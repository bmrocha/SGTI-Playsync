"use client";

import { useEffect, useState, useRef } from "react";
import { CloudSun, Calendar, Clock, MapPin, Search, Loader2, CloudRain, CloudSnow, CloudLightning, Sun, Cloud, CloudFog, Moon, Laptop, CloudMoon } from "lucide-react";
import { notifySuccess } from "@/lib/notification-store";

interface WeatherData {
    temp: number;
    condition: string;
    code: number;
}

interface LocationData {
    name: string;
    lat: number;
    lon: number;
    admin1?: string; // State/Region
    country?: string;
}

export function DateTimeWeatherWidget() {
    const [date, setDate] = useState(new Date());
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Search state
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<LocationData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [themeOverride, setThemeOverride] = useState<'system' | 'light' | 'dark'>('system');

    // ... existing hooks ...
    // Weather codes mapping to conditions and icons
    const getWeatherInfo = (code: number, isNight: boolean = false) => {
        if (code === 0) return { condition: "Céu Limpo", icon: isNight ? Moon : Sun };
        if (code >= 1 && code <= 3) return { condition: "Parcialmente Nublado", icon: isNight ? CloudMoon : CloudSun };
        if (code >= 45 && code <= 48) return { condition: "Nevoeiro", icon: CloudFog };
        if (code >= 51 && code <= 67) return { condition: "Chuva Fraca", icon: CloudRain };
        if (code >= 71 && code <= 77) return { condition: "Neve", icon: CloudSnow };
        if (code >= 80 && code <= 82) return { condition: "Chuva Forte", icon: CloudRain };
        if (code >= 85 && code <= 86) return { condition: "Neve Forte", icon: CloudSnow };
        if (code >= 95 && code <= 99) return { condition: "Tempestade", icon: CloudLightning };
        return { condition: "Desconhecido", icon: Cloud };
    };

    // Load saved location on mount
    useEffect(() => {
        const saved = localStorage.getItem('weather_location');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validate parsed data
                if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
                    setLocation(parsed);
                } else {
                    throw new Error("Invalid location format");
                }
            } catch (e) {
                // Default to Sete Lagoas (based on user's image search)
                setLocation({ name: "Sete Lagoas", lat: -19.46, lon: -44.24 });
            }
        } else {
            // Default: Sete Lagoas
            setLocation({ name: "Sete Lagoas", lat: -19.46, lon: -44.24 });
        }

        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch weather when location changes
    useEffect(() => {
        if (!location) return;

        const fetchWeather = async () => {
            if (!location?.lat || !location?.lon) return;

            setIsLoading(true);
            try {
                // Use window.fetch for explicit client-side call
                const res = await window.fetch(
                    `/api/weather/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,weather_code`
                );

                const data = await res.json();
                if (data.fallback) throw new Error('Clima API error');

                const current = data.current;

                const isNightTime = new Date().getHours() >= 18 || new Date().getHours() < 6;
                const info = getWeatherInfo(current.weather_code, isNightTime);

                setWeather({
                    temp: Math.round(current.temperature_2m),
                    condition: info.condition,
                    code: current.weather_code
                });
            } catch (error) {
                console.error("Weather fetch error:", error);
                // Keep previous data if available or show error state implicitly
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
        // Refresh every 30 mins
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [location]);

    // Handle city search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Clean search query for Open-Meteo (remove state/country if present)
                const cleanQuery = searchQuery.split(',')[0].trim();
                const res = await fetch(
                    `/api/weather/geocode?name=${encodeURIComponent(cleanQuery)}&count=5&language=pt&format=json`
                );
                const data = await res.json();

                if (data.results) {
                    setSearchResults(data.results.map((r: any) => ({
                        name: r.name,
                        lat: r.latitude,
                        lon: r.longitude,
                        admin1: r.admin1,
                        country: r.country
                    })));
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // Debounce 500ms

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    const handleSelectLocation = (loc: LocationData) => {
        setLocation(loc);
        localStorage.setItem('weather_location', JSON.stringify(loc));
        setIsEditing(false);
        setSearchQuery("");
        setSearchResults([]);
        notifySuccess(`Localização atualizada para ${loc.name}`, "O clima será exibido para esta região");
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }).format(date);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const isNight = date.getHours() >= 18 || date.getHours() < 6;
    const WeatherIcon = weather ? getWeatherInfo(weather.code, isNight).icon : Cloud;

    const getWeatherColor = (code: number) => {
        if (code === 0) return "text-yellow-500 dark:text-yellow-400"; // Limpo
        if (code >= 1 && code <= 3) return "text-yellow-600 dark:text-yellow-300"; // Nublado
        if (code >= 45 && code <= 48) return "text-slate-500 dark:text-slate-400"; // Nevoeiro
        if (code >= 51 && code <= 67) return "text-blue-500 dark:text-blue-400"; // Chuva
        if (code >= 71 && code <= 77) return "text-cyan-500 dark:text-cyan-400"; // Neve
        if (code >= 80 && code <= 99) return "text-indigo-500 dark:text-indigo-400"; // Tempestade
        return "text-gray-500 dark:text-gray-400";
    };

    const toggleTheme = (e: React.MouseEvent) => {
        e.stopPropagation();
        setThemeOverride(prev => {
            if (prev === 'system') return 'light';
            if (prev === 'light') return 'dark';
            return 'system';
        });
    };

    const themeClass = themeOverride === 'system' ? '' : themeOverride;

    return (
        <div className={`bg-panel-bg p-4 rounded-2xl shadow-sm border border-border flex flex-col justify-between h-full relative overflow-hidden group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${themeClass}`}>
            {/* Background Decoration - Increased Opacity for Visibility */}
            <div className="absolute -top-10 -right-10 p-8 opacity-10 dark:opacity-[0.15] text-brand-main group-hover:scale-110 group-hover:opacity-20 transition-all duration-700 pointer-events-none">
                <WeatherIcon className="w-28 h-28 laptop:w-32 laptop:h-32" />
            </div>

            {/* Time Section */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-text-light mb-1 text-xs laptop:text-sm uppercase tracking-wider font-bold">
                    <Clock className="w-3 h-3 laptop:w-4 laptop:h-4" />
                    <span>Tempo Real</span>
                </div>
                {/* ... (Time display remains) */}
                <div className="text-4xl laptop:text-5xl font-bold text-text-dark tabular-nums tracking-tight">
                    {formatTime(date)}
                </div>
                <div className="text-text-light capitalize mt-1 flex items-center gap-2 text-xs laptop:text-sm">
                    <Calendar className="w-3 h-3 laptop:w-4 laptop:h-4" />
                    {formatDate(date)}
                </div>
            </div>

            {/* Weather Section (Bottom) */}
            <div className="relative z-10 mt-1 pt-2 laptop:mt-3 laptop:pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        {isLoading && !weather ? (
                            <div className="flex items-center gap-2 text-text-light">
                                <Loader2 className="w-4 h-4 laptop:w-5 laptop:h-5 animate-spin" />
                                <span className="text-xs laptop:text-sm">Carregando clima...</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl laptop:text-3xl font-bold text-text-dark flex items-center gap-2">
                                    {weather?.temp}°C
                                    <WeatherIcon className={`w-6 h-6 laptop:w-8 laptop:h-8 ${weather ? getWeatherColor(weather.code) : 'text-gray-400'}`} />
                                </div>
                                <div className="text-xs laptop:text-sm text-text-light">
                                    {weather?.condition}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-right relative">
                        {isEditing ? (
                            <div className="absolute bottom-0 right-0 w-64 bg-panel-bg shadow-xl rounded-lg border border-border z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                                    <Search className="w-4 h-4 text-text-light" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Buscar cidade..."
                                        className="w-full bg-transparent outline-none text-sm text-text-dark placeholder:text-text-light/50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {isSearching && <Loader2 className="w-3 h-3 animate-spin text-brand-main" />}
                                </div>

                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {searchResults.length > 0 ? (
                                        searchResults.map((result, idx) => (
                                            <button
                                                key={`${result.lat}-${result.lon}-${idx}`}
                                                onClick={() => handleSelectLocation(result)}
                                                className="w-full text-left px-2 py-1.5 hover:bg-brand-main/10 rounded text-xs text-text-dark transition-colors truncate"
                                                title={`${result.name}, ${result.admin1}, ${result.country}`}
                                            >
                                                <span className="font-bold">{result.name}</span>
                                                <span className="text-text-light ml-1">
                                                    {result.admin1 && `- ${result.admin1}`}
                                                    {result.country && `, ${result.country}`}
                                                </span>
                                            </button>
                                        ))
                                    ) : searchQuery.length >= 3 && !isSearching ? (
                                        <p className="text-xs text-text-light text-center py-2">Nenhuma cidade encontrada</p>
                                    ) : (
                                        <p className="text-xs text-text-light text-center py-2">Digite sua cidade</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSearchQuery("");
                                    }}
                                    className="w-full mt-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-1 rounded transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="group/loc flex items-center justify-end gap-2 text-xs font-bold uppercase text-brand-main bg-brand-main/10 hover:bg-brand-main/20 px-3 py-1.5 rounded-lg transition-all active:scale-95 border border-transparent hover:border-brand-main/30 ml-auto"
                                title="Clique para alterar a cidade"
                            >
                                <div className="flex flex-col items-end leading-tight">
                                    <span className="max-w-[140px] truncate text-right">{location?.name || "Definir Local"}</span>
                                    <span className="text-[10px] opacity-70 underline decoration-dashed underline-offset-2 font-normal">Alterar cidade</span>
                                </div>
                                <MapPin className="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
