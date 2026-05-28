"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useSystemStore } from "@/lib/system-store";
import { UserRole } from "@/lib/permissions";
import { Wrench } from "lucide-react";

interface PageMaintenanceOverlayProps {
    /** Optional: override which path to check. Defaults to current pathname. */
    path?: string;
}

/**
 * Renders a full-page maintenance overlay if:
 * 1. `maintenanceScope` is "pages" (granular mode)
 * 2. The current page path is in `maintenancePages`
 * 3. The current user is NOT an admin
 *
 * Usage: Drop <PageMaintenanceOverlay /> at the top of any page component.
 */
export function PageMaintenanceOverlay({ path }: PageMaintenanceOverlayProps) {
    const currentPath = usePathname();
    const targetPath = path ?? currentPath;

    const { user, isAuthenticated } = useAuthStore();
    const { isMaintenanceMode, maintenanceScope, maintenancePages, maintenanceMessage, maintenanceEstimatedTime } = useSystemStore();

    // Admins always pass through
    if (isAuthenticated && user?.role === UserRole.ADMIN) return null;

    // Only activates in "pages" scope mode
    if (!isMaintenanceMode || maintenanceScope !== "pages") return null;

    // Normalize paths for comparison (strip trailing slashes)
    const normalize = (p: string) => p.replace(/\/$/, "") || "/";
    const isPageUnderMaintenance = maintenancePages.some(
        (p) => normalize(p) === normalize(targetPath)
    );

    if (!isPageUnderMaintenance) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 max-w-md text-center px-8">
                {/* Icon */}
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-3xl bg-amber-500/10 animate-pulse" />
                    <div className="relative w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Wrench className="w-10 h-10 text-amber-500" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-text-dark dark:text-white tracking-tight">
                        Página em Manutenção
                    </h2>
                    <p className="text-sm text-text-light font-medium leading-relaxed">
                        {maintenanceMessage || "Esta seção está temporariamente indisponível para manutenção programada."}
                    </p>
                </div>

                {/* ETA */}
                {maintenanceEstimatedTime && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            Previsão: {maintenanceEstimatedTime}
                        </span>
                    </div>
                )}

                {/* Hint for other pages */}
                <p className="text-[11px] text-text-light/60 font-medium">
                    As demais seções do sistema continuam disponíveis.
                </p>
            </div>
        </div>
    );
}
