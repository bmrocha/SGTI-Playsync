"use client";

import { useState, useEffect, useRef } from "react";

export function VideoPlayer({
    url,
    isMuted,
    isPaused,
    rotation = 0,
    showControls
}: {
    url: string;
    isMuted: boolean;
    isPaused: boolean;
    rotation?: number;
    showControls: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const backgroundVideoRef = useRef<HTMLVideoElement>(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioIssue, setAudioIssue] = useState(false);

    useEffect(() => {
        const main = videoRef.current;
        const bg = backgroundVideoRef.current;
        if (!main) return;
        if (isPaused) {
            main.pause();
            bg?.pause();
        } else {
            main.play().catch(console.error);
            bg?.play().catch(() => {});
        }
    }, [isPaused]);

    useEffect(() => {
        setAudioIssue(false);
        if (isMuted || isPaused) return;
        const el = videoRef.current;
        if (!el) return;

        const timer = setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyEl = el as any;
            const audioTracksLen = typeof anyEl.audioTracks?.length === 'number' ? anyEl.audioTracks.length : null;
            const mozHasAudio = typeof anyEl.mozHasAudio === 'boolean' ? anyEl.mozHasAudio : null;
            const webkitAudioBytes = typeof anyEl.webkitAudioDecodedByteCount === 'number' ? anyEl.webkitAudioDecodedByteCount : null;

            const missingByTracks = audioTracksLen === 0;
            const missingByMoz = mozHasAudio === false;
            const missingByBytes = webkitAudioBytes === 0 && el.readyState >= 2;

            if (missingByTracks || missingByMoz || missingByBytes) {
                setAudioIssue(true);
            }
        }, 1800);

        return () => clearTimeout(timer);
    }, [url, isMuted, isPaused]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration);
            if (videoRef.current.duration > 0) {
                setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }
            const bg = backgroundVideoRef.current;
            if (bg && Math.abs(bg.currentTime - videoRef.current.currentTime) > 0.35) {
                bg.currentTime = videoRef.current.currentTime;
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const val = Number(e.target.value);
        if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            const time = (val / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            if (backgroundVideoRef.current) {
                backgroundVideoRef.current.currentTime = time;
            }
            setProgress(val);
        }
    };

    const skipTime = (seconds: number) => {
        if (videoRef.current) {
            const next = videoRef.current.currentTime + seconds;
            videoRef.current.currentTime = next;
            if (backgroundVideoRef.current) {
                backgroundVideoRef.current.currentTime = next;
            }
        }
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute inset-0 w-full h-full group">
            <video
                ref={backgroundVideoRef}
                src={url}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    filter: 'blur(24px) brightness(0.8)',
                    transform: `scale(1.12) rotate(${rotation}deg)`,
                }}
                aria-hidden="true"
            />
            <video
                ref={videoRef}
                src={url}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                className="relative z-10 w-full h-full object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
            />

            {audioIssue && (
                <div className="absolute top-4 left-4 z-110 bg-black/60 text-white/90 text-xs px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md pointer-events-none">
                    Áudio indisponível (verifique o arquivo/fonte)
                </div>
            )}

            {showControls && (
                <div
                    className="absolute bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-md z-100 flex flex-col gap-2 transition-all duration-300 opacity-100 translate-y-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-xs text-white/80 font-mono min-w-10 text-right">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-main [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                        />
                        <span className="text-xs text-white/50 font-mono min-w-10">{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-white/90">
                        <button
                            onClick={(e) => { e.stopPropagation(); skipTime(-10); }}
                            className="hover:bg-white/10 p-1.5 rounded-full transition-colors text-xs flex items-center gap-1"
                            title="Voltar 10s"
                        >
                            ⏪ -10s
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); skipTime(10); }}
                            className="hover:bg-white/10 p-1.5 rounded-full transition-colors text-xs flex items-center gap-1"
                            title="Avançar 10s"
                        >
                            +10s ⏩
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
