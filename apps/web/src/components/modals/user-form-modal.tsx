'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Shield,
  Building2,
  Key,
  Lock,
  Pencil,
  Trash2,
  Eye,
  Upload,
  BarChart3,
  Settings,
  FileText,
  Monitor,
} from 'lucide-react';
import { FormModal } from '@/components/modals/form-modal';
import { CustomSelect } from '@/components/ui/custom-select';
import {
  UserRole,
  ROLE_LABELS,
  ROLE_COLORS,
  Permission,
  ROLE_PERMISSIONS,
} from '@/lib/permissions';
import { notifyError, notifySuccess } from '@/lib/notification-store';
import { logUserCreated } from '@/lib/activity-log-store';

const permissionGroups = [
  {
    label: 'Usuários',
    icon: Users,
    permissions: [Permission.MANAGE_USERS, Permission.VIEW_USERS],
  },
  {
    label: 'Empresas',
    icon: Building2,
    permissions: [
      Permission.CREATE_COMPANY,
      Permission.EDIT_COMPANY,
      Permission.DELETE_COMPANY,
      Permission.VIEW_COMPANY,
    ],
  },
  {
    label: 'Playlists',
    icon: FileText,
    permissions: [
      Permission.CREATE_PLAYLIST,
      Permission.EDIT_PLAYLIST,
      Permission.DELETE_PLAYLIST,
      Permission.VIEW_PLAYLIST,
    ],
  },
  {
    label: 'Mídia',
    icon: Upload,
    permissions: [Permission.UPLOAD_MEDIA, Permission.DELETE_MEDIA, Permission.EDIT_MEDIA],
  },
  {
    label: 'Players',
    icon: Monitor,
    permissions: [
      Permission.CREATE_PLAYER,
      Permission.EDIT_PLAYER,
      Permission.DELETE_PLAYER,
      Permission.VIEW_PLAYER,
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    permissions: [Permission.VIEW_ANALYTICS, Permission.VIEW_ALL_ANALYTICS],
  },
  {
    label: 'Logs',
    icon: Eye,
    permissions: [Permission.VIEW_ACTIVITY_LOG, Permission.EXPORT_ACTIVITY_LOG],
  },
  {
    label: 'Sistema',
    icon: Settings,
    permissions: [Permission.MANAGE_SETTINGS],
  },
];

const roleConfig: Record<
  UserRole,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    permissions: string[];
  }
> = {
  [UserRole.ADMIN]: {
    label: 'Administrador',
    color: '#ef4444',
    icon: Shield,
    permissions: ['Acesso Total', 'Gerenciar Usuários', 'Editar Playlists', 'Visualizar'],
  },
  [UserRole.COMPANY_ADMIN]: {
    label: 'Admin. da Empresa',
    color: '#3b82f6',
    icon: Building2,
    permissions: ['Gerenciar Empresa', 'Playlists', 'Mídia', 'Analytics'],
  },
  [UserRole.EDITOR]: {
    label: 'Editor',
    color: '#a855f7',
    icon: Shield,
    permissions: ['Editar Playlists', 'Visualizar', 'Upload de Mídia'],
  },
  [UserRole.VIEWER]: {
    label: 'Visualizador',
    color: '#10b981',
    icon: Shield,
    permissions: ['Visualizar Playlists', 'Gerar Links'],
  },
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUserId: string | null;
  onSaved: () => Promise<void>;
  users: any[];
  companies: any[];
  currentUser: any;
}

