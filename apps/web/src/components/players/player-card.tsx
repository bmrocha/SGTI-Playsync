"use client";

import { Player, usePlayerStore } from "@/lib/player-store";
import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Monitor, Cpu, HardDrive, Wifi, WifiOff, Clock, Trash2, RotateCw, MapPin, Building2, Network, FileText, Power, RefreshCw, Edit } from "lucide-react";
import { useConfirm, ConfirmModal } from "@/components/modals/confirm-modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { notifySuccess, notifyError } from "@/lib/notification-store";
import { useAuthStore } from "@/lib/auth-store";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";

interface PlayerCardProps {
    player: Player;
    onEdit?: (player: Player) => void;
    onRefresh?: () => void;
}

export function PlayerCard({ player, onEdit, onRefresh }: PlayerCardProps) {
    const { removePlayer, assignPlaylist } = usePlayerStore();
    const { user } = useAuthStore();
    const { confirm, confirmProps } = useConfirm();

    const isOnline = player.status === 'online' && player.lastSeen
        ? (Date.now() - new Date(player.lastSeen).getTime() < 30000)
        : false;

    // Live Uptime Logic
    const [uptimeDisplay, setUptimeDisplay] = useState(0);

    useEffect(() => {
        if (!isOnline || !player.metrics?.uptime) {
            setUptimeDisplay(0);
            return;
        }

        // Initialize with server metric
        setUptimeDisplay(player.metrics.uptime);

        const interval = setInterval(() => {
            setUptimeDisplay(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isOnline, player.metrics?.uptime]);

    const formatUptime = (seconds: number) => {
        if (!seconds) return "00:00:00";
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleDelete = () => {
        confirm({
            title: "Remover Player",
            message: `Tem certeza que deseja remover "${player.name}"?`,
            type: "danger",
            onConfirm: async () => {
                // Optimistic UI update (if store is used)
                removePlayer(player.id);

                // Server persistence
                try {
                    await fetch(`/api/players?id=${player.id}`, { method: 'DELETE' });
                    notifySuccess("Player removido", "O player foi removido do sistema");
                    if (onRefresh) onRefresh();
                    else window.dispatchEvent(new Event('refresh-players'));
                } catch (error) {
                    notifyError("Erro ao remover do servidor", "O player pode não ter sido removido corretamente");
                }
            }
        });
    };

    const handleAssignPlaylist = async (playlistId: string) => {
        // Optimistic
        assignPlaylist(player.id, playlistId);

        // Server Persistence
        try {
            await fetch('/api/players', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: player.id,
                    updates: { currentPlaylistId: playlistId }
                })
            });
            notifySuccess("Playlist atribuída", "A playlist foi vinculada ao player");
            if (onRefresh) onRefresh();
            else window.dispatchEvent(new Event('refresh-players'));
        } catch (error) {
            console.error("Failed to assign playlist", error);
            notifyError("Erro ao atribuir playlist", "Não foi possível vincular a playlist ao player");
        }
    };

    const formatLastSeen = (dateStr: string | null) => {
        if (!dateStr) return "Nunca";
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    const { companies } = useAppStore();
    const company = player.companyId ? companies[player.companyId] : null;

    return (
        <div className="bg-panel-bg border border-border rounded-xl p-4 laptop:p-5 hover:border-green-300/50 hover:bg-green-50 dark:hover:bg-brand-main/10 transition-all group shadow-sm hover:shadow-md h-full flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3 laptop:mb-4">
                    <div className="flex items-center gap-2 laptop:gap-3">
                        <div className={`p-2 laptop:p-2.5 rounded-lg ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            <Monitor className="w-5 h-5 laptop:w-6 laptop:h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-dark text-sm laptop:text-base truncate max-w-[120px] laptop:max-w-[150px]" title={player.name}>
                                {player.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-text-light">
                                {isOnline ? (
                                    <>
                                        <Wifi className="w-3 h-3 text-green-500" />
                                        <span className="text-green-600 font-medium">Online</span>
                                    </>
                                ) : (
                                    <>
                                        <WifiOff className="w-3 h-3 text-red-500" />
                                        <span className="text-red-500 font-medium">Offline</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {user && hasPermission(user.role as UserRole, Permission.EDIT_PLAYER) && (
                            <button
                                onClick={() => onEdit && onEdit(player)}
                                className="p-1.5 laptop:p-2 hover:bg-brand-main/10 text-brand-main rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit className="w-3.5 h-3.5 laptop:w-4 laptop:h-4" />
                            </button>
                        )}
                        {user && hasPermission(user.role as UserRole, Permission.DELETE_PLAYER) && (
                            <button
                                onClick={handleDelete}
                                className="p-1.5 laptop:p-2 hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remover"
                            >
                                <Trash2 className="w-3.5 h-3.5 laptop:w-4 laptop:h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5 laptop:space-y-2 mb-3 laptop:mb-4">
                    {/* Location & Company */}
                    <div className="flex items-center gap-2 text-xs text-text-light">
                        <MapPin className="w-3 h-3 laptop:w-3.5 laptop:h-3.5" />
                        <span className="truncate max-w-[150px]">{player.location}</span>
                    </div>
                    {company && (
                        <div className="flex items-center gap-2 text-xs text-text-light">
                            <Building2 className="w-3.5 h-3.5" style={{ color: company.color }} />
                            <span className="truncate">{company.name}</span>
                        </div>
                    )}

                    {/* Playlist Selection */}
                    {company && (
                        <div className="mt-3 pt-3 border-t border-border border-dashed">
                            <label className="text-[10px] uppercase text-text-light font-semibold mb-1 block">Playlist Ativa</label>
                            {user && hasPermission(user.role as UserRole, Permission.EDIT_PLAYER) ? (
                                <CustomSelect
                                    value={player.currentPlaylistId || ""}
                                    onChange={(val) => handleAssignPlaylist(val)}
                                    options={[
                                        { value: "", label: "Sem Playlist" },
                                        ...Object.keys(company.playlists).map(plName => ({
                                            value: plName,
                                            label: plName
                                        }))
                                    ]}
                                    placeholder="Sem Playlist"
                                    className="text-xs"
                                />
                            ) : (
                                <div className="p-2 bg-body-bg border border-border rounded-lg text-xs text-text-light font-medium">
                                    {player.currentPlaylistId || "Sem Playlist Ativa"}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Credentials Info (Only if present) */}
                    {player.credentials?.ip && (
                        <div className="flex items-center gap-2 text-xs font-mono text-text-light/80 bg-black/5 dark:bg-white/5 p-1.5 rounded mt-2">
                            <Network className="w-3 h-3" />
                            <span>{player.credentials.ip}</span>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="border border-border/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-text-light mb-1">
                            <Cpu className="w-3 h-3 text-brand-main" /> CPU
                        </div>
                        <span className="text-sm font-semibold text-text-dark">
                            {isOnline && player.metrics ? `${player.metrics.cpu}%` : '-'}
                        </span>
                    </div>
                    <div className="border border-border/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-text-light mb-1">
                            <HardDrive className="w-3 h-3 text-brand-main" /> RAM
                        </div>
                        <span className="text-sm font-semibold text-text-dark">
                            {isOnline && player.metrics ? `${player.metrics.mem}%` : '-'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-text-light pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5" title="Tempo Online">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">{formatUptime(uptimeDisplay)}</span>
                    </div>
                    {player.attachedFiles && player.attachedFiles.length > 0 && (
                        <div className="flex items-center gap-1" title={`${player.attachedFiles.length} arquivos anexados`}>
                            <FileText className="w-3 h-3" />
                            {player.attachedFiles.length}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal {...confirmProps} />
        </div>
    );
}
