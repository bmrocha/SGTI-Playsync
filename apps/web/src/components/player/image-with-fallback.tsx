"use client";

import { useState } from "react";
import { WebFrame } from './web-frame';

export function ImageWithFallback({ src, alt, rotation = 0, theme }: { src: string; alt: string; rotation?: number; theme: string }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return <WebFrame src={src} title={alt} rotation={rotation} theme={theme} />;
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(24px) brightness(0.8)',
                    transform: `scale(1.12) rotate(${rotation}deg)`,
                }}
            />
            <img
                src={src}
                alt={alt}
                className="relative z-10 w-full h-full object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
                loading="eager"
                onError={() => setFailed(true)}
                draggable={false}
            />
        </div>
    );
}
