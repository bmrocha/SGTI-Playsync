// ─────────────────────────────────────────────
// Enums / Literal Unions
// ─────────────────────────────────────────────

export type UserRole = "admin" | "editor" | "viewer" | "company_admin";

export type MediaType = "image" | "video" | "youtube" | "layout" | "widget" | "web";

export type PlayerStatus = "online" | "offline";

export type SessionStatus = "online" | "offline";

export type LayoutType =
  | "single"
  | "grid-2x2"
  | "horizontal-2"
  | "horizontal-3"
  | "vertical-2"
  | "vertical-3"
  | "split-left"
  | "split-right";

export type ActionType =
  | "login" | "logout" | "failed_login"
  | "user_created" | "user_updated" | "user_deleted" | "role_changed"
  | "company_created" | "company_updated" | "company_deleted"
  | "playlist_created" | "playlist_updated" | "playlist_deleted"
  | "media_uploaded" | "media_deleted" | "media_updated"
  | "settings_changed" | "export_performed";

export type NotificationType = "success" | "error" | "info" | "warning";

// ─────────────────────────────────────────────
// Entity types (canonical/shared)
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  companyId?: string | null;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  forcePasswordReset: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  force2faSetup?: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  theme?: string;
  primaryColor?: string;
}

export interface Player {
  id: string;
  name: string;
  token: string;
  companyId?: string | null;
  location?: string | null;
  status: PlayerStatus;
  lastSeen: string | null;
  metrics?: PlayerMetrics | null;
  currentPlaylistId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerMetrics {
  cpu: number;
  mem: number;
  disk: number;
  temperature?: number;
  uptime: number;
  display?: { width: number; height: number };
  latency?: number;
}

export interface MediaItem {
  id: string;
  playlistId?: string;
  type: MediaType;
  url: string;
  name: string;
  duration: number;
  rotation: number;
  layout?: LayoutType;
  layoutTemplateId?: string;
  regionConfig?: Record<string, unknown>;
  zones?: Array<{
    id: string;
    type: MediaType;
    url: string;
    name: string;
    rotation?: number;
  } | null>;
  schedule?: {
    startDate: string | null;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    daysOfWeek: number[];
    enabled: boolean;
  };
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  companies?: Array<{ id: string; name: string; color: string }>;
  items?: MediaItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  token?: string;
  device?: string | null;
  os?: string | null;
  ip?: string | null;
  lastSeen: string;
  createdAt: string;
  status?: SessionStatus;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: ActionType;
  resource: string;
  resourceId?: string | null;
  resourceName?: string | null;
  details: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
  ipAddress?: string | null;
}

export interface PlaylistLink {
  id: string;
  companyId: string;
  playlistId: string;
  theme: string;
  primaryColor: string | null;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybackLog {
  id: string;
  playerId?: string | null;
  mediaItemId?: string | null;
  playlistId?: string | null;
  companyId?: string | null;
  playedAt: string;
  durationPlayed: number;
  errorMessage?: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
