'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Keyboard, AlertTriangle, ShieldCheck, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySuggestedPassword = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPassword);
      setCopied(true);
      setNewPassword(suggestedPassword);
      setConfirmNewPassword(suggestedPassword);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback manual
    }
  };

  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const passwordRequirements = [
    { label: '12+ caracteres', valid: newPassword.length >= 12 },
    { label: '1 maiúscula', valid: /[A-Z]/.test(newPassword) },
    { label: '1 minúscula', valid: /[a-z]/.test(newPassword) },
    { label: '1 número', valid: /[0-9]/.test(newPassword) },
    { label: '1 especial', valid: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.valid);

  const generateSuggestedPassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '!@#$%&*?';
    const all = upper + lower + numbers + specials;
    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];
    for (let i = 0; i < 12; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    return pwd
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const [suggestedPassword, setSuggestedPassword] = useState(generateSuggestedPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError(
        'A senha deve ter no mínimo 12 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Senhas não coincidem.');
      return;
    }

    setIsChanging(true);
    try {
      const user = useAuthStore.getState().user;
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          password: newPassword,
          forcePasswordReset: false,
          actorId: user?.id,
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });

      if (response.ok) {
        await useAuthStore.getState().logout();
        onClose();
        window.location.href = '/login?passwordChanged=true';
      } else {
        setError('Erro ao atualizar');
        setIsChanging(false);
      }
    } catch {
      setError('Erro de conexão');
      setIsChanging(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-xl p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white/90 dark:bg-[#0c0e12]/95 border border-black/5 dark:border-white/5 rounded-[3rem] w-full max-w-md p-10 space-y-8 shadow-[0_40px_100px_-20px_rgba(16,185,129,0.15)] overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

            <div className="text-center space-y-3 relative z-10">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                <Lock className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                  Redefinir Acesso
                </h2>
                <p className="text-slate-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
                  Protocolo de Segurança Ativo
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-5">
                <div className="relative group/input">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyUp={checkCapsLock}
                    className={`w-full px-6 py-4 bg-slate-100/30 dark:bg-white/3 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-700 focus:outline-none focus:ring-1 transition-all pr-12 ${
                      newPassword.length === 0
                        ? 'border border-black/5 dark:border-white/5 focus:border-emerald-500/40 focus:ring-emerald-500/20'
                        : isPasswordValid
                          ? 'border-2 border-emerald-500/50 focus:border-emerald-500/40 focus:ring-emerald-500/20'
                          : 'border-2 border-red-500/30 focus:border-red-500/40 focus:ring-red-500/20'
                    }`}
                    placeholder="Nova senha mestre"
                  />
                  {newPassword.length > 0 && (
                    <div
                      className={`absolute right-14 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                        newPassword.length >= 12 ? 'text-emerald-500' : 'text-red-400'
                      }`}
                    >
                      {newPassword.length}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 hover:text-emerald-500 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword.length > 0 && (
                  <div className="space-y-1.5 px-1">
                    {passwordRequirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {req.valid ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg
                              className="w-2 h-2 text-emerald-500"
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
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg
                              className="w-2 h-2 text-red-400"
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
                          </div>
                        )}
                        <span
                          className={`text-[11px] font-medium ${req.valid ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'}`}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-wider">
                      Senha sugerida
                    </p>
                    <button
                      type="button"
                      onClick={() => setSuggestedPassword(generateSuggestedPassword())}
                      className="text-[9px] text-emerald-500 hover:text-emerald-400 font-bold underline"
                    >
                      Gerar nova
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all select-all flex-1">
                      {suggestedPassword}
                    </p>
                    <button
                      type="button"
                      onClick={copySuggestedPassword}
                      className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                      title="Copiar e usar senha gerada"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1">
                    Clique no ícone ao lado para copiar e usar esta senha automaticamente nos campos
                    acima.
                  </p>
                </div>

                <div className="relative group/input">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    onKeyUp={checkCapsLock}
                    className="w-full px-6 py-4 bg-slate-100/30 dark:bg-white/3 border border-black/5 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500/40 text-sm transition-all pr-12"
                    placeholder="Confirmar autenticação"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-600 hover:text-emerald-500 transition-colors"
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {capsLockOn && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-amber-500 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  <Keyboard className="w-3 h-3" />
                  Caps Lock Ativado
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-500/5 border border-red-500/10 text-red-500/80 rounded-xl text-[11px] font-medium flex items-center justify-center gap-3 text-center"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {error}
                </motion.div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isPasswordValid || isChanging || newPassword !== confirmNewPassword}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.2)] dark:shadow-lg dark:shadow-emerald-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale relative overflow-hidden group/btn"
                >
                  {isChanging ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin z-10" />
                      <span className="z-10">Atualizando...</span>
                    </>
                  ) : (
                    <>
                      <span className="z-10">Confirmar Redefinição</span>
                      <ShieldCheck className="w-3.5 h-3.5 fill-current z-10 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 dark:via-black/20 to-transparent -translate-x-full"
                    animate={isChanging ? { x: ['100%', '-100%'] } : {}}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
