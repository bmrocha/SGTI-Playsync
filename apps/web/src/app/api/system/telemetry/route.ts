import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { query } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { hasPermission, Permission, UserRole } from '@/lib/permissions';
import { getSystemSettings } from '@/lib/system-settings';

export const dynamic = 'force-dynamic';

function snapshotCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle;
  }

  return { idle, total };
}

async function measureCpuPercent(sampleMs: number) {
  const a = snapshotCpuTimes();
  await new Promise((r) => setTimeout(r, sampleMs));
  const b = snapshotCpuTimes();

  const idleDelta = b.idle - a.idle;
  const totalDelta = b.total - a.total;
  if (totalDelta <= 0) return 0;

  const usage = 1 - idleDelta / totalDelta;
  return Math.max(0, Math.min(100, usage * 100));
}

export async function GET(request: NextRequest) {
    const _lc = await requireLicense(); if (_lc) return _lc;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = Object.values(UserRole).includes(user.role as UserRole) ? (user.role as UserRole) : null;
    if (!role || !hasPermission(role, Permission.MANAGE_SETTINGS)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const env = process.env.NODE_ENV || 'development';

    const [cpuPercent, settings] = await Promise.all([
      measureCpuPercent(120),
      getSystemSettings(),
    ]);

    const systemTotalMem = os.totalmem();
    const systemFreeMem = os.freemem();
    const systemUsedMem = Math.max(0, systemTotalMem - systemFreeMem);
    const systemUsedPercent = systemTotalMem > 0 ? (systemUsedMem / systemTotalMem) * 100 : 0;

    const processMem = process.memoryUsage();

    let dbLatencyMs: number | null = null;
    let dbOk = false;
    let dbTransactions: number | null = null;

    const dbStart = Date.now();
    try {
      await query('SELECT 1');
      dbLatencyMs = Date.now() - dbStart;
      dbOk = true;
    } catch {
      dbLatencyMs = Date.now() - dbStart;
      dbOk = false;
    }

    try {
      const txRes = await query(
        `SELECT (xact_commit + xact_rollback) AS tx
         FROM pg_stat_database
         WHERE datname = current_database()`
      );
      const txValue = txRes.rows?.[0]?.tx;
      if (typeof txValue === 'number') dbTransactions = txValue;
      if (typeof txValue === 'string') dbTransactions = Number.parseInt(txValue, 10);
    } catch {
      dbTransactions = null;
    }

    let mediaUsedBytes = 0;
    let mediaVideoBytes = 0;
    let mediaImageBytes = 0;

    try {
      const mediaRes = await query(
        `SELECT
            COALESCE(SUM(size), 0) AS used_bytes,
            COALESCE(SUM(CASE WHEN mime_type LIKE 'video/%' THEN size ELSE 0 END), 0) AS video_bytes,
            COALESCE(SUM(CASE WHEN mime_type LIKE 'image/%' THEN size ELSE 0 END), 0) AS image_bytes
         FROM media_library
         WHERE environment = $1`,
        [env]
      );
      const row = mediaRes.rows?.[0] || {};

      mediaUsedBytes = typeof row.used_bytes === 'string' ? Number.parseInt(row.used_bytes, 10) : Number(row.used_bytes || 0);
      mediaVideoBytes = typeof row.video_bytes === 'string' ? Number.parseInt(row.video_bytes, 10) : Number(row.video_bytes || 0);
      mediaImageBytes = typeof row.image_bytes === 'string' ? Number.parseInt(row.image_bytes, 10) : Number(row.image_bytes || 0);
    } catch {
      mediaUsedBytes = 0;
      mediaVideoBytes = 0;
      mediaImageBytes = 0;
    }

    const storageLimitMb = Number(settings.storageLimit || 0);
    const storageLimitBytes = storageLimitMb > 0 ? storageLimitMb * 1024 * 1024 : 0;
    const storageUsedPercent = storageLimitBytes > 0 ? (mediaUsedBytes / storageLimitBytes) * 100 : 0;

    let playersTotal: number | null = null;
    let playersOnline: number | null = null;
    try {
      const [totalRes, onlineRes] = await Promise.all([
        query('SELECT COUNT(*) AS c FROM players'),
        query(`SELECT COUNT(*) AS c FROM players WHERE status = 'online' AND last_seen > NOW() - INTERVAL '30 seconds'`),
      ]);
      playersTotal = Number.parseInt(totalRes.rows?.[0]?.c ?? totalRes.rows?.[0]?.count ?? '0', 10);
      playersOnline = Number.parseInt(onlineRes.rows?.[0]?.c ?? onlineRes.rows?.[0]?.count ?? '0', 10);
    } catch {
      playersTotal = null;
      playersOnline = null;
    }

    return NextResponse.json({
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        nodeVersion: process.version,
        time: new Date().toISOString(),
        processUptimeSeconds: Math.floor(process.uptime()),
      },
      cpu: {
        percent: cpuPercent,
        cores: os.cpus().length,
      },
      memory: {
        system: {
          totalBytes: systemTotalMem,
          freeBytes: systemFreeMem,
          usedBytes: systemUsedMem,
          usedPercent: systemUsedPercent,
        },
        process: {
          rssBytes: processMem.rss,
          heapTotalBytes: processMem.heapTotal,
          heapUsedBytes: processMem.heapUsed,
          externalBytes: processMem.external,
        },
      },
      db: {
        ok: dbOk,
        latencyMs: dbLatencyMs,
        transactions: dbTransactions,
      },
      mediaStorage: {
        environment: env,
        usedBytes: mediaUsedBytes,
        videoBytes: mediaVideoBytes,
        imageBytes: mediaImageBytes,
        limitBytes: storageLimitBytes,
        limitMb: storageLimitMb,
        usedPercent: Math.max(0, Math.min(100, storageUsedPercent)),
      },
      players: {
        total: playersTotal,
        online: playersOnline,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
