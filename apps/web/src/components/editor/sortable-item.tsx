"use client";

import Image from "next/image";
import { Trash2, GripVertical, Copy, Edit } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaItem } from "@/lib/store";
import { LayoutType } from "@/lib/layouts";

interface SortableItemProps {
    item: MediaItem;
    index: number;
    onDelete: () => void;
    onDuplicate: () => void;
    onEdit: () => void;
}

export function SortableItem({
    item,
    index,
    onDelete,
    onDuplicate,
    onEdit
}: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
    };

    const layoutType = (item.layout || 'single') as LayoutType;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-panel-bg p-2 laptop:p-1.5 mb-1 rounded border-l-4 border-brand-main flex items-center gap-3 laptop:gap-2 hover:shadow-md hover:border-brand-accent transition-all duration-200"
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 laptop:w-3.5 laptop:h-3.5 text-text-light" />
            </div>
            <div className="w-15 h-10 laptop:w-12.5 laptop:h-8.5 bg-[#eee] dark:bg-[#1a1a1a] rounded overflow-hidden shrink-0 flex items-center justify-center border border-border relative">
                {item.zones && item.zones.length > 0 ? (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-px bg-gray-900">
                        {item.zones.slice(0, 4).map((zone: any, idx: number) => (
                            <div key={idx} className="relative bg-black overflow-hidden w-full h-full">
                                {zone?.type === 'image' ? (
                                    <Image
                                        src={zone.url}
                                        alt={zone.name}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                        style={{ transform: `rotate(${zone.rotation || 0}deg)` }}
                                    />
                                ) : zone ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-[8px] text-white/70">
                                        ▶
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {item.type === "image" ? (
                            <Image
                                src={item.url}
                                alt={item.name}
                                fill
                                unoptimized
                                className="object-cover"
                                style={{ transform: `rotate(${item.rotation || 0}deg)` }}
                            />
                        ) : item.type === "video" ? (
                            <span className="text-xl text-text-light/50" style={{ transform: `rotate(${item.rotation || 0}deg)` }}>▶</span>
                        ) : item.type === "youtube" ? (
                            <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-[10px]">YT</div>
                        ) : null}
                    </>
                )}
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="text-sm laptop:text-xs font-semibold text-text-dark truncate">{item.name}</div>
                <div className="text-xs laptop:text-[10px] text-text-light">{item.duration}s • {item.rotation}° • {item.layout || 'single'}</div>
                {item.schedule.startDate && (
                    <span className="text-[0.7rem] bg-[#e0f2f1] dark:bg-[#00695c]/30 text-[#00695c] dark:text-[#4db6ac] px-1 rounded inline-block mt-0.5">
                        📅 {item.schedule.startDate}
                    </span>
                )}
            </div>
            <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit();
                    }}
                    type="button"
                    className="w-8 h-8 laptop:w-7 laptop:h-7 flex items-center justify-center rounded-lg text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Editar"
                >
                    <Edit className="w-4 h-4 laptop:w-3.5 laptop:h-3.5" />
                </button>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDuplicate();
                    }}
                    type="button"
                    className="w-8 h-8 laptop:w-7 laptop:h-7 flex items-center justify-center rounded-lg text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                    title="Duplicar"
                >
                    <Copy className="w-4 h-4 laptop:w-3.5 laptop:h-3.5" />
                </button>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete();
                    }}
                    type="button"
                    className="w-8 h-8 laptop:w-7 laptop:h-7 flex items-center justify-center rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Excluir"
                >
                    <Trash2 className="w-4 h-4 laptop:w-3.5 laptop:h-3.5" />
                </button>
            </div>
        </div>
    );
}
