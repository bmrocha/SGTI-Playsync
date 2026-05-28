"use client";

import { useState, useEffect } from "react";

export function ResponsiveHelper() {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return;

        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        setIsVisible(true);

        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    if (!isVisible || process.env.NODE_ENV === 'production') return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-white px-3 py-1 rounded-full text-xs font-mono border border-white/20 pointer-events-none">
            {dimensions.width}x{dimensions.height}
            <span className="ml-2 text-gray-400">
                {dimensions.width >= 1536 ? '2xl' :
                 dimensions.width >= 1280 ? 'xl' :
                 dimensions.width >= 1024 ? 'lg' :
                 dimensions.width >= 768 ? 'md' :
                 dimensions.width >= 640 ? 'sm' : 'xs'}
            </span>
        </div>
    );
}
