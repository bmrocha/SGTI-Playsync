'use client';

import { MediaGallery } from '@/components/media/media-gallery';

export default function LibraryPage() {
  return (
    <div className="p-6 laptop:p-4 max-w-400 mx-auto space-y-6 laptop:space-y-4 h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <MediaGallery />
      </div>
    </div>
  );
}
