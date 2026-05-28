"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Copy, Check, LogOut, KeyRound, Save, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { motion } from "framer-motion";

export function LicenseGuard({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [publicKey, setPublicKey] = useState<string>("");
    const [keyConfigured, setKeyConfigured] = useState(false);

    const [jwtToken, setJwtToken] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const [error, setError] = useState("");
    const [copiedId, setCopiedId] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [savingKey, setSavingKey] = useState(false);

    const checkLicense = async () => {
        try {
            const res = await fetch('/api/license/status');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                setKeyConfigured(data.keyConfigured);
            }
        } catch (e) {
            console.error("Failed to check license", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            checkLicense();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleApply = async () => {
        if (!jwtToken) return;
        setIsApplying(true);
        setError("");
        try {
            const res = await fetch('/api/license/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: jwtToken })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                await checkLicense();
            } else {
                setError(`Falha ao ativar: ${data.reason || 'Token inv\u00e1lido'}`);
            }
        } catch (e) {
            setError("Erro ao conectar com servidor.");
        } finally {
            setIsApplying(false);
        }
    };

    const handleSaveKey = async () => {
        if (!publicKey.trim()) return;
        setSavingKey(true);
        setError("");
        try {
            const res = await fetch('/api/license/public-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicKey: publicKey.trim() })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setKeyConfigured(true);
            } else {
                setError(`Erro ao salvar chave: ${data.error || 'Falha'}`);
            }
        } catch (e) {
            setError("Erro ao conectar com servidor.");
        } finally {
            setSavingKey(false);
        }
    };

    const copyToClipboard = (text: string, setter: any) => {
        navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    if (loading) return <div className="min-h-screen bg-[#020a0a] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

    if (status?.enforced && !status?.licensed && !user?.forcePasswordReset) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#020a0a] text-white flex flex-col items-center justify-center p-4 overflow-y-auto">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="relative z-10 w-full max-w-2xl bg-zinc-950/80 backdrop-blur-2xl border border-red-500/20 rounded-3xl p-8 shadow-2xl shadow-red-900/20"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                            <ShieldAlert className="w-7 h-7 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-red-500">SISTEMA BLOQUEADO</h1>
                            <p className="text-zinc-400 text-sm">Ative o sistema com sua licen\u00e7a para liberar todas as funcionalidades.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Step 1: Installation ID */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                    Copie o ID da Instala\u00e7\u00e3o
                                </label>
                                {keyConfigured && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Conclu\u00eddo</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 block p-4 bg-black/50 border border-white/5 rounded-xl text-emerald-400 font-mono text-sm break-all select-all">
                                    {status.installationId}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(status.installationId, setCopiedId)}
                                    className="p-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
                                    title="Copiar ID"
                                >
                                    {copiedId ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Public Key */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                    Cole a Chave P\u00fablica RSA
                                </label>
                                {keyConfigured && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Salva</span>}
                            </div>
                            {user?.role === 'admin' ? (
                                <>
                                    <textarea
                                        value={publicKey}
                                        onChange={(e) => { setPublicKey(e.target.value); setKeyConfigured(false); }}
                                        readOnly={keyConfigured}
                                        placeholder={"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"}
                                        className="w-full h-32 p-4 bg-black/50 border border-white/5 rounded-xl text-zinc-400 font-mono text-[10px] resize-none outline-none focus:border-emerald-500/50 disabled:opacity-50"
                                    />
                                    <div className="flex items-center gap-2">
                                        {!keyConfigured ? (
                                            <button
                                                onClick={handleSaveKey}
                                                disabled={!publicKey.trim() || savingKey}
                                                className="py-2 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg font-bold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {savingKey ? (
                                                    <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                                ) : <Save className="w-3 h-3" />}
                                                Salvar Chave P\u00fablica
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-500/80 text-xs flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Chave salva no servidor
                                                </span>
                                                <button
                                                    onClick={() => { setKeyConfigured(false); setPublicKey(""); }}
                                                    className="py-1 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold text-[10px] transition-colors"
                                                >
                                                    Remover Chave
                                                </button>
                                            </div>
                                        )}
                                        {publicKey && (
                                            <button
                                                onClick={() => copyToClipboard(publicKey, setCopiedKey)}
                                                className="py-2 px-4 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 text-xs flex items-center gap-2"
                                            >
                                                {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                Copiar Chave
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-zinc-500 text-xs">Apenas administradores podem configurar a chave p\u00fablica.</p>
                            )}
                        </div>

                        {/* Arrow connector */}
                        {keyConfigured && (
                            <div className="flex justify-center">
                                <ArrowRight className="w-5 h-5 text-emerald-500/50" />
                            </div>
                        )}

                        {/* Step 3: Token */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                                <label className="text-xs font-bold uppercase tracking-widest text-emerald-500/80 flex items-center gap-2">
                                    <KeyRound className="w-4 h-4" />
                                    Cole o Token de Licen\u00e7a (JWT)
                                </label>
                            </div>
                            <textarea
                                value={jwtToken}
                                onChange={(e) => setJwtToken(e.target.value)}
                                disabled={!keyConfigured || user?.role !== 'admin'}
                                placeholder={
                                    !keyConfigured
                                        ? "Salve a chave p\u00fablica primeiro (passo 2)..."
                                        : "Cole o token JWT gerado com o Installation ID acima..."
                                }
                                className="w-full h-32 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-100 font-mono text-xs resize-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {error && (
                                <p className="text-red-400 text-xs font-bold mt-2">{error}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={logout}
                                className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sair
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!jwtToken || isApplying || !keyConfigured || user?.role !== 'admin'}
                                className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                            >
                                {isApplying ? (
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <KeyRound className="w-4 h-4" />
                                        Ativar Sistema
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}
