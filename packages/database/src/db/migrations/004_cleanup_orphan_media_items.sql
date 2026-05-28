-- Remove media_items records that reference files not present in media_library
-- This only affects image/video types; youtube/web/widget/layout types are kept
DELETE FROM media_items mi
WHERE mi.type IN ('image', 'video')
  AND NOT EXISTS (
    SELECT 1 FROM media_library ml WHERE ml.url = mi.url
  );
