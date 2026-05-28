"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useSystemStore } from "@/lib/system-store";
import { UserRole } from "@/lib/permissions";

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { isMaintenanceMode, maintenanceScope, fetchSettings } = useSystemStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Fetch global settings from server on mount, then mark as mounted
        fetchSettings().then(() => setMounted(true));
    }, [fetchSettings]);

    useEffect(() => {
        if (!mounted) return;

        // Admins are NEVER affected by maintenance mode — they retain full access
        if (isAuthenticated && user?.role === UserRole.ADMIN) return;

        // Skip check if the user is on public/system pages like maintenance, login, or api routes
        if (pathname === "/manutencao" || pathname === "/login" || pathname?.startsWith("/api")) return;

        // Only trigger global redirect for SITE-WIDE maintenance
        // Page-specific maintenance is handled by PageMaintenanceOverlay on each page
        if (isMaintenanceMode && maintenanceScope === "site") {
            // Non-admin or unauthenticated users are locked out
            if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
                router.push("/manutencao");
            }
        }
    }, [isMaintenanceMode, maintenanceScope, user, isAuthenticated, pathname, router, mounted]);

    // During mounting, render blank to avoid flash of content
    if (!mounted) {
        return <div className="min-h-screen bg-background" />;
    }

    return <>{children}</>;
}
