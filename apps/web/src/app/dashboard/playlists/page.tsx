'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useConfirm, ConfirmModal } from '@/components/modals/confirm-modal';
import { PlaylistSettingsModal } from '@/components/modals/playlist-settings-modal';
import { logPlaylistCreated, logPlaylistDeleted } from '@/lib/activity-log-store';
import { Permission, hasPermission, UserRole } from '@/lib/permissions';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { notifyError, notifySuccess } from '@/lib/notification-store';
import { Grid, List } from 'lucide-react';

import { PageHeader } from '@/components/playlists/page-header';
import { FiltersBar } from '@/components/playlists/filters-bar';
import { PlaylistCard } from '@/components/playlists/playlist-card';
import { EmptyState } from '@/components/playlists/empty-state';
import { CreatePlaylistModal } from '@/components/playlists/create-playlist-modal';
import { ViewCompaniesModal } from '@/components/playlists/view-companies-modal';

interface Company {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  companies: { id: string; name: string; color: string }[];
  items: Array<Record<string, unknown>>;
}

export default function PlaylistsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyNameFilter = searchParams.get('company');

  const { user } = useAuthStore();
  const { confirm, confirmProps } = useConfirm();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsPlaylistId, setSettingsPlaylistId] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState('name-asc');

  const [viewCompaniesModal, setViewCompaniesModal] = useState<{
    isOpen: boolean;
    playlist: Playlist | null;
  }>({
    isOpen: false,
    playlist: null,
  });

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const companiesRes = await fetch('/api/companies');
      let companiesData: Company[] = [];

      if (companiesRes.ok) {
        const data = await companiesRes.json();
        companiesData = data.companies;
        setCompanies(companiesData);
      }

      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (debouncedSearch) params.set('search', debouncedSearch);

      if (companyNameFilter) {
        const company = companiesData.find((c) => c.name === companyNameFilter);
        if (company) {
          params.set('companyId', company.id);
        }
      }

      const playlistsRes = await fetch(`/api/playlists?${params.toString()}`);

      if (playlistsRes.ok) {
        const data = await playlistsRes.json();
        setPlaylists(data.playlists);
        if (data.pagination) {
          setTotalItems(data.pagination.total);
          setTotalPages(data.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, companyNameFilter, companies]);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, companyNameFilter]);

  const handleCreatePlaylist = async (name: string, companyIds: string[], sectorIds: string[]) => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, companyIds, sectorIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar playlist');
      }

      if (user) {
        const companyNames = companyIds
          .map((id) => companies.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(', ');

        logPlaylistCreated(user.id, user.name, user.role, name, companyNames);
      }

      await fetchData();
      setIsCreateModalOpen(false);
      notifySuccess('Playlist Criada', `Playlist "${name}" criada com sucesso!`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      notifyError(
        'Erro ao criar playlist',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  };

  const handleDelete = (playlistId: string, playlistName: string) => {
    confirm({
      title: 'Excluir Playlist',
      message: `Deseja excluir a playlist "${playlistName}"? Esta ação não pode ser desfeita.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/playlists/${playlistId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Erro ao excluir playlist');
          }

          if (user) {
            logPlaylistDeleted(user.id, user.name, user.role, playlistName);
          }

          await fetchData();
          notifySuccess('Playlist Excluída', `Playlist "${playlistName}" excluída com sucesso.`);
        } catch (error) {
          console.error('Error deleting playlist:', error);
          notifyError('Erro ao excluir', 'Não foi possível excluir a playlist. Tente novamente.');
        }
      },
    });
  };

  const handleUpdatePlaylist = async (
    id: string,
    name: string,
    companyIds: string[],
    sectorIds: string[],
  ) => {
    const response = await fetch(`/api/playlists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, companyIds, sectorIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar playlist');
    }

    await fetchData();
  };

  const handleEdit = (playlistId: string) => {
    router.push(`/dashboard/editor?playlistId=${playlistId}`);
  };

  const handleSettings = (playlist: Playlist) => {
    setSettingsPlaylistId(playlist.id);
    setIsSettingsModalOpen(true);
  };

  const handleViewCompanies = (playlist: Playlist) => {
    setViewCompaniesModal({ isOpen: true, playlist });
  };

  const filteredPlaylists = useMemo(() => {
    return playlists
      .filter((pl) => {
        const matchesCompany =
          !companyNameFilter || pl.companies.some((c) => c.name === companyNameFilter);
        const matchesSearch =
          searchTerm === '' || pl.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCompany && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
      });
  }, [playlists, companyNameFilter, searchTerm, sortBy]);

  const currentSettingsPlaylist = useMemo(() => {
    return playlists.find((p) => p.id === settingsPlaylistId) || null;
  }, [playlists, settingsPlaylistId]);

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-main"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <PageHeader
          totalItems={filteredPlaylists.length}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          user={user}
          onNewPlaylist={() => setIsCreateModalOpen(true)}
        />

        {showFilters && (
          <FiltersBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4 mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-brand-main text-white' : 'bg-panel-bg border border-border text-text-light hover:border-brand-main'}`}
              title="Visualização em Cards"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-main text-white' : 'bg-panel-bg border border-border text-text-light hover:border-brand-main'}`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-text-light">{totalItems} playlists</span>
        </div>

        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 laptop:gap-6">
            {filteredPlaylists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                user={user}
                companies={companies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSettings={handleSettings}
                onViewCompanies={handleViewCompanies}
              />
            ))}

            {filteredPlaylists.length === 0 &&
              user &&
              (hasPermission(user.role as UserRole, Permission.CREATE_PLAYLIST) ||
                searchTerm ||
                companyNameFilter) && (
                <EmptyState
                  searchTerm={searchTerm}
                  hasActiveFilter={!!companyNameFilter}
                  onClearFilters={() => setSearchTerm('')}
                  onCreatePlaylist={() => setIsCreateModalOpen(true)}
                />
              )}
          </div>
        ) : (
          <div className="bg-panel-bg rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-border/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                    Empresas
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                    Mídias
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlaylists.map((pl) => (
                  <tr key={pl.id} className="hover:bg-border/10 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-text-dark">{pl.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-light">
                        {pl.companies.length} empresas
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-light">{pl.items.length} mídias</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(pl.id)}
                          className="px-2 py-1 text-xs text-text-light hover:text-brand-main hover:bg-brand-main/10 rounded transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleSettings(pl)}
                          className="px-2 py-1 text-xs text-text-light hover:text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                        >
                          Config
                        </button>
                        <button
                          onClick={() => handleDelete(pl.id, pl.name)}
                          className="px-2 py-1 text-xs text-text-light hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={limit}
            />
          </div>
        )}
      </div>

      <ViewCompaniesModal
        isOpen={viewCompaniesModal.isOpen}
        onClose={() => setViewCompaniesModal({ ...viewCompaniesModal, isOpen: false })}
        playlist={viewCompaniesModal.playlist}
        companies={companies}
      />

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        companies={companies}
        onSubmit={handleCreatePlaylist}
      />

      <PlaylistSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setSettingsPlaylistId(null);
        }}
        playlist={currentSettingsPlaylist}
        companies={companies}
        onSave={handleUpdatePlaylist}
      />

      <ConfirmModal {...confirmProps} />
    </div>
  );
}
