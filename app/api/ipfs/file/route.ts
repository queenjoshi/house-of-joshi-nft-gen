import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, formatPinataResult, requirePinataJWT } from '@/lib/server/pinata';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const jwt = requirePinataJWT();
    const incoming = await request.formData();
    const file = incoming.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'An image file is required.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only PNG, JPG, WebP, and GIF files are supported.' }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File must be between 1 byte and 15 MB.' }, { status: 413 });
    }

    const body = new FormData();
    body.append('file', file, file.name);
    body.append('pinataMetadata', JSON.stringify({ name: file.name }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body,
    });
    const result = await response.json();

    if (!response.ok || !result.IpfsHash) {
      return NextResponse.json(
        { error: result.error?.details || result.error || 'Pinata file upload failed.' },
        { status: 502 },
      );
    }

    return NextResponse.json(formatPinataResult(result.IpfsHash));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'File upload failed.';
    const status = message.includes('not configured') ? 503 : message.includes('Cross-origin') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
