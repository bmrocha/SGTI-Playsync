'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppStore, MediaItem } from '@/lib/store';
import { Play, Link2, ArrowLeft, Plus, Layout } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LinkGeneratorModal } from '@/components/modals/link-generator-modal';
import { LayoutSelector } from '@/components/layout/layout-selector';
import { LayoutPreviewCard } from '@/components/layout/layout-preview-card';
import { LAYOUT_TEMPLATES } from '@/lib/layout-templates';
import { LayoutType, LAYOUT_CONFIGS } from '@/lib/layouts';
import { useConfirm, ConfirmModal } from '@/components/modals/confirm-modal';
import { useAlert } from '@/components/modals/alert-modal';

import { SortableItem } from '@/components/editor/sortable-item';
import dynamic from 'next/dynamic';

const MediaConfigModal = dynamic(
  () =>
    import('@/components/modals/media-config-modal').then((m) => ({ default: m.MediaConfigModal })),
  { ssr: false },
);
const FullscreenPlayer = dynamic(
  () =>
    import('@/components/player/fullscreen-player').then((m) => ({ default: m.FullscreenPlayer })),
  { ssr: false },
);

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Support legacy URL (company/playlist names) for backward compat or just switch?
  // Given the major refactor, I'll switch to basic playlistId support.
  const playlistId = searchParams.get('playlistId') || '';

  const {
    playlists,
    addMediaItem,
    removeMediaItem,
    updateMediaItem,
    reorderMediaItems,
    duplicateMediaItem,
    fetchData,
  } = useAppStore();

  const { confirm, confirmProps } = useConfirm();
  const { success, error, alertElement } = useAlert();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Removed isSaved state logic as requested - saving is automatic/implicit
  // const [isSaved, setIsSaved] = useState(true);

  const playlist = playlists[playlistId];

  const [activeTab, setActiveTab] = useState<'content' | 'layouts' | 'schedule'>('content');

  useEffect(() => {
    if (playlistId && !playlist && !isLoadingData) {
      setIsLoadingData(true);
      fetchData().finally(() => setIsLoadingData(false));
    }
  }, [playlistId, playlist, fetchData, isLoadingData]);

  const companyName =
    playlist && playlist.companyNames.length > 0 ? playlist.companyNames[0] : 'Geral'; // Fallback for display/legacy
  const playlistName = playlist ? playlist.name : '';
  const companyId =
    playlist && playlist.companyIds && playlist.companyIds.length > 0
      ? playlist.companyIds[0]
      : undefined;

  // Form state
  const [layout, setLayout] = useState<LayoutType>('single');
  const [layoutTemplateId, setLayoutTemplateId] = useState<string>('');

  // Multi-zone Draft State (Legacy - removing usage in favor of modal, but keeping for safe migration if needed, actually removing logic)
  // const [zoneDraft, setZoneDraft] = ... REMOVED

  // Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const handleOpenAddParams = () => {
    setEditingItem(null);
    setIsConfigModalOpen(true);
  };

  const handleOpenEditParams = (item: MediaItem) => {
    setEditingItem(item);
    setIsConfigModalOpen(true);
  };

  const handleSaveItem = async (item: MediaItem) => {
    setIsLoadingData(true); // Re-using state for global loading if needed, or just let store handle it

    try {
      if (editingItem && item.type !== 'widget') {
        const index = items.findIndex((i) => i.id === editingItem.id);
        if (index !== -1) {
          await updateMediaItem(playlistId, index, item);
          success('Atualizado', 'Item atualizado com sucesso!');
        }
      } else {
        await addMediaItem(playlistId, item);
        if (item.type === 'widget') {
          success('Widget Adicionado', 'Widget adicionado à playlist!');
        } else {
          success('Adicionado', 'Novo slide adicionado!');
        }
      }
      setIsConfigModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('[EditorPage] Error saving item:', err);
      error('Erro ao Salvar', 'Não foi possível salvar a mídia no servidor.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAutoSaveItem = (item: MediaItem) => {
    if (!editingItem) return;

    const index = items.findIndex((i) => i.id === editingItem.id);
    if (index === -1) return;

    updateMediaItem(playlistId, index, item);
    setEditingItem(item);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (playlist) {
      setItems(playlist.items);
    }
  }, [playlist]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      reorderMediaItems(playlistId, oldIndex, newIndex);
    }
  };

  const handleDelete = (index: number) => {
    const itemName = items[index]?.name || 'este item';

    confirm({
      title: 'Remover Item',
      message: `Tem certeza que deseja remover "${itemName}"?`,
      type: 'danger',
      onConfirm: () => {
        removeMediaItem(playlistId, index);
      },
    });
  };

  // Apply current layout to ALL existing items
  const handleApplyLayoutToAll = () => {
    if (items.length === 0) return;
    const layoutName = LAYOUT_CONFIGS.find((l) => l.id === layout)?.name || layout;

    confirm({
      title: 'Aplicar Layout a Todos',
      message: `Deseja aplicar o layout "${layoutName}" a todos os ${items.length} itens da playlist?`,
      type: 'warning',
      onConfirm: () => {
        items.forEach((_, index) => {
          updateMediaItem(playlistId, index, { layout });
        });
        success('Layout Atualizado', 'Layout foi aplicado a todos os itens da playlist!');
      },
    });
  };

  const formatSchedule = (item: MediaItem) => {
    const s = item.schedule;
    if (!s || !s.enabled) return 'Sem agenda';

    const datePart =
      s.startDate || s.endDate
        ? `${s.startDate ? `De ${s.startDate}` : ''}${s.startDate && s.endDate ? ' ' : ''}${s.endDate ? `Até ${s.endDate}` : ''}`.trim()
        : 'Sem período';

    const timePart = s.allDay
      ? 'Dia inteiro'
      : `${s.startTime || '--:--'} - ${s.endTime || '--:--'}`;

    const daysPart =
      s.daysOfWeek && s.daysOfWeek.length > 0
        ? `Dias: ${s.daysOfWeek.join(', ')}`
        : 'Todos os dias';

    return `${datePart} • ${timePart} • ${daysPart}`;
  };

  if (!playlistId || !playlist) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-text-light py-10 border border-dashed border-border rounded-lg bg-panel-bg">
          Playlist não encontrada ou não selecionada.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-6 laptop:py-4 px-4 sm:px-6 lg:px-8">
        {/* Header Removed - Content Consolidated below */}

        {/* Main Content - Full Width */}
        <div className="flex flex-col gap-5 laptop:gap-4">
          {/* Toolbar / Playlist Header */}
          <div className="bg-panel-bg p-4 rounded-xl shadow-sm border border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Back Button Moved Here */}
              <button
                onClick={() => router.back()}
                className="bg-brand-main text-white p-2.5 rounded-lg hover:bg-brand-accent hover:text-black dark:hover:text-black transition-colors shadow-md group border border-brand-accent/20"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div className="h-10 w-px bg-border mx-1 hidden sm:block"></div>

              {/* Icon & Info */}
              <div className="w-12 h-12 bg-white dark:bg-card rounded-lg shadow-sm border border-border flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-main/10 group-hover:bg-brand-main/20 transition-colors"></div>
                <Layout className="w-6 h-6 text-brand-main group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-dark leading-tight">
                  {playlistName || 'Nova Playlist'}
                </h2>
                <p className="text-xs text-text-light flex items-center gap-2 mt-0.5">
                  <span className="font-medium bg-brand-main/5 px-2 py-0.5 rounded text-brand-main">
                    {items.filter((i) => i.type !== 'widget').length}{' '}
                    {items.filter((i) => i.type !== 'widget').length === 1 ? 'slide' : 'slides'}
                  </span>
                  <span className="opacity-50">•</span>
                  <span>
                    {items
                      .filter((i) => i.type !== 'widget')
                      .reduce((acc, i) => acc + i.duration, 0)}
                    s duração
                  </span>
                  {items.filter((i) => i.type === 'widget').length > 0 && (
                    <>
                      <span className="opacity-50">•</span>
                      <span className="font-medium bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-400">
                        {items.filter((i) => i.type === 'widget').length} widget
                        {items.filter((i) => i.type === 'widget').length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Slide Button */}
              <button
                onClick={handleOpenAddParams}
                className="btn-premium bg-brand-main text-white px-4 py-2 hover:brightness-110 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">ADICIONAR SLIDE</span>
                <span className="sm:hidden">ADD</span>
              </button>

              <div className="h-8 w-px bg-border mx-1"></div>

              {/* Actions Moved Here */}
              <button
                onClick={() => setIsLinkModalOpen(true)}
                disabled={items.length === 0}
                className="btn-premium bg-blue-500 text-white px-3 py-2 hover:bg-blue-600 transition-all hover:scale-105 shadow-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:grayscale"
                title="Gerar Link de Compartilhamento"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden xl:inline">LINK</span>
              </button>

              <button
                onClick={() => setIsPlayerOpen(true)}
                disabled={items.length === 0}
                className="btn-premium bg-orange-500 text-white px-3 py-2 hover:bg-orange-600 transition-all hover:scale-105 shadow-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:grayscale"
                title="Visualizar em Tela Cheia"
              >
                <Play className="w-4 h-4" />
                <span className="hidden xl:inline">TELA CHEIA</span>
              </button>
            </div>
          </div>

          <div className="bg-panel-bg rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="flex items-center gap-2 p-2 border-b border-border bg-body-bg/40">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeTab === 'content'
                    ? 'bg-brand-main text-white border-brand-main'
                    : 'bg-transparent text-text-light border-transparent hover:bg-border/40 hover:text-text-dark'
                }`}
              >
                Conteúdo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layouts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeTab === 'layouts'
                    ? 'bg-brand-main text-white border-brand-main'
                    : 'bg-transparent text-text-light border-transparent hover:bg-border/40 hover:text-text-dark'
                }`}
              >
                Layouts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-brand-main text-white border-brand-main'
                    : 'bg-transparent text-text-light border-transparent hover:bg-border/40 hover:text-text-dark'
                }`}
              >
                Agenda
              </button>
            </div>

            {activeTab === 'content' && (
              <div className="p-6">
                <div className="flex-1 bg-body-bg border border-border rounded-lg p-2 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar">
                  {items.length === 0 && (
                    <div className="text-center text-text-light py-20 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-border/30 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                        <Play className="w-10 h-10 opacity-20" />
                      </div>
                      <h3 className="text-lg font-bold opacity-70">Playlist Vazia</h3>
                      <p className="mb-6 opacity-50 max-w-sm">
                        Adicione slides para começar a construir sua playlist.
                      </p>
                      <button
                        onClick={handleOpenAddParams}
                        className="text-brand-main font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Criar primeiro slide
                      </button>
                    </div>
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={items.filter((item) => item.type !== 'widget').map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {items
                        .filter((item) => item.type !== 'widget')
                        .map((item, idx) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            index={idx}
                            onDelete={() => handleDelete(idx)}
                            onDuplicate={() => {
                              duplicateMediaItem(playlistId, idx);
                              success('Item Duplicado', 'O item foi duplicado com sucesso!');
                            }}
                            onEdit={() => handleOpenEditParams(item)}
                          />
                        ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}

            {activeTab === 'layouts' && (
              <div className="p-6 space-y-6">
                {/* Layouts Nativos */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-text-light mb-3">
                    Layouts Nativos
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <LayoutSelector value={layout} onChange={setLayout} />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleApplyLayoutToAll}
                        disabled={items.filter((i) => i.type !== 'widget').length === 0}
                        className="btn-premium bg-brand-accent text-black px-4 py-3 w-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aplicar a todos
                      </button>
                    </div>
                  </div>
                </div>

                {/* Templates Profissionais */}
                <div className="pt-6 border-t border-border">
                  <h3 className="text-xs font-bold uppercase text-text-light mb-4 flex items-center gap-2">
                    Templates Profissionais
                    <span className="text-[10px] font-normal normal-case text-brand-main bg-brand-main/10 px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {LAYOUT_TEMPLATES.map((template) => (
                      <LayoutPreviewCard
                        key={template.id}
                        template={template}
                        isSelected={layoutTemplateId === template.id}
                        onClick={() => {
                          setLayoutTemplateId(template.id);
                          setLayout('single');
                        }}
                        theme="dark"
                      />
                    ))}
                  </div>
                </div>

                {/* Playlist Items */}
                <div className="pt-6 border-t border-border">
                  <h3 className="text-xs font-bold uppercase text-text-light mb-3">
                    Slides da Playlist
                  </h3>
                  <div className="bg-body-bg border border-border rounded-lg p-2 max-h-[calc(100vh-520px)] overflow-y-auto custom-scrollbar">
                    {items
                      .filter((item) => item.type !== 'widget')
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-panel-bg p-3 rounded border border-border flex items-center justify-between gap-3 mb-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-text-dark truncate">
                              {item.name}
                            </div>
                            <div className="text-xs text-text-light truncate">
                              {item.layoutTemplateId
                                ? LAYOUT_TEMPLATES.find((t) => t.id === item.layoutTemplateId)?.name
                                : LAYOUT_CONFIGS.find((l) => l.id === (item.layout || 'single'))
                                    ?.name ||
                                  item.layout ||
                                  'single'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditParams(item)}
                            className="btn-premium bg-blue-600 text-white px-3 py-2 text-xs font-bold"
                          >
                            Editar
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="p-6">
                <div className="bg-body-bg border border-border rounded-lg p-2 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar">
                  {items.filter((item) => item.type !== 'widget').length === 0 && (
                    <div className="text-center text-text-light py-16">
                      Nenhum slide na playlist.
                    </div>
                  )}
                  {items
                    .filter((item) => item.type !== 'widget')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-panel-bg p-3 rounded border border-border flex items-center justify-between gap-3 mb-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-text-dark truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-text-light truncate">
                            {formatSchedule(item)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenEditParams(item)}
                          className="btn-premium bg-blue-600 text-white px-3 py-2 text-xs font-bold"
                        >
                          Editar
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveItem}
        onAutoSave={handleAutoSaveItem}
        initialItem={editingItem}
      />

      <FullscreenPlayer
        items={items}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        companyName={companyName}
        companyId={companyId}
        playlistName={playlistName}
        playlistId={playlistId}
      />

      <LinkGeneratorModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        items={items}
        playlistName={playlistName}
        companyName={companyName}
        playlistDbId={playlistId}
        companyId={companyId}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal {...confirmProps} />

      {/* Alert Modal */}
      {alertElement}
    </>
  );
}
