"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useConfirm, ConfirmModal } from "@/components/modals/confirm-modal";
import { PlaylistSettingsModal } from "@/components/modals/playlist-settings-modal";
import { logPlaylistCreated, logPlaylistDeleted } from "@/lib/activity-log-store";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { notifyError, notifySuccess } from "@/lib/notification-store";

import { PageHeader } from "@/components/playlists/page-header";
import { FiltersBar } from "@/components/playlists/filters-bar";
import { PlaylistCard } from "@/components/playlists/playlist-card";
import { EmptyState } from "@/components/playlists/empty-state";
import { CreatePlaylistModal } from "@/components/playlists/create-playlist-modal";
import { ViewCompaniesModal } from "@/components/playlists/view-companies-modal";

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
    items: any[];
}

export default function PlaylistsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const companyNameFilter = searchParams.get("company");

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
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [sortBy, setSortBy] = useState("name-asc");

    const [viewCompaniesModal, setViewCompaniesModal] = useState<{ isOpen: boolean; playlist: any }>({
        isOpen: false,
        playlist: null
    });

    const fetchData = async () => {
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
                const company = companiesData.find(c => c.name === companyNameFilter);
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
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, debouncedSearch]);

    const handleCreatePlaylist = async (name: string, companyIds: string[]) => {
        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, companyIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar playlist');
            }

            if (user) {
                const companyNames = companyIds
                    .map(id => companies.find(c => c.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');

                logPlaylistCreated(user.id, user.name, user.role, name, companyNames);
            }

            await fetchData();
            setIsCreateModalOpen(false);
            notifySuccess("Playlist Criada", `Playlist "${name}" criada com sucesso!`);
        } catch (error) {
            console.error("Error creating playlist:", error);
            notifyError("Erro ao criar playlist", error instanceof Error ? error.message : "Erro desconhecido");
        }
    };

    const handleDelete = (playlistId: string, playlistName: string) => {
        confirm({
            title: "Excluir Playlist",
            message: `Deseja excluir a playlist "${playlistName}"? Esta ação não pode ser desfeita.`,
            type: "danger",
            onConfirm: async () => {
                try {
                    const response = await fetch(`/api/playlists/${playlistId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Erro ao excluir playlist');
                    }

                    if (user) {
                        logPlaylistDeleted(user.id, user.name, user.role, playlistName);
                    }

                    await fetchData();
                    notifySuccess("Playlist Excluída", `Playlist "${playlistName}" excluída com sucesso.`);
                } catch (error) {
                    console.error('Error deleting playlist:', error);
                    notifyError("Erro ao excluir", "Não foi possível excluir a playlist. Tente novamente.");
                }
            }
        });
    };

    const handleUpdatePlaylist = async (id: string, name: string, companyIds: string[]) => {
        const response = await fetch(`/api/playlists/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, companyIds })
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

    const handleSettings = (playlist: any) => {
        setSettingsPlaylistId(playlist.id);
        setIsSettingsModalOpen(true);
    };

    const handleViewCompanies = (playlist: any) => {
        setViewCompaniesModal({ isOpen: true, playlist });
    };

    const filteredPlaylists = useMemo(() => {
        return playlists
            .filter(pl => {
                const matchesCompany = !companyNameFilter || pl.companies.some(c => c.name === companyNameFilter);
                const matchesSearch = searchTerm === "" ||
                    pl.name.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCompany && matchesSearch;
            })
            .sort((a, b) => {
                if (sortBy === "name-asc") return a.name.localeCompare(b.name);
                if (sortBy === "name-desc") return b.name.localeCompare(a.name);
                return 0;
            });
    }, [playlists, companyNameFilter, searchTerm, sortBy]);

    const currentSettingsPlaylist = useMemo(() => {
        return playlists.find(p => p.id === settingsPlaylistId) || null;
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

                    {filteredPlaylists.length === 0 && user && (hasPermission(user.role as UserRole, Permission.CREATE_PLAYLIST) || searchTerm || companyNameFilter) && (
                        <EmptyState
                            searchTerm={searchTerm}
                            hasActiveFilter={!!companyNameFilter}
                            onClearFilters={() => setSearchTerm("")}
                            onCreatePlaylist={() => setIsCreateModalOpen(true)}
                        />
                    )}
                </div>

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
                onClose={() => { setIsSettingsModalOpen(false); setSettingsPlaylistId(null); }}
                playlist={currentSettingsPlaylist}
                companies={companies}
                onSave={handleUpdatePlaylist}
            />

            <ConfirmModal {...confirmProps} />
        </div>
    );
}
