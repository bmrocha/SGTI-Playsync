"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { generateUUID } from "@/lib/utils";
import { X, Monitor } from "lucide-react";
import { notifySuccess } from "@/lib/notification-store";

interface DistributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceCompany: string;
    sourcePlaylist: string;
    mediaItemIndex: number;
}

export function DistributeModal({ isOpen, onClose, sourceCompany, sourcePlaylist, mediaItemIndex }: DistributeModalProps) {
    const { companies, playlists, addMediaItem } = useAppStore();
    const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const sourceItem = companies[sourceCompany]?.playlists[sourcePlaylist]?.[mediaItemIndex];
    if (!sourceItem) return null;

    const togglePlaylist = (companyName: string, playlistName: string) => {
        const key = `${companyName}::${playlistName}`;
        const newSet = new Set(selectedPlaylists);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedPlaylists(newSet);
    };

    const handleDistribute = () => {
        selectedPlaylists.forEach((key) => {
            const [companyName, playlistName] = key.split("::");
            // Find target playlist ID
            const targetPlaylist = Object.values(playlists).find(p => p.name === playlistName && p.companyNames.includes(companyName));

            if (targetPlaylist) {
                // Create a copy of the item with a new ID
                const newItem = { ...sourceItem, id: generateUUID() };
                addMediaItem(targetPlaylist.id, newItem);
            }
        });
        notifySuccess("Sucesso", `Mídia distribuída para ${selectedPlaylists.size} playlist(s)!`);
        setSelectedPlaylists(new Set());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-center justify-center">
            <div className="bg-panel-bg w-[600px] max-w-[95%] rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-brand-main text-white p-5 flex justify-between items-center">
                    <h2 className="m-0 text-xl font-bold">Distribuir Mídia</h2>
                    <button
                        onClick={onClose}
                        className="text-white text-3xl leading-none hover:opacity-70 transition-opacity"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <p className="mt-0 mb-4 text-text-light">
                        Selecione as playlists destino para <strong>{sourceItem.name}</strong>:
                    </p>
                    <div className="space-y-3">
                        {Object.entries(companies).map(([compName, company]) => (
                            <div key={compName} className="border border-border rounded-lg p-3">
                                <div className="font-bold text-text-dark mb-2 flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: company.color }}
                                    />
                                    {compName}
                                </div>
                                <div className="pl-6 space-y-1">
                                    {Object.keys(company.playlists).map((plName) => {
                                        const key = `${compName}::${plName}`;
                                        const isSelected = selectedPlaylists.has(key);
                                        const isSameAsSource = compName === sourceCompany && plName === sourcePlaylist;

                                        return (
                                            <label
                                                key={plName}
                                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors ${isSameAsSource ? "opacity-50 cursor-not-allowed" : ""
                                                    }`}
                                            >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isSameAsSource}
                                                        onChange={() => !isSameAsSource && togglePlaylist(compName, plName)}
                                                        className="w-4 h-4 rounded accent-brand-main text-brand-main focus:ring-0 cursor-pointer"
                                                    />
                                                <span className="text-sm text-text-dark flex items-center gap-1.5">
                                                    <Monitor className="w-3.5 h-3.5 text-brand-main" />
                                                    {plName}
                                                    {isSameAsSource && " (origem)"}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5 bg-[#f9f9f9] flex justify-end gap-3 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-md text-sm font-bold bg-[#eee] text-text-dark hover:bg-[#ddd] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDistribute}
                        disabled={selectedPlaylists.size === 0}
                        className="px-5 py-2.5 rounded-md text-sm font-bold bg-brand-main text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Distribuir ({selectedPlaylists.size})
                    </button>
                </div>
            </div>
        </div>
    );
}
