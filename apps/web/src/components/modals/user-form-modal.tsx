"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Shield, Building2, Key } from "lucide-react";
import { FormModal } from "@/components/modals/form-modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { UserRole, ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { notifyError, notifySuccess } from "@/lib/notification-store";
import { logUserCreated } from "@/lib/activity-log-store";

const roleConfig: Record<UserRole, {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    permissions: string[];
}> = {
    [UserRole.ADMIN]: {
        label: "Administrador",
        color: "#ef4444",
        icon: Shield,
        permissions: ["Acesso Total", "Gerenciar Usuários", "Editar Playlists", "Visualizar"]
    },
    [UserRole.COMPANY_ADMIN]: {
        label: "Admin. da Empresa",
        color: "#3b82f6",
        icon: Building2,
        permissions: ["Gerenciar Empresa", "Playlists", "Mídia", "Analytics"]
    },
    [UserRole.EDITOR]: {
        label: "Editor",
        color: "#a855f7",
        icon: Shield,
        permissions: ["Editar Playlists", "Visualizar", "Upload de Mídia"]
    },
    [UserRole.VIEWER]: {
        label: "Visualizador",
        color: "#10b981",
        icon: Shield,
        permissions: ["Visualizar Playlists", "Gerar Links"]
    }
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
        name: "",
        email: "",
        role: UserRole.VIEWER,
        companyId: "",
        password: "",
        forcePasswordReset: false,
        forceTwoFactorSetup: false
    });

    useEffect(() => {
        if (!isOpen) return;

        if (editingUserId) {
            const user = users.find((u: any) => u.id === editingUserId);
            if (user) {
                setFormData({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    companyId: user.company_id || "",
                    password: "",
                    forcePasswordReset: user.forcePasswordReset || false,
                    forceTwoFactorSetup: user.forceTwoFactorSetup || false
                });
            }
        } else {
            setFormData({
                name: "",
                email: "",
                role: UserRole.VIEWER,
                companyId: "",
                password: "Psw@@Reset1234",
                forcePasswordReset: true,
                forceTwoFactorSetup: false
            });
        }
    }, [isOpen, editingUserId, users]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            notifyError("Erro", "Por favor, preencha todos os campos!");
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
                        ...(formData.password && { password: formData.password })
                    })
                });

                if (response.ok) {
                    await onSaved();
                    notifySuccess("Usuário Atualizado", `${formData.name} foi atualizado com sucesso`);
                    onClose();
                } else {
                    const data = await response.json();
                    notifyError("Erro", data.error || "Falha ao atualizar usuário");
                }
            } else {
                if (!formData.password) {
                    notifyError("Erro", "Senha é obrigatória para novos usuários!");
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
                    })
                });

                if (response.ok) {
                    await onSaved();

                    if (currentUser) {
                        logUserCreated(currentUser.id, currentUser.name, currentUser.role, formData.name, formData.role);
                    }

                    notifySuccess("Usuário Criado", `${formData.name} foi adicionado ao sistema`);
                    onClose();
                } else {
                    const data = await response.json();
                    notifyError("Erro", data.error || "Falha ao criar usuário");
                }
            }
        } catch (error) {
            console.error('Error saving user:', error);
            notifyError("Erro", "Erro ao conectar com o servidor");
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={editingUserId ? "Editar Usuário" : "Novo Usuário"}
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
                        {editingUserId ? "Salvar Alterações" : "Criar Usuário"}
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
                            { value: UserRole.VIEWER, label: "Visualizador - Apenas visualização" },
                            { value: UserRole.EDITOR, label: "Editor - Editar playlists e mídia" },
                            { value: UserRole.COMPANY_ADMIN, label: "Admin. da Empresa - Gestão completa da empresa" },
                            { value: UserRole.ADMIN, label: "Administrador - Acesso total ao sistema" },
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

                {(formData.role === UserRole.COMPANY_ADMIN || formData.role === UserRole.EDITOR || formData.role === UserRole.VIEWER) && (
                    <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            Empresa Vinculada
                        </label>
                        <CustomSelect
                            value={formData.companyId || ""}
                            onChange={(value) => setFormData({ ...formData, companyId: value })}
                            options={[
                                { value: "", label: "Nenhuma (Acesso Global)" },
                                ...companies.map((c: any) => ({ value: c.id, label: c.name }))
                            ]}
                        />
                        <p className="text-xs text-text-light mt-1">
                            {formData.companyId
                                ? "O usuário terá acesso restrito apenas a esta empresa."
                                : "Sem empresa vinculada, o usuário terá acesso global (se a função permitir)."}
                        </p>
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 bg-border/20 rounded-lg border border-border">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-text-dark flex items-center gap-2">
                                <Shield className="w-4 h-4 text-brand-main" />
                                Forçar Setup 2FA
                            </span>
                            <span className="text-xs text-text-light mt-1">O usuário será obrigado a configurar 2FA no próximo login</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.forceTwoFactorSetup || false}
                                onChange={(e) => setFormData({ ...formData, forceTwoFactorSetup: e.target.checked })}
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
                            <span className="text-xs text-text-light mt-1">O usuário deverá redefinir a senha no próximo acesso</span>
                        </div>
                        <label className={`relative inline-flex items-center ${!editingUserId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
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
                            <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">Primeiro Acesso Seguro</h4>
                            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium leading-relaxed mt-1">
                                O usuário será criado com a senha padrão <strong>Psw@@Reset1234</strong>. A opção de "Forçar Troca de Senha" foi ativada automaticamente. O usuário será obrigado a definir uma nova senha forte em seu primeiro acesso.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </FormModal>
    );
}
