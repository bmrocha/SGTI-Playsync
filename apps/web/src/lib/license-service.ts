import { query } from '@playsync/database';
import * as crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface LicenseState {
  installationId: string;
  token: string;
  payloadJson?: Record<string, unknown>;
  issuer?: string;
  expiresAt: string;
  appliedAt?: string;
  appliedBy?: string;
  licensed: boolean;
}

export interface LicenseStatusResponse {
  enforced: boolean;
  licensed: boolean;
  installationId: string;
  mode: 'jwt' | 'off';
  expiresAt?: string;
  appliedAt?: string;
  reason?: string;
  keyConfigured: boolean;
}

// Generate a fresh random installation ID for display in the activation modal
// This ID is temporary and will only be saved when license is successfully activated
export function generateTemporaryInstallationId(): string {
  return crypto.randomUUID();
}

// Get persisted temporary installation ID from localStorage (safe: checks window)
function getTemporaryInstallationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('temporary_installation_id');
  } catch {
    return null;
  }
}

// Set persisted temporary installation ID to localStorage (safe: checks window)
function setTemporaryInstallationId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('temporary_installation_id', id);
  } catch {
    // localStorage not available
  }
}

// Clear persisted temporary installation ID from localStorage (safe: checks window)
export function clearTemporaryInstallationId(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('temporary_installation_id');
  } catch {
    // localStorage not available
  }
}

export async function getLicenseState(): Promise<LicenseState> {
  const res = await query('SELECT value FROM system_settings WHERE key = $1', ['license_state']);
  let state: LicenseState;

  if (res.rows.length === 0) {
    state = {
      installationId: generateTemporaryInstallationId(),
      token: 'UNLICENSED',
      expiresAt: '1970-01-01T00:00:00Z',
      licensed: false,
    };
    await query('INSERT INTO system_settings (key, value) VALUES ($1, $2)', [
      'license_state',
      JSON.stringify(state),
    ]);
  } else {
    state = JSON.parse(res.rows[0].value);
  }

  if (state.licensed && state.expiresAt) {
    const expiresDate = new Date(state.expiresAt);
    if (new Date() > expiresDate) {
      state.licensed = false;
    }
  }

  return state;
}

export async function getLicenseStatus(): Promise<LicenseStatusResponse> {
  const state = await getLicenseState();
  const isDev = process.env.NODE_ENV === 'development';
  const isLicensed = isDev ? true : state.licensed;

  if (!getLicensePublicKeyPem()) {
    await loadLicensePublicKeyFromDb();
  }

  // Always generate a fresh temporary ID if not licensed
  let displayInstallationId = state.installationId;
  if (!isLicensed) {
    // Check if we have a persisted temporary installation ID
    const persistedTempId = getTemporaryInstallationId();
    if (persistedTempId) {
      displayInstallationId = persistedTempId;
    } else {
      // Generate new temporary ID and persist it
      displayInstallationId = generateTemporaryInstallationId();
      setTemporaryInstallationId(displayInstallationId);
    }
  }

  let reason = 'ACTIVATED';
  if (!isLicensed) {
    if (state.token === 'UNLICENSED') {
      reason = 'NOT_ACTIVATED';
    } else if (state.expiresAt && new Date() > new Date(state.expiresAt)) {
      reason = 'EXPIRED';
    } else {
      reason = 'INVALID_LICENSE';
    }
  }

  const mode = getLicensePublicKeyPem() ? 'jwt' : 'off';

  return {
    enforced: !isDev,
    licensed: isLicensed,
    installationId: displayInstallationId,
    mode,
    expiresAt: isDev
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : state.expiresAt !== '1970-01-01T00:00:00Z'
        ? state.expiresAt
        : undefined,
    appliedAt: state.appliedAt,
    reason: !isLicensed ? reason : undefined,
    keyConfigured: !!getLicensePublicKeyPem(),
  };
}

function base64UrlDecode(input: string): Buffer {
  const b64 =
    input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(b64, 'base64');
}

function normalizeToPem(raw: string): string | null {
  let s = raw.trim().replace(/\\n/g, '\n');
  if (s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1);
  }
  if (!s.includes('-----BEGIN')) {
    try {
      s = Buffer.from(s, 'base64').toString('utf8').trim();
    } catch {
      return null;
    }
  }
  if (!s.includes('BEGIN PUBLIC KEY') && !s.includes('BEGIN RSA PUBLIC KEY')) return null;
  if (s.includes('BEGIN RSA PUBLIC KEY')) {
    try {
      const obj = crypto.createPublicKey(s);
      return String(obj.export({ type: 'spki', format: 'pem' }));
    } catch {
      return null;
    }
  }
  return s;
}

