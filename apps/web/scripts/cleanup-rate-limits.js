#!/usr/bin/env node

/**
 * Rate Limits Cleanup Cron Job
 *
 * This script automatically cleans up expired rate limit records.
 * Run this daily via cron or scheduled task.
 *
 * Usage:
 *   node scripts/cleanup-rate-limits.js
 *
 * Cron example (daily at 3 AM):
 *   Linux/Mac: 0 3 * * * cd /path/to/project && node scripts/cleanup-rate-limits.js
 *   Windows:   SchTasks /Create /SC DAILY /TN "CleanupRateLimits" /TR "node C:\path\to\scripts\cleanup-rate-limits.js" /ST 03:00
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('ERROR: CRON_SECRET environment variable is not set');
  console.error('Please set it in your .env file');
  process.exit(1);
}

async function cleanupRateLimits() {
  console.log(`[${new Date().toISOString()}] Starting rate limits cleanup...`);

  try {
    const response = await fetch(`${BASE_URL}/api/cron/cleanup-rate-limits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[${new Date().toISOString()}] Cleanup failed:`, data);
      process.exit(1);
    }

    console.log(`[${new Date().toISOString()}] Cleanup successful:`);
    console.log(`  - Deleted: ${data.deletedCount} expired rate limits`);
    console.log(`  - Message: ${data.message}`);

    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup error:`, error);
    process.exit(1);
  }
}

cleanupRateLimits();
