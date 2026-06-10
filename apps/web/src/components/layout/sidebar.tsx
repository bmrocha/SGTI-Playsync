'use client';
import Image from 'next/image';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Settings,
  Building2,
  Tv,
  TrendingUp,
  Users,
  Archive,
  ChevronsLeft,
  Monitor,
  Shield,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';
import { useUIStore } from '@/lib/ui-store';
import { useThemeStore } from '@/lib/theme-store';
import { useSystemStore } from '@/lib/system-store';
import { UserRole, Permission, hasPermission } from '@/lib/permissions';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { theme } = useThemeStore();
  const { systemName, logoSidebarUrl, showPlayersMenu } = useSystemStore();

  const navigation = [
    { name: 'Visão Geral', href: '/dashboard', icon: Home },
    {
      name: 'Empresas',
      href: '/dashboard/companies',
      icon: Building2,
      permission: Permission.VIEW_COMPANY,
    },
    {
      name: 'Setores',
      href: '/dashboard/sectors',
      icon: Layers,
      permission: Permission.MANAGE_SETTINGS,
    },
    {
      name: 'Playlists',
      href: '/dashboard/playlists',
      icon: Tv,
      permission: Permission.VIEW_PLAYLIST,
      aliases: ['/dashboard/editor'],
    },
    {
      name: 'Telas',
      href: '/dashboard/players',
      icon: Monitor,
      permission: Permission.VIEW_PLAYER,
      hidden: !showPlayersMenu,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
      permission: Permission.VIEW_ANALYTICS,
    },
    {
      name: 'Armazenamento',
      href: '/dashboard/storage',
      icon: Archive,
      permission: Permission.UPLOAD_MEDIA,
    },
    {
      name: 'Auditoria',
      href: '/dashboard/audit',
      icon: Shield,
      permission: Permission.VIEW_ACTIVITY_LOG,
    },
  ];

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r transition-all duration-300 shadow-2xl z-50 relative',
        isSidebarCollapsed
          ? 'w-[var(--sidebar-width-collapsed)]'
          : 'w-[var(--sidebar-width-expanded)]',
        theme === 'dark' ? 'backdrop-blur-md text-white' : 'text-slate-800',
      )}
      style={{
        background:
          theme === 'dark'
            ? `linear-gradient(180deg, var(--bg-main) 0%, rgba(0,0,0,0.92) 100%)`
            : `linear-gradient(180deg, #f8fafc 0%, #f0f4f8 50%, #e8edf2 100%)`,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header Section with Toggle */}
      <div
        className={cn(
          'flex shrink-0 items-center border-b mb-2 transition-all duration-300 relative sidebar-header',
          theme === 'dark' ? 'border-white/25' : 'border-slate-200',
          isSidebarCollapsed
            ? 'h-15 laptop:h-15 justify-center flex-col gap-1'
            : 'h-15 laptop:h-15 px-4 laptop:px-4',
        )}
      >
        {/* Logo Area */}
        <div
          className={cn('flex items-center gap-3', isSidebarCollapsed ? 'justify-center' : 'px-0')}
        >
          {logoSidebarUrl && (
            <Image
              src={logoSidebarUrl}
              alt="Logo"
              width={56}
              height={56}
              className={cn(
                'object-contain transition-all duration-500',
                isSidebarCollapsed
                  ? 'h-10 w-10 laptop:h-8 laptop:w-8'
                  : 'h-14 w-14 laptop:h-10 laptop:w-10',
              )}
              priority
            />
          )}

          {!isSidebarCollapsed && (
            <div className="flex items-center gap-0.5 translate-y-0.5">
              <span className="font-black tracking-tighter text-brand-accent leading-none drop-shadow-lg text-xl laptop:text-lg transition-all">
                {systemName === 'PlaySync'
                  ? 'Play'
                  : systemName
                    ? systemName.split(' ')[0]
                    : 'Play'}
              </span>
              <span
                className={`font-black tracking-tighter leading-none drop-shadow-lg text-xl laptop:text-lg transition-all ${
                  theme === 'dark' ? 'text-white/40' : 'text-slate-400'
                }`}
              >
                {systemName === 'PlaySync'
                  ? 'Sync'
                  : systemName && systemName.includes(' ')
                    ? systemName.split(' ').slice(1).join(' ')
                    : 'Sync'}
              </span>
            </div>
          )}

          {isSidebarCollapsed && !logoSidebarUrl && (
            <span
              className={`font-black tracking-tight text-xl ${
                theme === 'dark' ? 'text-brand-accent' : 'text-brand-main'
              }`}
            >
              {systemName ? systemName.charAt(0) : 'P'}
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation - Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 scrollbar-hide">
        <nav className="flex flex-col gap-1">
          {navigation
            .filter(
              (item) =>
                !item.permission || (user && hasPermission(user.role as UserRole, item.permission)),
            )
            .filter((item) => !item.hidden)
            .map((item) => {
              const isExactActive = pathname === item.href;
              const isSubRouteActive = item.href !== '/dashboard' && pathname.startsWith(item.href);
              const isAliasActive = item.aliases?.some((alias: string) =>
                pathname.startsWith(alias),
              );
              const isActive = isExactActive || isSubRouteActive || isAliasActive;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isSidebarCollapsed ? item.name : ''}
                  className={cn(
                    'group flex items-center rounded-xl transition-all duration-300 ease-out relative sidebar-item mb-1',
                    isSidebarCollapsed
                      ? 'justify-center p-3 laptop:p-2.5'
                      : 'gap-x-4 laptop:gap-x-3 p-3 laptop:p-2.5',
                    isActive
                      ? theme === 'dark'
                        ? 'bg-white/20 text-white font-black backdrop-blur-md shadow-[inset_4px_0_0_0_#d4ff00]'
                        : 'bg-brand-main/10 text-brand-main font-black shadow-[inset_4px_0_0_0_var(--bg-main)]'
                      : theme === 'dark'
                        ? 'text-white/85 hover:bg-white/10 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <item.icon
                    className={cn(
                      'shrink-0 transition-all duration-300',
                      isSidebarCollapsed
                        ? 'h-7 w-7 laptop:h-6 laptop:w-6'
                        : 'h-6 w-6 laptop:h-5 laptop:w-5',
                      isActive ? 'scale-110' : 'group-hover:scale-110',
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {!isSidebarCollapsed && (
                    <span className="whitespace-nowrap text-[15px] laptop:text-sm font-bold tracking-normal leading-none py-1">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div
        className={cn(
          'mt-auto shrink-0',
          theme === 'dark' ? 'border-t border-white/25' : 'border-t border-slate-200',
          isSidebarCollapsed ? 'p-2 space-y-2' : 'p-4 space-y-2',
        )}
      >
        {/* Admin Only Link */}
        {/* Admin Only Link */}
        {/* Admin Only Link */}
        {user && hasPermission(user.role as UserRole, Permission.VIEW_USERS) && (
          <Link
            href="/dashboard/users"
            title={isSidebarCollapsed ? 'Gestão de Usuários' : ''}
            className={cn(
              'group flex items-center rounded-xl transition-all duration-300 ease-out relative mb-1',
              isSidebarCollapsed
                ? 'justify-center p-3 laptop:p-2.5'
                : 'gap-x-4 laptop:gap-x-3 p-3 laptop:p-2.5',
              pathname.startsWith('/dashboard/users')
                ? theme === 'dark'
                  ? 'bg-white/20 text-white font-black shadow-[inset_4px_0_0_0_#d4ff00] backdrop-blur-md'
                  : 'bg-brand-main/10 text-brand-main font-black shadow-[inset_4px_0_0_0_var(--bg-main)]'
                : theme === 'dark'
                  ? 'text-white/85 hover:bg-white/10 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Users
              className={cn(
                'shrink-0 transition-all duration-300',
                isSidebarCollapsed
                  ? 'h-7 w-7 laptop:h-6 laptop:w-6'
                  : 'h-6 w-6 laptop:h-5 laptop:w-5',
                pathname.startsWith('/dashboard/users') ? 'scale-110' : 'group-hover:scale-110',
              )}
            />
            {!isSidebarCollapsed && (
              <span className="whitespace-nowrap text-[15px] laptop:text-sm font-bold tracking-normal leading-none py-1">
                Gestão de Usuários
              </span>
            )}
          </Link>
        )}

        {/* System Settings Link */}
        {user && hasPermission(user.role as UserRole, Permission.MANAGE_SETTINGS) && (
          <Link
            href="/dashboard/settings"
            title={isSidebarCollapsed ? 'Configurações do Sistema' : ''}
            className={cn(
              'group flex items-center rounded-xl transition-all duration-300 ease-out relative',
              isSidebarCollapsed
                ? 'justify-center p-3 laptop:p-2.5'
                : 'gap-x-4 laptop:gap-x-3 p-3 laptop:p-2.5',
              pathname.startsWith('/dashboard/settings')
                ? theme === 'dark'
                  ? 'bg-white/20 text-white font-black shadow-[inset_4px_0_0_0_#d4ff00] backdrop-blur-md'
                  : 'bg-brand-main/10 text-brand-main font-black shadow-[inset_4px_0_0_0_var(--bg-main)]'
                : theme === 'dark'
                  ? 'text-white/85 hover:bg-white/10 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Settings
              className={cn(
                'shrink-0 transition-all duration-300',
                isSidebarCollapsed
                  ? 'h-7 w-7 laptop:h-6 laptop:w-6'
                  : 'h-6 w-6 laptop:h-5 laptop:w-5',
                pathname.startsWith('/dashboard/settings') ? 'scale-110' : 'group-hover:scale-110',
              )}
            />
            {!isSidebarCollapsed && (
              <span className="whitespace-nowrap text-[15px] laptop:text-sm font-bold tracking-normal leading-none py-1">
                Configurações
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Toggle Button - Clean Premium Style */}
      {/* Toggle Button - Force Style via Inline to bypass Tailwind conflicts */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-4 top-4.5 z-10000 group sidebar-toggle',
          'h-8 w-8 rounded-full flex items-center justify-center cursor-pointer',
          'transition-all duration-500 ease-out hover:scale-110 active:scale-95',

          // LIGHT MODE
          'bg-white border border-slate-200 shadow-md text-slate-600 hover:text-brand-main',

          // DARK MODE (Elite Emerald Style)
          'dark:bg-[#0a1a17]/80 dark:backdrop-blur-md',
          'dark:border-brand-main dark:border-opacity-50',
          'dark:text-[#d4ff00] dark:hover:text-[#e5ff60]',
          'dark:shadow-[0_0_15px_rgba(17,135,109,0.3)] dark:hover:shadow-[0_0_20px_rgba(212,255,0,0.2)]',
        )}
        title={isSidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        data-hover="scale"
      >
        {isSidebarCollapsed ? (
          <ChevronsLeft className="w-4 h-4 rotate-180 transition-all duration-500 group-hover:translate-x-0.5" />
        ) : (
          <ChevronsLeft className="w-4 h-4 transition-all duration-500 group-hover:-translate-x-0.5" />
        )}
      </button>
    </div>
  );
}
