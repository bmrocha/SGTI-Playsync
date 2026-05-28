"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

interface GeoResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country_code?: string;
    country?: string;
    admin1?: string; // State/Region often
}

export function LocationAutocomplete({ value, onChange, className, placeholder = "Ex: São Paulo, BR" }: LocationAutocompleteProps) {
    const { theme } = useThemeStore();
    const [query, setQuery] = useState(value || "");
    const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync query with value prop if value changes externally
    useEffect(() => {
        if (value && value !== query) {
            setQuery(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSuggestions]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    const fetchSuggestions = async (searchTerm: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/weather/geocode?name=${encodeURIComponent(searchTerm)}&count=5&language=pt&format=json`);
            const data = await res.json();

            if (data.results) {
                // Heuristic: Sort by population or prioritize local? The API usually sorts by relevance/population.
                // We'll trust the API but maybe move exact matches with country code to top?
                // For now, raw results are usually good.
                setSuggestions(data.results);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Geocoding fetch error:", error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: GeoResult) => {
        // Format: "City, State, CountryCode" or similar
        // e.g. "São Paulo, SP, BR"
        const parts = [item.name];
        if (item.admin1) parts.push(item.admin1);
        if (item.country_code) parts.push(item.country_code); // Prefer code "BR" over "Brazil" for brevity in widget display

        const newValue = parts.join(", ");
        setQuery(newValue);
        onChange(newValue);
        setShowSuggestions(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val); // Also update parent blindly so "manual" typing still works if API fails
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 2 && setSuggestions(prev => prev.length > 0 ? prev : [])} // Try to show if existing results
                    placeholder={placeholder}
                    className={cn(
                        "w-full px-4 py-3 pl-10 border rounded-xl text-sm font-bold focus:border-brand-main outline-none transition-all shadow-sm",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                    )}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-main" />
                    ) : (
                        <Search className={cn("w-4 h-4", theme === 'dark' ? "text-white/20" : "text-slate-400")} />
                    )}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className={cn(
                    "absolute z-[8000] left-0 mt-1 w-full rounded-xl border shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200",
                    theme === 'dark' ? "bg-[#0c1412] border-white/10" : "bg-white border-slate-100"
                )}>
                    {suggestions.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={cn(
                                "w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2",
                                theme === 'dark'
                                    ? "hover:bg-white/5 text-slate-300 border-b border-white/5 last:border-0"
                                    : "hover:bg-slate-50 text-slate-600 border-b border-slate-50 last:border-0"
                            )}
                        >
                            <MapPin className="w-3.5 h-3.5 opacity-50 shrink-0" />
                            <div className="flex flex-col leading-tight">
                                <span className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-800")}>{item.name}</span>
                                <span className="text-[10px] uppercase tracking-wide opacity-60">
                                    {[item.admin1, item.country].filter(Boolean).join(" • ")}
                                </span>
                            </div>
                            {item.country_code && (
                                <span className={cn(
                                    "ml-auto text-[9px] font-black px-1.5 py-0.5 rounded uppercase",
                                    theme === 'dark' ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-400"
                                )}>
                                    {item.country_code}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
