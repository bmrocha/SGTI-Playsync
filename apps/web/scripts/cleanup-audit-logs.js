#!/usr/bin/env node

/**
 * Audit Log Cleanup Cron Job
 *
 * This script automatically cleans up audit logs older than 180 days.
 * Run this daily via cron or scheduled task.
 *
 * Usage:
 *   node scripts/cleanup-audit-logs.js
 *
 * Cron example (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/cleanup-audit-logs.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET_KEY;

if (!CRON_SECRET) {
  console.error('ERROR: CRON_SECRET_KEY environment variable is not set');
  console.error('Please set it in your .env file');
  process.exit(1);
}

async function cleanupAuditLogs() {
  console.log(`[${new Date().toISOString()}] Starting audit log cleanup...`);

  try {
    const response = await fetch(`${BASE_URL}/api/audit/cleanup/auto`, {
      method: 'POST',
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
    console.log(`  - Deleted: ${data.deletedCount} logs`);
    console.log(`  - Retention: ${data.retentionDays} days`);
    console.log(`  - Cutoff date: ${data.cutoffDate}`);
    console.log(`  - Triggered by: ${data.triggeredBy}`);

    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cleanup error:`, error);
    process.exit(1);
  }
}

cleanupAuditLogs();
