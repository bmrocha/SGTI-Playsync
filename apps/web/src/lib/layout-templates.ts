import { WeatherConfig } from '@/components/widgets/weather-widget';
import { NewsTickerConfig } from '@/components/widgets/news-ticker-widget';
// Widget Config Types
export interface DateTimeWidgetConfig {
    format: '12h' | '24h';
    showDate: boolean;
    showTime: boolean;
    showSeconds: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    timezone?: string;
    theme?: 'light' | 'dark';
}

export interface MessageWidgetConfig {
    text: string;
    type: 'info' | 'warning' | 'campaign';
    display?: 'banner' | 'fullscreen' | 'overlay';
    animation?: 'fade' | 'slide' | 'bounce' | 'none';
    animationDuration?: number;
    backgroundColor?: string;
    textColor?: string;
    theme?: 'light' | 'dark';
    // Template specific fields
    displayMode?: 'static' | 'marquee' | 'scroll';
    fontSize?: number;
    fontWeight?: string;
}
import { CalendarWidgetConfig } from '@/components/widgets/calendar-widget';

// Layout Region Types
export type RegionType = 'sidebar' | 'content' | 'ticker' | 'header' | 'footer';
export type RegionWidgetType = 'weather' | 'clock' | 'news' | 'message' | 'media' | 'calendar' | 'none';

export interface LayoutRegion {
    id: string;
    type: RegionType;
    widgetType: RegionWidgetType;
    position: {
        x: number; // percentage
        y: number; // percentage
        width: number; // percentage
        height: number; // percentage
    };
    config?: WeatherConfig | NewsTickerConfig | DateTimeWidgetConfig | MessageWidgetConfig | CalendarWidgetConfig;
    zIndex?: number;
}

export interface LayoutTemplate {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    regions: LayoutRegion[];
}

export const DEFAULT_WEATHER_LOCATION = 'Sete Lagoas, Minas Gerais, BR';

