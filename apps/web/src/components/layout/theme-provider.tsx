"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme-store";
import { Toaster, resolveValue } from "react-hot-toast";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, primaryColor } = useThemeStore();
    useEffect(() => {
        const root = window.document.documentElement;

        if (theme === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
        } else {
            root.classList.add("light");
            root.classList.remove("dark");
        }

        // Apply Dynamic Colors
        if (primaryColor) {
            root.style.setProperty('--bg-main', primaryColor);
            root.style.setProperty('--ring', primaryColor);
            const rgbMain = hexToRgb(primaryColor);
            if (rgbMain) root.style.setProperty('--bg-main-rgb', `${rgbMain.r} ${rgbMain.g} ${rgbMain.b}`);

            // Adjust sidebar/UI colors based on primary
            // Reduced darkening to keep the colors distinct (Green stays light, Blue stays blue)
            const sidebarBg = theme === 'dark' ? adjustBrightness(primaryColor, -70) : adjustBrightness(primaryColor, -25); 
            const sidebarHover = adjustBrightness(primaryColor, -15);
            const sidebarBottom = adjustBrightness(primaryColor, -35); 
            
            root.style.setProperty('--sidebar-bg', sidebarBg);
            root.style.setProperty('--sidebar-hover', sidebarHover);
            root.style.setProperty('--sidebar-bottom', sidebarBottom);

            if (theme === 'dark') {
                const darkBg = mixWithBlack(primaryColor, 96); 
                root.style.setProperty('--background', darkBg);
                root.style.setProperty('--panel-bg', mixWithBlack(primaryColor, 94));
                root.style.setProperty('--card', mixWithBlack(primaryColor, 92));
                root.style.setProperty('--border-color', `${primaryColor}25`); // Translucent border based on primary
            } else {
                root.style.removeProperty('--background');
                root.style.removeProperty('--panel-bg');
                root.style.removeProperty('--card');
                root.style.removeProperty('--border-color');
            }
        }
    }, [theme, primaryColor]);

    return (
        <>
            <style jsx global>{`
                :root, .light, .dark, [data-theme] {
                    --bg-main: ${primaryColor} !important;
                    ${primaryColor ? `--bg-main-rgb: ${hexToRgb(primaryColor)?.r} ${hexToRgb(primaryColor)?.g} ${hexToRgb(primaryColor)?.b} !important;` : ''}
                    --ring: ${primaryColor} !important;
                }
                
                @keyframes toast-progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .toast-enter {
                    animation: toast-enter 0.3s ease-out forwards;
                }
                .toast-leave {
                    animation: toast-leave 0.2s ease-in forwards;
                }
                @keyframes toast-enter {
                    from { opacity: 0; transform: scale(0.9) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                 @keyframes toast-leave {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to { opacity: 0; transform: scale(0.9) translateY(-10px); }
                }
                /* Neon pulse for default indicator */
                @keyframes neon-pulse {
                    0% { box-shadow: 0 0 2px #d4ff00, 0 0 5px #d4ff00; opacity: 0.8; }
                    50% { box-shadow: 0 0 10px #d4ff00, 0 0 20px #d4ff00; opacity: 1; }
                    100% { box-shadow: 0 0 2px #d4ff00, 0 0 5px #d4ff00; opacity: 0.8; }
                }
                .neon-pulse {
                    animation: neon-pulse 1.5s infinite ease-in-out;
                }
            `}</style>
            {children}
            <Toaster position="top-right" gutter={12} toastOptions={{ duration: 3000 }}>
                {(t) => (
                    <div
                        className={`
                            ${t.visible ? 'toast-enter' : 'toast-leave'}
                            transform transition-all duration-300
                            max-w-112.5 w-full 
                            bg-white dark:bg-[#18181b] 
                            shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
                            rounded-2xl 
                            border border-zinc-100 dark:border-zinc-800
                            flex flex-col overflow-hidden pointer-events-auto
                        `}
                        style={{
                            minWidth: '320px',
                        }}
                    >
                        {/* Main Content */}
                        <div className="flex items-start p-5 gap-4 relative overflow-hidden">
                            {/* Icon Section */}
                            <div className="shrink-0 pt-0.5">
                                {t.type === 'success' && (
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-500/20">
                                        <CheckCircle2 size={22} strokeWidth={2.5} />
                                    </div>
                                )}
                                {t.type === 'error' && (
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm shadow-red-500/20">
                                        <XCircle size={22} strokeWidth={2.5} />
                                    </div>
                                )}
                                {t.type === 'loading' && (
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Loader2 size={22} className="animate-spin" />
                                    </div>
                                )}
                                {(t.type === 'blank' || t.type === 'custom') && (
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                        <AlertCircle size={22} />
                                    </div>
                                )}
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 flex flex-col justify-center min-h-10">
                                <div className="text-[15px] font-bold text-zinc-800 dark:text-zinc-100 leading-snug">
                                    {resolveValue(t.message, t)}
                                </div>
                                {t.type === 'success' && <div className="text-xs font-medium text-zinc-400 mt-1">Operação concluída com sucesso</div>}
                                {t.type === 'error' && <div className="text-xs font-medium text-zinc-400 mt-1">Verifique os dados e tente novamente</div>}
                                {t.type === 'loading' && <div className="text-xs font-medium text-zinc-400 mt-1">Processando sua solicitação...</div>}
                            </div>

                            {/* Decoration Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2
                                ${t.type === 'success' ? 'bg-emerald-500' : ''}
                                ${t.type === 'error' ? 'bg-red-500' : ''}
                                ${t.type === 'loading' ? 'bg-blue-500' : ''}
                            `} />
                        </div>

                        {/* Progress Bar (Timer) */}
                        {t.type !== 'loading' && (
                            <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800/50">
                                <div
                                    className={`h-full ${t.type === 'success' ? 'bg-emerald-500' :
                                        t.type === 'error' ? 'bg-red-500' :
                                            'bg-zinc-400'
                                        }`}
                                    style={{
                                        width: '100%',
                                        animation: `toast-progress ${t.duration || 3000}ms linear forwards`
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Toaster>
        </>
    );
}

// Helper to darken/lighten hex color (Simple math)
function adjustBrightness(col: string, amt: number) {
    col = col.replace(/^#/, '');
    if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];

    let r = parseInt(col.substring(0, 2), 16);
    let g = parseInt(col.substring(2, 4), 16);
    let b = parseInt(col.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, r + amt));
    g = Math.max(0, Math.min(255, g + amt));
    b = Math.max(0, Math.min(255, b + amt));

    return "#" + ((r.toString(16).length === 1) ? "0" + r.toString(16) : r.toString(16)) +
        ((g.toString(16).length === 1) ? "0" + g.toString(16) : g.toString(16)) +
        ((b.toString(16).length === 1) ? "0" + b.toString(16) : b.toString(16));
}

// Helper to mix color with black for deep tints
function mixWithBlack(hex: string, percent: number) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const factor = (100 - percent) / 100;

    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    return "#" + ((newR.toString(16).length === 1) ? "0" + newR.toString(16) : newR.toString(16)) +
        ((newG.toString(16).length === 1) ? "0" + newG.toString(16) : newG.toString(16)) +
        ((newB.toString(16).length === 1) ? "0" + newB.toString(16) : newB.toString(16));
}

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}
