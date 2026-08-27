import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin } from '@/lib/server/pinata';
import { verifyPreviewAuthorization } from '@/lib/ai/preview-auth';
import {
  consumePreviewQuota,
  GcpConfigurationError,
  generateImagenPreview,
  getGoogleAccessToken,
  QuotaExceededError,
  ReplayDetectedError,
} from '@/lib/server/gcp';

export const runtime = 'nodejs';
export const maxDuration = 60;

type PreviewRequest = {
  prompt?: unknown;
  walletAddress?: unknown;
  nonce?: unknown;
  issuedAt?: unknown;
  signature?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await request.json() as PreviewRequest;
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress : '';
    const nonce = typeof body.nonce === 'string' ? body.nonce : '';
    const issuedAt = typeof body.issuedAt === 'string' ? body.issuedAt : '';
    const signature = (typeof body.signature === 'string' ? body.signature : '0x') as `0x${string}`;

    if (prompt.length < 3 || prompt.length > 1_000) {
      return NextResponse.json({ error: 'Prompt must be between 3 and 1,000 characters.' }, { status: 400 });
    }
    const authorized = await verifyPreviewAuthorization({ walletAddress, prompt, nonce, issuedAt, signature });
    if (!authorized) {
      return NextResponse.json({ error: 'A fresh wallet signature is required for an AI preview.' }, { status: 401 });
    }

    const { accessToken, config } = await getGoogleAccessToken(request);
    const quota = await consumePreviewQuota({ accessToken, projectId: config.projectId, walletAddress, nonce });
    const image = await generateImagenPreview({ accessToken, config, prompt });
    return NextResponse.json({ success: true, ...image, remainingPreviews: quota.remaining });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof ReplayDetectedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof GcpConfigurationError) {
      console.error('AI preview configuration error:', error.message);
      return NextResponse.json({ error: 'AI preview is not configured yet.' }, { status: 503 });
    }
    console.error('AI preview generation failed:', error);
    return NextResponse.json({ error: 'Could not generate an AI preview. Please try again.' }, { status: 502 });
  }
}
