"use client";

import { LicenseStatusCard } from "@/components/settings/license-status-card";

export default function SettingsSistemaTab() {
    return (
        <div className="space-y-4 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
            <LicenseStatusCard />
            <div className="h-24 sm:h-32 w-full shrink-0" />
        </div>
    );
}