export function getLicensePublicKeyPem(): string | null {
  const raw = process.env.LICENSE_PUBLIC_KEY;
  if (raw) return normalizeToPem(raw);
  return null;
}

export async function loadLicensePublicKeyFromDb(): Promise<string | null> {
  try {
    const res = await query('SELECT value FROM system_settings WHERE key = $1', [
      'license_public_key',
    ]);
    if (res.rows.length > 0) {
      let pem = res.rows[0].value;
      try {
        pem = JSON.parse(pem);
      } catch {}
      process.env.LICENSE_PUBLIC_KEY = pem;
      return pem;
    }
  } catch {
    // DB not available yet
  }
  return null;
}

export async function saveLicensePublicKey(
  input: string,
): Promise<{ success: boolean; reason?: string }> {
  try {
    const pem = normalizeToPem(input);
    if (!pem) return { success: false, reason: 'INVALID_PEM_FORMAT' };

    process.env.LICENSE_PUBLIC_KEY = pem;

    await query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2`,
      ['license_public_key', JSON.stringify(pem)],
    );

    return { success: true };
  } catch (error) {
    logger.error({ err: error }, 'Failed to save public key:');
    return { success: false, reason: 'INTERNAL_ERROR' };
  }
}

export function verifyLicenseJwt(
  token: string,
  publicKeyPem: string,
  expectedIssuer: string,
  expectedInstallationId: string,
): { ok: true; payload: Record<string, unknown> } | { ok: false; reason: string } {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'INVALID_FORMAT' };
  const [headerPart, payloadPart, signaturePart] = parts;

  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(headerPart).toString('utf8'));
  } catch {
    return { ok: false, reason: 'INVALID_FORMAT' };
  }
  if (header.alg !== 'RS256') return { ok: false, reason: 'INVALID_ALG' };

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8'));
  } catch {
    return { ok: false, reason: 'INVALID_PAYLOAD' };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp as number;
  if (!exp || now >= exp) return { ok: false, reason: 'EXPIRED' };
  if (payload.iss !== undefined && payload.iss !== expectedIssuer)
    return { ok: false, reason: 'INVALID_ISSUER' };
  if (payload.installation_id !== expectedInstallationId)
    return { ok: false, reason: 'INVALID_INSTALLATION' };

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerPart}.${payloadPart}`);
  verifier.end();
  if (!verifier.verify(publicKeyPem, base64UrlDecode(signaturePart)))
    return { ok: false, reason: 'INVALID_SIGNATURE' };

  return { ok: true, payload };
}

export async function applyLicense(
  token: string,
  userId: string,
  temporaryInstallationId?: string,
): Promise<{ success: boolean; reason?: string }> {
  try {
    const state = await getLicenseState();
    if (!getLicensePublicKeyPem()) {
      await loadLicensePublicKeyFromDb();
    }
    const publicKeyPem = getLicensePublicKeyPem();
    const issuer = process.env.LICENSE_ISSUER;

    if (!publicKeyPem) return { success: false, reason: 'SYSTEM_MISCONFIGURED' };
    if (!issuer) return { success: false, reason: 'SYSTEM_MISCONFIGURED' };

    // Use the temporary installation ID from the frontend if provided
    // This ensures the JWT token matches the ID that was displayed to the user
    const installationIdToVerify = temporaryInstallationId || state.installationId;

    const result = verifyLicenseJwt(token, publicKeyPem, issuer, installationIdToVerify);
    if (!result.ok) return { success: false, reason: result.reason };

    const newState: LicenseState = {
      ...state,
      installationId: installationIdToVerify, // Save the temporary ID permanently
      token: token,
      payloadJson: result.payload,
      issuer: issuer,
      expiresAt: result.payload.exp
        ? new Date((result.payload.exp as number) * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      appliedAt: new Date().toISOString(),
      appliedBy: userId,
      licensed: true,
    };

    await query('UPDATE system_settings SET value = $1 WHERE key = $2', [
      JSON.stringify(newState),
      'license_state',
    ]);
    return { success: true };
  } catch (error) {
    logger.error({ err: error }, 'Error applying license:');
    return { success: false, reason: 'INTERNAL_ERROR' };
  }
}

export async function requireLicense(): Promise<NextResponse | null> {
  try {
    const status = await getLicenseStatus();
    if (status.enforced && !status.licensed) {
      return NextResponse.json(
        { error: 'License Required', reason: status.reason },
        { status: 403 },
      );
    }
    return null;
  } catch (error) {
    logger.error({ err: error }, 'Error checking license in middleware:');
    return NextResponse.json({ error: 'License System Error' }, { status: 403 });
  }
}
