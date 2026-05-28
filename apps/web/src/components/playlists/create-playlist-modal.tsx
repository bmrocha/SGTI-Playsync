"use client";

import { useState, useMemo } from "react";
import { FormModal } from "@/components/modals/form-modal";
import { CompanySelector } from "@/components/ui/company-selector";

interface Company {
    id: string;
    name: string;
    color: string;
}

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    companies: Company[];
    onSubmit: (name: string, companyIds: string[]) => void;
}

export function CreatePlaylistModal({ isOpen, onClose, companies, onSubmit }: CreatePlaylistModalProps) {
    const [companyIds, setCompanyIds] = useState<string[]>([]);
    const [playlistName, setPlaylistName] = useState("");

    const companyOptions = useMemo(() => {
        return companies.map(comp => ({
            value: comp.id,
            label: comp.name,
            color: comp.color
        }));
    }, [companies]);

    const handleSubmit = () => {
        onSubmit(playlistName, companyIds);
        setCompanyIds([]);
        setPlaylistName("");
    };

    const handleClose = () => {
        setCompanyIds([]);
        setPlaylistName("");
        onClose();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Nova Playlist"
            maxWidth="max-w-4xl"
            footer={
                <>
                    <button
                        onClick={handleClose}
                        className="btn-premium bg-border/50 text-text-dark px-5 py-2.5 hover:bg-border"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn-premium bg-brand-main text-white px-6 py-2.5"
                    >
                        Criar Playlist
                    </button>
                </>
            }
        >
            <div>
                <div className="mb-6">
                    <label className="block text-sm font-bold text-text-dark mb-2">Empresas Responsáveis</label>
                    <CompanySelector
                        value={companyIds}
                        onChange={setCompanyIds}
                        options={companyOptions}
                    />
                </div>
                <div className="mb-2">
                    <label className="block text-sm font-bold text-text-dark mb-2">Nome da Playlist</label>
                    <input
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        placeholder="Ex: Recepção Principal, TV Hall, etc."
                        className="w-full p-3 bg-body-bg border-2 border-border rounded-lg text-base focus:border-brand-main focus:ring-4 focus:ring-brand-main/10 outline-none transition-all text-text-dark placeholder:text-text-light/50"
                        autoFocus
                    />
                </div>
            </div>
        </FormModal>
    );
}