const DEFAULT_TEMPLATES: LayoutTemplate[] = [
    {
        id: 'full-content',
        name: 'Tela Cheia',
        description: 'Apenas conteúdo (modo atual)',
        thumbnail: '/templates/full-content.svg',
        regions: [
            {
                id: 'content-1',
                type: 'content',
                widgetType: 'media',
                position: { x: 0, y: 0, width: 100, height: 100 },
                zIndex: 1,
            },
        ],
    },
    {
        id: 'professional',
        name: 'Profissional',
        description: 'Sidebar clima + Conteúdo + Ticker notícias',
        thumbnail: '/templates/professional.svg',
        regions: [
            {
                id: 'sidebar-1',
                type: 'sidebar',
                widgetType: 'weather',
                position: { x: 0, y: 10, width: 22, height: 35 },
                zIndex: 3,
                config: {
                    location: DEFAULT_WEATHER_LOCATION,
                    useApi: true,
                    forecastLayout: 'grid',
                    manualData: {
                        current: 27,
                        condition: 'cloudy',
                        forecast: [
                            { day: 'SEX', temp: 29, condition: 'sunny' },
                            { day: 'SÁB', temp: 25, condition: 'cloudy' },
                            { day: 'DOM', temp: 22, condition: 'rainy' },
                            { day: 'SEG', temp: 23, condition: 'cloudy' },
                            { day: 'TER', temp: 26, condition: 'sunny' },
                        ],
                    },
                } as WeatherConfig,
            },
            {
                id: 'sidebar-2',
                type: 'sidebar',
                widgetType: 'calendar',
                position: { x: 0, y: 45, width: 22, height: 45 },
                zIndex: 3,
                config: {
                    highlightToday: true,
                } as CalendarWidgetConfig,
            },
            {
                id: 'content-1',
                type: 'content',
                widgetType: 'media',
                position: { x: 22, y: 10, width: 78, height: 80 },
                zIndex: 1,
            },
            {
                id: 'ticker-1',
                type: 'ticker',
                widgetType: 'news',
                position: { x: 0, y: 90, width: 100, height: 10 },
                zIndex: 4,
                config: {
                    newsItems: [
                        'Expansão do Brics: bloco anuncia 6 novos membros',
                        'Mercado financeiro projeta inflação de 4,5% para 2024',
                        'Brasil registra recorde de exportações no primeiro semestre',
                    ],
                    speed: 50,
                    useRss: false,
                    density: 'compact',
                } as NewsTickerConfig,
            },
            {
                id: 'header-1',
                type: 'header',
                widgetType: 'message',
                position: { x: 0, y: 0, width: 100, height: 10 },
                zIndex: 5,
                config: {
                    text: 'SETEMBRO AMARELO | Mês de prevenção ao suicídio',
                    displayMode: 'static',
                    type: 'campaign',
                    fontSize: 24,
                    fontWeight: 'bold',
                } as MessageWidgetConfig,
            },
        ],
    },
    {
        id: 'news-focus',
        name: 'Foco em Notícias',
        description: 'Conteúdo + Ticker grande',
        thumbnail: '/templates/news-focus.svg',
        regions: [
            {
                id: 'content-1',
                type: 'content',
                widgetType: 'media',
                position: { x: 0, y: 0, width: 100, height: 88 },
                zIndex: 1,
            },
            {
                id: 'ticker-1',
                type: 'ticker',
                widgetType: 'news',
                position: { x: 0, y: 88, width: 100, height: 12 },
                zIndex: 4,
                config: {
                    newsItems: ['Notícia 1', 'Notícia 2', 'Notícia 3'],
                    speed: 50,
                    density: 'compact',
                } as NewsTickerConfig,
            },
        ],
    },
    {
        id: 'weather-focus',
        name: 'Foco em Clima',
        description: 'Sidebar grande + Conteúdo',
        thumbnail: '/templates/weather-focus.svg',
        regions: [
            {
                id: 'sidebar-1',
                type: 'sidebar',
                widgetType: 'weather',
                position: { x: 0, y: 0, width: 16, height: 100 },
                zIndex: 3,
                config: {
                    location: DEFAULT_WEATHER_LOCATION,
                    useApi: true,
                    manualData: {
                        current: 25,
                        condition: 'sunny',
                        forecast: [
                            { day: 'SEG', temp: 26, condition: 'sunny' },
                            { day: 'TER', temp: 28, condition: 'cloudy' },
                            { day: 'QUA', temp: 24, condition: 'rainy' },
                        ],
                    },
                } as WeatherConfig,
            },
            {
                id: 'content-1',
                type: 'content',
                widgetType: 'media',
                position: { x: 16, y: 0, width: 84, height: 100 },
                zIndex: 1,
            },
        ],
    },
    {
        id: 'tv-agencias',
        name: 'TV AGÊNCIAS',
        description: 'Avisos + Clima + Calendário + Conteúdo maior + Notícias',
        thumbnail: '/templates/professional.svg',
        regions: [
            {
                id: 'header-1',
                type: 'header',
                widgetType: 'message',
                position: { x: 0, y: 0, width: 100, height: 8 },
                zIndex: 5,
                config: {
                    text: 'AVISO | Atualizações e comunicados internos',
                    displayMode: 'static',
                    type: 'info',
                    fontSize: 22,
                    fontWeight: 'bold',
                } as MessageWidgetConfig,
            },
            {
                id: 'sidebar-1',
                type: 'sidebar',
                widgetType: 'weather',
                position: { x: 0, y: 8, width: 18, height: 32 },
                zIndex: 3,
                config: {
                    location: DEFAULT_WEATHER_LOCATION,
                    useApi: true,
                    manualData: {
                        current: 26,
                        condition: 'sunny',
                        forecast: [
                            { day: 'SEG', temp: 28, condition: 'sunny' },
                            { day: 'TER', temp: 27, condition: 'cloudy' },
                            { day: 'QUA', temp: 25, condition: 'rainy' },
                        ],
                    },
                } as WeatherConfig,
            },
            {
                id: 'sidebar-2',
                type: 'sidebar',
                widgetType: 'calendar',
                position: { x: 0, y: 40, width: 18, height: 52 },
                zIndex: 3,
                config: {
                    highlightToday: true,
                } as CalendarWidgetConfig,
            },
            {
                id: 'content-1',
                type: 'content',
                widgetType: 'media',
                position: { x: 18, y: 8, width: 82, height: 84 },
                zIndex: 1,
            },
            {
                id: 'ticker-1',
                type: 'ticker',
                widgetType: 'news',
                position: { x: 0, y: 92, width: 100, height: 8 },
                zIndex: 4,
                config: {
                    newsItems: ['Notícia 1', 'Notícia 2', 'Notícia 3'],
                    speed: 50,
                    density: 'compact',
                } as NewsTickerConfig,
            },
        ],
    },
];

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
    ...DEFAULT_TEMPLATES,
    {
        id: 'corporate-hub',
        name: 'Corporate Hub',
        description: 'Painel completo: Clima, Calendário, Relógio e Notícias',
        thumbnail: '/templates/corporate.svg', // Placeholder
        regions: [
            {
                id: 'sidebar-top',
                type: 'sidebar',
                widgetType: 'weather',
                position: { x: 0, y: 0, width: 22, height: 45 },
                zIndex: 3,
                config: { 
                    location: DEFAULT_WEATHER_LOCATION, 
                    useApi: true,
                    forecastLayout: 'grid',
                    manualData: {
                        current: 26,
                        condition: 'cloudy',
                        forecast: [
                            { day: 'SEG', temp: 28, condition: 'sunny' },
                            { day: 'TER', temp: 25, condition: 'rainy' },
                        ],
                    }
                } as WeatherConfig
            },
            {
                id: 'sidebar-mid',
                type: 'sidebar',
                widgetType: 'calendar',
                position: { x: 0, y: 45, width: 22, height: 40 },
                zIndex: 3,
                config: { highlightToday: true, carouselEnabled: true, carouselInterval: 15 } as CalendarWidgetConfig
            },
            {
                id: 'sidebar-bot',
                type: 'sidebar',
                widgetType: 'clock',
                position: { x: 0, y: 85, width: 22, height: 15 }, // Remaining height
                zIndex: 3,
                config: { format: '24h', showSeconds: true, showDate: true, showTime: true } as DateTimeWidgetConfig
            },
            {
                id: 'main-content',
                type: 'content',
                widgetType: 'media',
                position: { x: 22, y: 0, width: 78, height: 90 },
                zIndex: 1,
            },
            {
                id: 'footer-ticker',
                type: 'ticker',
                widgetType: 'news',
                position: { x: 22, y: 90, width: 78, height: 10 },
                zIndex: 4,
                config: {
                    useRss: false,
                    showClock: false,
                    density: 'compact',
                } as NewsTickerConfig
            },
        ],
    },
];

// Helper to get template by ID
export function getLayoutTemplate(id: string): LayoutTemplate | undefined {
    return LAYOUT_TEMPLATES.find((t) => t.id === id);
}

// Helper to get active template regions
export function getActiveTemplateRegions(templateId?: string): LayoutRegion[] {
    if (!templateId) {
        // Default to full-content
        return LAYOUT_TEMPLATES[0].regions;
    }
    const template = getLayoutTemplate(templateId);
    return template?.regions || LAYOUT_TEMPLATES[0].regions;
}
