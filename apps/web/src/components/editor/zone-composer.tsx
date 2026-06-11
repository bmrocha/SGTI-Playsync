'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LayoutType, getLayoutConfig } from '@/lib/layouts';
import { MediaType } from '@/lib/store';
import { Upload, Link2, X, Plus, RotateCw } from 'lucide-react';
import { DropZone } from '@/components/upload/drop-zone';

interface ZoneComposerProps {
  layout: LayoutType;
  onZonesChange: (
    zones: Array<{
      id: string;
      type: MediaType;
      url: string;
      name: string;
      rotation?: number;
    } | null>,
  ) => void;
  initialZones?: Array<{
    id: string;
    type: MediaType;
    url: string;
    name: string;
    rotation?: number;
  } | null>;
}

type ZoneContent = {
  type: MediaType;
  url: string;
  name: string;
  rotation?: number;
  file?: File;
};

export function ZoneComposer({ layout, onZonesChange, initialZones = [] }: ZoneComposerProps) {
  const layoutConfig = getLayoutConfig(layout);
  // State to hold content for each zone
  // Key = index (0 to slots-1)
  const [zoneContents, setZoneContents] = useState<
    Record<number, { type: MediaType; url: string; name: string; rotation?: number; file?: File }>
  >({});
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);

  // Load initial zones when component mounts or initialZones changes
  useEffect(() => {
    if (initialZones && initialZones.length > 0) {
      const contents: Record<
        number,
        { type: MediaType; url: string; name: string; rotation?: number }
      > = {};
      initialZones.forEach((zone, index) => {
        if (zone) {
          // Skip null zones
          contents[index] = {
            type: zone.type,
            url: zone.url,
            name: zone.name,
            rotation: zone.rotation || 0,
          };
        }
      });
      setZoneContents(contents);
    }
  }, [initialZones]);

  // Helper to get grid classes (similar to FullscreenPlayer but for editing)
  const getGridClass = () => {
    switch (layout) {
      case 'grid-2x2':
        return 'grid-cols-2 grid-rows-2';
      case 'horizontal-2':
        return 'grid-cols-2 grid-rows-1';
      case 'horizontal-3':
        return 'grid-cols-3 grid-rows-1';
      case 'vertical-2':
        return 'grid-cols-1 grid-rows-2';
      case 'vertical-3':
        return 'grid-cols-1 grid-rows-3';
      case 'split-left':
        return 'grid-cols-[2fr_1fr] grid-rows-2';
      case 'split-right':
        return 'grid-cols-[1fr_2fr] grid-rows-2';
      default:
        return 'grid-cols-1 grid-rows-1';
    }
  };

  const slots = layoutConfig?.slots || 1;
  const slotIndices = Array.from({ length: slots }, (_, i) => i);

  const handleZoneUpdate = (index: number, content: ZoneContent) => {
    const newContents = { ...zoneContents, [index]: content };
    setZoneContents(newContents);
    setActiveZoneIndex(null);

    // Notify parent - preserve ALL zone positions (including empty ones as null)
    const zones: Array<{
      id: string;
      type: MediaType;
      url: string;
      name: string;
      rotation?: number;
    } | null> = slotIndices.map((i) => {
      const zoneContent = newContents[i];
      if (!zoneContent) return null;
      return {
        id: `zone-${i}`,
        type: zoneContent.type,
        url: zoneContent.url,
        name: zoneContent.name,
        rotation: zoneContent.rotation,
      };
    });
    onZonesChange(zones);
  };

  const handleFileSelect = (index: number, files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    const type = file.type.startsWith('image/') ? 'image' : 'video';
    const url = URL.createObjectURL(file);
    handleZoneUpdate(index, { type, url, name: file.name, file });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-text-light uppercase tracking-wider">
          Visualização de Zonas
        </span>
      </div>

      <div
        className={`w-full aspect-video bg-transparent rounded-lg overflow-hidden border border-border shadow-sm p-1 grid ${getGridClass()} gap-1 relative`}
      >
        {slotIndices.map((index) => {
          const content = zoneContents[index];

          // Split Styling Logic
          let splitClass = '';
          if (layout === 'split-left') {
            if (index === 0) splitClass = 'row-span-2 col-start-1';
            else splitClass = 'col-start-2';
          } else if (layout === 'split-right') {
            if (index === 0) splitClass = 'row-span-2 col-start-2';
            else splitClass = 'col-start-1';
          }

          return (
            <div
              key={index}
              onClick={() => setActiveZoneIndex(index)}
              className={`relative bg-panel-bg border flex flex-col items-center justify-center group overflow-hidden transition-all duration-200 min-w-0 min-h-0 cursor-pointer ${splitClass} ${activeZoneIndex === index ? 'border-brand-main ring-2 ring-brand-main shadow-md z-10' : 'border-border/50 hover:border-brand-main'}`}
            >
              {content ? (
                <>
                  {content.type === 'image' && (
                    <Image
                      src={content.url}
                      alt={content.name || 'Zone Content'}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ transform: `rotate(${content.rotation || 0}deg)` }}
                    />
                  )}
                  {content.type === 'video' && (
                    <video
                      src={content.url}
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={{ transform: `rotate(${content.rotation || 0}deg)` }}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}
                  {content.type === 'youtube' && (
                    <div className="w-full h-full pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube-nocookie.com/embed/${(() => {
                          const trimmed = (content.url || '').trim();
                          if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
                          const match = trimmed.match(
                            /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|shorts\/|live\/)([^"&?\/\s]{11})/,
                          );
                          return match ? match[1] : '';
                        })()}?autoplay=1&mute=1&controls=0&loop=1&playlist=${(() => {
                          const trimmed = (content.url || '').trim();
                          if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
                          const match = trimmed.match(
                            /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|shorts\/|live\/)([^"&?\/\s]{11})/,
                          );
                          return match ? match[1] : '';
                        })()}&playsinline=1&rel=0&modestbranding=1`}
                        title={content.name}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full object-cover"
                      ></iframe>
                    </div>
                  )}

                  {/* Hover Overlay to Edit/Delete */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-20">
                    <div className="flex gap-2">
                      <div className="relative">
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) handleFileSelect(index, files);
                          }}
                          accept="image/*,video/*"
                        />
                        <button
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white pointer-events-none"
                          title="Trocar Mídia"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Stop click from re-selecting zone
                          const currentRotation = content.rotation || 0;
                          const newRotation = (currentRotation + 90) % 360;
                          handleZoneUpdate(index, { ...content, rotation: newRotation });
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Rotacionar 90°"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Stop click from re-selecting zone
                          const newContents = { ...zoneContents };
                          delete newContents[index];
                          setZoneContents(newContents);

                          // Notify parent
                          const zones: Array<{
                            id: string;
                            type: MediaType;
                            url: string;
                            name: string;
                          } | null> = slotIndices.map((i) => {
                            const zoneContent = newContents[i];
                            if (!zoneContent) return null;
                            return {
                              id: `zone-${i}`,
                              type: zoneContent.type,
                              url: zoneContent.url,
                              name: zoneContent.name,
                            };
                          });
                          onZonesChange(zones);
                          setActiveZoneIndex(index); // Select the now empty zone
                        }}
                        className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white"
                        title="Remover"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                      Zona {index + 1}
                    </span>
                  </div>
                </>
              ) : (
                <DropZone
                  onFilesAccepted={(files) => handleFileSelect(index, files)}
                  multiple={false}
                  className="w-full h-full border-none bg-transparent hover:bg-brand-main/5 transition-colors"
                  activeClassName="border-brand-main bg-brand-main/10"
                  accept={{ 'image/*': [], 'video/*': [] }}
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-text-light group-hover:text-brand-main transition-colors h-full w-full">
                    <div className="p-3 bg-panel-bg rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="text-center px-2">
                      <span className="text-sm font-bold block mb-1">Adicionar Mídia</span>
                      <span className="text-[10px] opacity-70 block">Arraste ou Clique</span>
                    </div>
                    <span className="text-[10px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full mt-1">
                      Zona {index + 1}
                    </span>
                  </div>
                </DropZone>
              )}
            </div>
          );
        })}
      </div>

      {/* URL Input Section */}
      <div className="p-2 border-t border-border bg-white dark:bg-card relative">
        <div className="relative mb-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
            <span className="bg-panel-bg px-2 text-text-light text-[10px]">ou Link Externo</span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="w-8 h-8 flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-lg border border-border text-text-light">
            <Link2 className="w-4 h-4" />
          </div>

          {(() => {
            // Dynamic Placeholder and Button Text Logic
            const emptyZones = slotIndices.filter((i) => !zoneContents[i]);
            const isAllFull = emptyZones.length === 0;
            const singleEmptyZone = emptyZones.length === 1 ? emptyZones[0] : null;

            let placeholderText = 'URL interna, YouTube, Google Drive, site...';
            let buttonText = 'Adicionar';

            if (activeZoneIndex !== null) {
              placeholderText = `Cole o link para a Zona ${activeZoneIndex + 1}...`;
              buttonText = `Adicionar na Zona ${activeZoneIndex + 1}`;
            } else if (singleEmptyZone !== null) {
              placeholderText = `A única zona vazia é a ${singleEmptyZone + 1}. Colar link aqui?`;
              buttonText = `Add na Zona ${singleEmptyZone + 1}`;
            } else if (!isAllFull) {
              placeholderText = `Cole o link (vai para a primeira zona vazia: ${emptyZones[0] + 1})...`;
              buttonText = 'Adicionar Automático';
            } else {
              placeholderText = 'Zonas cheias. Selecione uma para substituir...';
              buttonText = 'Substituir';
            }

            return (
              <>
                <input
                  type="text"
                  placeholder={placeholderText}
                  className={`flex-1 h-8 px-3 bg-white dark:bg-black/20 border rounded-lg text-xs text-text-dark outline-none transition-all placeholder:text-gray-400 ${activeZoneIndex !== null ? 'border-brand-main ring-1 ring-brand-main/20' : 'border-border focus:border-brand-main focus:ring-1 focus:ring-brand-main'}`}
                  id="zone-url-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      const url = e.currentTarget.value;

                      // Determination Logic
                      let targetIndex = activeZoneIndex;

                      if (targetIndex === null) {
                        const emptyIndex = slotIndices.find((i) => !zoneContents[i]);
                        if (emptyIndex !== undefined) {
                          targetIndex = emptyIndex;
                        } else {
                          // Fallback: If full, maybe notify user to select?
                          // For now, let's not auto-overwrite unless imperative.
                          // Beeping/Visual feedback would be ideal but simple is better here.
                        }
                      }

                      if (targetIndex !== null && targetIndex !== undefined) {
                        const isYoutube = url.includes('youtube') || url.includes('youtu.be');
                        handleZoneUpdate(targetIndex, {
                          type: isYoutube ? 'youtube' : 'video',
                          url,
                          name: isYoutube ? 'YouTube Video' : 'URL Media',
                        });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('zone-url-input') as HTMLInputElement;
                    if (input && input.value) {
                      const url = input.value;
                      let targetIndex = activeZoneIndex;
                      if (targetIndex === null) {
                        const emptyIndex = slotIndices.find((i) => !zoneContents[i]);
                        if (emptyIndex !== undefined) targetIndex = emptyIndex;
                      }

                      if (targetIndex !== null && targetIndex !== undefined) {
                        const isYoutube = url.includes('youtube') || url.includes('youtu.be');
                        handleZoneUpdate(targetIndex, {
                          type: isYoutube ? 'youtube' : 'video',
                          url,
                          name: isYoutube ? 'YouTube Video' : 'URL Media',
                        });
                        input.value = '';
                      }
                    }
                  }}
                  className="h-8 px-3 bg-brand-main text-white rounded-lg text-xs font-bold hover:bg-brand-main/90 transition-colors shadow-sm whitespace-nowrap"
                >
                  {buttonText}
                </button>
              </>
            );
          })()}
        </div>

        <div className="flex justify-between items-center mt-1 h-4">
          {activeZoneIndex !== null ? (
            <p className="text-[10px] text-brand-main font-bold animate-pulse">
              Editando Zona {activeZoneIndex + 1}
            </p>
          ) : Object.keys(zoneContents).length === slots ? (
            <p className="text-[10px] text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
              <span>⚠️</span>
              <span>Para substituir, clique na zona desejada.</span>
            </p>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}
