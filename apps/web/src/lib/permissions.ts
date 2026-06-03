// User Roles
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMPANY_ADMIN = 'company_admin',
}

// Permissions
export enum Permission {
  // User Management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // Company Management
  CREATE_COMPANY = 'create_company',
  EDIT_COMPANY = 'edit_company',
  DELETE_COMPANY = 'delete_company',
  VIEW_COMPANY = 'view_company',

  // Playlist Management
  CREATE_PLAYLIST = 'create_playlist',
  EDIT_PLAYLIST = 'edit_playlist',
  DELETE_PLAYLIST = 'delete_playlist',
  VIEW_PLAYLIST = 'view_playlist',

  // Media Management
  UPLOAD_MEDIA = 'upload_media',
  DELETE_MEDIA = 'delete_media',
  EDIT_MEDIA = 'edit_media',

  // Player Management
  CREATE_PLAYER = 'create_player',
  EDIT_PLAYER = 'edit_player',
  DELETE_PLAYER = 'delete_player',
  VIEW_PLAYER = 'view_player',

  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_ALL_ANALYTICS = 'view_all_analytics',

  // Activity Logs
  VIEW_ACTIVITY_LOG = 'view_activity_log',
  EXPORT_ACTIVITY_LOG = 'export_activity_log',

  // System
  MANAGE_SETTINGS = 'manage_settings',
}

// Role to Permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // All permissions
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.CREATE_COMPANY,
    Permission.EDIT_COMPANY,
    Permission.DELETE_COMPANY,
    Permission.VIEW_COMPANY,
    Permission.CREATE_PLAYLIST,
    Permission.EDIT_PLAYLIST,
    Permission.DELETE_PLAYLIST,
    Permission.VIEW_PLAYLIST,
    Permission.UPLOAD_MEDIA,
    Permission.DELETE_MEDIA,
    Permission.EDIT_MEDIA,
    Permission.CREATE_PLAYER,
    Permission.EDIT_PLAYER,
    Permission.DELETE_PLAYER,
    Permission.VIEW_PLAYER,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.VIEW_ACTIVITY_LOG,
    Permission.EXPORT_ACTIVITY_LOG,
    Permission.MANAGE_SETTINGS,
  ],
  [UserRole.COMPANY_ADMIN]: [
    // Company specific permissions
    Permission.VIEW_COMPANY,
    Permission.CREATE_PLAYLIST,
    Permission.EDIT_PLAYLIST,
    Permission.DELETE_PLAYLIST,
    Permission.VIEW_PLAYLIST,
    Permission.UPLOAD_MEDIA,
    Permission.DELETE_MEDIA,
    Permission.EDIT_MEDIA,
    Permission.CREATE_PLAYER,
    Permission.EDIT_PLAYER,
    Permission.DELETE_PLAYER,
    Permission.VIEW_PLAYER,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.EDITOR]: [
    // Content management only
    Permission.VIEW_COMPANY,
    Permission.CREATE_PLAYLIST,
    Permission.EDIT_PLAYLIST,
    Permission.DELETE_PLAYLIST,
    Permission.VIEW_PLAYLIST,
    Permission.UPLOAD_MEDIA,
    Permission.DELETE_MEDIA,
    Permission.EDIT_MEDIA,
    Permission.CREATE_PLAYER,
    Permission.EDIT_PLAYER,
    Permission.DELETE_PLAYER,
    Permission.VIEW_PLAYER,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.VIEWER]: [
    // Read-only
    Permission.VIEW_USERS,
    Permission.VIEW_COMPANY,
    Permission.VIEW_PLAYLIST,
    Permission.VIEW_PLAYER,
    Permission.VIEW_ANALYTICS,
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.COMPANY_ADMIN]: 'Admin. da Empresa',
  [UserRole.EDITOR]: 'Editor',
  [UserRole.VIEWER]: 'Visualizador',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '#ef4444', // red-500
  [UserRole.COMPANY_ADMIN]: '#3b82f6', // blue-500
  [UserRole.EDITOR]: '#a855f7', // purple-500
  [UserRole.VIEWER]: '#10b981', // emerald-500
};

// Permission checking functions
export function hasPermission(
  userRole: UserRole,
  permission: Permission,
  customPermissions?: string[],
): boolean {
  // If user has custom permissions set, use them as override
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions.includes(permission);
  }
  // Fallback to role-based permissions
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[],
  customPermissions?: string[],
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission, customPermissions));
}

export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[],
  customPermissions?: string[],
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission, customPermissions));
}

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Acesso total ao sistema, incluindo gerenciamento de usuários',
  [UserRole.COMPANY_ADMIN]: 'Gerenciamento completo da empresa vinculada',
  [UserRole.EDITOR]: 'Pode criar e editar conteúdo, mas não gerenciar usuários',
  [UserRole.VIEWER]: 'Apenas visualização, sem permissão para editar',
};
