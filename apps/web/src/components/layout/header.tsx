'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth-store';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useThemeStore } from '@/lib/theme-store';
import { Sun, Moon, User as UserIcon, LogOut } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/notification-center';

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const getTitleFromPath = () => {
    if (pathname === '/dashboard') return 'Visão Geral';
    if (pathname.includes('/companies')) return 'Gerenciar Empresas';
    if (pathname.includes('/playlists')) return 'Gerenciar Playlists';
    if (pathname.includes('/users')) return 'Gerenciar Usuários';
    if (pathname.includes('/editor')) return 'Editor de Playlist';
    if (pathname.includes('/analytics')) return 'Analytics & Estatísticas';
    if (pathname.includes('/storage')) return 'Armazenamento';
    if (pathname.includes('/activity-log') || pathname.includes('/audit')) return 'Auditoria';
    if (pathname.includes('/sectors')) return 'Gerenciar Setores';
    if (pathname.includes('/players')) return 'Gerenciar Telas';
    if (pathname.includes('/settings')) return 'Configurações do Sistema';
    return 'Dashboard';
  };

  return (
    <div
      className="flex items-center justify-between border-b border-border bg-panel-bg px-4 sm:px-6 laptop:px-6 transition-colors duration-300 shadow-sm header-container"
      style={{
        height: 'var(--header-height)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.7rem] laptop:text-[0.7rem] text-text-light font-normal uppercase tracking-widest">
          PLAYSYNC
        </span>
        <span className="text-[1rem] sm:text-[1.1rem] laptop:text-base text-brand-main font-bold m-0">
          {getTitleFromPath()}
        </span>
      </div>

      <div className="flex items-center gap-2 laptop:gap-3">
        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 laptop:p-2 rounded-full border transition-all duration-300 active:scale-95 group
                        ${
                          theme === 'light'
                            ? 'bg-brand-main/10 text-brand-main border-brand-main/20 hover:bg-brand-main hover:text-white hover:border-brand-main'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-brand-main hover:border-white'
                        }`}
          title={theme === 'light' ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
          data-hover="scale"
        >
          {theme === 'light' ? (
            <Moon
              className="w-4.5 h-4.5 laptop:w-4 laptop:h-4 transition-transform duration-500 group-hover:rotate-[-15deg] group-hover:scale-110 origin-center"
              data-hover="glow"
            />
          ) : (
            <Sun
              className="w-4.5 h-4.5 laptop:w-4 laptop:h-4 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110"
              data-hover="glow"
            />
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`p-2 laptop:p-2 rounded-full border transition-all duration-300 active:scale-95 group
                        ${
                          theme === 'light'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500'
                        }`}
          title="Sair do Sistema"
          data-hover="scale"
        >
          {isLoggingOut ? (
            <div className="w-4.5 h-4.5 laptop:w-4 laptop:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut
              className="w-4.5 h-4.5 laptop:w-4 laptop:h-4 transition-transform duration-500 group-hover:rotate-[-5deg] group-hover:scale-110 origin-center"
              data-hover="glow"
            />
          )}
        </button>

        {/* User Profile */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-2 laptop:gap-2 pl-2 sm:pl-3 laptop:pl-3 border-l border-border transition-all group"
          title="Minha Conta"
        >
          <div className="text-right hidden lg:block">
            <p className="text-xs laptop:text-xs font-bold text-text-dark leading-none transition-colors link-underline">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-[0.6rem] laptop:text-[0.6rem] text-text-light uppercase tracking-wider font-medium mt-0.5">
              {user?.role || 'Visitante'}
            </p>
          </div>
          <div
            className="w-9 h-9 laptop:w-8 laptop:h-8 rounded-full bg-brand-main/10 border-2 border-brand-main/20 flex items-center justify-center text-brand-main group-hover:bg-brand-main group-hover:text-white group-hover:border-brand-main transition-all duration-300 overflow-hidden group-hover:scale-110 relative"
            data-hover="lift"
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || 'User avatar'}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <UserIcon className="w-4.5 h-4.5 laptop:w-4 laptop:h-4" />
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
