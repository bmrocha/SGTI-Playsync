import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { CompanyRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { hasPermission, Permission } from '@/lib/permissions';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const updateCompanySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').optional(),
    description: z.string().optional(),
    color: z.string().optional()
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as any, Permission.EDIT_COMPANY)) {
            return NextResponse.json({ error: 'Sem permissão para editar empresas' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const result = updateCompanySchema.safeParse(body);
        
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const updatedCompany = await CompanyRepository.update(id, result.data);
        
        if (!updatedCompany) {
            return NextResponse.json(
                { error: 'Empresa não encontrada' },
                { status: 404 }
            );
        }

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'UPDATE',
            resource: 'company',
            details: `Empresa ${updatedCompany.name} atualizada`,
            resourceId: id,
            resourceName: updatedCompany.name
        });

        return NextResponse.json({ company: updatedCompany });
    } catch (error) {
        logger.error({ err: error }, 'Error updating company:');
        return NextResponse.json(
            { error: 'Erro ao atualizar empresa' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as any, Permission.DELETE_COMPANY)) {
            return NextResponse.json({ error: 'Sem permissão para excluir empresas' }, { status: 403 });
        }

        const { id } = await params;
        await CompanyRepository.delete(id);

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'DELETE',
            resource: 'company',
            details: `Empresa ${id} removida`,
            resourceId: id
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ err: error }, 'Error deleting company:');
        return NextResponse.json(
            { error: 'Erro ao excluir empresa' },
            { status: 500 }
        );
    }
}
