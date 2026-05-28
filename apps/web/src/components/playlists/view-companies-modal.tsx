"use client";

import { Tv } from "lucide-react";
import { FormModal } from "@/components/modals/form-modal";

interface ViewCompaniesModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: any;
    companies: any[];
}

export function ViewCompaniesModal({ isOpen, onClose, playlist, companies }: ViewCompaniesModalProps) {
    const playlistCompanies = playlist?.companies || [];
    const playlistName = playlist?.name || "";

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Empresas: ${playlistName}`}
            maxWidth="max-w-md"
            footer={
                <button
                    onClick={onClose}
                    className="btn-premium bg-brand-main text-white px-6 py-2 w-full"
                >
                    Fechar
                </button>
            }
        >
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-3">
                    {playlistCompanies.map((comp: any) => (
                        <div
                            key={comp.id || comp.name}
                            className="flex items-center gap-4 p-3 rounded-lg border border-border bg-body-bg"
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                                style={{ backgroundColor: comp.color }}
                            >
                                <Tv className="w-5 h-5 drop-shadow-md" />
                            </div>
                            <div>
                                <h4 className="font-bold text-text-dark">{comp.name}</h4>
                                <p className="text-xs text-text-light">{comp.description || "Sem descrição"}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </FormModal>
    );
}
