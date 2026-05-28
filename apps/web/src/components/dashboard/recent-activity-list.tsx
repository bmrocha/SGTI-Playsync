"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Tv, Clock, Edit, Activity } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";

export function RecentActivityList() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { playlists, companies } = useAppStore();

    // Convert to array and take last 5 as "recent" logic for now (mocking timestamps)
    // In a real app we would sort by `updatedAt`
    const recentPlaylists = Object.values(playlists).slice(0, 5).reverse();

    return (
        <div className="bg-panel-bg rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden h-full transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="p-4 laptop:p-6 border-b border-border flex justify-between items-center bg-transparent">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 laptop:p-2 bg-brand-main/10 rounded-lg text-brand-main">
                        <Activity className="w-4 h-4 laptop:w-5 laptop:h-5" />
                    </div>
                    <div>
                        <h3 className="text-text-dark font-bold text-base laptop:text-lg">Log de Atividades</h3>
                        <p className="text-text-light text-[10px] laptop:text-xs">Visão geral das últimas atualizações</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/dashboard/activity-log')}
                    className="text-brand-main text-[10px] laptop:text-xs font-bold hover:underline"
                >
                    Ver Completo
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                {recentPlaylists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-text-light text-xs laptop:text-sm">
                        <Tv className="w-6 h-6 laptop:w-8 laptop:h-8 opacity-20 mb-2" />
                        Nenhuma atividade recente
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] laptop:text-xs text-text-light uppercase border-b border-border bg-black/5 dark:bg-white/5">
                                <th className="p-3 laptop:p-4 font-semibold">Playlist</th>
                                <th className="p-3 laptop:p-4 font-semibold hidden sm:table-cell">Empresa</th>
                                <th className="p-3 laptop:p-4 font-semibold text-center">Duração</th>
                                <th className="p-3 laptop:p-4 font-semibold text-center">Mídias</th>
                                <th className="p-3 laptop:p-4 font-semibold text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPlaylists.map((playlist, idx) => {
                                const duration = playlist.items.reduce((acc, item) => acc + (item.duration || 0), 0);
                                const minutes = Math.floor(duration / 60);
                                const seconds = duration % 60;

                                return (
                                    <tr key={playlist.id} className="border-b border-border last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-3 laptop:p-4">
                                            <div className="flex items-center gap-2 laptop:gap-3">
                                                <div className="w-6 h-6 laptop:w-8 laptop:h-8 rounded-lg bg-brand-main/20 flex items-center justify-center text-brand-main">
                                                    <Tv className="w-3 h-3 laptop:w-4 laptop:h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs laptop:text-sm font-bold text-text-dark">{playlist.name}</div>
                                                    <div className="text-[10px] laptop:text-xs text-text-light flex items-center gap-1">
                                                        <Clock className="w-2 h-2 laptop:w-3 laptop:h-3" />
                                                        <span>Agora mesmo</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 laptop:p-4 hidden sm:table-cell">
                                            {(() => {
                                                const companyName = playlist.companyNames[0];
                                                const company = companyName ? companies[companyName] : null;
                                                return (
                                                    <span
                                                        className="text-[10px] laptop:text-xs font-bold px-2 py-0.5 laptop:px-2.5 laptop:py-1 rounded-md border"
                                                        style={{
                                                            backgroundColor: company ? `${company.color}15` : 'var(--bg-panel)',
                                                            borderColor: company ? `${company.color}30` : 'var(--border)',
                                                            color: company ? company.color : 'var(--text-light)'
                                                        }}
                                                    >
                                                        {companyName || 'Geral'}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-3 laptop:p-4 text-center">
                                            <span className="text-[10px] laptop:text-xs font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 laptop:px-2 laptop:py-1 rounded text-text-dark">
                                                {minutes}m {seconds}s
                                            </span>
                                        </td>
                                        <td className="p-3 laptop:p-4 text-center">
                                            <span className="text-xs laptop:text-sm font-bold text-text-dark">
                                                {playlist.items.length}
                                            </span>
                                        </td>
                                        <td className="p-3 laptop:p-4 text-right">
                                            {user && hasPermission(user.role as UserRole, Permission.EDIT_PLAYLIST) && (
                                                <button
                                                    onClick={() => router.push(`/dashboard/editor?playlistId=${playlist.id}`)}
                                                    className="p-1.5 laptop:p-2 rounded-full hover:bg-brand-main/10 text-text-light hover:text-brand-main transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-3 h-3 laptop:w-4 laptop:h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
