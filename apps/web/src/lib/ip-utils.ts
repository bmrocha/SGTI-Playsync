
/**
 * Utility functions for IP address validation and CIDR checking.
 */

import { z } from 'zod';

// Basic regex for IPv4 and IPv6
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

function ipToLong(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function ipv6ToBigInt(ip: string): bigint {
    // Expand ::
    let expanded = ip;
    if (ip.indexOf('::') !== -1) {
        const parts = ip.split('::');
        const left = parts[0].split(':').filter(Boolean);
        const right = parts[1].split(':').filter(Boolean);
        // IPv4-mapped IPv6 (::ffff:1.2.3.4) handling
        const lastRight = right[right.length - 1];
        if (lastRight && lastRight.includes('.')) {
             return 0n; 
        }

        const missing = 8 - (left.length + right.length);
        const zeros = Array(Math.max(0, missing)).fill('0');
        expanded = [...left, ...zeros, ...right].join(':');
    }
    
    const parts = expanded.split(':');
    let value = BigInt(0);
    for (const part of parts) {
        value = (value << 16n) + BigInt(parseInt(part || '0', 16));
    }
    return value;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
    try {
        const [range, bitsStr] = cidr.split('/');
        const bits = parseInt(bitsStr, 10);
        if (isNaN(bits) || bits < 0 || bits > 32) return false;
        const mask = bits === 0 ? 0 : (~0) << (32 - bits);
        return (ipToLong(ip) & mask) === (ipToLong(range) & mask);
    } catch { return false; }
}

function isIpv6InCidr(ip: string, cidr: string): boolean {
    try {
        const [range, bitsStr] = cidr.split('/');
        const bits = parseInt(bitsStr, 10);
        if (isNaN(bits) || bits < 0 || bits > 128) return false;

        const ipBig = ipv6ToBigInt(ip);
        const rangeBig = ipv6ToBigInt(range);
        
        // Create 128-bit mask
        const mask = bits === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << (128n - BigInt(bits))) - 1n);
        
        return (ipBig & mask) === (rangeBig & mask);
    } catch { return false; }
}

// Check if string is a valid IPv4
export function isIPv4(ip: string): boolean {
    return z.string().regex(ipv4Regex).safeParse(ip).success;
}

// Check if string is a valid IPv6
export function isIPv6(ip: string): boolean {
    return z.string().regex(ipv6Regex).safeParse(ip).success;
}

export function isValidIp(ip: string): boolean {
    return isIPv4(ip) || isIPv6(ip);
}

export function isValidCidr(cidr: string): boolean {
    const parts = cidr.split('/');
    if (parts.length !== 2) return false;
    const [ip, bits] = parts;
    
    if (isIPv4(ip)) {
        const bitNum = parseInt(bits, 10);
        return bitNum >= 0 && bitNum <= 32;
    }
    
    if (isIPv6(ip)) {
        const bitNum = parseInt(bits, 10);
        return bitNum >= 0 && bitNum <= 128;
    }
    return false;
}

export function isIpTrusted(clientIp: string, trustedIps: string): boolean {
    if (!trustedIps || !trustedIps.trim()) return false;

    // Normalize separators
    const rules = trustedIps.split(/[\s,]+/).filter(Boolean);
    
    if (rules.length === 0) return false;

    // Handle IPv4-mapped IPv6 addresses (::ffff:127.0.0.1)
    let cleanIp = clientIp;
    if (clientIp.startsWith('::ffff:')) {
        cleanIp = clientIp.substring(7);
    }

    // Check IP version
    const isV4 = isIPv4(cleanIp);
    const isV6 = isIPv6(cleanIp);

    for (const rule of rules) {
        // Exact match
        if (rule === cleanIp) return true;
        if (rule === clientIp) return true; // Just in case

        // CIDR match
        if (rule.includes('/')) {
            const [rangeIp] = rule.split('/');
            
            // IPv4 CIDR
            if (isV4 && isIPv4(rangeIp)) {
                if (isIpv4InCidr(cleanIp, rule)) return true;
            }
            
            // IPv6 CIDR
            if (isV6 && isIPv6(rangeIp)) {
                if (isIpv6InCidr(cleanIp, rule)) return true;
            }
        }
        
        // Wildcard match
        if (rule.includes('*')) {
            const prefix = rule.replace('*', '');
            if (clientIp.startsWith(prefix) || cleanIp.startsWith(prefix)) return true;
        }
    }

    return false;
}

/**
 * Extracts the user's IP address from request headers.
 * Prioritizes headers in the following order:
 * 1. x-sgti-client-ip (Internal header set by middleware)
 * 2. x-forwarded-for (Standard proxy header)
 * 3. x-real-ip (Nginx proxy header)
 * 4. cf-connecting-ip (Cloudflare)
 * 
 * Returns '127.0.0.1' if not found.
 */
function normalizeIp(raw: string): string {
    let ip = raw.trim();

    if (ip.startsWith('[')) {
        const end = ip.indexOf(']');
        if (end !== -1) ip = ip.slice(1, end);
    }

    const zoneIndex = ip.indexOf('%');
    if (zoneIndex !== -1) ip = ip.slice(0, zoneIndex);

    if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
        ip = ip.split(':')[0];
    }

    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    return ip;
}

function isPrivateOrReservedIp(rawIp: string): boolean {
    const ip = normalizeIp(rawIp);

    if (isIPv4(ip)) {
        const privateCidrs = [
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
            '127.0.0.0/8',
            '169.254.0.0/16',
            '100.64.0.0/10',
            '0.0.0.0/8'
        ];

        return privateCidrs.some(cidr => isIpv4InCidr(ip, cidr));
    }

    if (isIPv6(ip)) {
        const privateCidrs = [
            '::/128',
            '::1/128',
            'fc00::/7',
            'fe80::/10'
        ];

        return privateCidrs.some(cidr => isIpv6InCidr(ip, cidr));
    }

    return true;
}

function pickBestIp(candidates: string[]): string | null {
    const ips = candidates.map(normalizeIp).filter(isValidIp);

    for (const ip of ips) {
        if (!isPrivateOrReservedIp(ip)) return ip;
    }

    return ips[0] ?? null;
}

export function getIpFromHeaders(headers: Headers): string {
    const internalIpRaw = headers.get('x-sgti-client-ip');
    const internalIp = internalIpRaw ? pickBestIp([internalIpRaw]) : null;

    const forwardedFor = headers.get('x-forwarded-for') || headers.get('x_forwarded_for');
    if (forwardedFor) {
        const candidate = pickBestIp(forwardedFor.split(',').map(v => v.trim()));
        if (candidate) return candidate;
    }

    if (internalIp) return internalIp;

    const realIpRaw = headers.get('x-real-ip');
    if (realIpRaw) {
        const candidate = pickBestIp([realIpRaw]);
        if (candidate) return candidate;
    }

    const cfIpRaw = headers.get('cf-connecting-ip');
    if (cfIpRaw) {
        const candidate = pickBestIp([cfIpRaw]);
        if (candidate) return candidate;
    }

    return '127.0.0.1';
}
