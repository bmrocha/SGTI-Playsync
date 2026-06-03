import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { CompanyRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';
import { hasPermission, UserRole, Permission } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const createCompanySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
  editorIds: z.array(z.string()).optional(),
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    let companyId: string | undefined = undefined;

    if (currentUser.role !== 'admin') {
      if (!currentUser.companyId) {
        // User without company (and not admin) should see nothing
        return NextResponse.json({
          companies: [],
          pagination: { total: 0, page, limit, pages: 0 },
        });
      }
      companyId = currentUser.companyId;
    }

    const { companies, total } = await CompanyRepository.findAll(companyId, page, limit, search);

    return NextResponse.json({
      companies,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching companies:');
    return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 });
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
        Permission.CREATE_COMPANY,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Sem permissão para criar empresa' }, { status: 403 });
    }

    const body = await request.json();
    const result = createCompanySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const company = await CompanyRepository.createWithEditors(
      { ...result.data, createdBy: currentUser.id },
      result.data.editorIds || [],
    );

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'CREATE',
      resource: 'company',
      details: `Empresa ${result.data.name} criada`,
      resourceId: company.id,
      resourceName: result.data.name,
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Error creating company:');
    return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 });
  }
}
