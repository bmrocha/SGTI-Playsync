"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useSystemStore } from "@/lib/system-store";
import { useAppStore } from "@/lib/store";
import { useThemeStore } from "@/lib/theme-store";
import { UserRole } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LicenseGuard } from "@/components/providers/license-guard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageMaintenanceOverlay } from "@/components/dashboard/page-maintenance-overlay";
import { notifyError } from "@/lib/notification-store";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        const noop = () => {};
        console.log = noop;
        console.warn = noop;
        console.info = noop;
    }
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, checkAuth, user, logout } = useAuthStore();
    const { fetchSettings, sessionLimit, isMaintenanceMode, maintenanceScope, maintenancePages, maintenanceMessage, maintenanceEstimatedTime, maintenancePriority } = useSystemStore();
    const { fetchData } = useAppStore();
    const { theme: currentTheme, primaryColor: currentPrimaryColor, setTheme, setPrimaryColor } = useThemeStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const hasSyncedRef = useRef(false);

    // Wait for Zustand persist to hydrate
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Check server session on mount to validate cookie
    useEffect(() => {
        const verifySession = async () => {
            if (isHydrated) {
                await checkAuth();
                await fetchSettings();
                setIsCheckingSession(false);
            }
        };
        verifySession();
    }, [isHydrated, checkAuth, fetchSettings]);

    // Sync theme settings from user profile to theme store (Only ONCE per session/load)
    useEffect(() => {
        if (isHydrated && !isCheckingSession && user && !hasSyncedRef.current) {
            // Priority: User profile preference > Store value
            if (user.theme && user.theme !== currentTheme) {
                setTheme(user.theme);
            }
            if (user.primaryColor && user.primaryColor !== currentPrimaryColor) {
                setPrimaryColor(user.primaryColor);
            }
            hasSyncedRef.current = true;
        }
    }, [isHydrated, isCheckingSession, user, currentTheme, currentPrimaryColor, setTheme, setPrimaryColor]);

    // Poll settings every 5s so maintenance changes apply without page reload (except on settings page to avoid overwriting edits)
    useEffect(() => {
        if (!isHydrated || pathname === "/dashboard/settings") return;
        const interval = setInterval(() => {
            fetchSettings();
        }, 5000);
        return () => clearInterval(interval);
    }, [isHydrated, fetchSettings, pathname]);

    // Client-side session inactivity detector (auto-logout)
    useEffect(() => {
        if (!isHydrated || isCheckingSession || !isAuthenticated) return;

        // Hardcoded to 15 minutes systemic default as requested
        const limitMinutes = 15;
        const limitMs = limitMinutes * 60 * 1000;

        let lastActivity = Date.now();

        const resetTimer = () => {
            lastActivity = Date.now();
        };

        // Events to monitor active user interactions on the screen
        const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
        events.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        // Periodically check elapsed inactivity time (every 10 seconds)
        const intervalId = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivity;
            if (timeSinceLastActivity >= limitMs) {
                logout()
                    .then(() => {
                        notifyError("Sessão inativa", `Você foi desconectado por inatividade (${limitMinutes} min).`);
                    })
                    .catch((error) => {
                        console.error("Auto-logout error:", error);
                    });
            }
        }, 10000);

        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
            clearInterval(intervalId);
        };
    }, [isHydrated, isCheckingSession, isAuthenticated, sessionLimit, logout]);

    useEffect(() => {
        // Only redirect if both hydration and server check are complete AND still not authenticated
        if (isHydrated && !isCheckingSession && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, isHydrated, isCheckingSession, router]);

    // Show loading state while hydrating or checking session
    if (!isHydrated || (isCheckingSession && !isAuthenticated)) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-brand-main border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-secondary text-sm">Verificando sessão...</p>
                </div>
            </div>
        );
    }

    // ── PAGE-SPECIFIC MAINTENANCE CHECK ───────────────────────────────────────
    // Admins always bypass maintenance. Non-admins see overlay when their
    // current page is in the maintenancePages list (scope = "pages").
    const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;
    const normalize = (p: string) => p.replace(/\/$/, "") || "/";

    const isPageUnderMaintenance =
        !isAdmin &&
        isMaintenanceMode &&
        maintenanceScope === "pages" &&
        maintenancePages.some((p) => {
            const normP = normalize(p);
            const normPath = normalize(pathname);
            return normPath === normP || normPath.startsWith(normP + "/");
        });

    return (
        <LicenseGuard>
        <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
            {/* Sidebar - No shrink to prevent layout shifts */}
            <div className="shrink-0 h-full">
                <Sidebar />
            </div>

            <div className="flex flex-1 flex-col h-full overflow-hidden">
                <Header />

                <main className="flex-1 overflow-hidden flex flex-col bg-body-bg">
                    <ErrorBoundary>
                        {isPageUnderMaintenance ? (
                            <PageMaintenanceOverlay
                                maintenanceMessage={maintenanceMessage}
                                maintenanceEstimatedTime={maintenanceEstimatedTime}
                                maintenancePriority={maintenancePriority}
                            />
                        ) : (
                            <div className="flex-1 overflow-hidden bg-body-bg">
                                {children}
                            </div>
                        )}
                    </ErrorBoundary>
                </main>
            </div>
        </div>
        </LicenseGuard>
    );
}
