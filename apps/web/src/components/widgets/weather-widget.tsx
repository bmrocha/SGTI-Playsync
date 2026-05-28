import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/lib/theme-store';

export interface WeatherConfig {
    location: string;
    apiKey?: string; // OpenWeatherMap API key
    useApi: boolean; // true = fetch from API, false = use manual data
    theme?: 'light' | 'dark';
    forecastLayout?: 'grid' | 'list';
    manualData?: {
        current: number;
        condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
        forecast: Array<{ day: string; temp: number; condition: string }>;
    };
}

interface WeatherWidgetProps {
    config: WeatherConfig;
    className?: string;
}

export function WeatherWidget({ config, className }: WeatherWidgetProps) {
    const { theme: systemTheme } = useThemeStore();
    const [weatherData, setWeatherData] = useState<any>(null);
    const [resolvedLocation, setResolvedLocation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Determine effective theme: config override or system default
    const effectiveTheme = config.theme || systemTheme;
    const isLight = effectiveTheme === 'light';

    useEffect(() => {
        // Priority:
        // 1. OpenWeatherMap (if apiKey + useApi is explicitly set)
        // 2. Open-Meteo (Free, No Key) - Default behavior for dynamic locations if useApi is true
        // 3. Manual Data (Fallback)

        if (config.useApi) {
            if (config.apiKey) {
                fetchOpenWeatherMap();
            } else if (config.location && config.location.length > 2) {
                // If we have a location name but no API key, use Open-Meteo (Free)
                fetchOpenMeteo();
            } else {
                // useApi is true but no location/key? Fallback.
                 setWeatherData({
                    current: config.manualData?.current ?? 28,
                    condition: config.manualData?.condition ?? 'sunny',
                    forecast: config.manualData?.forecast ?? [],
                });
            }
        } else {
            // Fallback to manual/mock data
            setWeatherData({
                current: config.manualData?.current ?? 28,
                condition: config.manualData?.condition ?? 'sunny',
                forecast: config.manualData?.forecast ?? [
                    { day: 'SEG', temp: 29, condition: 'sunny' },
                    { day: 'TER', temp: 27, condition: 'cloudy' },
                    { day: 'QUA', temp: 25, condition: 'rainy' },
                    { day: 'QUI', temp: 26, condition: 'cloudy' },
                    { day: 'SEX', temp: 28, condition: 'sunny' },
                ],
            });
        }
    }, [config.location, config.apiKey, config.useApi]);

    const fetchOpenWeatherMap = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${config.location}&appid=${config.apiKey}&units=metric&lang=pt_br`
            );

            if (!response.ok) throw new Error('OWM Failed');

            const data = await response.json();

            // Fetch 5-day forecast
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${config.location}&appid=${config.apiKey}&units=metric&lang=pt_br`
            );
            const forecastData = await forecastResponse.json();

            setWeatherData({
                current: Math.round(data.main.temp),
                condition: mapWeatherCondition(data.weather[0].main),
                forecast: processForecast(forecastData.list),
            });
        } catch (error) {
            console.warn('[WeatherWidget] OWM failed, trying Open-Meteo fallback...', error);
            fetchOpenMeteo();
        } finally {
            setLoading(false);
        }
    };

    const fetchOpenMeteo = async () => {
        setLoading(true);
        try {
            // 1. Geocoding - Clean the input to just the city name part if possible
            // Example: "São Paulo, SP, BR" -> "São Paulo"
            const searchTerm = config.location.split(',')[0].trim();

            const geoRes = await fetch(`/api/weather/geocode?name=${encodeURIComponent(searchTerm)}&count=10&language=pt&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Location not found');
            }

            // Enhance matching: try to match State/Region if present in the original input
            // e.g. input "Sete Lagoas, Minas Gerais, BR" -> search "Sete Lagoas" -> filter results for "Minas Gerais"
            const inputParts = config.location.split(',').map(p => p.trim().toLowerCase());
            const statePart = inputParts.length > 1 ? inputParts[1] : null;

            let bestMatch = geoData.results[0]; // Default to first

            // Priority 1: Match State Code or Name (e.g. "Minas Gerais" or "MG") AND Country "BR"
            if (statePart) {
                const stateMatch = geoData.results.find((r: any) =>
                    r.country_code === 'BR' &&
                    (r.admin1?.toLowerCase().includes(statePart) || r.admin1_code?.toLowerCase() === statePart)
                );
                if (stateMatch) bestMatch = stateMatch;
            }
            // Priority 2: Match Country "BR" Only
            else {
                const brMatch = geoData.results.find((r: any) => r.country_code === 'BR');
                if (brMatch) bestMatch = brMatch;
            }

            const targetCity = bestMatch;

            const { latitude, longitude, name, country, country_code } = targetCity;

            setResolvedLocation(`${name}, ${country_code || country}`);

            // 2. Weather
            const weatherRes = await fetch(
                `/api/weather/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max`
            );
            const weatherData = await weatherRes.json();

            if (weatherData.fallback) {
                throw new Error('Weather API unavailable');
            }

            setWeatherData({
                current: Math.round(weatherData.current.temperature_2m),
                condition: mapWmoCode(weatherData.current.weather_code),
                forecast: weatherData.daily.time.slice(1, 6).map((time: string, index: number) => ({
                    // Append T12:00 to ensure we are in the middle of the day to avoid timezone rollback
                    day: new Date(time + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
                    temp: Math.round(weatherData.daily.temperature_2m_max[index + 1]),
                    condition: mapWmoCode(weatherData.daily.weather_code[index + 1])
                }))
            });

        } catch (error) {
            console.error('[WeatherWidget] Open-Meteo failed:', error);
            // Fallback to manual if everything fails
            setWeatherData({
                current: 25,
                condition: 'cloudy',
                forecast: [
                    { day: 'SEG', temp: 29, condition: 'sunny' },
                    { day: 'TER', temp: 27, condition: 'cloudy' },
                    { day: 'QUA', temp: 25, condition: 'rainy' },
                    { day: 'QUI', temp: 26, condition: 'cloudy' },
                    { day: 'SEX', temp: 28, condition: 'sunny' },
                ]
            });
            setResolvedLocation(null);
        } finally {
            setLoading(false);
        }
    };

    const mapWmoCode = (code: number): string => {
        // WMO Weather interpretation codes (WW)
        if (code === 0) return 'sunny'; // Clear sky
        if (code === 1 || code === 2 || code === 3) return 'cloudy'; // Mainly clear, partly cloudy, overcast
        if (code >= 45 && code <= 48) return 'cloudy'; // Fog
        if (code >= 51 && code <= 67) return 'rainy'; // Drizzle / Rain
        if (code >= 71 && code <= 77) return 'snowy'; // Snow
        if (code >= 80 && code <= 82) return 'rainy'; // Rain showers
        if (code >= 85 && code <= 86) return 'snowy'; // Snow showers
        if (code >= 95) return 'windy'; // Thunderstorm
        return 'sunny';
    };

    const mapWeatherCondition = (condition: string) => {
        const map: { [key: string]: string } = {
            Clear: 'sunny',
            Clouds: 'cloudy',
            Rain: 'rainy',
            Snow: 'snowy',
            Wind: 'windy',
            Thunderstorm: 'windy',
            Drizzle: 'rainy',
            Mist: 'cloudy',
            Smoke: 'cloudy',
            Haze: 'cloudy',
            Dust: 'cloudy',
            Fog: 'cloudy',
            Sand: 'cloudy',
            Ash: 'cloudy',
            Squall: 'windy',
            Tornado: 'windy',
        };
        return map[condition] || 'cloudy';
    };

    const processForecast = (list: any[]) => {
        // Get one forecast per day (12:00 PM)
        const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
        const dailyForecasts = list
            .filter((item) => item.dt_txt.includes('12:00:00'))
            .slice(0, 5)
            .map((item) => {
                const date = new Date(item.dt * 1000);
                return {
                    day: days[date.getDay()],
                    temp: Math.round(item.main.temp),
                    condition: mapWeatherCondition(item.weather[0].main),
                };
            });
        return dailyForecasts;
    };

    const getWeatherIcon = (condition: string, customClass?: string) => {
        const iconClass = customClass || "w-16 h-16 transition-transform duration-500";
        switch (condition) {
            case 'sunny':
                return <Sun className={iconClass} />;
            case 'rainy':
                return <CloudRain className={iconClass} />;
            case 'snowy':
                return <CloudSnow className={iconClass} />;
            case 'windy':
                return <Wind className={iconClass} />;
            default:
                return <Cloud className={iconClass} />;
        }
    };

    const getConditionText = (condition: string) => {
        const map: { [key: string]: string } = {
            sunny: 'Ensolarado',
            cloudy: 'Nublado',
            rainy: 'Chuvoso',
            snowy: 'Nevando',
            windy: 'Ventando',
        };
        return map[condition] || 'Nublado';
    };

    if (loading) {
        return (
            <div className={cn('flex items-center justify-center h-full', className)}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-main"></div>
            </div>
        );
    }

    if (!weatherData) {
        return (
            <div className={cn('flex items-center justify-center h-full text-white/50', className)}>
                <p>Configurar clima</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative overflow-hidden p-6 flex flex-col justify-start gap-2 h-full transition-all duration-500 transform-gpu bg-transparent',
                (config.theme || 'dark') === 'light' ? "!text-slate-900" : "dark:!text-white",
                className
            )}
        >
            {/* CLEAN BACKGROUND FOR LIGHT MODE - REMOVED GRADIENT */}

            {/* Top Section - Grouped Info */}
            <div className="flex flex-col gap-2 relative z-10 flex-1 overflow-hidden">
                {/* Header - Location ONLY */}
                <div className="text-left border-l-[4px] border-brand-main pl-4 py-1 flex-shrink-0">
                    <p className="font-black text-2xl laptop:text-3xl tracking-tighter !text-slate-900 dark:!text-white uppercase italic leading-[1.0] break-words subpixel-antialiased">
                        {resolvedLocation || config.location}
                    </p>
                </div>

                {/* Current Weather - Centered in the middle */}
                <div className="flex-1 flex flex-col items-center justify-center gap-1 flex-shrink min-h-0 py-2">
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-brand-main opacity-90 scale-[1.1] transition-transform duration-700">
                            {getWeatherIcon(weatherData.condition, "w-14 h-14")}
                        </div>
                        <div className="flex items-baseline gap-1 group cursor-default">
                            <p className="text-6xl laptop:text-7xl font-black tracking-tighter tabular-nums leading-none !text-slate-900 dark:!text-white transition-all duration-500">
                                {weatherData.current}
                            </p>
                            <span className="text-2xl font-black text-brand-main italic -translate-y-8 select-none">°</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] !text-brand-main/90 leading-none mt-1">
                        {getConditionText(weatherData.condition)}
                    </p>
                </div>
            </div>

            {/* 5-Day Forecast - Adaptive Layout */}
            {weatherData.forecast && weatherData.forecast.length > 0 && (
                <div className={cn(
                    "relative z-10 border-t border-slate-200 dark:border-white/5 mt-auto",
                    config.forecastLayout === 'grid' ? "pt-4" : "pt-2 bg-white/50 dark:bg-black/5 rounded-t-2xl"
                )}>
                    {config.forecastLayout === 'grid' ? (
                        /* Horizontal Grid (Classic) */
                        <div className="grid grid-cols-5 gap-1 text-center py-2 px-1">
                            {weatherData.forecast.map((day: any, idx: number) => (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                    <p className="text-[10px] font-black !text-slate-500 dark:!text-white/40 uppercase tracking-widest leading-none">
                                        {day.day}
                                    </p>
                                    <div className="text-brand-main opacity-90">
                                        {getWeatherIcon(day.condition, "w-8 h-8")}
                                    </div>
                                    <p className="text-[12px] font-black !text-slate-900 dark:!text-white leading-none">
                                        {day.temp}°
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Vertical List (For narrow Sidebars) */
                        <div className="flex flex-col gap-1 p-1">
                            {weatherData.forecast.map((day: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-0.5 bg-white/40 dark:bg-white/5 rounded-lg transition-all duration-300">
                                    <p className="text-[10px] font-black !text-slate-500 dark:!text-white/40 uppercase tracking-widest w-10">
                                        {day.day}
                                    </p>
                                    <div className="text-brand-main opacity-90 scale-75">
                                        {getWeatherIcon(day.condition, "w-6 h-6")}
                                    </div>
                                    <p className="text-[13px] font-black !text-slate-900 dark:!text-white w-10 text-right">
                                        {day.temp}°
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
