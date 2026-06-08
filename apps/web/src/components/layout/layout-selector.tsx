'use client';

import { LayoutType, LAYOUT_CONFIGS } from '@/lib/layouts';
import { useState, useEffect, useRef } from 'react';

interface LayoutSelectorProps {
  value: LayoutType;
  onChange: (layout: LayoutType) => void;
  playlistId?: string;
  allowedLayouts?: LayoutType[];
}

export function LayoutSelector({
  value,
  onChange,
  playlistId,
  allowedLayouts,
}: LayoutSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const layoutsToShow = allowedLayouts
    ? LAYOUT_CONFIGS.filter((l) => allowedLayouts.includes(l.id))
    : LAYOUT_CONFIGS;

  const selectedLayout =
    layoutsToShow.find((l) => l.id === value) || layoutsToShow[0] || LAYOUT_CONFIGS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking on file input or label
      if (target.tagName === 'INPUT' || target.tagName === 'LABEL') {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-bold text-text-light mb-1">📐 Layout de Exibição</label>

      {/* Selected Layout Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-border rounded-md bg-body-bg text-text-dark flex items-center justify-between hover:border-brand-main transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-brand-accent/10 rounded-lg border border-brand-accent/20">
            {(() => {
              const Icon = selectedLayout.icon;
              return <Icon className="w-6 h-6 text-brand-main" />;
            })()}
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm">{selectedLayout.name}</div>
            <div className="text-xs text-text-light">{selectedLayout.description}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="fixed z-[9999] w-64 mt-2 bg-card border border-border rounded-lg shadow-2xl max-h-60 overflow-y-auto animate-scaleIn"
          style={{
            top: dropdownRef.current?.getBoundingClientRect().bottom ?? 0,
            left: dropdownRef.current?.getBoundingClientRect().left ?? 0,
            width: dropdownRef.current?.getBoundingClientRect().width ?? 0,
          }}
        >
          {layoutsToShow.map((layout) => {
            const Icon = layout.icon;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => {
                  onChange(layout.id);
                  setIsOpen(false);
                }}
                className={`w-full p-3 flex items-center gap-3 hover:bg-brand-main/10 transition-colors border-b border-border last:border-b-0 ${
                  layout.id === value ? 'bg-brand-main/20' : ''
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center bg-brand-accent/10 rounded-lg border border-brand-accent/20">
                  <Icon className="w-6 h-6 text-brand-main" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm text-text-dark">{layout.name}</div>
                  <div className="text-xs text-text-light">{layout.description}</div>
                  <div className="text-xs text-brand-main mt-0.5">
                    {layout.slots} {layout.slots === 1 ? 'imagem' : 'imagens'}
                  </div>
                </div>
                {layout.id === value && (
                  <svg className="w-5 h-5 text-brand-main" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
