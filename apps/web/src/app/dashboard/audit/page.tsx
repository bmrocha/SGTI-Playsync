'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useActivityLogStore, ActionType, ActivityLog } from '@/lib/activity-log-store';
import { useAuthStore } from '@/lib/auth-store';
import { Shield, Download, Filter, Calendar } from 'lucide-react';
import { AuditStats } from '@/components/audit/audit-stats';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTable } from '@/components/audit/audit-table';

export default function AuditPage() {
  const { user } = useAuthStore();
  const { fetchFromBackend, exportLogs } = useActivityLogStore();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [bulkExportStartDate, setBulkExportStartDate] = useState('');
  const [bulkExportEndDate, setBulkExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const selectedUser = '';
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const cleanIp = (ip: unknown): string => {
    if (!ip) return '';
    if (typeof ip !== 'string') return String(ip);
    return ip.replace(/::ffff:/g, '').trim();
  };

  const getDisplayIp = (log: ActivityLog) => {
    const meta = log.metadata as Record<string, unknown> | undefined;
    const headers = meta?.headers as Record<string, unknown> | undefined;
    const raw =
      (meta?.x_forwarded_for as string) ??
      (meta?.['x-forwarded-for'] as string) ??
      (headers?.x_forwarded_for as string) ??
      (headers?.['x-forwarded-for'] as string);
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const first = raw.split(',')[0]?.trim();
      if (first) return cleanIp(first);
    }
    return cleanIp(log.ipAddress) || '-';
  };

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 6;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (dateRange === 'custom') {
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
      } else if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      const result = await fetchFromBackend({
        userId: selectedUser || undefined,
        action: (selectedAction as ActionType) || undefined,
        resource: selectedResource || undefined,
        startDate,
        endDate,
        limit: 1000,
      });

      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedUser,
    selectedAction,
    selectedResource,
    dateRange,
    customStartDate,
    customEndDate,
    fetchFromBackend,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedUser,
    selectedAction,
    selectedResource,
    dateRange,
    customStartDate,
    customEndDate,
    searchTerm,
  ]);

  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) => log.action !== 'logout');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.userName.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term) ||
          log.resource.toLowerCase().includes(term) ||
          log.resourceName?.toLowerCase().includes(term),
      );
    }
    return result;
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(startIndex, startIndex + logsPerPage);
  }, [filteredLogs, currentPage, logsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const actions: ActionType[] = [
    'login',
    'failed_login',
    'user_created',
    'user_updated',
    'user_deleted',
    'role_changed',
    'company_created',
    'company_updated',
    'company_deleted',
    'playlist_created',
    'playlist_updated',
    'playlist_deleted',
    'media_uploaded',
    'media_updated',
    'media_deleted',
    'settings_changed',
    'export_performed',
  ];

  const resources = ['user', 'company', 'playlist', 'media', 'auth', 'settings'];

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter((log) => new Date(log.timestamp) >= today);
    const uniqueUsersToday = new Set(todayLogs.map((log) => log.userId)).size;

    return { total, today: todayLogs.length, activeUsers: uniqueUsersToday };
  }, [logs, total]);

  const handleExport = () => {
    const csv = exportLogs(filteredLogs);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleBulkExport = async () => {
    if (!bulkExportStartDate || !bulkExportEndDate) {
      alert('Por favor, selecione o intervalo de datas para exportação.');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: bulkExportStartDate,
          endDate: bulkExportEndDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Falha ao exportar logs');
        return;
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${bulkExportStartDate}_to_${bulkExportEndDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowBulkExport(false);
      setBulkExportStartDate('');
      setBulkExportEndDate('');
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar logs. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'login':
        return {
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        };
      case 'logout':
        return {
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-800',
        };
      case 'failed_login':
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'user_created':
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'user_updated':
        return {
          color: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        };
      case 'user_deleted':
        return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' };
      case 'role_changed':
        return {
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
        };
      case 'playlist_created':
        return { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' };
      case 'playlist_updated':
        return { color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' };
      case 'playlist_deleted':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
        };
      case 'media_uploaded':
        return { color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' };
      case 'media_updated':
        return { color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-900/20' };
      case 'media_deleted':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-900/20',
        };
      case 'settings_changed':
        return { color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800' };
      default:
        if (action.includes('created') || action.includes('uploaded'))
          return {
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
          };
        if (action.includes('updated') || action.includes('changed'))
          return {
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
          };
        if (action.includes('deleted'))
          return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
        return { color: 'text-text-light', bg: 'bg-panel-bg' };
    }
  };

  if (!user) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">Acesso Negado</h2>
          <p className="text-red-700 dark:text-red-400">
            Você precisa estar logado para acessar os logs de auditoria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar py-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-premium px-3 py-2 border ${showFilters ? 'bg-brand-main text-white border-brand-main' : 'bg-panel-bg border-border text-text-light hover:border-brand-main hover:text-brand-main'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Filtros</span>
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setShowBulkExport(!showBulkExport)}
                  className="btn-premium bg-green-600 text-white px-4 py-2 hover:bg-green-700"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Exportação em Massa
                </button>
                <button
                  onClick={handleExport}
                  disabled={filteredLogs.length === 0}
                  className="btn-premium bg-brand-main text-white px-4 py-2 hover:bg-brand-main/90 disabled:opacity-50 disabled:scale-100"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Exportar CSV
                </button>
              </>
            )}
          </div>
        </div>

        <AuditStats total={stats.total} today={stats.today} activeUsers={stats.activeUsers} />

        <AuditFilters
          show={showFilters}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedAction={selectedAction}
          onActionChange={setSelectedAction}
          selectedResource={selectedResource}
          onResourceChange={setSelectedResource}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          customStartDate={customStartDate}
          onCustomStartDateChange={setCustomStartDate}
          customEndDate={customEndDate}
          onCustomEndDateChange={setCustomEndDate}
          actions={actions}
          resources={resources}
        />

        <AuditTable
          loading={loading}
          filteredLogs={filteredLogs}
          currentLogs={currentLogs}
          expandedRow={expandedRow}
          onToggleRow={(id) => setExpandedRow(expandedRow === id ? null : id)}
          pageNumbers={pageNumbers}
          currentPage={currentPage}
          totalPages={totalPages}
          logsPerPage={logsPerPage}
          onPageChange={setCurrentPage}
          getActionStyle={getActionStyle}
          cleanIp={cleanIp}
          getDisplayIp={getDisplayIp}
        />

        {/* Bulk Export Modal */}
        {showBulkExport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-panel-bg border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-text-dark mb-4">Exportação em Massa de Logs</h3>
              <p className="text-sm text-text-light mb-4">
                Selecione o intervalo de datas para exportar. Limite máximo: 180 dias por
                exportação.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={bulkExportStartDate}
                    onChange={(e) => setBulkExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-body-bg text-text-dark"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-light mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={bulkExportEndDate}
                    onChange={(e) => setBulkExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-body-bg text-text-dark"
                    max={new Date().toISOString().split('T')[0]}
                    min={bulkExportStartDate}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkExport(false);
                    setBulkExportStartDate('');
                    setBulkExportEndDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-text-light hover:bg-body-bg transition-colors"
                  disabled={exporting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkExport}
                  disabled={!bulkExportStartDate || !bulkExportEndDate || exporting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? 'Exportando...' : 'Exportar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
