"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
    theme: "light" | "dark";
    primaryColor: string;
    toggleTheme: () => void;
    setTheme: (theme: "light" | "dark") => void;
    setPrimaryColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
            primaryColor: "#11876d", // Default Teal
            toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
            setTheme: (theme) => {
                console.log('SETTING THEME TO:', theme);
                set({ theme });
            },
            setPrimaryColor: (color) => set({ primaryColor: color }),
        }),
        {
            name: "playsync-theme",
        }
    )
);
