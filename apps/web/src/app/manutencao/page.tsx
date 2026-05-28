"use client";

import { AlertTriangle, Hammer, Clock, ArrowLeft, Settings, Cpu, Zap, Activity, ShieldCheck, Gauge, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { UserRole } from "@/lib/permissions";
import { useSystemStore } from "@/lib/system-store";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ManutencaoPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [scanPosition, setScanPosition] = useState(0);
    const {
        isMaintenanceMode,
        maintenanceMessage,
        maintenanceEstimatedTime,
        maintenancePriority,
        fetchSettings
    } = useSystemStore();

    useEffect(() => {
        fetchSettings();
        const interval = setInterval(() => {
            setScanPosition(prev => (prev + 0.5) % 100);
        }, 30);
        return () => clearInterval(interval);
    }, [fetchSettings]);

    useEffect(() => {
        if (!isMaintenanceMode) {
            router.push("/");
        }
    }, [isMaintenanceMode, router]);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 xl:p-6 2xl:p-8 overflow-hidden relative font-sans selection:bg-emerald-500/30">
            {/* 1. BACKGROUND INFRASTRUCTURE (THE CANVAS) */}
            <div className="absolute inset-0 z-0">
                {/* Massive Animated Grid */}
                <div
                    className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.2]"
                    style={{ transform: `translateY(${scanPosition * 0.1}px)` }}
                ></div>

                {/* Strategic Gears - Background Layer */}
                <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] text-emerald-500/5 pointer-events-none">
                    <Settings className="w-full h-full animate-[spin_80s_linear_infinite]" />
                </div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] text-blue-500/5 pointer-events-none">
                    <Settings className="w-full h-full animate-[spin_120s_linear_infinite_reverse]" />
                </div>

                {/* Cyber Glow Vistas */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[200px] animate-pulse"></div>
            </div>

            {/* 2. SCAN LINE EFFECT */}
            <div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent z-10 pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                style={{ top: `${scanPosition}%` }}
            ></div>

            {/* 3. MAIN IMMERSIVE CONTENT (NO CARD) */}
            <div className="relative z-20 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 2xl:gap-12 items-center">

                {/* LEFT SIDE: THE MASSIVE CORE ENGINE */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="lg:col-span-6 flex items-center justify-center lg:justify-start"
                >
                    <div className="relative w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] xl:w-[380px] xl:h-[380px] 2xl:w-[480px] 2xl:h-[480px]">
                        {/* Multi-layered Orbital Rings */}
                        <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-[spin_15s_linear_infinite]"></div>
                        <div className="absolute inset-6 sm:inset-8 xl:inset-10 2xl:inset-12 rounded-full border border-blue-500/10 animate-[spin_25s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-12 sm:inset-16 xl:inset-20 2xl:inset-24 rounded-full border-2 border-dashed border-emerald-500/5 animate-[spin_40s_linear_infinite]"></div>

                        {/* The Core Power cell */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="p-10 sm:p-14 md:p-16 xl:p-18 2xl:p-24 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_80px_rgba(16,185,129,0.3)] rounded-[2.5rem] xl:rounded-[3rem] 2xl:rounded-[4rem] relative z-10"
                                >
                                    <Settings className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 text-white animate-pulse" />
                                </motion.div>

                                {/* Orbiting Data Spheres */}
                                <div className="absolute top-0 left-1/2 w-8 h-8 bg-emerald-400 rounded-full shadow-emerald-glow animate-orbit-massive"></div>
                                <div className="absolute bottom-0 left-1/2 w-6 h-6 bg-blue-400 rounded-full shadow-blue-glow animate-orbit-massive-reverse"></div>
                            </div>
                        </div>

                        {/* Floating Tech Badges */}
                        <div className="absolute top-10 right-0 p-4 bg-zinc-900/80 border border-emerald-500/30 rounded-3xl backdrop-blur-xl animate-bounce-slow flex items-center gap-3">
                            <Gauge className="w-6 h-6 text-emerald-400" />
                            <div className="hidden md:block">
                                <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Power Load</div>
                                <div className="text-xs font-mono text-white">88.4%</div>
                            </div>
                        </div>
                        <div className="absolute bottom-20 -left-10 p-4 bg-zinc-900/80 border border-blue-500/30 rounded-3xl backdrop-blur-xl animate-pulse flex items-center gap-3">
                            <Activity className="w-6 h-6 text-blue-400" />
                            <div className="hidden md:block">
                                <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Core Sync</div>
                                <div className="text-xs font-mono text-white">RECALIBRATING</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT SIDE: FLOATING TEXT & HUD */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="lg:col-span-6 space-y-5 xl:space-y-6 2xl:space-y-12"
                >
                    <div className="space-y-2.5 xl:space-y-3 2xl:space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] xl:text-[10px] 2xl:text-xs font-black uppercase tracking-[0.25em] shadow-emerald-glow backdrop-blur-md">
                            <Zap className="w-4 h-4 fill-current animate-pulse" />
                            Industrial-Grade Maintenance Active
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-8xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl">
                            Modo <br />
                            <span className="text-emerald-500">
                                Manutenção
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-sm lg:text-base xl:text-lg 2xl:text-2xl font-medium leading-relaxed max-w-2xl border-l-[3px] border-emerald-500/30 pl-4 xl:pl-5 2xl:pl-6 backdrop-blur-sm">
                            {maintenanceMessage || "O sistema está passando por uma reestruturação profunda de hardware e otimização de cache nível-L3 para sua máxima performance."}
                        </p>
                    </div>

                    {/* HUD STATUS STRIP - FLOATING CARS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:gap-4 2xl:gap-6 pb-2 xl:pb-4 2xl:pb-8">
                        {[
                            { icon: Clock, label: "Tempo Estimado", val: maintenanceEstimatedTime || "Poucos minutos", color: "emerald" },
                            { icon: ShieldCheck, label: "Nível / Prioridade", val: maintenancePriority || "Nível 5 Ativo", color: "blue" },
                        ].map((item, i) => (
                            <div key={i} className={`p-4 xl:p-5 2xl:p-8 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl xl:rounded-3xl 2xl:rounded-[2.5rem] hover:border-${item.color}-500/40 transition-all duration-500 group/card relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-16 xl:w-20 2xl:w-24 h-16 xl:h-20 2xl:h-24 bg-${item.color}-500/5 rounded-full blur-2xl group-hover/card:bg-${item.color}-500/10 transition-colors`}></div>
                                <div className="flex items-center gap-3 xl:gap-4 2xl:gap-5 mb-2 xl:mb-3 2xl:mb-4">
                                    <div className={`p-2.5 xl:p-3 2xl:p-4 bg-${item.color}-500/10 rounded-lg xl:rounded-xl 2xl:rounded-2xl text-${item.color}-400 group-hover/card:scale-110 transition-transform shadow-inner`}>
                                        <item.icon className="w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" />
                                    </div>
                                    <div className="text-[8px] xl:text-[9px] 2xl:text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                                        {item.label}
                                    </div>
                                </div>
                                <div className="text-base xl:text-lg 2xl:text-2xl font-black text-white tracking-tight">
                                    {item.val}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ACTIONS STRIP */}
                    <div className="flex flex-col sm:flex-row gap-3 xl:gap-4 2xl:gap-6 items-center">
                        {user?.role === UserRole.ADMIN ? (
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="w-full sm:w-auto px-6 xl:px-8 2xl:px-12 py-3 xl:py-4 2xl:py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl xl:rounded-2xl 2xl:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] xl:text-xs 2xl:text-sm transition-all active:scale-95 shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2.5 xl:gap-3 2xl:gap-4 group"
                            >
                                <Settings className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                Bypass to Command Console
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full sm:w-auto px-6 xl:px-8 2xl:px-10 py-3 xl:py-4 2xl:py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl xl:rounded-2xl 2xl:rounded-3xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 xl:gap-3 2xl:gap-4 group/loginbtn backdrop-blur-md text-[10px] xl:text-[11px] 2xl:text-xs"
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover/loginbtn:-translate-x-2 transition-transform" />
                                    Abort & Log Out
                                </button>
                                <div className="flex items-center gap-2 xl:gap-3 text-zinc-600 font-bold uppercase tracking-widest text-[8px] xl:text-[9px] italic md:ml-4 2xl:ml-6">
                                    <div className="w-2 h-2 rounded-full bg-zinc-800 animate-pulse"></div>
                                    Secure access only
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* 4. PERIPHERAL TECH DETAILS (EXTENDING BEYOND CONTENT) */}
            <div className="fixed bottom-10 left-10 z-30 hidden xl:flex gap-8 pointer-events-none opacity-40">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-tighter">LATENCY_CORE_P2P</span>
                    <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-emerald-500 animate-pulse"></div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-zinc-500 tracking-tighter">BUFFER_SYNC_LEVEL</span>
                    <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-blue-500"></div>
                    </div>
                </div>
            </div>

            {/* 5. FLOATING PARTICLES (CANVAS FILL) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-emerald-500/20 rounded-full blur-[1px]"
                        animate={{
                            y: [-20, -200, -20],
                            x: [0, Math.random() * 100 - 50, 0],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            <style jsx global>{`
                :root {
                    --orbit-radius-1: 120px;
                    --orbit-radius-2: 95px;
                }
                @media (min-width: 640px) {
                    :root {
                        --orbit-radius-1: 145px;
                        --orbit-radius-2: 115px;
                    }
                }
                @media (min-width: 768px) {
                    :root {
                        --orbit-radius-1: 165px;
                        --orbit-radius-2: 130px;
                    }
                }
                @media (min-width: 1280px) {
                    :root {
                        --orbit-radius-1: 175px;
                        --orbit-radius-2: 140px;
                    }
                }
                @media (min-width: 1536px) {
                    :root {
                        --orbit-radius-1: 220px;
                        --orbit-radius-2: 180px;
                    }
                }

                @keyframes orbit-massive {
                    from { transform: rotate(0deg) translateX(var(--orbit-radius-1)) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(var(--orbit-radius-1)) rotate(-360deg); }
                }
                @keyframes orbit-massive-reverse {
                    from { transform: rotate(360deg) translateX(var(--orbit-radius-2)) rotate(-360deg); }
                    to { transform: rotate(0deg) translateX(var(--orbit-radius-2)) rotate(0deg); }
                }
                .animate-orbit-massive {
                    animation: orbit-massive 15s linear infinite;
                }
                .animate-orbit-massive-reverse {
                    animation: orbit-massive-reverse 20s linear infinite;
                }
                .shadow-emerald-glow {
                    box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
                }
                .shadow-blue-glow {
                    box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 15s ease infinite;
                }
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
            `}</style>
        </div>
    );
}
