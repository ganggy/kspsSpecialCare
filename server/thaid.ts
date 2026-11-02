import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookupPatientByCidOrHn, PatientRightProfile } from './hosxp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface ThaIDConfig {
  callbackUrl: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  defaultScope: string;
}

export function getThaIDConfig(): ThaIDConfig {
  return {
    callbackUrl: process.env.THAID_CALLBACK_URL || 'http://147.50.107.211:3601/',
    apiKey: process.env.THAID_API_KEY || '',
    clientId: process.env.THAID_CLIENT_ID || '',
    clientSecret: process.env.THAID_CLIENT_SECRET || '',
    authUrl: process.env.THAID_AUTH_URL || 'https://imauth.bora.dopa.go.th/api/v2/oauth2/auth/',
    tokenUrl: process.env.THAID_TOKEN_URL || 'https://imauth.bora.dopa.go.th/api/v2/oauth2/token/',
    userinfoUrl: process.env.THAID_USERINFO_URL || 'https://imauth.bora.dopa.go.th/api/v2/oauth2/userinfo/',
    defaultScope: process.env.THAID_SCOPE || 'openid pid given_name middle_name family_name',
  };
}

export interface ThaIDSessionUser {
  sessionId: string;
  authenticatedVia: 'THAID_OAUTH2' | 'THAID_PID_VERIFY';
  sub: string;
  pid: string;
  givenName: string;
  middleName: string;
  familyName: string;
  fullName: string;
  birthDate: string | null;
  gender: string | null;
  rawClaims: Record<string, any>;
  hosxpProfile: PatientRightProfile | null;
  authenticatedAt: string;
}

const sessionStore = new Map<string, ThaIDSessionUser>();
const stateStore = new Map<string, { createdAt: number; redirectUri: string; scope: string }>();

export function buildThaIDAuthUrl(customScope?: string, customRedirectUri?: string): {
  url: string;
  state: string;
  redirectUri: string;
  scope: string;
} {
  const cfg = getThaIDConfig();
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = customRedirectUri || cfg.callbackUrl;
  const scope = (customScope || cfg.defaultScope || 'openid').trim();

  stateStore.set(state, {
    createdAt: Date.now(),
    redirectUri,
    scope,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  return {
    url: `${cfg.authUrl}?${params.toString()}`,
    state,
    redirectUri,
    scope,
  };
}

function decodeJwtPayload(jwtToken: string): Record<string, any> {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function exchangeThaIDCode(
  code: string,
  state?: string,
  redirectUriOverride?: string
): Promise<ThaIDSessionUser> {
  const cfg = getThaIDConfig();
  const savedState = state ? stateStore.get(state) : undefined;
  const redirectUri = redirectUriOverride || savedState?.redirectUri || cfg.callbackUrl;

  const basicAuth = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${basicAuth}`,
  };
  if (cfg.apiKey) {
    headers['x-api-key'] = cfg.apiKey;
  }

  const response = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers,
    body: body.toString(),
  });

  const tokenData: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errMsg =
      tokenData?.error_description ||
      tokenData?.error ||
      `ThaID Token Exchange failed (HTTP ${response.status})`;
    throw new Error(errMsg);
  }

  const idTokenClaims = tokenData.id_token ? decodeJwtPayload(tokenData.id_token) : {};
  let userinfoClaims: Record<string, any> = {};

  if (tokenData.access_token) {
    try {
      const uiRes = await fetch(cfg.userinfoUrl, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          ...(cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {}),
        },
      });
      if (uiRes.ok) {
        userinfoClaims = (await uiRes.json()) as Record<string, any>;
      }
    } catch {
      // fallback to idTokenClaims
    }
  }

  const merged: Record<string, any> = {
    ...idTokenClaims,
    ...userinfoClaims,
    ...tokenData,
  };

  const rawPid = String(merged.pid || merged.citizen_id || merged.sub || '').replace(/[^0-9]/g, '');
  const pid = rawPid.length === 13 ? rawPid : '';
  const title = merged.title || '';
  const givenName = merged.given_name || '';
  const middleName = merged.middle_name || '';
  const familyName = merged.family_name || '';

  let hosxpProfile: PatientRightProfile | null = null;
  if (pid) {
    hosxpProfile = await lookupPatientByCidOrHn(pid);
  }

  const fullNameFromClaims = [title, givenName, middleName, familyName]
    .filter(Boolean)
    .join(' ')
    .trim() || merged.name || '';

  const fullName = hosxpProfile?.fullName || fullNameFromClaims || 'ผู้รับบริการ (ยืนยันตัวตน ThaID)';

  const sessionId = crypto.randomBytes(24).toString('hex');
  const sessionUser: ThaIDSessionUser = {
    sessionId,
    authenticatedVia: 'THAID_OAUTH2',
    sub: String(merged.sub || pid || sessionId),
    pid: pid || hosxpProfile?.cid || '',
    givenName: givenName || hosxpProfile?.fname || '',
    middleName,
    familyName: familyName || hosxpProfile?.lname || '',
    fullName,
    birthDate: merged.birthdate || hosxpProfile?.birthDate || null,
    gender: merged.gender || hosxpProfile?.sex || null,
    rawClaims: {
      pid: pid || undefined,
      given_name: givenName || undefined,
      middle_name: middleName || undefined,
      family_name: familyName || undefined,
      iss: merged.iss || 'https://imauth.bora.dopa.go.th',
    },
    hosxpProfile,
    authenticatedAt: new Date().toISOString(),
  };

  sessionStore.set(sessionId, sessionUser);
  return sessionUser;
}

export async function createDirectPatientSession(
  cidOrHn: string,
  customName?: string,
  customPhone?: string
): Promise<ThaIDSessionUser> {
  const hosxpProfile = await lookupPatientByCidOrHn(cidOrHn);
  const cleanCid = cidOrHn.replace(/[^0-9]/g, '');
  const sessionId = crypto.randomBytes(24).toString('hex');

  const fullName =
    hosxpProfile?.fullName ||
    (customName || '').trim() ||
    `ผู้รับบริการ (${cleanCid.slice(0, 4)}xxxxx${cleanCid.slice(-2)})`;

  if (hosxpProfile && customPhone && !hosxpProfile.phone) {
    hosxpProfile.phone = customPhone;
  }

  const sessionUser: ThaIDSessionUser = {
    sessionId,
    authenticatedVia: 'THAID_PID_VERIFY',
    sub: cleanCid,
    pid: hosxpProfile?.cid || (cleanCid.length === 13 ? cleanCid : ''),
    givenName: hosxpProfile?.fname || fullName,
    middleName: '',
    familyName: hosxpProfile?.lname || '',
    fullName,
    birthDate: hosxpProfile?.birthDate || null,
    gender: hosxpProfile?.sex || null,
    rawClaims: { pid: cleanCid },
    hosxpProfile,
    authenticatedAt: new Date().toISOString(),
  };

  sessionStore.set(sessionId, sessionUser);
  return sessionUser;
}

export function getSessionUser(sessionId: string): ThaIDSessionUser | null {
  if (!sessionId) return null;
  return sessionStore.get(sessionId) || null;
}
