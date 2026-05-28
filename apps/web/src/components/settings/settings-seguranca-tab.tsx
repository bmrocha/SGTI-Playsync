"use client";

import { useSystemStore } from "@/lib/system-store";
import { notifySuccess } from "@/lib/notification-store";
import {
    ShieldCheck, Lock, Key, Fingerprint, Activity,
    Cpu, ShieldAlert, History, ChevronRight
} from "lucide-react";

interface Props {
    isMaintenanceModeLocal: boolean;
}

export default function SettingsSegurancaTab({ isMaintenanceModeLocal }: Props) {
    const {
        isPasswordComplexityEnforced, isTwoFactorEnforced,
        isBruteForceProtection, auditLogRetention, sessionLimit,
        restrictIP, trusted_ips, sessions, terminateSession,
        setField
    } = useSystemStore();

    const handleResetLocks = async () => {
        if (confirm('Deseja realmente resetar todos os bloqueios de login do sistema?')) {
            try {
                const res = await fetch('/api/auth/reset-locks', { method: 'POST' });
                const data = await res.json();
                if (data.success) alert(data.message);
                else alert('Erro ao resetar: ' + (data.error || 'Erro desconhecido'));
            } catch {
                alert('Erro de conexão');
            }
        }
    };

    const handleTerminateSession = async (sessionId: string) => {
        await terminateSession(sessionId);
        notifySuccess("Sessão finalizada", "A sessão selecionada foi encerrada com sucesso");
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-zinc-400/10 rounded-2xl flex items-center justify-center text-zinc-400  group">
                        <ShieldCheck className="w-7 h-7 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-text-dark dark:text-white tracking-tight">Centro de Segurança</h2>
                            <span className="bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-[1px] px-3 py-1 rounded-full  border border-white/10 flex items-center gap-1.5">
                                SECOPS DASHBOARD
                            </span>
                        </div>
                        <p className="text-text-light dark:text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1 pl-0.5">Controle de acesso, criptografia e proteção de infraestrutura</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center bg-white dark:bg-white/5 p-3 rounded-2xl border border-border ">
                    <div className="relative w-12 h-12">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={126} strokeDashoffset={126 - (126 * 85) / 100} className="text-zinc-400" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-400">85%</div>
                    </div>
                    <div className="pr-4">
                        <span className="block text-[7px] font-black text-text-light uppercase tracking-widest mb-0.5">Status Global</span>
                        <span className="text-sm font-black text-text-dark dark:text-white tracking-tighter flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                            Protegido
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Access Control Column */}
                <div className="space-y-6 flex flex-col h-full">
                    <h3 className="flex items-center gap-2 text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest pl-4">
                        <Lock className="w-4 h-4 text-zinc-400" />
                        Controle de Acesso
                    </h3>

                    <div className="bg-white/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] relative group flex-1 flex flex-col p-6">
                        <div className="relative z-10 space-y-3 flex flex-col flex-1">
                            <div className="space-y-3">
                                {/* Toggle Items */}
                                {[
                                    {
                                        icon: Key,
                                        label: "Senha Forte",
                                        sub: "Exige Símbolos e Números",
                                        state: isPasswordComplexityEnforced,
                                        toggle: () => setField('isPasswordComplexityEnforced', !isPasswordComplexityEnforced)
                                    },
                                    {
                                        icon: Fingerprint,
                                        label: "Autenticação 2FA",
                                        sub: "Obrigatório para Admin",
                                        state: isTwoFactorEnforced,
                                        toggle: () => setField('isTwoFactorEnforced', !isTwoFactorEnforced)
                                    },
                                ].map((item, idx) => {
                                    const activeColorClass = 'bg-zinc-400';
                                    const activeBgClass = 'bg-zinc-400/20';
                                    const activeTextClass = 'text-zinc-400';

                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-transparent rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all group/item">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${item.state ? `${activeBgClass} ${activeTextClass}` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                                    <item.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <span className={`block font-black text-[10px] uppercase tracking-wide transition-colors ${item.state ? activeTextClass : 'text-zinc-900 dark:text-white group-hover/item:text-zinc-600 dark:group-hover/item:text-zinc-300'}`}>{item.label}</span>
                                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider opacity-70">{item.sub}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={item.toggle}
                                                className={`w-12 h-6 rounded-full transition-all relative ${item.state ? `${activeColorClass} shadow-md` : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all  ${item.state ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Session Monitor */}
                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[2px] mb-3 pl-1 flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Monitor de Sessões
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {sessions.length === 0 ? (
                                        <div className="col-span-full py-4 flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/30 dark:bg-zinc-900/10">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center animate-pulse mb-2">
                                                <Activity className="w-4 h-4 text-zinc-300" />
                                            </div>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sincronizando sessões...</p>
                                        </div>
                                    ) : (
                                        sessions.map((session, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-50/50 dark:bg-black/20 rounded-xl border border-border transition-all hover:border-zinc-400/30 group/session">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-border flex items-center justify-center text-zinc-400">
                                                        <Cpu className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                                            {session.user_name || 'Usuário'} <span className="text-zinc-400 font-normal">({session.user_email})</span>
                                                            {session.current && <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"></span>}
                                                        </div>
                                                        <div className="text-[8px] text-zinc-400 font-medium uppercase tracking-tighter flex items-center gap-1.5">
                                                            {session.ip || 'IP Desconhecido'}
                                                            <span className="text-zinc-300">•</span>
                                                            <span className="text-zinc-400">
                                                                {session.status === 'online' ? 'Online' : 'Offline'}
                                                            </span>
                                                            {session.created_at && (
                                                                <>
                                                                    <span className="text-zinc-300">•</span>
                                                                    <span title="Início da sessão">{new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                </>
                                                            )}
                                                            {session.last_seen && (
                                                                <>
                                                                    <span className="text-zinc-300">•</span>
                                                                    <span title="Última atividade">Visto: {new Date(session.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-[7px] text-zinc-300 mt-0.5">
                                                            {session.device} - {session.os}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!session.current && (
                                                    <button
                                                        onClick={() => handleTerminateSession(session.id)}
                                                        className="text-[8px] font-black text-red-500 uppercase px-2 py-1.5 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover/session:opacity-100"
                                                    >
                                                        Desconectar
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Infrastructure Column */}
                <div className="space-y-6 flex flex-col h-full">
                    <h3 className="flex items-center gap-2 text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest pl-4">
                        <ShieldCheck className="w-4 h-4 text-zinc-400" />
                        Diretrizes de Infra
                    </h3>

                    <div className={`bg-white/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] relative group flex-1 flex flex-col ${isMaintenanceModeLocal ? 'p-4' : 'p-6'}`}>
                        <div className="relative z-10 space-y-3 flex flex-col flex-1">
                            {/* Global Lock Reset */}
                            <div className="p-4 bg-zinc-400/5 rounded-2xl border border-zinc-400/10 mb-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-400/10 flex items-center justify-center text-zinc-400">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-wide">Limpeza de Segurança</h4>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase">Resetar todos os bloqueios de login</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleResetLocks}
                                        className="px-4 py-2 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-600 transition-all shadow-zinc-400/20 active:scale-95"
                                    >
                                        Resetar Agora
                                    </button>
                                </div>
                            </div>

                            {/* Audit Retention */}
                            <div className="p-4 bg-transparent">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <History className="w-5 h-5 text-zinc-400" />
                                        <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wide">Retenção de Logs</span>
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-400 bg-zinc-400/10 px-3 py-1 rounded-lg border border-zinc-400/20">
                                        {auditLogRetention} DIAS
                                    </span>
                                </div>

                                <div className="relative h-6 group/slider mt-4">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-zinc-400 relative"
                                            style={{ width: `${((Number(auditLogRetention) - 30) / (365 - 30)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <input
                                        type="range"
                                        min="30"
                                        max="365"
                                        step="30"
                                        value={auditLogRetention}
                                        onChange={(e) => setField('auditLogRetention', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-zinc-400 rounded-full pointer-events-none transition-transform group-hover/slider:scale-125"
                                        style={{ left: `${((Number(auditLogRetention) - 30) / (365 - 30)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-24 sm:h-32 w-full shrink-0" />
        </div>
    );
}
