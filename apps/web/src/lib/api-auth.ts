import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { hasPermission, UserRole, Permission } from '@/lib/permissions';

export type AuthenticatedRequest = NextRequest & {
  user: Awaited<ReturnType<typeof getCurrentUser>> & Record<string, unknown>;
};

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }
  return { user, response: null };
}

export async function requirePermission(request: NextRequest, permission: Permission) {
  const auth = await requireAuth(request);
  if (auth.response) return auth;

  if (!hasPermission(auth.user!.role as UserRole, permission, auth.user!.permissions)) {
    return {
      user: auth.user,
      response: NextResponse.json(
        { error: 'Acesso negado: permissão insuficiente' },
        { status: 403 },
      ),
    };
  }

  return { user: auth.user, response: null };
}

export async function requireAnyPermission(request: NextRequest, permissions: Permission[]) {
  const auth = await requireAuth(request);
  if (auth.response) return auth;

  const hasAny = permissions.some((p) =>
    hasPermission(auth.user!.role as UserRole, p, auth.user!.permissions),
  );

  if (!hasAny) {
    return {
      user: auth.user,
      response: NextResponse.json(
        { error: 'Acesso negado: permissão insuficiente' },
        { status: 403 },
      ),
    };
  }

  return { user: auth.user, response: null };
}

export async function requireAllPermissions(request: NextRequest, permissions: Permission[]) {
  const auth = await requireAuth(request);
  if (auth.response) return auth;

  const hasAll = permissions.every((p) =>
    hasPermission(auth.user!.role as UserRole, p, auth.user!.permissions),
  );

  if (!hasAll) {
    return {
      user: auth.user,
      response: NextResponse.json(
        { error: 'Acesso negado: permissão insuficiente' },
        { status: 403 },
      ),
    };
  }

  return { user: auth.user, response: null };
}
