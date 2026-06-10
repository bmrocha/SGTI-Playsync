import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { AuditLogRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

// POST /api/audit/export - Bulk export audit logs (Admin only)
export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    // Validate date range (max 180 days per export)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 180) {
        return NextResponse.json(
          {
            error: 'Export date range cannot exceed 180 days. Please narrow your selection.',
          },
          { status: 400 },
        );
      }
    }

    // Fetch logs (up to 100,000 records)
    const { logs: rawLogs } = await AuditLogRepository.findMany({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 100000,
      offset: 0,
    });

    if (rawLogs.length === 0) {
      return NextResponse.json(
        {
          error: 'No audit logs found for the specified date range',
        },
        { status: 404 },
      );
    }

    // Convert to CSV
    const headers = [
      'Data/Hora',
      'Usuário',
      'Email',
      'Função',
      'Ação',
      'Recurso',
      'ID Recurso',
      'Nome Recurso',
      'Detalhes',
      'Endereço IP',
      'Metadata',
    ];

    const rows = rawLogs.map((log) => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      log.user_name,
      log.user_id,
      log.user_role,
      log.action,
      log.resource,
      log.resource_id || '',
      log.resource_name || '',
      log.details,
      log.ip_address || '-',
      log.metadata ? JSON.stringify(log.metadata) : '',
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ].join('\n');

    // Add BOM for Excel compatibility
    const csvWithBOM = '\uFEFF' + csv;

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error exporting audit logs:');
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
  }
}
