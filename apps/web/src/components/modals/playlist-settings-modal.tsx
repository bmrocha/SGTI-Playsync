import { useState, useEffect, useMemo } from "react";
import { X, Save, Tv } from "lucide-react";
import { CompanySelector } from "@/components/ui/company-selector";
import { notifyError, notifySuccess } from "@/lib/notification-store";

interface Company {
    id: string;
    name: string;
    color: string;
}

interface Playlist {
    id: string;
    name: string;
    companies: { id: string; name: string; color: string }[];
}

interface PlaylistSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: Playlist | null;
    companies: Company[];
    onSave: (id: string, name: string, companyIds: string[]) => Promise<void>;
}

export function PlaylistSettingsModal({ isOpen, onClose, playlist, companies, onSave }: PlaylistSettingsModalProps) {
    const [name, setName] = useState("");
    const [companyIds, setCompanyIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Convert companies to options format
    const companyOptions = useMemo(() => {
        return companies.map(comp => ({
            value: comp.id,
            label: comp.name,
            color: comp.color
        }));
    }, [companies]);

    useEffect(() => {
        if (isOpen && playlist) {
            setName(playlist.name);
            setCompanyIds(playlist.companies.map(c => c.id));
        }
    }, [isOpen, playlist]);

    const handleSave = async () => {
        if (!playlist) return;
        if (!name.trim()) {
            notifyError("Nome Inválido", "O nome da playlist não pode estar vazio.");
            return;
        }
        if (companyIds.length === 0) {
            notifyError("Seleção Inválida", "Selecione pelo menos uma empresa.");
            return;
        }

        try {
            setLoading(true);
            await onSave(playlist.id, name, companyIds);
            notifySuccess("Sucesso", "Playlist atualizada com sucesso!");
            onClose();
        } catch (error) {
            console.error("Error saving playlist:", error);
            notifyError("Erro ao Salvar", "Não foi possível salvar a playlist. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-panel-bg rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border flex flex-col">

                {/* Header */}
                <div className="bg-panel-bg p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                        <Tv className="w-6 h-6 text-brand-main" />
                        Configurações da Playlist
                    </h3>
                    <button onClick={onClose} className="text-text-light hover:text-text-dark transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-brand-main mb-2">Nome da Playlist</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-body-bg border border-border rounded-lg p-3 text-brand-main focus:border-brand-main outline-none transition-colors placeholder:text-brand-main/50"
                            placeholder="Ex: Campanhas Mensais"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-brand-main mb-2">Empresas Vinculadas</label>
                        <p className="text-xs text-brand-main/70 mb-3">Selecione quais empresas terão acesso a esta playlist.</p>
                        <CompanySelector
                            value={companyIds}
                            onChange={setCompanyIds}
                            options={companyOptions}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-body-bg border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-brand-main font-medium hover:bg-border/50 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-premium bg-brand-main text-white px-6 py-2 hover:bg-brand-accent hover:text-black dark:hover:text-black transition-all shadow-md flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </div>
            </div>
        </div>
    );
}
