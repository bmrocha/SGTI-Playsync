import { 
    Maximize2, 
    Grid2x2, 
    Columns2, 
    Columns3, 
    Rows2, 
    Rows3, 
    PanelLeft, 
    PanelRight,
    LucideIcon 
} from 'lucide-react';

// Layout configuration types for multi-image display
export type LayoutType =
    | 'single'      // 1 image fullscreen
    | 'grid-2x2'    // 4 images in 2x2 grid
    | 'horizontal-2' // 2 images side by side
    | 'horizontal-3' // 3 images side by side
    | 'vertical-2'   // 2 images stacked
    | 'vertical-3'   // 3 images stacked
    | 'split-left'   // 1 large left + 2 small right
    | 'split-right'; // 1 large right + 2 small left

export interface LayoutConfig {
    id: LayoutType;
    name: string;
    description: string;
    slots: number; // How many images this layout can display
    icon: LucideIcon; // Icon component
}

export const LAYOUT_CONFIGS: LayoutConfig[] = [
    {
        id: 'single',
        name: 'Tela Cheia',
        description: 'Uma imagem por vez em tela cheia',
        slots: 1,
        icon: Maximize2
    },
    {
        id: 'grid-2x2',
        name: 'Grade 2x2',
        description: '4 imagens em grade',
        slots: 4,
        icon: Grid2x2
    },
    {
        id: 'horizontal-2',
        name: 'Horizontal 2',
        description: '2 imagens lado a lado',
        slots: 2,
        icon: Columns2
    },
    {
        id: 'horizontal-3',
        name: 'Horizontal 3',
        description: '3 imagens lado a lado',
        slots: 3,
        icon: Columns3
    },
    {
        id: 'vertical-2',
        name: 'Vertical 2',
        description: '2 imagens empilhadas',
        slots: 2,
        icon: Rows2
    },
    {
        id: 'vertical-3',
        name: 'Vertical 3',
        description: '3 imagens empilhadas',
        slots: 3,
        icon: Rows3
    },
    {
        id: 'split-left',
        name: 'Split Esquerda',
        description: '1 grande à esquerda + 2 pequenas à direita',
        slots: 3,
        icon: PanelLeft
    },
    {
        id: 'split-right',
        name: 'Split Direita',
        description: '1 grande à direita + 2 pequenas à esquerda',
        slots: 3,
        icon: PanelRight
    }
];

// Helper function to get layout config by ID
export function getLayoutConfig(layoutId: LayoutType): LayoutConfig | undefined {
    return LAYOUT_CONFIGS.find(config => config.id === layoutId);
}

// Helper function to get CSS grid template for layout
export function getLayoutGridTemplate(layoutId: LayoutType): string {
    switch (layoutId) {
        case 'single':
            return 'grid-template: 1fr / 1fr';
        case 'grid-2x2':
            return 'grid-template: 1fr 1fr / 1fr 1fr';
        case 'horizontal-2':
            return 'grid-template: 1fr / 1fr 1fr';
        case 'horizontal-3':
            return 'grid-template: 1fr / 1fr 1fr 1fr';
        case 'vertical-2':
            return 'grid-template: 1fr 1fr / 1fr';
        case 'vertical-3':
            return 'grid-template: 1fr 1fr 1fr / 1fr';
        case 'split-left':
            return 'grid-template: 1fr 1fr / 2fr 1fr';
        case 'split-right':
            return 'grid-template: 1fr 1fr / 1fr 2fr';
        default:
            return 'grid-template: 1fr / 1fr';
    }
}
