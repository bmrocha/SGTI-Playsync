'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useSystemStore } from '@/lib/system-store';
import {
  Play,
  Tv,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Lock,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ChangePasswordModal } from '@/components/auth/change-password-modal';
import { LoginSlideshow } from '@/components/auth/login-slideshow';
import { LoginLoadingOverlay } from '@/components/auth/login-loading-overlay';
import Image from 'next/image';
import { useThemeStore } from '@/lib/theme-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA } = useAuthStore();
  const { fetchSettings, logoLoginUrl, systemName } = useSystemStore();
  const { theme, toggleTheme } = useThemeStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA State
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    // Check for password change success parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('passwordChanged') === 'true') {
        // We can use a more elegant toast here if available, but for now setting a temporary error/info state
        // Or maybe just clear the params
        window.history.replaceState({}, document.title, window.location.pathname);
        // Ideally show a success message. Since we have 'error' state, maybe we can use it for success too or add a new one?
        // Let's reuse error state but with a success color logic if needed, or just standard alert.
        // Actually, let's just alert for now or set a specific state if we want to render it.
        // But the user asked for "volte para tela de login".
        // Let's add a success state.
        setSuccessMessage('Senha alterada com sucesso. Faça login novamente.');
      }
    }
  }, []);

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(() => {
      setScanPosition((prev) => (prev + 0.2) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [fetchSettings]);

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % 3), []);
  const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + 3) % 3), []);

  // Password Change State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Ensure the "experience" lasts at least 2.5 seconds
    const MIN_LOADING_TIME = 2500;
    const startTime = Date.now();

    try {
      const result = await login(username, password);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

      if (result.require2fa && result.tempToken) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
        setTempToken(result.tempToken);
        setIsTwoFactorStep(true);
        setIsLoading(false);
      } else if (result.success) {
        // Wait for the minimum animation time to complete
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        if (result.require2faSetup) {
          router.push('/dashboard/profile?setup2fa=true');
        } else if (result.requirePasswordReset) {
          setIsChangePasswordOpen(true);
          setIsLoading(false);
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.error || 'Acesso negado');
        setIsLoading(false);
      }
    } catch {
      setError('Erro de conexão');
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Ensure the "experience" lasts at least 1.5 seconds for 2FA
    const MIN_LOADING_TIME = 1500;
    const startTime = Date.now();

    try {
      const result = await verify2FA(tempToken, twoFactorCode);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      if (result.success) {
        if (result.requirePasswordReset) {
          setIsChangePasswordOpen(true);
          setIsLoading(false);
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.error || 'Código inválido');
        setIsLoading(false);
      }
    } catch {
      setError('Erro ao verificar código');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFA] dark:bg-[#020a0a] flex items-center justify-center p-4 lg:p-8 overflow-hidden relative font-sans selection:bg-emerald-500/20 text-slate-900 dark:text-slate-200 transition-colors duration-700">
      {/* 0. DISCRETE THEME TOGGLE */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white/40 dark:bg-black/20 hover:bg-white/60 dark:hover:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl transition-all active:scale-95 group shadow-sm dark:shadow-none"
          title={theme === 'dark' ? 'Modo Light' : 'Modo Dark'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-emerald-500 group-hover:rotate-45 transition-transform duration-500" />
          ) : (
            <Moon className="w-4 h-4 text-emerald-900 group-hover:-rotate-12 transition-transform duration-500" />
          )}
        </button>
      </div>

      {/* 1. SUBTLE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98130_1px,transparent_1px),linear-gradient(to_bottom,#10b98130_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-size-[60px_60px] opacity-100"></div>

        {/* Background Media Elements (Logo moved adjacent to Title) */}
        <div className="absolute bottom-[5%] right-[5%] w-100 h-100 opacity-[0.12] dark:opacity-15 pointer-events-none text-emerald-600 dark:text-emerald-400/30">
          <Tv className="w-full h-full animate-pulse" />
        </div>

        {/* Balanced Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-emerald-500/8 dark:bg-emerald-500/5 rounded-full blur-[180px]"></div>
        <div className="absolute bottom-0 right-0 w-125 h-125 bg-emerald-600/5 dark:bg-emerald-500/3 rounded-full blur-[150px]"></div>
      </div>

      {/* 2. DISCREET SCAN LINE */}
      <div
        className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-500/20 dark:via-emerald-500/30 to-transparent z-10 pointer-events-none"
        style={{ top: `${scanPosition}%` }}
      ></div>

      {/* 3. MAIN GRID */}
      <div className="relative z-20 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT CONTEXT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-6 space-y-10"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            {/* Logo integrated to the left */}
            {logoLoginUrl && (
              <div className="shrink-0 animate-in fade-in slide-in-from-right-4 duration-1000">
                <Image
                  src={logoLoginUrl}
                  alt="System Logo"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-20 md:h-28 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] opacity-90 dark:opacity-80"
                  priority
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 dark:bg-zinc-900/50 border border-emerald-500/10 dark:border-white/5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md transition-colors">
                <Zap className="w-3 h-3 fill-current" />
                Gerenciador Inteligente
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-slate-900 dark:text-white transition-colors flex items-center gap-1">
                {systemName === 'PlaySync'
                  ? 'Play'
                  : systemName
                    ? systemName.split(' ')[0]
                    : 'Play'}
                <span className="text-emerald-500/60 dark:text-emerald-500/50 whitespace-nowrap">
                  {systemName === 'PlaySync'
                    ? 'Sync'
                    : systemName && systemName.includes(' ')
                      ? systemName.split(' ').slice(1).join(' ')
                      : 'Sync'}
                </span>
              </h1>
            </div>
          </div>

          <LoginSlideshow currentSlide={currentSlide} onNext={nextSlide} onPrev={prevSlide} />
        </motion.div>

        {/* RIGHT LOGIN DOCK */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={
            isLoading
              ? {
                  opacity: 1,
                  scale: [1, 1.01, 1],
                  transition: { repeat: Infinity, duration: 2 },
                }
              : { opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-6 flex justify-center lg:justify-end"
        >
          <div
            className={`w-full max-w-95 bg-white/60 dark:bg-[#0c0e12]/80 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-[3rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-2xl relative transition-all duration-700 ${isLoading ? 'ring-2 ring-emerald-500/50' : ''}`}
          >
            <div className="text-center mb-8">
              {logoLoginUrl ? (
                <Image
                  src={logoLoginUrl}
                  alt="Logo"
                  className="h-16 w-16 object-contain mx-auto mb-6 opacity-90 drop-shadow-lg"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-emerald-500/20">
                  <Shield className="w-8 h-8 text-emerald-500" />
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em] transition-colors">
                Autenticação
              </h2>
              <p className="text-[9px] text-emerald-600 dark:text-emerald-500/40 font-black uppercase tracking-[0.3em] mt-1 transition-colors">
                Secured Data Access
              </p>
            </div>

            {isTwoFactorStep ? (
              <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-500/40 ml-4 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Código de Verificação (2FA)
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/30 transition-all text-center text-2xl tracking-[0.5em] font-mono shadow-inner"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-center text-slate-400 dark:text-zinc-600 pt-2">
                    Abra o Microsoft Authenticator e digite o código
                  </p>
                </div>

                {successMessage && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/80 rounded-xl text-[11px] font-medium flex items-center gap-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {successMessage}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500/80 rounded-xl text-[11px] font-medium flex items-center gap-3">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.2)] dark:shadow-lg dark:shadow-emerald-900/20 flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden group/btn"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin z-10" />
                      <span className="z-10">Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span className="z-10">Validar Acesso</span>
                      <ShieldCheck className="w-3.5 h-3.5 fill-current z-10 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}

                  {/* HARD PREMIUM BUTTON SCAN EFFECT */}
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 dark:via-black/20 to-transparent -translate-x-full"
                    animate={isLoading ? { x: ['100%', '-100%'] } : {}}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />

                  <div className="absolute inset-0 bg-linear-to-tr from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTwoFactorStep(false);
                    setTempToken('');
                    setError('');
                  }}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-emerald-500 transition-colors uppercase font-bold tracking-widest mt-2"
                >
                  Voltar para Login
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {successMessage && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/80 rounded-xl text-[11px] font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      {successMessage}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-500/40 ml-4 flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      E-mail ou Usuário
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/30 transition-all text-sm shadow-inner"
                      placeholder="Digite seu e-mail ou usuário"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-500/40 ml-4 flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Sua Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 dark:focus:border-emerald-500/30 transition-all text-sm pr-12 shadow-inner"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500/80 rounded-xl text-[11px] font-medium flex items-center gap-3">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.2)] dark:shadow-lg dark:shadow-emerald-900/20 flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden group/btn"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin z-10" />
                        <span className="z-10">Autenticando...</span>
                      </>
                    ) : (
                      <>
                        <span className="z-10">Entrar no Sistema</span>
                        <Play className="w-3.5 h-3.5 fill-current z-10 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}

                    {/* HARD PREMIUM BUTTON SCAN EFFECT */}
                    <motion.div
                      className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 dark:via-black/20 to-transparent -translate-x-full"
                      animate={isLoading ? { x: ['100%', '-100%'] } : {}}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    />

                    <div className="absolute inset-0 bg-linear-to-tr from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  </button>
                </form>

                <div className="mt-8 text-center opacity-20 hover:opacity-100 transition-opacity">
                  <p className="text-[8px] font-mono uppercase tracking-widest">
                    v4.5.1 // Protocol: 256-Bit
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
      <LoginLoadingOverlay isLoading={isLoading} />
    </div>
  );
}
