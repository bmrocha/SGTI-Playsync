"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    autoPlay?: boolean;
}

export function VideoPlayer({ src, poster, autoPlay = false }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Format time (e.g., 65s -> 01:05)
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Toggle Play/Pause
    const togglePlay = useCallback(async () => {
        if (videoRef.current) {
            try {
                if (isPlaying) {
                    videoRef.current.pause();
                } else {
                    await videoRef.current.play();
                }
                // State update handled by event listeners
            } catch (error) {
                console.error("Playback error:", error);
            }
        }
    }, [isPlaying]);

    // Handle Video Progress
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Handle Video Metadata Loaded
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // Handle Play/Pause changes from video events (e.g. click on video)
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        };
    }, []);

    // Fullscreen Toggle
    const toggleFullscreen = () => {
        if (!playerRef.current) return;

        if (!document.fullscreenElement) {
            playerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Auto-hide controls
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const resetTimer = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (isPlaying) setShowControls(false);
            }, 3000);
        };

        const player = playerRef.current;
        if (player) {
            player.addEventListener('mousemove', resetTimer);
        }

        return () => {
            if (player) player.removeEventListener('mousemove', resetTimer);
            clearTimeout(timeout);
        };
    }, [isPlaying]);


    return (
        <div
            ref={playerRef}
            className="group relative w-full aspect-video bg-black overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10"
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                className="h-full w-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />

            {/* Overlay Gradient for Controls */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 pointer-events-none",
                    showControls ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Center Play Button (Big) */}
            {!isPlaying && (
                <button
                    onClick={togglePlay}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-110 transition-all duration-300 group/btn"
                >
                    <Play className="h-10 w-10 text-white fill-current translate-x-1" />
                </button>
            )}

            {/* Bottom Controls Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 px-4 pb-4 transition-all duration-300",
                    showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                )}
            >
                {/* Timeline */}
                <div className="group/timeline relative flex items-center h-4 cursor-pointer"
                    onClick={(e) => {
                        if (!videoRef.current) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        videoRef.current.currentTime = pos * duration;
                    }}
                >
                    <div className="w-full h-1 bg-white/30 rounded-full">
                        <div
                            className="h-full bg-blue-500 rounded-full relative"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/timeline:scale-100 transition-transform shadow-md" />
                        </div>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                            {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-white/80">
                                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setVolume(val);
                                    if (videoRef.current) videoRef.current.volume = val;
                                    setIsMuted(val === 0);
                                }}
                                className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                        </div>

                        <div className="text-xs text-neutral-300 font-medium font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleFullscreen} className="text-white hover:text-white/80">
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
