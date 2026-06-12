import { useState, useEffect, useMemo } from 'react';
import { X, Save, Tv, Building2, Search, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { CompanySelector } from '@/components/ui/company-selector';
import { notifyError, notifySuccess } from '@/lib/notification-store';

interface Company {
  id: string;
  name: string;
  color: string;
}

interface Sector {
  id: string;
  name: string;
}

interface Playlist {
  id: string;
  name: string;
  companies: { id: string; name: string; color: string }[];
  sectors?: { id: string; name: string }[];
}

interface PlaylistSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist | null;
  companies: Company[];
  onSave: (id: string, name: string, companyIds: string[], sectorIds: string[]) => Promise<void>;
}

export function PlaylistSettingsModal({
  isOpen,
  onClose,
  playlist,
  companies,
  onSave,
}: PlaylistSettingsModalProps) {
  const [name, setName] = useState('');
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [sectorIds, setSectorIds] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sectorSearchTerm, setSectorSearchTerm] = useState('');

  // Convert companies to options format
  const companyOptions = useMemo(() => {
    return companies.map((comp) => ({
      value: comp.id,
      label: comp.name,
      color: comp.color,
    }));
  }, [companies]);

  useEffect(() => {
    if (!isOpen) return;
    fetchSectors();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && playlist) {
      setName(playlist.name);
      setCompanyIds(playlist.companies.map((c) => c.id));
      setSectorIds((playlist.sectors || []).map((s) => s.id));
    }
  }, [isOpen, playlist]);

  const fetchSectors = async () => {
    setLoadingSectors(true);
    try {
      const res = await fetch('/api/sectors');
      if (res.ok) {
        const data = await res.json();
        setAvailableSectors(data.sectors || []);
      }
    } catch (e) {
      console.error('Failed to fetch sectors:', e);
    } finally {
      setLoadingSectors(false);
    }
  };

  const toggleSector = (sectorId: string) => {
    setSectorIds((prev) =>
      prev.includes(sectorId) ? prev.filter((s) => s !== sectorId) : [...prev, sectorId],
    );
  };

  // Filter sectors based on search
  const filteredSectors = useMemo(() => {
    return availableSectors.filter((sector) =>
      sector.name.toLowerCase().includes(sectorSearchTerm.toLowerCase()),
    );
  }, [availableSectors, sectorSearchTerm]);

  const handleSelectAllSectors = () => {
    const allFilteredIds = filteredSectors.map((s) => s.id);
    const newIds = Array.from(new Set([...sectorIds, ...allFilteredIds]));
    setSectorIds(newIds);
  };

  const handleDeselectAllSectors = () => {
    const visibleIds = filteredSectors.map((s) => s.id);
    setSectorIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
  };

  const fetchPlaylistSectors = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/sectors`);
      if (res.ok) {
        const data = await res.json();
        setSectorIds((data.sectors || []).map((s: any) => s.id));
      }
    } catch (e) {
      console.error('Failed to fetch playlist sectors:', e);
    }
  };

  const handleSave = async () => {
    if (!playlist) return;
    if (!name.trim()) {
      notifyError('Nome Inválido', 'O nome da playlist não pode estar vazio.');
      return;
    }
    if (companyIds.length === 0) {
      notifyError('Seleção Inválida', 'Selecione pelo menos uma empresa.');
      return;
    }

    try {
      setLoading(true);
      await onSave(playlist.id, name, companyIds, sectorIds);
      notifySuccess('Sucesso', 'Playlist atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error saving playlist:', error);
      notifyError('Erro ao Salvar', 'Não foi possível salvar a playlist. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-panel-bg rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-border flex flex-col">
        {/* Header */}
        <div className="bg-panel-bg p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
            <Tv className="w-6 h-6 text-brand-main" />
            Configurações da Playlist
          </h3>
          <button
            onClick={onClose}
            className="text-text-light hover:text-text-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
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
            <label className="block text-sm font-bold text-brand-main mb-2">
              Empresas Vinculadas
            </label>
            <p className="text-xs text-brand-main/70 mb-3">
              Selecione quais empresas terão acesso a esta playlist.
            </p>
            <CompanySelector value={companyIds} onChange={setCompanyIds} options={companyOptions} />
          </div>

          {/* Setores */}
          <div>
            <label className="block text-sm font-bold text-brand-main mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-main" />
              Setores
            </label>
            <p className="text-xs text-brand-main/70 mb-3">
              Selecione os setores que terão acesso a esta playlist.
            </p>
            {loadingSectors ? (
              <p className="text-xs text-text-light py-4 text-center">Carregando setores...</p>
            ) : availableSectors.length === 0 ? (
              <p className="text-xs text-text-light py-4 text-center">Nenhum setor disponível</p>
            ) : (
              <div className="space-y-3">
                {/* Search and Bulk Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-border">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                      type="text"
                      placeholder="Buscar setor..."
                      value={sectorSearchTerm}
                      onChange={(e) => setSectorSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-body-bg border border-border rounded-md focus:border-brand-main focus:ring-1 focus:ring-brand-main/50 outline-none transition-all"
                    />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllSectors}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-brand-main bg-brand-main/10 hover:bg-brand-main/20 rounded-md transition-colors"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllSectors}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-text-light hover:text-text-dark hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="text-xs text-text-light font-medium px-1">
                  Mostrando {filteredSectors.length} de {availableSectors.length} setores
                  {sectorIds.length > 0 && (
                    <span className="text-brand-main ml-2">
                      • {sectorIds.length} selecionado(s)
                    </span>
                  )}
                </div>

                {/* Sectors Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {filteredSectors.length > 0 ? (
                    filteredSectors.map((sector) => {
                      const isSelected = sectorIds.includes(sector.id);
                      return (
                        <label
                          key={sector.id}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all group ${
                            isSelected
                              ? 'border-brand-main bg-brand-main/5 shadow-sm'
                              : 'border-border bg-card hover:border-brand-main/30 hover:shadow-md'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSector(sector.id)}
                            className="w-4 h-4 rounded border-border text-brand-main focus:ring-brand-main/20"
                          />
                          <span className="text-sm text-text-dark flex-1 truncate">
                            {sector.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3 h-3 text-brand-main flex-shrink-0" />
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-text-light italic">
                      Nenhum setor encontrado para "{sectorSearchTerm}"
                    </div>
                  )}
                </div>
              </div>
            )}
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
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
