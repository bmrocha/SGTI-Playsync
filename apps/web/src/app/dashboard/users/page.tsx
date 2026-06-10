'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Mail,
  Trash2,
  Edit,
  Plus,
  Search,
  Key,
  Filter,
  X,
  Zap,
  Eye,
  FileEdit,
  Building2,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/custom-select';
import Image from 'next/image';
import { ConfirmModal, useConfirm } from '@/components/modals/confirm-modal';
import { Pagination } from '@/components/ui/pagination';
import { useAuthStore } from '@/lib/auth-store';
import { useDebounce } from '@/hooks/use-debounce';
import { UserRole, hasPermission, Permission } from '@/lib/permissions';
import { notifySuccess, notifyError } from '@/lib/notification-store';
import { logUserDeleted } from '@/lib/activity-log-store';
import { UserFormModal } from '@/components/modals/user-form-modal';
import { PasswordResetModal } from '@/components/modals/password-reset-modal';

const roleConfig = {
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
    icon: FileEdit,
    permissions: ['Editar Playlists', 'Visualizar', 'Upload de Mídia'],
  },
  [UserRole.VIEWER]: {
    label: 'Visualizador',
    color: '#10b981',
    icon: Eye,
    permissions: ['Visualizar Playlists', 'Gerar Links'],
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { confirm, confirmProps } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  interface UserData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId?: string;
    company?: { name: string };
    avatar?: string;
    createdAt: string | Date;
    lastLogin?: string | Date;
    [key: string]: unknown;
  }

  interface CompanyData {
    id: string;
    name: string;
    [key: string]: unknown;
  }

  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [, setIsLoading] = useState(true);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedRole) params.append('role', selectedRole);

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
        setTotalItems(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } else {
        notifyError('Erro', 'Falha ao carregar usuários');
      }

      const companiesResponse = await fetch('/api/companies');
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      notifyError('Erro', 'Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedRole]);

  // Load users on mount and dependency change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedRole]);

  const filteredUsers = users; // Users are already filtered by API

  const handleOpenModal = (userId?: string) => {
    if (userId) {
      setEditingUserId(userId);
    } else {
      setEditingUserId(null);
    }
    setIsModalOpen(true);
  };

  const handleDelete = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (userId === currentUser?.id) {
      notifyError('Erro', 'Você não pode excluir sua própria conta!');
      return;
    }

    confirm({
      title: 'Excluir Usuário',
      message: `Deseja realmente excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/users`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: userId,
              actorId: currentUser?.id,
              actorName: currentUser?.name,
              actorRole: currentUser?.role,
            }),
          });

          if (response.ok) {
            await fetchUsers();
            if (currentUser) {
              logUserDeleted(currentUser.id, currentUser.name, currentUser.role, user.name);
            }
            notifySuccess('Usuário Excluído', `${user.name} foi removido do sistema`);
          } else {
            const data = await response.json();
            notifyError('Erro', data.error || 'Falha ao excluir usuário');
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          notifyError('Erro', 'Erro ao conectar com o servidor');
        }
      },
    });
  };

  const handleOpenResetModal = (user: UserData) => {
    setResetUserId(user.id);
    setResetUserName(user.name);
    setIsResetModalOpen(true);
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === UserRole.ADMIN).length,
    editors: users.filter((u) => u.role === UserRole.EDITOR).length,
    viewers: users.filter((u) => u.role === UserRole.VIEWER).length,
  };

  // Check permissions
  const canManageUsers = currentUser && hasPermission(currentUser.role, Permission.MANAGE_USERS);

  if (!currentUser || !hasPermission(currentUser.role, Permission.VIEW_USERS)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-text-dark mb-2">Acesso Negado</h2>
          <p className="text-text-light">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-premium px-3 py-2 border ${showFilters ? 'bg-brand-main text-white border-brand-main' : 'bg-panel-bg border-border text-text-light hover:border-brand-main hover:text-brand-main'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Filtros</span>
          </button>
          {canManageUsers && (
            <button
              onClick={() => handleOpenModal()}
              className="btn-premium bg-brand-main text-white px-4 py-2 hover:bg-brand-main/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Usuário
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 laptop:gap-3 mb-6">
        <div className="card-hover bg-panel-bg p-5 laptop:p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-light uppercase font-semibold">Total</p>
              <p className="text-3xl laptop:text-2xl font-bold text-text-dark mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 laptop:w-10 laptop:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 laptop:w-5 laptop:h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card-hover bg-panel-bg p-5 laptop:p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-light uppercase font-semibold">Administradores</p>
              <p className="text-3xl laptop:text-2xl font-bold text-text-dark mt-1">
                {stats.admins}
              </p>
            </div>
            <div className="w-12 h-12 laptop:w-10 laptop:h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 laptop:w-5 laptop:h-5 text-red-500" />
            </div>
          </div>
        </div>

        <div className="card-hover bg-panel-bg p-5 laptop:p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-light uppercase font-semibold">Editores</p>
              <p className="text-3xl laptop:text-2xl font-bold text-text-dark mt-1">
                {stats.editors}
              </p>
            </div>
            <div className="w-12 h-12 laptop:w-10 laptop:h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Edit className="w-6 h-6 laptop:w-5 laptop:h-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="card-hover bg-panel-bg p-5 laptop:p-4 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-light uppercase font-semibold">Visualizadores</p>
              <p className="text-3xl laptop:text-2xl font-bold text-text-dark mt-1">
                {stats.viewers}
              </p>
            </div>
            <div className="w-12 h-12 laptop:w-10 laptop:h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 laptop:w-5 laptop:h-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-panel-bg border border-border rounded-xl p-4 animate-slideUp shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-10 py-2.5 bg-body-bg border border-border rounded-lg text-sm focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-text-dark placeholder:text-text-light/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="md:col-span-2">
              <CustomSelect
                value={selectedRole}
                onChange={setSelectedRole}
                options={[
                  { value: '', label: 'Todas as Funções' },
                  { value: UserRole.ADMIN, label: 'Administrador' },
                  { value: UserRole.EDITOR, label: 'Editor' },
                  { value: UserRole.VIEWER, label: 'Visualizador' },
                ]}
                placeholder="Filtrar por Função"
              />
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-panel-bg rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-border/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">
                  Último Acesso
                </th>
                {canManageUsers && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-text-light uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-border/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden relative"
                        style={{
                          backgroundColor: !user.avatar
                            ? user.email === 'admin@sgti.com'
                              ? '#06b6d4'
                              : roleConfig[user.role as UserRole]?.color || '#ccc'
                            : 'transparent',
                        }}
                      >
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-text-dark">{user.name}</div>
                        <div className="text-sm text-text-light flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${user.email === 'admin@sgti.com' ? '#06b6d4' : roleConfig[user.role as UserRole]?.color || '#ccc'}20`,
                          color:
                            user.email === 'admin@sgti.com'
                              ? '#06b6d4'
                              : roleConfig[user.role as UserRole]?.color || '#ccc',
                        }}
                      >
                        {(() => {
                          const Icon =
                            user.email === 'admin@sgti.com'
                              ? Zap
                              : roleConfig[user.role as UserRole]?.icon || Shield;
                          return <Icon className="w-3 h-3 mr-1" />;
                        })()}
                        {user.email === 'admin@sgti.com'
                          ? 'Hoot'
                          : roleConfig[user.role as UserRole]?.label || user.role}
                      </span>
                      <div className="text-xs text-text-light mt-1">
                        {roleConfig[user.role as UserRole]?.permissions.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-light">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-light">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {user.email === 'admin@sgti.com' ? (
                          <div
                            className="flex items-center text-[10px] font-bold p-2 gap-1 italic opacity-80"
                            style={{ color: '#06b6d4' }}
                          >
                            <Zap className="w-3 h-3" />
                            Conta Hoot (Bloqueada)
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenModal(user.id)}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Editar usuário"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenResetModal(user)}
                              className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors"
                              title="Redefinir Senha"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={user.id === currentUser?.id}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-text-light">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={limit}
            />
          </div>
        )}
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUserId(null);
        }}
        editingUserId={editingUserId}
        onSaved={fetchUsers}
        users={users}
        companies={companies}
        currentUser={currentUser}
      />

      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        userId={resetUserId}
        userName={resetUserName}
        onSaved={fetchUsers}
        currentUser={currentUser}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal {...confirmProps} />
    </div>
  );
}
