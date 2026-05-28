/**
 * Utility for parsing User-Agent strings to detect device and OS info.
 * Provides consistent formatting for the Session Monitor.
 */

export interface DeviceInfo {
    device: string;
    os: string;
}

export function getDeviceInfo(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();

    let device = "Dispositivo Desconhecido";
    let os = "OS Desconhecido";

    // 1. Detect OS
    if (ua.includes("windows")) {
        os = "Windows";
    } else if (ua.includes("mac os") || ua.includes("macintosh")) {
        os = "macOS";
    } else if (ua.includes("android")) {
        os = "Android";
    } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
        os = "iOS";
    } else if (ua.includes("linux")) {
        os = "Linux";
    }

    // 2. Detect Device Type
    if (ua.includes("iphone")) {
        device = "iPhone";
    } else if (ua.includes("ipad")) {
        device = "iPad";
    } else if (ua.includes("android")) {
        device = ua.includes("mobile") ? "Smartphone Android" : "Tablet Android";
    } else if (ua.includes("macintosh")) {
        // We can't easily distinguish MacBook vs iMac via string, but MacBook is safer label for laptops
        device = "MacBook / iMac";
    } else if (ua.includes("windows")) {
        device = "Windows PC";
    } else if (ua.includes("linux")) {
        device = "Linux PC";
    }

    // 3. Fallback for common browsers on unidentified hardware
    if (device === "Dispositivo Desconhecido") {
        if (ua.includes("mobile")) {
            device = "Smartphone Genérico";
        } else {
            device = "Computador Desktop";
        }
    }

    return { device, os };
}
