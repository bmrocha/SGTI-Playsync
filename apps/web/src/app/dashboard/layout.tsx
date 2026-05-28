
import { headers } from 'next/headers';
import { getSystemSettings } from '@/lib/system-settings';
import { getIpFromHeaders, isIpTrusted } from '@/lib/ip-utils';
import ClientLayout from './client-layout';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Get System Settings (DB Call)
    const settings = await getSystemSettings();
    const trustedIps = settings.trusted_ips || settings.restrictIP || '';

    // 2. Check IP restriction if configured
    if (trustedIps && trustedIps.trim().length > 0) {
        const headersList = await headers();
        const clientIp = getIpFromHeaders(headersList);
        
        const isAllowed = isIpTrusted(clientIp, trustedIps);

        if (!isAllowed) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-gray-950 text-white">
                    <div className="text-center space-y-4 max-w-md p-6 border border-red-900/50 bg-red-950/20 rounded-lg">
                        <h1 className="text-2xl font-bold text-red-500">Acesso Negado</h1>
                        <p className="text-gray-300">
                            Seu endereço IP ({clientIp}) não está autorizado a acessar este sistema.
                        </p>
                        <p className="text-sm text-gray-500">
                            Entre em contato com o administrador se acredita que isso é um erro.
                        </p>
                    </div>
                </div>
            );
        }
    }

    return (
        <ClientLayout>
            {children}
        </ClientLayout>
    );
}
