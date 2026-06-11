'use client';

import { useAuthStore } from '@/lib/auth-store';
import Image from 'next/image';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Camera,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Palette,
  Moon,
  Sun,
  Lock,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserRole } from '@/lib/permissions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import { notifySuccess, notifyError } from '@/lib/notification-store';
import { useThemeStore } from '@/lib/theme-store';
import { useNotificationStore } from '@/lib/notification-store';

function SettingsPageContent() {
  const { user, updateProfile } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Search params no longer needed for security sections

  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { theme, primaryColor, setTheme, setPrimaryColor } = useThemeStore();

  const [draftTheme, setDraftTheme] = useState<'light' | 'dark'>('light');
  const [draftPrimaryColor, setDraftPrimaryColor] = useState<string>('#11876d');

  // Track initial appearance to detect changes
  const [initialTheme, setInitialTheme] = useState<string>('');
  const [initialPrimaryColor, setInitialPrimaryColor] = useState<string>('');

  // Refs for scrolling no longer needed

  // Forced scroll effects removed

  // Trap navigation if changes exist
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hasChanges && rootRef.current && !rootRef.current.contains(e.target as Node)) {
        // Check if the click is coming from the Header/Navbar
        // The header usually has a specific class or is outside the main content
        const isHeaderClick =
          (e.target as HTMLElement).closest('.header-container') ||
          (e.target as HTMLElement).closest('header');

        if (isHeaderClick) {
          // Allow global actions like theme toggle from header even with unsaved changes
          return;
        }

        // If the click is outside and NOT from header (e.g. Sidebar)
        e.preventDefault();
        e.stopPropagation();

        // Add to system notification (bell & toast)
        addNotification(
          'warning',
          'Segurança de Perfil',
          'Você tentou sair da página com alterações não salvas. Por favor, salve para prosseguir.',
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Use capture phase to intercept clicks before they reach Sidebar links
    window.addEventListener('click', handleClickOutside, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('click', handleClickOutside, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [addNotification, hasChanges]);

  // Initialize state when user loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPreviewAvatar(user.avatar || null);

      const initialUserTheme = user.theme || theme;
      const initialUserColor = user.primaryColor || primaryColor;

      // Priority: User profile preference > Store value
      if (initialUserTheme !== theme) {
        setTheme(initialUserTheme);
      }
      if (initialUserColor !== primaryColor) {
        setPrimaryColor(initialUserColor);
      }

      setDraftTheme(initialUserTheme);
      setDraftPrimaryColor(initialUserColor);
      setInitialTheme(initialUserTheme);
      setInitialPrimaryColor(initialUserColor);
    }
  }, [user, theme, primaryColor, setTheme, setPrimaryColor]);

  // Check for changes
  useEffect(() => {
    if (!user) return;
    const isNameChanged = name !== user.name;
    const isEmailChanged = email !== user.email;
    const isAvatarChanged = previewAvatar !== (user.avatar || null);
    const isThemeChanged = draftTheme !== initialTheme;
    const isColorChanged = draftPrimaryColor !== initialPrimaryColor;
    const isPasswordChanged = password.length > 0;

    setHasChanges(
      isNameChanged ||
        isEmailChanged ||
        isAvatarChanged ||
        isThemeChanged ||
        isColorChanged ||
        isPasswordChanged,
    );
  }, [
    name,
    email,
    previewAvatar,
    user,
    draftTheme,
    draftPrimaryColor,
    initialTheme,
    initialPrimaryColor,
    password,
  ]);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        notifyError('Formato inválido', 'Selecione apenas imagens (JPEG, PNG, WebP, GIF).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        notifyError(
          'A imagem deve ter no máximo 5MB',
          'O arquivo selecionado excede o limite de 5MB',
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (password && password !== confirmPassword) {
        notifyError(
          'As senhas não coincidem.',
          'Os campos de nova senha e confirmação devem ser iguais',
        );
        setIsLoading(false);
        return;
      }
      if (password) {
        const reqs = [
          password.length >= 12,
          /[A-Z]/.test(password),
          /[a-z]/.test(password),
          /[0-9]/.test(password),
          /[^A-Za-z0-9]/.test(password),
        ];
        if (!reqs.every((r) => r)) {
          notifyError(
            'A senha deve ter no mínimo 12 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
            '',
          );
          setIsLoading(false);
          return;
        }
      }

      const payload: {
        id: string;
        name: string;
        avatar: string | null;
        theme: 'light' | 'dark';
        primaryColor: string;
        password?: string;
      } = {
        id: user.id,
        name,
        avatar: previewAvatar,
        theme: draftTheme,
        primaryColor: draftPrimaryColor,
      };

      if (password) {
        payload.password = password;
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar perfil');
      }

      const { user: updatedUser } = await response.json();

      // Update local store with data from server to ensure sync
      updateProfile(updatedUser);

      // Reset drafts to the saved values
      setDraftTheme(updatedUser.theme || draftTheme);
      setDraftPrimaryColor(updatedUser.primaryColor || draftPrimaryColor);
      setInitialTheme(updatedUser.theme || draftTheme);
      setInitialPrimaryColor(updatedUser.primaryColor || draftPrimaryColor);
      setPassword('');
      setConfirmPassword('');
      notifySuccess('Perfil atualizado com sucesso!', 'Suas informações foram salvas');
      setHasChanges(false);
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar alterações';
      notifyError(errorMessage, 'Tente novamente ou contate o suporte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="py-2.5 px-4 sm:px-6 lg:px-8 flex flex-col gap-3 w-full animate-fadeIn h-full overflow-hidden"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-dark flex items-center gap-2">
            <User className="w-5 h-5 text-brand-main" />
            Meu Perfil
          </h1>
          <p className="text-text-light text-xs mt-0.5">
            Gerencie suas informações e preferências.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!searchParams.get('setup2fa') && !searchParams.get('changePassword') && (
            <button
              onClick={() => {
                if (hasChanges) {
                  if (
                    window.confirm(
                      'Você tem alterações não salvas! Deseja realmente sair sem salvar?',
                    )
                  ) {
                    router.push('/dashboard');
                  }
                } else {
                  router.push('/dashboard');
                }
              }}
              className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-main text-white font-black text-[11px] uppercase tracking-[2px] transition-all duration-300 shadow-lg hover:scale-[1.03] active:scale-95 overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:animate-shimmer" />
              <ArrowLeft className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Voltar</span>
            </button>
          )}
          {/* Save button — in header after Back button */}
          <button
            onClick={handleSave}
            disabled={
              !hasChanges ||
              isLoading ||
              (password.length > 0 &&
                (!(
                  password.length >= 12 &&
                  /[A-Z]/.test(password) &&
                  /[a-z]/.test(password) &&
                  /[0-9]/.test(password) &&
                  /[^A-Za-z0-9]/.test(password)
                ) ||
                  password !== confirmPassword))
            }
            className={`group relative flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[11px] uppercase tracking-[2px] transition-all duration-300 shadow-lg hover:scale-[1.03] active:scale-95 overflow-hidden border border-white/10 ${
              hasChanges && !isLoading
                ? 'bg-brand-main text-white shadow-xl shadow-brand-main/20'
                : 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed opacity-40 text-white'
            }`}
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:animate-shimmer" />
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 relative z-10" />
                <span className="relative z-10">Processando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Grid — fills height, no scroll */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* ── Left: ID Card (3 cols) ── */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 overflow-hidden">
          <div className="bg-panel-bg rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col flex-1">
            <div className="h-20 bg-linear-to-r from-brand-main to-brand-accent relative shrink-0">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <button
                  onClick={handleAvatarClick}
                  title="Alterar foto de perfil"
                  className="w-20 h-20 rounded-full border-4 border-panel-bg bg-linear-to-r from-brand-accent to-brand-main flex items-center justify-center text-text-light relative overflow-hidden transition-all hover:border-brand-main shadow-lg group/avatar"
                >
                  {previewAvatar ? (
                    <Image
                      src={previewAvatar}
                      alt={name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="w-10 h-10 text-white/50" />
                  )}
                  <div className="absolute inset-0 bg-[#00252e] flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>
            </div>
            <div className="pt-12 pb-4 px-4 text-center flex flex-col gap-3">
              <div>
                <h2 className="text-base font-bold text-text-dark">{name}</h2>
                <p className="text-brand-main font-medium text-[10px] mt-1 uppercase tracking-wide border border-brand-main/20 bg-brand-main/5 px-2 py-0.5 rounded-full inline-block">
                  {user.role}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg flex gap-2 text-left">
                <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    Conta Ativa
                  </h4>
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400/70 leading-tight">
                    Acesso {user.role === UserRole.ADMIN ? 'total' : 'padrão'} ao sistema.
                  </p>
                </div>
              </div>
              <div className="text-left text-[10px] text-text-light space-y-1 border-t border-border pt-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>Desde {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: 9 cols, 2 rows, NO scroll ── */}
        <div className="lg:col-span-9 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Row 1 — Aparência */}
          <div className="shrink-0">
            <ThemeAppearanceSettings
              primaryColor={draftPrimaryColor}
              onSetPrimaryColor={(color) => {
                setDraftPrimaryColor(color);
                setPrimaryColor(color);
              }}
            />
          </div>

          {/* Row 2 — Info + Security side by side */}
          {/* Informações Section — Expanded to full width */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="bg-panel-bg rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <h3 className="text-sm font-bold text-text-dark flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-main" />
                  Informações da Conta
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-2">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-body-bg border border-border rounded-xl focus-within:ring-2 focus-within:ring-brand-main/20 focus-within:border-brand-main transition-all group">
                    <User className="w-4 h-4 text-text-light group-focus-within:text-brand-main transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-none outline-none w-full font-bold text-sm text-text-dark placeholder:text-text-light/30"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-wider">
                    Endereço de Email
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-body-bg/50 border border-border rounded-xl opacity-60 cursor-not-allowed group relative">
                    <Mail className="w-4 h-4 text-text-light" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="bg-transparent border-none outline-none w-full font-bold text-sm text-text-dark cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-text-light absolute right-3 opacity-40" />
                  </div>
                  <p className="text-[9px] text-text-light/70 ml-1 font-medium italic">
                    E-mail gerenciado pelo administrador master.
                  </p>
                </div>

                {/* Nível */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-wider">
                    Nível de Acesso
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-body-bg/50 border border-border rounded-xl opacity-60 relative">
                    <Shield className="w-4 h-4 text-text-light" />
                    <span className="font-bold text-sm text-text-dark capitalize tracking-tight">
                      {user.role}
                    </span>
                    <Lock className="w-3.5 h-3.5 text-text-light absolute right-3 opacity-40" />
                  </div>
                </div>

                {/* Data de Criação */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-text-light uppercase tracking-wider">
                    Membro da Rede Desde
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-body-bg/50 border border-border rounded-xl opacity-60 relative">
                    <Calendar className="w-4 h-4 text-text-light" />
                    <span className="font-bold text-sm text-text-dark">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <Lock className="w-3.5 h-3.5 text-text-light absolute right-3 opacity-40" />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="mt-4 p-5 bg-panel-bg border border-border rounded-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Key className="w-4 h-4 text-brand-main" />
                  <h4 className="text-sm font-bold text-text-dark">Alteração de Senha</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Nova Senha */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-text-light uppercase tracking-wider">
                      Nova Senha
                    </label>
                    <div
                      className={`flex items-center gap-3 p-3 bg-body-bg border rounded-xl transition-all group relative ${
                        password.length === 0
                          ? 'border-border focus-within:ring-2 focus-within:ring-brand-main/20 focus-within:border-brand-main'
                          : password.length >= 12 &&
                              /[A-Z]/.test(password) &&
                              /[a-z]/.test(password) &&
                              /[0-9]/.test(password) &&
                              /[^A-Za-z0-9]/.test(password)
                            ? 'border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20'
                            : 'border-red-500/30 focus-within:ring-2 focus-within:ring-red-500/20'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-text-light group-focus-within:text-brand-main transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-transparent border-none outline-none w-full font-bold text-sm text-text-dark placeholder:text-text-light/30 pr-8"
                        placeholder="Digite a nova senha"
                        autoComplete="new-password"
                      />
                      {password.length > 0 && (
                        <span
                          className={`absolute right-10 text-[10px] font-bold ${
                            password.length >= 12 ? 'text-emerald-500' : 'text-red-400'
                          }`}
                        >
                          {password.length}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-text-light hover:text-text-dark transition-colors"
                        title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {/* Password Requirements Checklist */}
                    {password.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {[
                          { label: '12+ caracteres', valid: password.length >= 12 },
                          { label: '1 maiúscula', valid: /[A-Z]/.test(password) },
                          { label: '1 minúscula', valid: /[a-z]/.test(password) },
                          { label: '1 número', valid: /[0-9]/.test(password) },
                          { label: '1 especial', valid: /[^A-Za-z0-9]/.test(password) },
                        ].map((req, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            {req.valid ? (
                              <svg
                                className="w-3 h-3 text-emerald-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            <span
                              className={`text-[10px] font-medium ${req.valid ? 'text-emerald-500' : 'text-text-light'}`}
                            >
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-text-light uppercase tracking-wider">
                      Confirmar Nova Senha
                    </label>
                    <div
                      className={`flex items-center gap-3 p-3 bg-body-bg border rounded-xl transition-all group relative ${
                        confirmPassword.length === 0
                          ? 'border-border focus-within:ring-2 focus-within:ring-brand-main/20 focus-within:border-brand-main'
                          : confirmPassword === password && password.length >= 12
                            ? 'border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20'
                            : 'border-red-500/30 focus-within:ring-2 focus-within:ring-red-500/20'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-text-light group-focus-within:text-brand-main transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-transparent border-none outline-none w-full font-bold text-sm text-text-dark placeholder:text-text-light/30 pr-8"
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-text-light hover:text-text-dark transition-colors"
                        title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {confirmPassword === password && password.length >= 12 ? (
                          <svg
                            className="w-3 h-3 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg
                            className="w-3 h-3 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        <span
                          className={`text-[10px] font-medium ${confirmPassword === password && password.length >= 12 ? 'text-emerald-500' : 'text-text-light'}`}
                        >
                          Senhas coincidem
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-text-light font-medium italic mt-1">
                  Deixe os campos em branco caso não queira alterar sua senha atual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-brand-main" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

function ThemeAppearanceSettings({
  primaryColor,
  onSetPrimaryColor,
}: {
  primaryColor: string;
  onSetPrimaryColor: (color: string) => void;
}) {
  const colors = [
    '#11876d', // Teal (Default PlaySync)
    '#2563eb', // Deep Vivid Blue
    '#9333ea', // Vibrant Purple
    '#db2777', // Deep Pink
    '#d97706', // Amber
    '#dc2626', // Red-600
  ];

  return (
    <div className="bg-panel-bg rounded-2xl shadow-sm border border-border p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3 shrink-0">
        <h3 className="text-base font-bold text-text-dark flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-main" />
          Aparência
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-[10px] font-bold text-text-light uppercase tracking-wider mb-2">
            Cor Principal
          </label>
          <div className="flex items-center gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onSetPrimaryColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center relative ${primaryColor === color ? 'border-brand-main scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: color }}
              >
                {primaryColor === color && <Check className="w-4 h-4 text-white" />}

                {/* System Default "Green/Teal" Indicator */}
                {color === '#11876d' && (
                  <div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#d4ff00] rounded-full border border-black/20 neon-pulse"
                    title="Cor padrão PlaySync"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
