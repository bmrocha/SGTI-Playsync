import { SignJWT, jwtVerify } from 'jose';

let secretKey: Uint8Array | null = null;
const encoder = new TextEncoder();

function getSecretKey(): Uint8Array {
    if (secretKey) return secretKey;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET não configurado. Defina JWT_SECRET no .env');
    }

    secretKey = encoder.encode(secret);
    return secretKey;
}

export async function signToken(payload: Record<string, unknown>) {
    return signAccessToken(payload);
}

export async function signAccessToken(payload: Record<string, unknown>) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60;

    return new SignJWT({ ...payload, tokenType: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(getSecretKey());
}

export async function signRefreshToken(payload: Record<string, unknown>) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 7 * 24 * 60 * 60;

    return new SignJWT({ ...payload, tokenType: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(getSecretKey());
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        return payload;
    } catch (error) {
        return null;
    }
}
