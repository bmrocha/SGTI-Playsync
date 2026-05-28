import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from './permissions';
import { logLogin, logLogout } from './activity-log-store';
import { apiFetch } from './api-client';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    companyId?: string | null;
    createdAt: Date;
    lastLogin?: Date;
    avatar?: string | null;
    forcePasswordReset?: boolean;
    theme?: "light" | "dark";
    primaryColor?: string;
    two_factor_enabled?: boolean;
    force_2fa_setup?: boolean;
}

export interface LoginResponse {
    success: boolean;
    error?: string;
    require2fa?: boolean;
    tempToken?: string;
    requirePasswordReset?: boolean;
    require2faSetup?: boolean;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<LoginResponse>;
    verify2FA: (tempToken: string, code: string) => Promise<{ success: boolean; error?: string; requirePasswordReset?: boolean }>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => void;
    checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,

            checkAuth: async () => {
                try {
                    const response = await apiFetch('/api/auth/me');
                    if (response.ok) {
                        const data = await response.json();
                        // Restore session from server cookie
                        const user: User = {
                            ...data.user,
                            createdAt: new Date(data.user.createdAt),
                            lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : undefined,
                        };
                        set({ user, isAuthenticated: true });
                        return true;
                    } else {
                        // Cookie invalid/missing
                        if (get().isAuthenticated) {
                            set({ user: null, isAuthenticated: false });
                        }
                        return false;
                    }
                } catch (error) {
                    console.error('Session check failed:', error);
                    return false;
                }
            },

            login: async (email: string, password: string): Promise<LoginResponse> => {
                try {
                    const response = await apiFetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        return { success: false, error: data.error || 'Erro ao fazer login' };
                    }

                    if (data.require2fa) {
                        return { success: true, require2fa: true, tempToken: data.tempToken };
                    }

                    const user: User = {
                        ...data.user,
                        createdAt: new Date(data.user.createdAt),
                        lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : undefined,
                    };

                    set({
                        user,
                        isAuthenticated: true,
                    });

                    // Log successful login
                    logLogin(user.id, user.name, user.role);

                    return { success: true, requirePasswordReset: user.forcePasswordReset, require2faSetup: user.force_2fa_setup };
                } catch (error) {
                    console.error('Login error:', error);
                    return { success: false, error: 'Erro de conexão com o servidor' };
                }
            },

            verify2FA: async (tempToken: string, code: string) => {
                try {
                    const response = await apiFetch('/api/auth/2fa/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tempToken, code }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        return { success: false, error: data.error || 'Código inválido' };
                    }

                    const user: User = {
                        ...data.user,
                        createdAt: new Date(data.user.createdAt),
                        lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : undefined,
                        // Ensure forcePasswordReset is mapped if the API returns snake_case
                        forcePasswordReset: data.user.forcePasswordReset ?? data.user.force_password_reset
                    };

                    set({
                        user,
                        isAuthenticated: true,
                    });
                    
                    logLogin(user.id, user.name, user.role);

                    return { success: true, requirePasswordReset: user.forcePasswordReset };
                } catch (error) {
                    console.error('2FA Verify error:', error);
                    return { success: false, error: 'Erro de conexão' };
                }
            },

            logout: async () => {
                const currentUser = get().user;
                if (currentUser) {
                    try {
                        await apiFetch('/api/auth/logout', { method: 'POST' });
                        logLogout(currentUser.id, currentUser.name, currentUser.role);
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                }
                set({ user: null, isAuthenticated: false });
            },

            updateProfile: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                }));
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
