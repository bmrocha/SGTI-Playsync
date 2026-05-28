import { MediaItem } from "@/lib/store";

/**
 * Check if a media item should be displayed based on its schedule
 */
export function shouldDisplayMedia(item: MediaItem): boolean {
    // If scheduling is not enabled, always show
    if (!item.schedule.enabled) {
        return true;
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // YYYY-MM-DD local

    // Check day of week
    if (item.schedule.daysOfWeek.length > 0) {
        if (!item.schedule.daysOfWeek.includes(currentDay)) {
            return false;
        }
    }

    // Check date range
    if (item.schedule.startDate && currentDate < item.schedule.startDate) {
        return false;
    }
    if (item.schedule.endDate && currentDate > item.schedule.endDate) {
        return false;
    }

    // Check time range (if not all day)
    if (!item.schedule.allDay && item.schedule.startTime && item.schedule.endTime) {
        const [startHour, startMin] = item.schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = item.schedule.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        console.log(`[Scheduler] Checking item "${item.name}": Now=${currentTime} (${now.getHours()}:${now.getMinutes()}), Start=${startMinutes}, End=${endMinutes}`);

        // Handle overnight schedules (e.g., 22:00 - 02:00)
        if (startMinutes > endMinutes) {
            if (currentTime < startMinutes && currentTime > endMinutes) {
                console.log(`[Scheduler] BLOCKED: Outside overnight window`);
                return false;
            }
        } else {
            if (currentTime < startMinutes || currentTime > endMinutes) {
                console.log(`[Scheduler] BLOCKED: Outside regular window`);
                return false;
            }
        }
    }

    return true;
}

/**
 * Filter playlist items based on current schedule
 */
export function getScheduledItems(items: MediaItem[]): MediaItem[] {
    return items.filter(shouldDisplayMedia);
}

/**
 * Get a human-readable description of the schedule
 */
export function getScheduleDescription(item: MediaItem): string {
    if (!item.schedule.enabled) {
        return 'Sempre ativo';
    }

    const parts: string[] = [];

    // Days
    if (item.schedule.daysOfWeek.length > 0) {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const days = item.schedule.daysOfWeek.map(d => dayNames[d]).join(', ');
        parts.push(days);
    }

    // Time
    if (!item.schedule.allDay && item.schedule.startTime && item.schedule.endTime) {
        parts.push(`${item.schedule.startTime} - ${item.schedule.endTime}`);
    } else {
        parts.push('Todo dia');
    }

    // Date range
    if (item.schedule.startDate || item.schedule.endDate) {
        const start = item.schedule.startDate || '...';
        const end = item.schedule.endDate || '...';
        parts.push(`${start} até ${end}`);
    }

    return parts.join(' • ');
}
