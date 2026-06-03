import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { UserRepository, SectorRepository } from '@playsync/database';
import type { User } from '@playsync/database';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/server-auth';
import { logServerAction } from '@/lib/server-audit';
import { hasPermission, UserRole, Permission } from '@/lib/permissions';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const passwordValidation = z
  .string()
  .min(12, 'A senha deve ter pelo menos 12 caracteres')
  .refine((val) => /[A-Z]/.test(val), 'A senha deve conter pelo menos 1 letra maiúscula')
  .refine((val) => /[a-z]/.test(val), 'A senha deve conter pelo menos 1 letra minúscula')
  .refine((val) => /[0-9]/.test(val), 'A senha deve conter pelo menos 1 número')
  .refine((val) => /[^A-Za-z0-9]/.test(val), 'A senha deve conter pelo menos 1 caractere especial');

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordValidation,
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.nativeEnum(UserRole),
  forcePasswordReset: z.boolean().optional(),
  forceTwoFactorSetup: z.boolean().optional(),
});

const updateUserSchema = z.object({
  id: z.string().uuid('ID inválido'),
  email: z.string().email('Email inválido').optional(),
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  role: z.nativeEnum(UserRole).optional(),
  password: passwordValidation.optional(),
  avatar: z.string().nullable().optional(),
  forcePasswordReset: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  forceTwoFactorSetup: z.boolean().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  actorRole: z.string().optional(),
  theme: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
});

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;

    const companyId = currentUser.role === 'admin' ? undefined : currentUser.companyId || undefined;
    const { users: rawUsers, total } = await UserRepository.findAll(
      companyId,
      page,
      limit,
      search,
      role,
    );

    const users: Record<string, any>[] = rawUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.created_at,
      lastLogin: u.last_login,
      forcePasswordReset: u.force_password_reset,
      twoFactorEnabled: u.two_factor_enabled,
      forceTwoFactorSetup: u.force_2fa_setup,
      permissions: u.permissions || [],
      sectors: [] as { id: string; name: string }[],
    }));

    // Fetch sectors for each user
    for (const user of users) {
      const userSectors = await SectorRepository.getUserSectors(user.id);
      user.sectors = userSectors.map((s) => ({ id: s.id, name: s.name }));
    }

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching users:');
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const result = createUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password, name, role, forcePasswordReset, forceTwoFactorSetup } = result.data;

    if (
      !hasPermission(currentUser.role as UserRole, Permission.MANAGE_USERS, currentUser.permissions)
    ) {
      return NextResponse.json(
        { error: 'Acesso negado: Você não tem permissão para gerenciar usuários' },
        { status: 403 },
      );
    }

    const existingUser = await UserRepository.findByEmail(email.toLowerCase());

    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rawUser = await UserRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      force_password_reset: forcePasswordReset,
      force_2fa_setup: forceTwoFactorSetup,
    });

    const user = {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.name,
      role: rawUser.role,
      avatar: rawUser.avatar,
      createdAt: rawUser.created_at,
      lastLogin: rawUser.last_login,
      forcePasswordReset: rawUser.force_password_reset,
      forceTwoFactorSetup: rawUser.force_2fa_setup,
      permissions: rawUser.permissions || [],
    };

    await logServerAction({
      req: request,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'user_created',
      resource: 'user',
      resourceId: user.id,
      resourceName: user.name,
      details: `Criou usuário "${user.name}" (${user.email}) com função ${user.role}`,
      metadata: { newUserId: user.id, email: user.email, role: user.role },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Error creating user:');
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const result = updateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const {
      id,
      email,
      name,
      role,
      password,
      avatar,
      forcePasswordReset,
      twoFactorEnabled,
      forceTwoFactorSetup,
      theme,
      primaryColor,
    } = result.data;

    const isSelfUpdate = currentUser.id === id;
    const isAdmin = hasPermission(
      currentUser.role as UserRole,
      Permission.MANAGE_USERS,
      currentUser.permissions,
    );

    if (!isAdmin && !isSelfUpdate) {
      return NextResponse.json(
        { error: 'Acesso negado: Você não tem permissão para gerenciar outros usuários' },
        { status: 403 },
      );
    }

    if (isSelfUpdate && !isAdmin && role && role !== currentUser.role) {
      return NextResponse.json(
        { error: 'Segurança: Você não pode alterar seu próprio nível de acesso' },
        { status: 403 },
      );
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const originalUser = await UserRepository.findById(id);

    if (!originalUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Root Protection: Cannot update the root user unless it is the root user themselves
    if (originalUser.email === 'admin@sgti.tec.br' || originalUser.email === 'admin@sgti.com') {
      if (currentUser.email !== originalUser.email) {
        return NextResponse.json(
          {
            error:
              'Segurança do Sistema: O usuário Administrador (Root) não pode ser modificado por outros.',
          },
          { status: 403 },
        );
      }
    }

    const updateData: Partial<User> = {};
    if (email) updateData.email = email.toLowerCase();
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (forcePasswordReset !== undefined) updateData.force_password_reset = forcePasswordReset;
    if (forceTwoFactorSetup !== undefined) updateData.force_2fa_setup = forceTwoFactorSetup;
    if (theme !== undefined) updateData.theme = theme ?? undefined;
    if (primaryColor !== undefined) updateData.primary_color = primaryColor ?? undefined;

    if (twoFactorEnabled !== undefined) {
      if (isAdmin) {
        // Root Protection: Prevent disabling 2FA for root admin
        const isRootUser =
          originalUser.email === 'admin@sgti.tec.br' || originalUser.email === 'admin@sgti.com';
        if (isRootUser && twoFactorEnabled === false) {
          return NextResponse.json(
            {
              error:
                'Segurança: Não é permitido desativar a autenticação de dois fatores para o usuário Root.',
            },
            { status: 403 },
          );
        }

        updateData.two_factor_enabled = twoFactorEnabled;
        if (twoFactorEnabled === false) {
          updateData.two_factor_secret = null;
          updateData.force_2fa_setup = true;
          updateData.two_factor_temp_secret = null;
          updateData.two_factor_setup_expires = null;
        }
      } else {
        return NextResponse.json(
          { error: 'Acesso negado: Apenas administradores podem alterar configurações de 2FA' },
          { status: 403 },
        );
      }
    }

    let passwordChanged = false;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      passwordChanged = true;
    }

    const rawUser = await UserRepository.update(id, updateData);

    const user = {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.name,
      role: rawUser.role,
      avatar: rawUser.avatar,
      createdAt: rawUser.created_at,
      lastLogin: rawUser.last_login,
      forcePasswordReset: rawUser.force_password_reset,
      theme: rawUser.theme,
      primaryColor: rawUser.primary_color,
      permissions: rawUser.permissions || [],
    };

    // AUDIT LOGGING
    const auditPromises = [];
    const baseAuditParams = {
      req: request,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      resource: 'user',
      resourceId: user.id,
      resourceName: user.name,
    };

    if (passwordChanged) {
      auditPromises.push(
        logServerAction({
          ...baseAuditParams,
          action: 'user_updated',
          details: `Alterou a senha do usuário "${user.name}"`,
          metadata: { field: 'password' },
        }),
      );
    }

    if (role && role !== originalUser.role) {
      auditPromises.push(
        logServerAction({
          ...baseAuditParams,
          action: 'role_changed',
          details: `Alterou função de "${originalUser.role}" para "${role}"`,
          metadata: { oldRole: originalUser.role, newRole: role },
        }),
      );
    }

    if (
      forcePasswordReset !== undefined &&
      originalUser.force_password_reset !== forcePasswordReset
    ) {
      const actionDetail = forcePasswordReset ? 'Ativou' : 'Desativou';
      auditPromises.push(
        logServerAction({
          ...baseAuditParams,
          action: 'user_updated',
          details: `${actionDetail} troca obrigatória de senha para "${user.name}"`,
          metadata: { field: 'forcePasswordReset', value: forcePasswordReset },
        }),
      );
    }

    if (forceTwoFactorSetup !== undefined && originalUser.force_2fa_setup !== forceTwoFactorSetup) {
      const actionDetail = forceTwoFactorSetup ? 'Ativou' : 'Desativou';
      auditPromises.push(
        logServerAction({
          ...baseAuditParams,
          action: 'user_updated',
          details: `${actionDetail} configuração obrigatória de 2FA para "${user.name}"`,
          metadata: { field: 'forceTwoFactorSetup', value: forceTwoFactorSetup },
        }),
      );
    }

    if (twoFactorEnabled !== undefined && originalUser.two_factor_enabled !== twoFactorEnabled) {
      const actionDetail = twoFactorEnabled ? 'Ativou' : 'Desativou';
      auditPromises.push(
        logServerAction({
          ...baseAuditParams,
          action: 'user_updated',
          details: `${actionDetail} 2FA para usuário "${user.name}"`,
          metadata: { field: 'twoFactorEnabled', value: twoFactorEnabled },
        }),
      );
    }

    const otherChanges = [];
    if (name && name !== originalUser.name)
      otherChanges.push(`Nome: ${originalUser.name} -> ${name}`);
    if (email && email.toLowerCase() !== originalUser.email)
      otherChanges.push(`Email: ${originalUser.email} -> ${email}`);

    if (otherChanges.length > 0) {
      auditPromises.push(
        logServerAction({
          ...baseAuditParams,
          action: 'user_updated',
          details: `Atualizou dados de "${user.name}": ${otherChanges.join(', ')}`,
          metadata: { changes: otherChanges },
        }),
      );
    }

    await Promise.all(auditPromises);

    return NextResponse.json({ user });
  } catch (error) {
    logger.error({ err: error }, 'Error updating user:');
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (
      !hasPermission(currentUser.role as UserRole, Permission.MANAGE_USERS, currentUser.permissions)
    ) {
      return NextResponse.json(
        { error: 'Acesso negado: Você não tem permissão para excluir usuários' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id, actorId, actorName, actorRole } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta' },
        { status: 400 },
      );
    }

    const userToDelete = await UserRepository.findById(id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (userToDelete.email === 'admin@sgti.tec.br' || userToDelete.email === 'admin@sgti.com') {
      return NextResponse.json(
        { error: 'Segurança do Sistema: O usuário Administrador (Root) não pode ser excluído.' },
        { status: 403 },
      );
    }

    await UserRepository.delete(id);

    await logServerAction({
      req: request,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'user_deleted',
      resource: 'user',
      resourceId: id,
      resourceName: userToDelete.name,
      details: `Excluiu o usuário "${userToDelete.name}" (${userToDelete.email})`,
      metadata: { deletedUserId: id, email: userToDelete.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting user:');
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
