'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { notifyError, notifySuccess } from '@/lib/notification-store';
import { ConfirmModal, useConfirm } from '@/components/modals/confirm-modal';
import { FormModal } from '@/components/modals/form-modal';

interface Sector {
  id: string;
  name: string;
  description?: string;
  companyId?: string;
  createdAt: string;
}

export default function SectorsPage() {
  const { confirm, confirmProps } = useConfirm();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sectors');
      if (res.ok) {
        const data = await res.json();
        setSectors(data.sectors || []);
      }
    } catch (e) {
      console.error('Failed to fetch sectors:', e);
      notifyError('Erro', 'Não foi possível carregar os setores.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      notifyError('Erro', 'Nome do setor é obrigatório.');
      return;
    }

    try {
      if (editingSector) {
        const res = await fetch(`/api/sectors`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSector.id,
            name: formData.name,
            description: formData.description,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao atualizar setor');
        }

        notifySuccess('Sucesso', `Setor "${formData.name}" atualizado com sucesso!`);
      } else {
        const res = await fetch('/api/sectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, description: formData.description }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao criar setor');
        }

        notifySuccess('Sucesso', `Setor "${formData.name}" criado com sucesso!`);
      }

      await fetchSectors();
      setIsModalOpen(false);
      setEditingSector(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error saving sector:', error);
      notifyError('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setFormData({ name: sector.name, description: sector.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = (sector: Sector) => {
    confirm({
      title: 'Excluir Setor',
      message: `Deseja excluir o setor "${sector.name}"? Esta ação não pode ser desfeita.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/sectors`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: sector.id }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Erro ao excluir setor');
          }

          notifySuccess('Sucesso', `Setor "${sector.name}" excluído com sucesso.`);
          await fetchSectors();
        } catch (error) {
          console.error('Error deleting sector:', error);
          notifyError('Erro', error instanceof Error ? error.message : 'Erro desconhecido');
        }
      },
    });
  };

  const filteredSectors = sectors.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setEditingSector(null);
            setFormData({ name: '', description: '' });
            setIsModalOpen(true);
          }}
          className="btn-premium bg-brand-main text-white px-5 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Setor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar setores..."
          className="w-full pl-10 pr-4 py-2.5 bg-panel-bg border border-border rounded-lg text-sm focus:border-brand-main outline-none transition-colors text-text-dark placeholder:text-text-light/50"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-main border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSectors.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-text-light/30 mx-auto mb-3" />
          <p className="text-text-light">Nenhum setor encontrado</p>
        </div>
      ) : (
        <div className="bg-panel-bg rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-border/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                  Descrição
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                  Criado em
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-text-light uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSectors.map((sector) => (
                <tr key={sector.id} className="hover:bg-border/10 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-text-dark">{sector.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-light">{sector.description || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-light">
                      {sector.createdAt
                        ? new Date(sector.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(sector)}
                        className="p-1.5 text-text-light hover:text-brand-main hover:bg-brand-main/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sector)}
                        className="p-1.5 text-text-light hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSector(null);
          setFormData({ name: '', description: '' });
        }}
        title={editingSector ? 'Editar Setor' : 'Novo Setor'}
        footer={
          <>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingSector(null);
                setFormData({ name: '', description: '' });
              }}
              className="px-6 py-2.5 border border-border text-text-dark hover:bg-border/20 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-brand-main hover:bg-brand-main/90 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              {editingSector ? 'Salvar' : 'Criar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1.5">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Recepção, Administração, Produção"
              className="w-full p-3 bg-border/20 border border-border rounded-lg text-sm focus:border-brand-main outline-none transition-colors text-text-dark placeholder:text-text-light/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1.5">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional do setor"
              rows={3}
              className="w-full p-3 bg-border/20 border border-border rounded-lg text-sm focus:border-brand-main outline-none transition-colors text-text-dark placeholder:text-text-light/50 resize-none"
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal {...confirmProps} />
    </div>
  );
}
