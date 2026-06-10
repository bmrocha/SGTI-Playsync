'use client';

import { useEffect } from 'react';
import { DashboardKPIGrid } from '@/components/dashboard/dashboard-kpi-grid';
import { MediaDistributionChart } from '@/components/dashboard/charts/media-distribution-chart';
import { DateTimeWeatherWidget } from '@/components/dashboard/widgets/date-time-weather';
import { SystemActivityChart } from '@/components/dashboard/widgets/system-activity-chart';
import { StorageDetailsWidget } from '@/components/dashboard/widgets/storage-details-widget';
import { useAppStore } from '@/lib/store';

export default function DashboardPage() {
  const { fetchData } = useAppStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="py-2 laptop:py-3 desktop:py-4 px-3 sm:px-4 laptop:px-5 desktop:px-6 flex flex-col gap-2 laptop:gap-3 desktop:gap-4 w-full animate-fadeIn h-full overflow-auto">
      {/* Top Row: KPIs (Full Width) - Slightly smaller height */}
      <div className="w-full shrink-0">
        <DashboardKPIGrid />
      </div>

      {/* Main Content Grid - Optimized to avoid scroll */}
      <div className="grid grid-cols-12 gap-3 laptop:gap-4 desktop:gap-5 flex-1 min-h-0">
        {/* Left Column: Charts (8 cols) */}
        <div className="col-span-12 laptop:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 laptop:gap-4">
          <SystemActivityChart />
          <MediaDistributionChart />
        </div>

        {/* Right Column: Widgets (4 cols) */}
        <div className="col-span-12 laptop:col-span-4 flex flex-col gap-3 laptop:gap-4">
          {/* Weather & Time */}
          <div className="shrink-0">
            <DateTimeWeatherWidget />
          </div>

          {/* Storage */}
          <div className="flex-1 min-h-0">
            <StorageDetailsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
