"use client";

import { MediaManager } from "@/components/admin/media/MediaManager";
import type { MediaItem } from "@/types/media";
import { useEffect, useState } from "react";

export function ProductMediaSection({
  productId,
  initialItems,
  draftItems,
  onDraftItemsChange,
  onUploadingChange,
}: {
  productId?: number;
  initialItems?: MediaItem[];
  draftItems?: MediaItem[];
  onDraftItemsChange?: (next: MediaItem[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    // If we have productId (Edit mode), we initialize with initialItems.
    // If not (New mode), we initialize with draftItems.
    if (productId) {
      setItems(Array.isArray(initialItems) ? initialItems : []);
    } else {
      setItems(Array.isArray(draftItems) ? draftItems : []);
    }
  }, [productId, initialItems]);

  const handleItemsChange = (next: MediaItem[]) => {
    setItems(next);
    // In both modes, we report back to parent so it can send IDs on Save
    if (onDraftItemsChange) {
      onDraftItemsChange(next);
    }
  };

  // KUSURSUZ MANTIK: 
  // Edit modunda bile olsak yeni yüklemeleri "global" (orphan) olarak yapıyoruz.
  // "Kaydet" butonuna basılana kadar backend'de ürüne bağlanmıyorlar.
  // Bu sayede kullanıcı "Vazgeç" derse, cleanup-draft kancası bu yeni yüklenenleri temizleyebiliyor.
  return (
    <MediaManager
      scope="global"
      items={items}
      onItemsChange={handleItemsChange}
      onUploadingChange={onUploadingChange}
    />
  );
}
