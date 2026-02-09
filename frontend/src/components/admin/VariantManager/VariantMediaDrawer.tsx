"use client";

import { MediaListManager } from "@/components/admin/media/MediaListManager";
import type { MediaItem } from "@/types/media";
import { useVariantMedia } from "@/hooks/useVariantMedia";
import { Drawer, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

export function VariantMediaDrawer({
  open,
  onClose,
  variant,
  variantUids,
  form,
}: {
  open: boolean;
  onClose: () => void;
  variant: any | null;
  variantUids: string | null;
  form: any;
}) {
  const variantId = variant?.id ? Number(variant.id) : undefined;

  const initialItems: MediaItem[] = useMemo(() => {
    const arr = (variant?.media ?? variant?.medias ?? []) as any;
    return Array.isArray(arr) ? (arr as MediaItem[]) : [];
  }, [variant]);

  const [items, setItems] = useState<MediaItem[]>([]);

  const resolveVariantIndex = (): number | null => {
    if (!variantUids) return null;
    const arr = (form?.getFieldValue?.(["variants"]) ?? []) as any[];
    if (!Array.isArray(arr)) return null;
    const idx = arr.findIndex((v) => String(v?.uids ?? v?.key) === String(variantUids));
    return idx >= 0 ? idx : null;
  };

  const variantIndex = resolveVariantIndex();
  const { setMedia } = useVariantMedia(form, variantIndex ?? 0);

  useEffect(() => {
    if (!open) return;
    const idx = resolveVariantIndex();
    if (idx !== null) {
      const fromForm = form?.getFieldValue?.(["variants", idx, "media"]);
      if (Array.isArray(fromForm)) {
        setItems(fromForm as MediaItem[]);
        return;
      }
    }
    setItems(Array.isArray(initialItems) ? initialItems : []);
  }, [open, initialItems, variantUids]);

  const title = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Text strong style={{ fontSize: 16, color: "#121926" }}>
        Görseller
      </Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {variant?.name ?? "Varyant"}
      </Text>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      placement="right"
      width={520}
      destroyOnClose
    >
      <MediaListManager
        scope={variantId ? "variant" : "global"}
        ownerId={variantId}
        items={items}
        onItemsChange={(next) => {
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log('[VariantMediaDrawer] onItemsChange', {
              variantUids,
              variantId,
              variantIndex,
              itemCount: next.length,
              mediaIds: next.map(m => m.id),
            });
          }

          setItems(next);

          // Use the hook to update form state
          if (variantIndex !== null) {
            setMedia(next);
          }
        }}
      />

      {!variantId ? (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Ürün kaydedilene kadar görseller taslak olarak yüklenir. Kaydet dediğinizde ilgili varyanta otomatik bağlanır.
          </Text>
        </div>
      ) : null}
    </Drawer>
  );
}
