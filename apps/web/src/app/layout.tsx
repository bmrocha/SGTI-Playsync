import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

import { getSystemSettings } from "@/lib/system-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();

  return {
    title: settings.systemName || "PlaySync",
    description: "Experiência de Mídia Cinematográfica",
    icons: {
      icon: settings.faviconUrl || "/favicon.ico",
      shortcut: settings.faviconUrl || "/favicon.ico",
      apple: settings.faviconUrl || "/apple-icon.png",
    },
  };
}

import { ThemeProvider } from "@/components/layout/theme-provider";
import { MaintenanceProvider } from "@/components/layout/maintenance-provider";
import { SessionHeartbeat } from "@/components/session-heartbeat";
import { ResponsiveHelper } from "@/components/debug/responsive-helper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`antialiased bg-background text-foreground scrollbar-hide`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SessionHeartbeat />
          <MaintenanceProvider>
            {children}
            <ResponsiveHelper />
          </MaintenanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
