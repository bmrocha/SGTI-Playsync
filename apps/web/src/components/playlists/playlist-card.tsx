"use client";

import { Tv, Trash2, Edit, Settings } from "lucide-react";
import Image from "next/image";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";

function PlaylistPreview({ items }: { items: any[] }) {
    if (items.length === 0) return null;

    const firstItem = items[0];
    const hasZones = firstItem.zones && firstItem.zones.length > 0;
    const layout = firstItem.layout || 'single';

    const getPreviewGridClass = () => {
        switch (layout) {
            case 'grid-2x2': return 'grid-cols-2 grid-rows-2';
            case 'horizontal-2': return 'grid-cols-2 grid-rows-1';
            case 'horizontal-3': return 'grid-cols-3 grid-rows-1';
            case 'vertical-2': return 'grid-cols-1 grid-rows-2';
            case 'vertical-3': return 'grid-cols-1 grid-rows-3';
            case 'split-left': return 'grid-cols-[2fr_1fr] grid-rows-2';
            case 'split-right': return 'grid-cols-[1fr_2fr] grid-rows-2';
            default: return 'grid-cols-1 grid-rows-1';
        }
    };

    return (
        <div className="mb-3 laptop:mb-4 rounded-lg overflow-hidden border border-border bg-black aspect-video">
            {hasZones ? (
                <div className={`w-full h-full grid ${getPreviewGridClass()} gap-0.5`}>
                    {firstItem.zones?.map((zone: any, idx: number) => {
                        const isSplit = layout?.startsWith('split') && idx === 0;
                        return (
                            <div key={idx} className={`relative bg-gray-900 overflow-hidden ${isSplit ? 'row-span-2' : ''}`}>
                                {zone?.type === 'image' && (
                                    <Image
                                        src={zone.url}
                                        alt={zone.name || 'Zone content'}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        style={{ transform: `rotate(${zone.rotation || 0}deg)` }}
                                    />
                                )}
                                {zone?.type === 'video' && (
                                    <video
                                        src={zone.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        style={{ transform: `rotate(${zone.rotation || 0}deg)` }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="w-full h-full relative overflow-hidden">
                    {firstItem.type === 'image' && (
                        <Image
                            src={firstItem.url}
                            alt={firstItem.name || 'Playlist item'}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ transform: `rotate(${firstItem.rotation || 0}deg)` }}
                        />
                    )}
                    {firstItem.type === 'video' && (
                        <video
                            src={firstItem.url}
                            className="w-full h-full object-cover"
                            muted
                            style={{ transform: `rotate(${firstItem.rotation || 0}deg)` }}
                        />
                    )}
                    {firstItem.type === 'youtube' && (
                        <div className="w-full h-full flex items-center justify-center bg-red-600 text-white">
                            <div className="text-center">
                                <div className="text-4xl mb-2">▶</div>
                                <div className="text-xs">YouTube</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface PlaylistCardProps {
    playlist: any;
    user: any;
    companies: any[];
    onEdit: (id: string) => void;
    onDelete: (id: string, name: string) => void;
    onSettings: (playlist: any) => void;
    onViewCompanies: (playlist: any) => void;
}

export function PlaylistCard({
    playlist,
    user,
    companies,
    onEdit,
    onDelete,
    onSettings,
    onViewCompanies
}: PlaylistCardProps) {
    const associatedCompanies = playlist.companies || [];

    return (
        <div className="card-hover bg-panel-bg rounded-xl overflow-hidden shadow-sm border border-border p-4 laptop:p-5 flex flex-col relative group">
            <div className="flex items-start mb-3 laptop:mb-4">
                <div className="flex -space-x-2 mr-3 laptop:mr-4 shrink-0 group/companies relative">
                    {associatedCompanies.length > 0 ? (
                        <>
                            {associatedCompanies.slice(0, 3).map((comp: any, i: number) => (
                                <div
                                    key={comp.id}
                                    className="w-8 h-8 laptop:w-10 laptop:h-10 rounded-full flex items-center justify-center text-sm laptop:text-lg shadow-md border-2 border-panel-bg relative transition-transform hover:scale-110 hover:z-20"
                                    style={{
                                        backgroundColor: comp.color,
                                        color: '#fff',
                                        zIndex: 3 - i
                                    }}
                                    title={comp.name}
                                >
                                    <Tv className="w-4 h-4 laptop:w-5 laptop:h-5 drop-shadow-md" />
                                </div>
                            ))}

                            {associatedCompanies.length > 3 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewCompanies(playlist); }}
                                    className="w-8 h-8 laptop:w-10 laptop:h-10 rounded-full flex items-center justify-center text-[10px] laptop:text-xs font-bold shadow-md border-2 border-panel-bg bg-gray-700 text-white relative z-0 hover:scale-110 hover:bg-gray-800 transition-all"
                                    title="Ver todas as empresas"
                                >
                                    +{associatedCompanies.length - 3}
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-8 h-8 laptop:w-10 laptop:h-10 rounded-full flex items-center justify-center bg-gray-500 text-white shadow-md border-2 border-panel-bg">
                            <Tv className="w-4 h-4 laptop:w-5 laptop:h-5" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5 laptop:pt-1">
                    <h4 className="m-0 text-base laptop:text-lg text-text-dark font-bold truncate" title={playlist.name}>{playlist.name}</h4>
                    <div className="text-xs laptop:text-sm text-text-light">
                        {associatedCompanies.length === 0 ? (
                            "Sem empresa"
                        ) : associatedCompanies.length === 1 ? (
                            <span className="truncate block" title={associatedCompanies[0].name}>
                                {associatedCompanies[0].name}
                            </span>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewCompanies(playlist); }}
                                className="font-medium hover:text-brand-main hover:underline transition-colors"
                            >
                                {associatedCompanies.length} Empresas
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <PlaylistPreview items={playlist.items} />

            <p className="text-xs laptop:text-sm font-medium text-text-light mb-4 laptop:mb-6 bg-body-bg py-1.5 laptop:py-2 px-2.5 laptop:px-3 rounded-md border border-border inline-block self-start">
                🎬 {playlist.items.length} {playlist.items.length === 1 ? "item" : "itens"}
            </p>

            {user && (hasPermission(user.role as UserRole, Permission.EDIT_PLAYLIST) || hasPermission(user.role as UserRole, Permission.DELETE_PLAYLIST)) && (
                <div className="flex gap-2 laptop:gap-3 mt-auto pt-3 laptop:pt-4 border-t border-border">
                    {hasPermission(user.role as UserRole, Permission.EDIT_PLAYLIST) && (
                        <>
                            <button
                                onClick={() => onEdit(playlist.id)}
                                className="btn-premium flex-1 bg-brand-main/10 text-brand-main hover:bg-brand-main hover:text-white text-xs laptop:text-sm py-1.5 laptop:py-2 font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Editar Conteúdo"
                            >
                                <Edit className="w-3.5 h-3.5 laptop:w-4 laptop:h-4" /> Editar
                            </button>
                            <button
                                onClick={() => onSettings(playlist)}
                                className="btn-premium p-1.5 laptop:p-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                                title="Configurações (Empresas/Nome)"
                            >
                                <Settings className="w-3.5 h-3.5 laptop:w-4 laptop:h-4" />
                            </button>
                        </>
                    )}
                    {hasPermission(user.role as UserRole, Permission.DELETE_PLAYLIST) && (
                        <button
                            onClick={() => onDelete(playlist.id, playlist.name)}
                            className="btn-premium p-1.5 laptop:p-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                            title="Excluir Playlist"
                        >
                            <Trash2 className="w-3.5 h-3.5 laptop:w-4 laptop:h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
