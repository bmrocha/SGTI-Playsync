"use client";

import { useEffect, useState, useCallback } from "react";
import { Player } from "@/lib/player-store";
import { useAppStore } from "@/lib/store";
import { PlayerCard } from "@/components/players/player-card";
import { NewPlayerModal } from "@/components/modals/new-player-modal";
import { Monitor, Plus, RefreshCw, Filter, Search } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { notifyError } from "@/lib/notification-store";
import { useAuthStore } from "@/lib/auth-store";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";

export default function PlayersPage() {
    const { user } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Pagination & Filter State
    const [players, setPlayers] = useState<Player[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12); // Grid 3x4 or 4x3
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [companyFilter, setCompanyFilter] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

    const { companies } = useAppStore();
    const companyList = Object.values(companies);

    const fetchPlayers = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (companyFilter !== 'all') params.append('companyId', companyFilter);

            const res = await fetch(`/api/players?${params.toString()}`);
            if (!res.ok) throw new Error("Falha ao buscar players");

            const data = await res.json();
            setPlayers(data.players || []);
            setTotalItems(data.pagination?.total || 0);

        } catch (error) {
            console.error("Error fetching players", error);
            notifyError("Erro ao carregar players", "Não foi possível obter a lista de players do servidor");
        } finally {
            setIsRefreshing(false);
        }
    }, [page, limit, debouncedSearch, statusFilter, companyFilter]);

    // Initial Fetch & Polling
    useEffect(() => {
        fetchPlayers();
        
        // Poll current page every 15 seconds to keep status fresh
        const interval = setInterval(fetchPlayers, 15000);
        
        // Listen for refresh requests
        const handleRefresh = () => fetchPlayers();
        window.addEventListener('refresh-players', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-players', handleRefresh);
        };
    }, [fetchPlayers]);

    // Offline Alert System (Only for visible players)
    useEffect(() => {
        const offlinePlayers = players.filter(p => {
            const isOnline = p.status === 'online' && p.lastSeen
                ? (Date.now() - new Date(p.lastSeen).getTime() < 30000)
                : false;
            return !isOnline;
        });

        if (offlinePlayers.length > 0) {
            const lastAlert = sessionStorage.getItem('last_offline_alert');
            const now = Date.now();

            if (!lastAlert || (now - parseInt(lastAlert)) > 60000) { 
                // Only alert if we have critical mass or specific condition? 
                // For pagination, alerting on *visible* offline players is less noisy than *all*.
                // But maybe we want to know if *any* player is offline?
                // For now, keep it simple: alert if visible players are offline.
                // toast.error(`${offlinePlayers.length} Player(s) Offline na visualização atual!`, {
                //     duration: 4000,
                //     icon: '⚠️'
                // });
                // sessionStorage.setItem('last_offline_alert', now.toString());
            }
        }
    }, [players]);

    const handleEdit = (player: Player) => {
        setEditingPlayer(player);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlayer(null);
        fetchPlayers(); // Refresh list after edit/create
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="p-4 laptop:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-text-dark flex items-center gap-3">
                        <Monitor className="w-8 h-8 text-brand-main" />
                        Gerenciamento de Telas
                    </h1>
                    <p className="text-text-light mt-2">
                        Monitore e gerencie seus players Raspberry Pi conectados.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-premium px-3 py-2 border ${showFilters ? 'bg-brand-main text-white border-brand-main' : 'bg-panel-bg border-border text-text-light hover:border-brand-main hover:text-brand-main'}`}
                        title="Filtrar"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Filtros</span>
                    </button>
                    <button
                        onClick={fetchPlayers}
                        className={`btn-premium px-3 py-2 border bg-panel-bg border-border text-brand-main hover:bg-brand-main/10 hover:border-brand-main ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Atualizar Status"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {user && hasPermission(user.role as UserRole, Permission.CREATE_PLAYER) && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-premium bg-brand-main text-white px-4 py-2 hover:bg-brand-main/90"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Novo Player
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Filters Bar */}
            {showFilters && (
                <div className="mb-6 p-5 bg-panel-bg rounded-xl border border-border animate-slideDown shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="text-xs font-semibold text-text-light mb-1.5 block uppercase">Buscar</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Nome, Local ou IP..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1); // Reset page on search
                                    }}
                                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none text-sm transition-all"
                                />
                                <Search className="w-4 h-4 text-text-light absolute left-3 top-3" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-text-light mb-1.5 block uppercase">Status</label>
                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => {
                                    setStatusFilter(val as any);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "all", label: "Todos os Status" },
                                    { value: "online", label: <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online</span> },
                                    { value: "offline", label: <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Offline</span> }
                                ]}
                                placeholder="Selecione..."
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-text-light mb-1.5 block uppercase">Empresa</label>
                            <CustomSelect
                                value={companyFilter}
                                onChange={(val) => {
                                    setCompanyFilter(val);
                                    setPage(1);
                                }}
                                options={[
                                    { value: "all", label: "Todas as Empresas" },
                                    ...companyList.map(comp => ({
                                        value: comp.id,
                                        label: comp.name
                                    }))
                                ]}
                                placeholder="Selecione..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {players.length === 0 && !isRefreshing ? (
                <div className="text-center py-20 bg-panel-bg rounded-2xl border-2 border-dashed border-border">
                    <Monitor className="w-16 h-16 mx-auto text-brand-main/20 mb-4" />
                    <h3 className="text-xl font-semibold text-text-dark mb-2">Nenhum Player Encontrado</h3>
                    <p className="text-text-light mb-6 max-w-md mx-auto">
                        {totalItems === 0 && searchQuery === "" && statusFilter === "all" && companyFilter === "all"
                            ? "Cadastre seu primeiro dispositivo para começar a gerenciar suas telas remotamente."
                            : "Nenhum resultado para os filtros selecionados."}
                    </p>
                    {totalItems === 0 && searchQuery === "" && statusFilter === "all" && companyFilter === "all" && user && hasPermission(user.role as UserRole, Permission.CREATE_PLAYER) && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary"
                        >
                            Adicionar Player
                        </button>
                    )}
                    {(searchQuery || statusFilter !== "all" || companyFilter !== "all") && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                                setCompanyFilter("all");
                                setPage(1);
                            }}
                            className="btn-primary"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {players.map(player => (
                            <PlayerCard
                                key={player.id}
                                player={player}
                                onEdit={handleEdit}
                                onRefresh={fetchPlayers}
                            />
                        ))}
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(totalItems / limit)}
                        onPageChange={handlePageChange}
                        totalItems={totalItems}
                        itemsPerPage={limit}
                    />
                </>
            )}

            <NewPlayerModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialData={editingPlayer}
            />
        </div>
    );
}
