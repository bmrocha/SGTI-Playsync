"use client";

import { Settings, Wrench, Activity, Clock, ShieldCheck, Zap } from "lucide-react";

interface PageMaintenanceOverlayProps {
    maintenanceMessage: string;
    maintenanceEstimatedTime: string;
    maintenancePriority: string;
}

export function PageMaintenanceOverlay({
    maintenanceMessage,
    maintenanceEstimatedTime,
    maintenancePriority,
}: PageMaintenanceOverlayProps) {
    return (
        <div className="flex-1 relative overflow-hidden bg-background flex items-center justify-center">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.06] dark:opacity-[0.15]"
                    style={{
                        backgroundImage: 'linear-gradient(to right, var(--bg-main) 1px, transparent 1px), linear-gradient(to bottom, var(--bg-main) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
                <div className="absolute bottom-[-5%] left-[-3%] w-[380px] h-[380px] pointer-events-none opacity-[0.04] dark:opacity-[0.06]">
                    <Settings className="w-full h-full text-brand-main animate-[spin_90s_linear_infinite_reverse]" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-brand-main/5 rounded-full blur-[100px] animate-pulse pointer-events-none" />
            </div>

            <div
                className="absolute left-0 right-0 h-px z-10 pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, transparent, var(--bg-main), transparent)',
                    boxShadow: '0 0 10px var(--bg-main)',
                    animation: 'scanline 4s ease-in-out infinite',
                }}
            />

            <div className="relative z-20 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center px-6 md:px-12 py-6 md:py-8">
                <div className="flex items-center justify-center">
                    <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[240px] md:h-[240px] xl:w-[270px] xl:h-[270px]">
                        <div className="absolute inset-0 rounded-full border border-brand-main/20 animate-[spin_15s_linear_infinite]" />
                        <div className="absolute inset-6 sm:inset-8 rounded-full border border-blue-500/10 animate-[spin_25s_linear_infinite_reverse]" />
                        <div className="absolute inset-12 sm:inset-16 rounded-full border border-dashed border-brand-main/10 animate-[spin_40s_linear_infinite]" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                className="p-6 sm:p-8 md:p-10 bg-gradient-to-br from-brand-main to-brand-main rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.22)]"
                                style={{ animation: 'spin 10s linear infinite' }}
                            >
                                <Settings className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white" />
                            </div>
                        </div>

                        <div className="absolute top-4 -right-4 sm:-right-8 p-2.5 sm:p-3 bg-card border border-brand-main/30 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 sm:gap-2.5">
                            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-main shrink-0" />
                            <div>
                                <div className="text-[6px] sm:text-[7px] font-black text-brand-main uppercase tracking-widest">Status</div>
                                <div className="text-[8px] sm:text-[10px] font-black text-foreground">Em Reparo</div>
                            </div>
                        </div>

                        <div className="absolute -bottom-2 -left-4 sm:-left-8 p-2.5 sm:p-3 bg-card border border-blue-500/30 rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-2 sm:gap-2.5 animate-pulse">
                            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                            <div>
                                <div className="text-[6px] sm:text-[7px] font-black text-blue-400 uppercase tracking-widest">Sistema</div>
                                <div className="text-[8px] sm:text-[10px] font-mono font-black text-foreground">RECALIBRANDO</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-7">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-brand-main/10 border border-brand-main/20 text-brand-main text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">
                        <Zap className="w-3 h-3 fill-current animate-pulse" />
                        Manutenção Programada Ativa
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] text-foreground">
                            Página em<br />
                            <span className="text-brand-main">Manutenção</span>
                        </h2>
                        <p className="text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground max-w-xs border-l-2 border-brand-main/30 pl-3 sm:pl-4">
                            {maintenanceMessage || "Esta seção está temporariamente offline enquanto realizamos melhorias críticas no sistema."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <div className="p-4 bg-card border border-border rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-brand-main" />
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Previsão</span>
                            </div>
                            <div className="text-lg font-black text-foreground">
                                {maintenanceEstimatedTime || "Em breve"}
                            </div>
                        </div>
                        <div className="p-4 bg-card border border-border rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Nível</span>
                            </div>
                            <div className="text-lg font-black text-foreground">
                                {maintenancePriority || "Programada"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-main animate-pulse" />
                        <p className="text-[10px] font-medium text-muted-foreground">
                            As demais seções continuam disponíveis na barra lateral.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
