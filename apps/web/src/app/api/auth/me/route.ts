import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { UserRepository } from '@playsync/database';
import { getSystemSettings } from '@/lib/system-settings';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Optional: Check if user still exists in DB
        const rawUser = await UserRepository.findById(payload.id as string);

        if (!rawUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const settings = await getSystemSettings();
        const shouldForceTwoFactorSetup = rawUser.force_2fa_setup && (settings.isTwoFactorEnforced !== false);

        const user = {
            id: rawUser.id,
            email: rawUser.email,
            name: rawUser.name,
            role: rawUser.role,
            companyId: rawUser.company_id,
            avatar: rawUser.avatar,
            createdAt: rawUser.created_at,
            lastLogin: rawUser.last_login,
            forcePasswordReset: rawUser.force_password_reset,
            two_factor_enabled: rawUser.two_factor_enabled,
            force_2fa_setup: shouldForceTwoFactorSetup,
            theme: rawUser.theme,
            primaryColor: rawUser.primary_color
        };

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
