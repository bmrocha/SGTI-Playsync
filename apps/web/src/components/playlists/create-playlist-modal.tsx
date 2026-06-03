'use client';

import { useState, useMemo, useEffect } from 'react';
import { FormModal } from '@/components/modals/form-modal';
import { CompanySelector } from '@/components/ui/company-selector';
import { Building2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  color: string;
}

interface Sector {
  id: string;
  name: string;
}

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onSubmit: (name: string, companyIds: string[], sectorIds: string[]) => void;
}

export function CreatePlaylistModal({
  isOpen,
  onClose,
  companies,
  onSubmit,
}: CreatePlaylistModalProps) {
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [sectorIds, setSectorIds] = useState<string[]>([]);
  const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchSectors();
  }, [isOpen]);

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

  const companyOptions = useMemo(() => {
    return companies.map((comp) => ({
      value: comp.id,
      label: comp.name,
      color: comp.color,
    }));
  }, [companies]);

  const handleSubmit = () => {
    onSubmit(playlistName, companyIds, sectorIds);
    setCompanyIds([]);
    setPlaylistName('');
    setSectorIds([]);
  };

  const handleClose = () => {
    setCompanyIds([]);
    setPlaylistName('');
    setSectorIds([]);
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
          <label className="block text-sm font-bold text-text-dark mb-2">
            Empresas Responsáveis
          </label>
          <CompanySelector value={companyIds} onChange={setCompanyIds} options={companyOptions} />
        </div>

        {/* Setores */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-text-dark mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-main" />
            Setores
          </label>
          {loadingSectors ? (
            <p className="text-xs text-text-light py-4 text-center">Carregando setores...</p>
          ) : availableSectors.length === 0 ? (
            <p className="text-xs text-text-light py-4 text-center">Nenhum setor disponível</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableSectors.map((sector) => (
                <label
                  key={sector.id}
                  className="flex items-center gap-2 p-2.5 bg-border/20 rounded-lg border border-border cursor-pointer hover:bg-border/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={sectorIds.includes(sector.id)}
                    onChange={() => toggleSector(sector.id)}
                    className="w-4 h-4 rounded border-border text-brand-main focus:ring-brand-main/20"
                  />
                  <span className="text-sm text-text-dark">{sector.name}</span>
                </label>
              ))}
            </div>
          )}
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
