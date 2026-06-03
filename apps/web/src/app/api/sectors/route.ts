import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { SectorRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';
import { hasPermission, UserRole, Permission } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const createSectorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  companyId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
});

const updateSectorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || undefined;

    // Non-admin users can only see sectors from their company
    let filterCompanyId: string | undefined = companyId;
    if (currentUser.role !== 'admin' && !filterCompanyId) {
      filterCompanyId = currentUser.companyId || undefined;
    }

    const sectors = await SectorRepository.findAll(filterCompanyId);
    return NextResponse.json({ sectors });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching sectors:');
    return NextResponse.json({ error: 'Erro ao buscar setores' }, { status: 500 });
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

    if (
      !hasPermission(
        currentUser.role as UserRole,
        Permission.MANAGE_SETTINGS,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const result = createSectorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const sector = await SectorRepository.create({
      name: result.data.name,
      company_id: result.data.companyId,
      description: result.data.description,
    });

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'CREATE',
      resource: 'sector',
      details: `Setor ${result.data.name} criado`,
      resourceId: sector.id,
      resourceName: result.data.name,
    });

    return NextResponse.json({ sector }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Error creating sector:');
    return NextResponse.json({ error: 'Erro ao criar setor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (
      !hasPermission(
        currentUser.role as UserRole,
        Permission.MANAGE_SETTINGS,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSectorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const sector = await SectorRepository.update(result.data.id, {
      name: result.data.name,
      description: result.data.description,
    });

    if (!sector) {
      return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 });
    }

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'UPDATE',
      resource: 'sector',
      details: `Setor ${sector.name} atualizado`,
      resourceId: sector.id,
      resourceName: sector.name,
    });

    return NextResponse.json({ sector });
  } catch (error) {
    logger.error({ err: error }, 'Error updating sector:');
    return NextResponse.json({ error: 'Erro ao atualizar setor' }, { status: 500 });
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
      !hasPermission(
        currentUser.role as UserRole,
        Permission.MANAGE_SETTINGS,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const sector = await SectorRepository.findById(id);
    const deleted = await SectorRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 });
    }

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'DELETE',
      resource: 'sector',
      details: `Setor ${sector?.name || id} removido`,
      resourceId: id,
      resourceName: sector?.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting sector:');
    return NextResponse.json({ error: 'Erro ao remover setor' }, { status: 500 });
  }
}
