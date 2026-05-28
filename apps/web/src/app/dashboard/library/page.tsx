"use client";

import { Library } from "lucide-react";
import { MediaGallery } from "@/components/media/media-gallery";

export default function LibraryPage() {
  return (
    <div className="p-6 laptop:p-4 max-w-[1600px] mx-auto space-y-6 laptop:space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-panel-bg p-4 rounded-xl border border-border shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl laptop:text-xl font-bold text-text-primary flex items-center gap-2">
            <Library className="w-8 h-8 laptop:w-6 laptop:h-6 text-brand-main" />
            Biblioteca de Mídia
          </h1>
          <p className="text-text-secondary mt-1 laptop:text-sm">Gerencie seus arquivos de mídia</p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <MediaGallery />
      </div>
    </div>
  );
}
