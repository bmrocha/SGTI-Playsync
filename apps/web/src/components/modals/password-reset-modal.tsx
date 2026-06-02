'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, AlertTriangle, Copy, Check } from 'lucide-react';
import { FormModal } from '@/components/modals/form-modal';
import { notifyError, notifySuccess } from '@/lib/notification-store';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSaved: () => Promise<void>;
  currentUser: any;
}

export function PasswordResetModal({
  isOpen,
  onClose,
  userId,
  userName,
  onSaved,
  currentUser,
}: PasswordResetModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [copied, setCopied] = useState(false);

  const copySuggestedPassword = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPassword);
      setCopied(true);
      setPassword(suggestedPassword);
      setConfirmPassword(suggestedPassword);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback manual
    }
  };

  const checkCapsLock = (e: React.KeyboardEvent | React.MouseEvent) => {
    const nativeEvent = (e as React.KeyboardEvent).nativeEvent || e;
    if (nativeEvent instanceof KeyboardEvent) {
      setCapsLockOn(nativeEvent.getModifierState('CapsLock'));
    }
  };

  const generateRandomPassword = () => {
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
    for (let i = 0; i < 10; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    return pwd
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const [suggestedPassword, setSuggestedPassword] = useState(generateRandomPassword);

  const getPasswordReqs = (pwd: string) => [
    pwd.length >= 12,
    /[A-Z]/.test(pwd),
    /[a-z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ];

  const isPasswordValid = getPasswordReqs(password).every(Boolean);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      notifyError('Erro', 'Por favor, preencha todos os campos!');
      return;
    }

    if (password !== confirmPassword) {
      notifyError('Erro', 'As senhas não coincidem!');
      return;
    }

    if (!isPasswordValid) {
      notifyError(
        'Erro',
        'A senha deve ter no mínimo 12 caracteres, incluindo maiúscula, minúscula, número e caractere especial.',
      );
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          password,
          forcePasswordReset: true,
          actorId: currentUser?.id,
          actorName: currentUser?.name,
          actorRole: currentUser?.role,
        }),
      });

      if (response.ok) {
        notifySuccess('Senha Alterada', `A senha de ${userName} foi redefinida com sucesso.`);
        await onSaved();
        onClose();
      } else {
        const data = await response.json();
        notifyError('Erro', data.error || 'Falha ao redefinir senha');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      notifyError('Erro', 'Erro ao conectar com o servidor');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Redefinir Senha"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-border text-text-dark hover:bg-border/20 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleResetPassword}
            disabled={!isPasswordValid || password !== confirmPassword || !password}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Salvar Nova Senha
          </button>
        </>
      }
    >
      <div onKeyDown={(e) => checkCapsLock(e as any)}>
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
          <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Redefinindo senha para: <strong>{userName}</strong>
          </p>
        </div>

        {capsLockOn && (
          <div className="mb-4 bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs p-2 rounded-lg flex items-center gap-2 justify-center font-bold uppercase tracking-wide animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Caps Lock Ativo
          </div>
        )}

        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Senha sugerida
            </p>
            <button
              type="button"
              onClick={() => setSuggestedPassword(generateRandomPassword())}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold underline"
            >
              Gerar nova
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-mono text-emerald-800 dark:text-emerald-300 break-all select-all flex-1">
              {suggestedPassword}
            </p>
            <button
              type="button"
              onClick={copySuggestedPassword}
              className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
              title="Copiar e usar senha gerada"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[9px] text-emerald-600/60 dark:text-emerald-400/60 mt-1">
            Clique no ícone ao lado para copiar e usar esta senha automaticamente nos campos acima.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-2">Nova Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => checkCapsLock(e as any)}
                className={`w-full p-3 border rounded-lg bg-body-bg text-text-dark focus:outline-none focus:ring-2 pr-16 ${
                  password.length === 0
                    ? 'border-border focus:border-brand-main focus:ring-brand-main/20'
                    : isPasswordValid
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-red-500/30 focus:border-red-500 focus:ring-red-500/20'
                }`}
                placeholder="Digite a nova senha"
                autoFocus
              />
              {password.length > 0 && (
                <span
                  className={`absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-bold ${
                    password.length >= 12 ? 'text-emerald-500' : 'text-red-400'
                  }`}
                >
                  {password.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-brand-main transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1 mt-2">
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
                      className={`text-[11px] font-medium ${req.valid ? 'text-emerald-500' : 'text-text-light'}`}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-dark mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyUp={(e) => checkCapsLock(e as any)}
                className={`w-full p-3 border rounded-lg bg-body-bg text-text-dark focus:outline-none focus:ring-2 pr-10 ${
                  confirmPassword.length === 0
                    ? 'border-border focus:border-brand-main focus:ring-brand-main/20'
                    : confirmPassword === password && isPasswordValid
                      ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-red-500/30 focus:border-red-500 focus:ring-red-500/20'
                }`}
                placeholder="Confirme a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-brand-main transition-colors p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                {confirmPassword === password && isPasswordValid ? (
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span
                  className={`text-[11px] font-medium ${confirmPassword === password && isPasswordValid ? 'text-emerald-500' : 'text-text-light'}`}
                >
                  Senhas coincidem
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