export function UserFormModal({
  isOpen,
  onClose,
  editingUserId,
  onSaved,
  users,
  companies,
  currentUser,
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.VIEWER,
    companyId: '',
    password: '',
    forcePasswordReset: false,
    forceTwoFactorSetup: false,
  });
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [enableCustomPermissions, setEnableCustomPermissions] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [availableSectors, setAvailableSectors] = useState<any[]>([]);
  const [userSectorIds, setUserSectorIds] = useState<string[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);

  const fetchPermissions = async (userId: string) => {
    setLoadingPermissions(true);
    try {
      const res = await fetch(`/api/users/${userId}/permissions`);
      if (res.ok) {
        const data = await res.json();
        const perms = data.permissions || [];
        setCustomPermissions(perms);
        setEnableCustomPermissions(perms.length > 0);
      }
    } catch (e) {
      console.error('Failed to fetch permissions:', e);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const togglePermission = (perm: string) => {
    setCustomPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const selectAllInGroup = (perms: string[]) => {
    setCustomPermissions((prev) => {
      const missing = perms.filter((p) => !prev.includes(p));
      if (missing.length === 0) {
        return prev.filter((p) => !perms.includes(p));
      }
      return [...new Set([...prev, ...missing])];
    });
  };

  const savePermissions = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: enableCustomPermissions ? customPermissions : [],
          actorId: currentUser?.id,
          actorName: currentUser?.name,
          actorRole: currentUser?.role,
        }),
      });
    } catch (e) {
      console.error('Failed to save permissions:', e);
    }
  };

  const fetchSectors = async () => {
    setLoadingSectors(true);
    try {
      const params = new URLSearchParams();
      if (currentUser?.companyId) params.set('companyId', currentUser.companyId);
      const res = await fetch(`/api/sectors?${params}`);
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

  const fetchUserSectors = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/sectors`);
      if (res.ok) {
        const data = await res.json();
        setUserSectorIds((data.sectors || []).map((s: any) => s.id));
      }
    } catch (e) {
      console.error('Failed to fetch user sectors:', e);
    }
  };

  const toggleSector = (sectorId: string) => {
    setUserSectorIds((prev) =>
      prev.includes(sectorId) ? prev.filter((s) => s !== sectorId) : [...prev, sectorId],
    );
  };

  const saveUserSectors = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/sectors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorIds: userSectorIds }),
      });
    } catch (e) {
      console.error('Failed to save user sectors:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchSectors();

    if (editingUserId) {
      const user = users.find((u: any) => u.id === editingUserId);
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.company_id || '',
          password: '',
          forcePasswordReset: user.forcePasswordReset || false,
          forceTwoFactorSetup: user.forceTwoFactorSetup || false,
        });
        fetchPermissions(editingUserId);
        fetchUserSectors(editingUserId);
      }
    } else {
      setFormData({
        name: '',
        email: '',
        role: UserRole.VIEWER,
        companyId: '',
        password: 'Psw@@Reset1234',
        forcePasswordReset: true,
        forceTwoFactorSetup: false,
      });
      setCustomPermissions([]);
      setEnableCustomPermissions(false);
      setUserSectorIds([]);
    }
  }, [isOpen, editingUserId, users]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      notifyError('Erro', 'Por favor, preencha todos os campos!');
      return;
    }

    try {
      if (editingUserId) {
        const response = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUserId,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            companyId: formData.companyId || null,
            forcePasswordReset: formData.forcePasswordReset,
            forceTwoFactorSetup: formData.forceTwoFactorSetup,
            actorId: currentUser?.id,
            actorName: currentUser?.name,
            actorRole: currentUser?.role,
            ...(formData.password && { password: formData.password }),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const userId = result.id || result.user?.id || editingUserId;
          if (userId) {
            if (enableCustomPermissions) {
              await savePermissions(userId);
            }
            await saveUserSectors(userId);
          }
          await onSaved();
          notifySuccess('Usuário Atualizado', `${formData.name} foi atualizado com sucesso`);
          onClose();
        } else {
          const data = await response.json();
          notifyError('Erro', data.error || 'Falha ao atualizar usuário');
        }
      } else {
        if (!formData.password) {
          notifyError('Erro', 'Senha é obrigatória para novos usuários!');
          return;
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            companyId: formData.companyId || null,
            actorId: currentUser?.id,
            actorName: currentUser?.name,
            actorRole: currentUser?.role,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const userId = result.id || result.user?.id;
          if (userId) {
            if (enableCustomPermissions) {
              await savePermissions(userId);
            }
            await saveUserSectors(userId);
          }
          await onSaved();

          if (currentUser) {
            logUserCreated(
              currentUser.id,
              currentUser.name,
              currentUser.role,
              formData.name,
              formData.role,
            );
          }

          notifySuccess('Usuário Criado', `${formData.name} foi adicionado ao sistema`);
          onClose();
        } else {
          const data = await response.json();
          notifyError('Erro', data.error || 'Falha ao criar usuário');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      notifyError('Erro', 'Erro ao conectar com o servidor');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUserId ? 'Editar Usuário' : 'Novo Usuário'}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border text-text-dark hover:bg-border/20 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-brand-main hover:bg-brand-main/90 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            {editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Nome Completo
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20"
            placeholder="Digite o nome completo"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20"
            placeholder="usuario@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-dark mb-2">
            <Shield className="w-4 h-4 inline mr-1" />
            Função / Nível de Acesso
          </label>
          <CustomSelect
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value as UserRole })}
            options={[
              { value: UserRole.VIEWER, label: 'Visualizador - Apenas visualização' },
              { value: UserRole.EDITOR, label: 'Editor - Editar playlists e mídia' },
              {
                value: UserRole.COMPANY_ADMIN,
                label: 'Admin. da Empresa - Gestão completa da empresa',
              },
              { value: UserRole.ADMIN, label: 'Administrador - Acesso total ao sistema' },
            ]}
          />
          <div className="mt-2 p-3 bg-border/20 rounded-lg">
            <p className="text-xs font-semibold text-text-dark mb-1">Permissões:</p>
            <ul className="text-xs text-text-light space-y-0.5">
              {roleConfig[formData.role].permissions.map((perm, idx) => (
                <li key={idx}>✓ {perm}</li>
              ))}
            </ul>
          </div>
        </div>

        {(formData.role === UserRole.COMPANY_ADMIN ||
          formData.role === UserRole.EDITOR ||
          formData.role === UserRole.VIEWER) && (
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Empresa Vinculada
            </label>
            <CustomSelect
              value={formData.companyId || ''}
              onChange={(value) => setFormData({ ...formData, companyId: value })}
              options={[
                { value: '', label: 'Nenhuma (Acesso Global)' },
                ...companies.map((c: any) => ({ value: c.id, label: c.name })),
              ]}
            />
            <p className="text-xs text-text-light mt-1">
              {formData.companyId
                ? 'O usuário terá acesso restrito apenas a esta empresa.'
                : 'Sem empresa vinculada, o usuário terá acesso global (se a função permitir).'}
            </p>
          </div>
        )}

        {editingUserId && (
          <div className="space-y-3 pt-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-main" />
                <span className="text-sm font-semibold text-text-dark">
                  Permissões Personalizadas
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableCustomPermissions}
                  onChange={(e) => setEnableCustomPermissions(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-main/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-main"></div>
              </label>
            </div>
            {enableCustomPermissions && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {loadingPermissions ? (
                  <p className="text-xs text-text-light py-4 text-center">
                    Carregando permissões...
                  </p>
                ) : (
                  permissionGroups.map((group) => {
                    const Icon = group.icon;
                    const allSelected = group.permissions.every((p) =>
                      customPermissions.includes(p),
                    );
                    return (
                      <div
                        key={group.label}
                        className="p-3 bg-border/20 rounded-lg border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-brand-main" />
                            <span className="text-xs font-bold text-text-dark">{group.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => selectAllInGroup(group.permissions)}
                            className="text-[10px] text-brand-main hover:underline font-medium"
                          >
                            {allSelected ? 'Desmarcar' : 'Selecionar'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {group.permissions.map((perm) => (
                            <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={customPermissions.includes(perm)}
                                onChange={() => togglePermission(perm)}
                                className="w-3.5 h-3.5 rounded border-border text-brand-main focus:ring-brand-main/20"
                              />
                              <span className="text-[11px] text-text-dark">
                                {perm
                                  .replace('MANAGE_', 'Gerenciar ')
                                  .replace('VIEW_', 'Ver ')
                                  .replace('CREATE_', 'Criar ')
                                  .replace('EDIT_', 'Editar ')
                                  .replace('DELETE_', 'Excluir ')
                                  .replace('UPLOAD_', 'Upload ')
                                  .replace('EXPORT_', 'Exportar ')
                                  .replace('ALL_', 'Todos ')
                                  .replace('USERS', 'Usuários')
                                  .replace('COMPANY', 'Empresa')
                                  .replace('PLAYLIST', 'Playlist')
                                  .replace('MEDIA', 'Mídia')
                                  .replace('PLAYER', 'Player')
                                  .replace('ANALYTICS', 'Analytics')
                                  .replace('ACTIVITY_LOG', 'Logs')
                                  .replace('SETTINGS', 'Configurações')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Setores */}
        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-text-dark flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-main" />
            Setores
          </label>
          <p className="text-xs text-text-light -mt-1">
            Selecione os setores que este usuário pode acessar
          </p>
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
                    checked={userSectorIds.includes(sector.id)}
                    onChange={() => toggleSector(sector.id)}
                    className="w-4 h-4 rounded border-border text-brand-main focus:ring-brand-main/20"
                  />
                  <span className="text-sm text-text-dark">{sector.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 bg-border/20 rounded-lg border border-border">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-dark flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-main" />
                Forçar Setup 2FA
              </span>
              <span className="text-xs text-text-light mt-1">
                O usuário será obrigado a configurar 2FA no próximo login
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.forceTwoFactorSetup || false}
                onChange={(e) =>
                  setFormData({ ...formData, forceTwoFactorSetup: e.target.checked })
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-main/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-main"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-border/20 rounded-lg border border-border">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-dark flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-main" />
                Forçar Troca de Senha
              </span>
              <span className="text-xs text-text-light mt-1">
                O usuário deverá redefinir a senha no próximo acesso
              </span>
            </div>
            <label
              className={`relative inline-flex items-center ${!editingUserId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.forcePasswordReset || false}
                onChange={(e) => setFormData({ ...formData, forcePasswordReset: e.target.checked })}
                disabled={!editingUserId}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-main/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-main"></div>
            </label>
          </div>
        </div>

        {!editingUserId && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 mt-4">
            <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                Primeiro Acesso Seguro
              </h4>
              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium leading-relaxed mt-1">
                O usuário será criado com a senha padrão <strong>Psw@@Reset1234</strong>. A opção de
                "Forçar Troca de Senha" foi ativada automaticamente. O usuário será obrigado a
                definir uma nova senha forte em seu primeiro acesso.
              </p>
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
}
