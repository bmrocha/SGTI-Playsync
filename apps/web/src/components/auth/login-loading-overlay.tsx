"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoginLoadingOverlayProps {
    isLoading: boolean;
}

export function LoginLoadingOverlay({ isLoading }: LoginLoadingOverlayProps) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-emerald-950/5 dark:bg-black/20"
                >
                    <div className="absolute inset-0 overflow-hidden flex justify-around opacity-20 pointer-events-none px-20">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: "-100%" }}
                                animate={{ y: "100%" }}
                                transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: "linear" }}
                                className="w-[1px] h-48 bg-gradient-to-b from-transparent via-emerald-500 to-transparent"
                            />
                        ))}
                    </div>

                    <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                        {[
                            "top-0 left-0 border-t-2 border-l-2",
                            "top-0 right-0 border-t-2 border-r-2",
                            "bottom-0 left-0 border-b-2 border-l-2",
                            "bottom-0 right-0 border-b-2 border-r-2"
                        ].map((pos, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                className={`absolute w-16 h-16 border-emerald-500/80 ${pos}`}
                            />
                        ))}

                        <motion.div
                            animate={{
                                opacity: [0.1, 0.4, 0.1],
                                scale: [1, 1.02, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-[340px] h-[420px] border border-emerald-500/30 rounded-[2.5rem]"
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute mt-[580px] flex flex-col items-center gap-1.5"
                    >
                        <div className="px-5 py-1.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-[0.5em] shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                            System Authorized
                        </div>
                        <div className="flex gap-6">
                            <span className="text-emerald-500/60 font-mono text-[8px] uppercase tracking-widest">Protocol: PLAYSYNC_SECURE</span>
                            <span className="text-emerald-500/60 font-mono text-[8px] uppercase tracking-widest">Uplink: 100%</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
