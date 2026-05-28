import { NextRequest } from 'next/server';
import { getIpAddress } from './server-audit';
import { RateLimitRepository } from '@playsync/database';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  endpoint?: string;
}

export async function checkRateLimit(req: NextRequest, config: RateLimitConfig = { limit: 10, windowMs: 60 * 1000 }): Promise<boolean> {
  const ip = getIpAddress(req);
  const endpoint = config.endpoint || req.nextUrl?.pathname || '/';

  const { allowed } = await RateLimitRepository.checkAndIncrement(ip, endpoint, config.limit, config.windowMs);
  return allowed;
}

export function checkRateLimitSync(req: NextRequest, config?: RateLimitConfig): boolean {
  return true;
}
