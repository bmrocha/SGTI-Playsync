"use client";

import { useNotificationStore } from "@/lib/notification-store";
import { Bell, Check, X, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle, BellRing, SquareCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const prevCountRef = useRef(unreadCount);

    // Audio Alert for new notifications (Recurring Beep)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const playBeep = () => {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.volume = 0.4;
            audio.play().catch(e => console.log("Sound play disabled by browser policy"));
        };

        if (unreadCount > 0 && !isOpen) {
            // Play immediately when unread count increases
            if (unreadCount > prevCountRef.current) {
                playBeep();
            }

            // Recurring beep every 8 seconds for more insistence
            interval = setInterval(() => {
                if (unreadCount > 0 && !isOpen) {
                    playBeep();
                }
            }, 8000);
        }

        prevCountRef.current = unreadCount;

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [unreadCount, isOpen]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'info': return <Info className="w-5 h-5 text-brand-main" />;
            default: return <BellRing className="w-5 h-5 text-text-light" />;
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        return `${days}d atrás`;
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 laptop:p-2 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center group overflow-hidden border
                    hover:bg-amber-500 hover:text-white hover:border-amber-500
                    dark:hover:bg-amber-400 dark:hover:text-black dark:hover:border-amber-400
                    ${isOpen
                        ? 'bg-amber-500/25 dark:bg-amber-400/30 backdrop-blur-md border-amber-500/40 dark:border-amber-400/50 text-amber-700 dark:text-amber-400 shadow-[0_8px_25px_-5px_rgba(245,158,11,0.2)] dark:shadow-[0_8px_25px_-5px_rgba(251,191,36,0.3)]'
                        : unreadCount > 0
                            ? 'bg-amber-500/15 dark:bg-amber-400/15 backdrop-blur-sm border-amber-500/30 dark:border-amber-400/30 text-amber-700 dark:text-amber-400 shadow-[0_4px_15px_-3px_rgba(245,158,11,0.15)] dark:shadow-[0_4px_15px_-3px_rgba(251,191,36,0.2)]'
                            : 'bg-amber-500/10 dark:bg-amber-400/10 backdrop-blur-sm border-amber-500/20 dark:border-amber-400/20 text-amber-700/70 dark:text-amber-400/70 shadow-none'}`}
            >
                {/* Flashing Yellow Dot (Bolinha) */}
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 z-20 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                )}
                {/* Ping Pulse Animation */}
                {unreadCount > 0 && !isOpen && (
                    <motion.span
                        animate={{ scale: [1, 1.45], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-amber-400"
                    />
                )}

                <Bell className={`w-[22px] h-[22px] laptop:w-[18px] laptop:h-[18px] z-10 transition-all duration-300 
                    ${isOpen ? 'rotate-12 scale-110' : ''} 
                    ${unreadCount > 0 && !isOpen ? 'animate-bell-swing' : 'group-hover:animate-bell-swing'}`}
                />

                {/* Subtle Glow Effect */}
                {unreadCount > 0 && (
                    <div className="absolute inset-0 bg-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/5"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10, rotateX: -10 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="absolute right-0 mt-3 w-[400px] bg-panel-bg/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 max-h-[600px] flex flex-col overflow-hidden origin-top-right"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 bg-white/40 dark:bg-black/20 border-b border-border/50 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-main/10 flex items-center justify-center">
                                        <BellRing className="w-4 h-4 text-brand-main" />
                                    </div>
                                    <h3 className="font-bold text-text-dark tracking-tight">Notificações</h3>
                                    {unreadCount > 0 && (
                                        <span className="bg-rose-600/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-600/20">
                                            {unreadCount} novas
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="p-2 text-text-light hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                                            title="Lidas"
                                        >
                                            <SquareCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearNotifications}
                                            className="p-2 text-text-light hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
                                            title="Limpar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 ml-1 text-text-light hover:text-text-dark hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
                                        title="Fechar"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="text-center py-16 px-6">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border/20 flex items-center justify-center opacity-40">
                                            <Bell className="w-8 h-8 text-text-light" />
                                        </div>
                                        <p className="text-sm font-medium text-text-light">Tudo em dia!</p>
                                        <p className="text-xs text-text-light/60 mt-1">Você não tem novas notificações no momento.</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        {notifications.map((notification, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={notification.id}
                                                className={`px-5 py-4 hover:bg-brand-main/5 transition-all cursor-pointer relative group border-l-4 ${!notification.read ? 'border-brand-main bg-brand-main/[0.02]' : 'border-transparent'
                                                    }`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className={`font-semibold text-sm transition-colors ${!notification.read ? 'text-text-dark' : 'text-text-light'}`}>
                                                                {notification.title}
                                                            </h4>
                                                            <span className="text-[10px] text-text-light/50 font-medium whitespace-nowrap mt-1">
                                                                {formatTime(notification.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-text-light/80 mt-1 leading-relaxed line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx>{`
                @keyframes bell-swing {
                    0%, 100% { transform: rotate(0); }
                    10%, 30%, 50%, 70%, 90% { transform: rotate(15deg); }
                    20%, 40%, 60%, 80% { transform: rotate(-15deg); }
                }
                .animate-bell-swing {
                    animation: bell-swing 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
