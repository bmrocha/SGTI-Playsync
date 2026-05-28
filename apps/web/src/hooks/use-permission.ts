import { useAuthStore } from '@/lib/auth-store';
import { hasPermission, Permission, UserRole } from '@/lib/permissions';

export function usePermission() {
    const { user } = useAuthStore();

    const checkPermission = (permission: Permission) => {
        if (!user) return false;
        return hasPermission(user.role, permission);
    };

    const checkRole = (role: UserRole) => {
        if (!user) return false;
        return user.role === role;
    };

    const hasAny = (permissions: Permission[]) => {
        if (!user) return false;
        return permissions.some(p => hasPermission(user.role, p));
    };

    const hasAll = (permissions: Permission[]) => {
        if (!user) return false;
        return permissions.every(p => hasPermission(user.role, p));
    };

    return {
        can: checkPermission,
        is: checkRole,
        hasAny,
        hasAll,
        role: user?.role,
        user
    };
}
