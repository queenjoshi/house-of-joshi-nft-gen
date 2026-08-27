import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const FIRESTORE_DATABASE = '(default)';
const DAILY_FREE_PREVIEW_LIMIT = 10;

type GcpConfig = {
  projectId: string;
  projectNumber: string;
  serviceAccountEmail: string;
  poolId: string;
  providerId: string;
  location: string;
  imagenModel: string;
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, { integerValue?: string; stringValue?: string }>;
  updateTime?: string;
};

export class GcpConfigurationError extends Error {}
export class QuotaExceededError extends Error {}
export class ReplayDetectedError extends Error {}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new GcpConfigurationError(`${name} is not configured.`);
  return value;
}

function getConfig(): GcpConfig {
  return {
    projectId: required('GCP_PROJECT_ID'),
    projectNumber: required('GCP_PROJECT_NUMBER'),
    serviceAccountEmail: required('GCP_SERVICE_ACCOUNT_EMAIL'),
    poolId: required('GCP_WORKLOAD_IDENTITY_POOL_ID'),
    providerId: required('GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID'),
    location: process.env.GCP_VERTEX_LOCATION?.trim() || 'us-central1',
    imagenModel: process.env.GCP_IMAGEN_MODEL?.trim() || 'imagen-4.0-generate-001',
  };
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new Error(`Google Cloud request failed (${response.status}).`);
  return body || {};
}

/** Exchanges Vercel's short-lived OIDC assertion for a short-lived Google access token. */
export async function getGoogleAccessToken(request: NextRequest) {
  const config = getConfig();
  const oidcToken = request.headers.get('x-vercel-oidc-token')
    || (process.env.NODE_ENV !== 'production' ? process.env.VERCEL_OIDC_TOKEN : undefined);
  if (!oidcToken) throw new GcpConfigurationError('Vercel OIDC token is unavailable.');

  const audience = `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/providers/${config.providerId}`;
  const tokenExchange = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      audience,
      scope: CLOUD_PLATFORM_SCOPE,
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      subject_token: oidcToken,
    }),
  });
  const exchanged = await readJson(tokenExchange);
  const federatedToken = typeof exchanged.access_token === 'string' ? exchanged.access_token : '';
  if (!federatedToken) throw new Error('Google Cloud did not return a federated access token.');

  const impersonation = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${federatedToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scope: [CLOUD_PLATFORM_SCOPE], lifetime: '3600s' }),
    },
  );
  const impersonated = await readJson(impersonation);
  const accessToken = typeof impersonated.accessToken === 'string' ? impersonated.accessToken : '';
  if (!accessToken) throw new Error('Google Cloud did not return a service-account access token.');

  return { accessToken, config };
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
}

function firestoreBaseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${FIRESTORE_DATABASE}/documents`;
}

function utcDateKey() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

function hashNonce(nonce: string) {
  return createHash('sha256').update(nonce).digest('hex');
}

async function firestoreFetch(url: string, accessToken: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { ...authHeaders(accessToken), ...(init?.headers || {}) },
  });
  return response;
}

async function getDocument(url: string, accessToken: string) {
  const response = await firestoreFetch(url, accessToken);
  if (response.status === 404) return null;
  return await readJson(response) as FirestoreDocument;
}

/** Atomically consumes one preview and prevents replaying the same wallet signature nonce. */
export async function consumePreviewQuota({
  accessToken,
  projectId,
  walletAddress,
  nonce,
}: {
  accessToken: string;
  projectId: string;
  walletAddress: string;
  nonce: string;
}) {
  const baseUrl = firestoreBaseUrl(projectId);
  const quotaId = `${walletAddress.toLowerCase()}-${utcDateKey()}`;
  const nonceId = hashNonce(nonce);
  const quotaUrl = `${baseUrl}/aiGenerationQuotas/${quotaId}`;
  const nonceUrl = `${baseUrl}/aiGenerationNonces/${nonceId}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const beginResponse = await firestoreFetch(`${baseUrl}:beginTransaction`, accessToken, {
      method: 'POST', body: JSON.stringify({ options: { readWrite: {} } }),
    });
    const begin = await readJson(beginResponse);
    const transaction = typeof begin.transaction === 'string' ? begin.transaction : '';
    if (!transaction) throw new Error('Firestore did not create a transaction.');

    const [quotaDocument, nonceDocument] = await Promise.all([
      getDocument(`${quotaUrl}?transaction=${encodeURIComponent(transaction)}`, accessToken),
      getDocument(`${nonceUrl}?transaction=${encodeURIComponent(transaction)}`, accessToken),
    ]);
    if (nonceDocument) throw new ReplayDetectedError('This preview authorization was already used.');

    const currentCount = Number(quotaDocument?.fields?.count?.integerValue || '0');
    if (currentCount >= DAILY_FREE_PREVIEW_LIMIT) {
      throw new QuotaExceededError('Daily free generation limit reached.');
    }

    const now = new Date().toISOString();
    const quotaWrite = {
      update: {
        name: quotaDocument?.name || `${baseUrl}/aiGenerationQuotas/${quotaId}`,
        fields: {
          count: { integerValue: String(currentCount + 1) },
          walletAddress: { stringValue: walletAddress.toLowerCase() },
          date: { stringValue: utcDateKey() },
          updatedAt: { stringValue: now },
        },
      },
      currentDocument: quotaDocument?.updateTime
        ? { updateTime: quotaDocument.updateTime }
        : { exists: false },
    };
    const nonceWrite = {
      update: {
        name: `${baseUrl}/aiGenerationNonces/${nonceId}`,
        fields: { usedAt: { stringValue: now } },
      },
      currentDocument: { exists: false },
    };
    const commitResponse = await firestoreFetch(`${baseUrl}:commit`, accessToken, {
      method: 'POST', body: JSON.stringify({ transaction, writes: [quotaWrite, nonceWrite] }),
    });

    if (commitResponse.ok) return { remaining: DAILY_FREE_PREVIEW_LIMIT - currentCount - 1 };
    if (commitResponse.status !== 409 && commitResponse.status !== 412) {
      await readJson(commitResponse);
    }
  }
  throw new Error('Could not reserve a preview quota. Please try again.');
}

export async function generateImagenPreview({
  accessToken,
  config,
  prompt,
}: {
  accessToken: string;
  config: GcpConfig;
  prompt: string;
}) {
  const endpoint = `https://${config.location}-aiplatform.googleapis.com/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${config.imagenModel}:predict`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        safetySetting: 'block_medium_and_above',
        personGeneration: 'allow_adult',
      },
    }),
  });
  const data = await readJson(response);
  const prediction = Array.isArray(data.predictions) ? data.predictions[0] as Record<string, unknown> : null;
  const bytes = typeof prediction?.bytesBase64Encoded === 'string' ? prediction.bytesBase64Encoded : '';
  const mimeType = typeof prediction?.mimeType === 'string' ? prediction.mimeType : 'image/png';
  if (!bytes) throw new Error('Vertex AI did not return an image preview.');
  return { previewImage: `data:${mimeType};base64,${bytes}` };
}
