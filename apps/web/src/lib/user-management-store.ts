import { generateUUID } from '@/lib/utils';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole } from './permissions';
import { User } from './auth-store';

interface UserManagementState {
    users: User[];

    // Actions
    addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => void;
    getUser: (id: string) => User | undefined;
    getUserByEmail: (email: string) => User | undefined;
    getAllUsers: () => User[];
    getUsersByRole: (role: UserRole) => User[];
}

export const useUserManagementStore = create<UserManagementState>()(
    persist(
        (set, get) => ({
            users: [
                {
                    id: '1',
                    email: 'admin@playsync.com',
                    name: 'Administrador PlaySync',
                    role: UserRole.ADMIN,
                    createdAt: new Date('2024-01-01'),
                },
                {
                    id: '2',
                    email: 'editor@playsync.com',
                    name: 'Editor PlaySync',
                    role: UserRole.EDITOR,
                    createdAt: new Date('2024-01-01'),
                },
                {
                    id: '3',
                    email: 'viewer@playsync.com',
                    name: 'Visualizador PlaySync',
                    role: UserRole.VIEWER,
                    createdAt: new Date('2024-01-01'),
                },
            ],

            addUser: (userData) => {
                const newUser: User = {
                    ...userData,
                    id: generateUUID(),
                    createdAt: new Date(),
                };

                set((state) => ({
                    users: [...state.users, newUser],
                }));
            },

            updateUser: (id, updates) => {
                // Root Protection: Cannot update the root user (id '1')
                if (id === '1') return;

                set((state) => ({
                    users: state.users.map((user) =>
                        user.id === id ? { ...user, ...updates } : user
                    ),
                }));
            },

            deleteUser: (id) => {
                // Root Protection: Cannot delete the root user (id '1')
                if (id === '1') return;

                set((state) => ({
                    users: state.users.filter((user) => user.id !== id),
                }));
            },

            getUser: (id) => {
                return get().users.find((user) => user.id === id);
            },

            getUserByEmail: (email) => {
                return get().users.find((user) => user.email === email);
            },

            getAllUsers: () => {
                return get().users;
            },

            getUsersByRole: (role) => {
                return get().users.filter((user) => user.role === role);
            },
        }),
        {
            name: 'playsync-user-management',
        }
    )
);
