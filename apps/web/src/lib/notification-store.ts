import { create } from 'zustand';
import toast from 'react-hot-toast';
import { generateUUID } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import React from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;

    // Actions
    addNotification: (type: NotificationType, title: string, message: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    getUnreadNotifications: () => Notification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (type, title, message) => {
        // Remove emojis from title to avoid duplication with icons
        const cleanTitle = title.replace(/^[✅❌⚠️ℹ️🗑️➕✏️📢]+\s*/, '');

        const notification: Notification = {
            id: generateUUID(),
            type,
            title: cleanTitle,
            message,
            timestamp: new Date(),
            read: false,
        };

        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
            unreadCount: state.unreadCount + 1,
        }));

        // Show toast notification with premium theme-adaptive styling
        const isDarkTheme = document.documentElement.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark';

        const toastOptions = {
            duration: 2500,
            style: isDarkTheme ? {
                // Dark Theme - Premium Black with Green Accent
                background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(26, 26, 26, 0.98) 100%)',
                color: '#ffffff',
                border: '1px solid rgba(0, 255, 200, 0.4)',
                borderRadius: '16px',
                padding: '18px 24px',
                boxShadow: '0 12px 40px rgba(0, 255, 200, 0.2), 0 6px 20px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                fontSize: '15px',
                fontWeight: '500',
                maxWidth: '420px',
                minWidth: '320px',
            } : {
                // Light Theme - Clean White with Dark Green Accent
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.98) 100%)',
                color: '#1a1a1a',
                border: '1px solid rgba(0, 150, 120, 0.3)',
                borderRadius: '16px',
                padding: '18px 24px',
                boxShadow: '0 12px 40px rgba(0, 150, 120, 0.15), 0 6px 20px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(16px)',
                fontSize: '15px',
                fontWeight: '500',
                maxWidth: '420px',
                minWidth: '320px',
            },
            iconTheme: isDarkTheme ? {
                primary: '#00ffc8',
                secondary: 'rgba(10, 10, 10, 0.98)',
            } : {
                primary: '#00b88a',
                secondary: 'rgba(255, 255, 255, 0.98)',
            },
        };

        switch (type) {
            case 'success':
                toast.success(cleanTitle + (message ? `\n${message}` : ''), toastOptions);
                break;
            case 'error':
                toast.error(cleanTitle + (message ? `\n${message}` : ''), toastOptions);
                break;
            case 'warning':
                toast(cleanTitle + (message ? `\n${message}` : ''), { 
                    ...toastOptions, 
                    icon: React.createElement(AlertTriangle, { className: "w-5 h-5 text-amber-500" })
                });
                break;
            case 'info':
                toast(cleanTitle + (message ? `\n${message}` : ''), { 
                    ...toastOptions, 
                    icon: React.createElement(Info, { className: "w-5 h-5 text-brand-main" })
                });
                break;
        }
    },

    markAsRead: (id) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
    },

    getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
    },
}));

// Helper functions for common notifications
export const notifyPlaylistStart = (playlistName: string, companyName: string) => {
    useNotificationStore.getState().addNotification(
        'info',
        'Playlist Iniciada',
        `${playlistName} (${companyName}) está sendo reproduzida`
    );
};

export const notifyPlaylistEnd = (playlistName: string) => {
    useNotificationStore.getState().addNotification(
        'success',
        'Playlist Concluída',
        `${playlistName} foi reproduzida com sucesso`
    );
};

export const notifyError = (title: string, message: string) => {
    useNotificationStore.getState().addNotification('error', title, message);
};

export const notifySuccess = (title: string, message: string) => {
    useNotificationStore.getState().addNotification('success', title, message);
};

export const notifyWarning = (title: string, message: string) => {
    useNotificationStore.getState().addNotification('warning', title, message);
};

export const notifyInfo = (title: string, message: string) => {
    useNotificationStore.getState().addNotification('info', title, message);
};
