import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { hasPermission, UserRole, Permission } from '@/lib/permissions';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const ALL_PERMISSIONS = Object.values(Permission);

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).refine((perms) => {
    return perms.every((p) => ALL_PERMISSIONS.includes(p as Permission));
  }, 'Uma ou mais permissões são inválidas'),
});

// GET /api/users/[id]/permissions - Get user's custom permissions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (
      !hasPermission(currentUser.role as UserRole, Permission.MANAGE_USERS, currentUser.permissions)
    ) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const user = await UserRepository.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user permissions:');
    return NextResponse.json({ error: 'Erro ao buscar permissões' }, { status: 500 });
  }
}

// PUT /api/users/[id]/permissions - Update user's custom permissions
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (
      !hasPermission(currentUser.role as UserRole, Permission.MANAGE_USERS, currentUser.permissions)
    ) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const targetUser = await UserRepository.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Root protection
    if (targetUser.email === 'admin@sgti.tec.br' || targetUser.email === 'admin@sgti.com') {
      if (currentUser.email !== targetUser.email) {
        return NextResponse.json(
          { error: 'Segurança: Permissões do usuário Root não podem ser modificadas por outros.' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const result = updatePermissionsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 },
      );
    }

    const { permissions } = result.data;
    const updatedPermissions = await UserRepository.updatePermissions(id, permissions);

    await logServerAction({
      req: request,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'permissions_updated',
      resource: 'user',
      resourceId: id,
      resourceName: targetUser.name,
      details: `Atualizou permissões customizadas de "${targetUser.name}" (${permissions.length} permissões)`,
      metadata: { permissions, previousPermissions: targetUser.permissions || [] },
    });

    return NextResponse.json({
      userId: id,
      permissions: updatedPermissions,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating user permissions:');
    return NextResponse.json({ error: 'Erro ao atualizar permissões' }, { status: 500 });
  }
}
