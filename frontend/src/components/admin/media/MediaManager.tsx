"use client";

import { apiFetch } from "@/lib/api";
import type { MediaItem, MediaScope } from "@/types/media";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  App,
  Button,
  Popconfirm,
  Typography,
  Spin,
} from "antd";
import {
  PlusOutlined,
  PictureOutlined,
  CloudUploadOutlined,
  CloseOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { MediaLibraryModal } from "./MediaLibraryModal";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const { Text } = Typography;

type UploadResponse = { media: MediaItem };

function toErrorMessage(e: unknown): string {
  if (!e) return "İşlem başarısız";
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "İşlem başarısız";
}

export type MediaManagerProps = {
  scope: MediaScope;
  ownerId?: number;
  items: MediaItem[];
  onItemsChange: (next: MediaItem[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
};

function resolvePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/${normalized}`;
}

function SortableTile({
  item,
  disabled,
  onDelete,
  onCrop,
}: {
  item: MediaItem;
  disabled?: boolean;
  onDelete: (item: MediaItem) => void;
  onCrop: (item: MediaItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: 200,
    height: 200,
    borderRadius: 12,
    border: "1px solid #f1f5f9",
    background: "#ffffff",
    overflow: "hidden",
    position: "relative",
    cursor: disabled ? "default" : "grab",
    opacity: isDragging ? 0.75 : 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  };

  const url = item.thumb_path ? resolvePublicUrl(item.thumb_path) : resolvePublicUrl(item.path);
  const isVideo = item.type === 'video' || item.mime?.startsWith('video/');

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="media-tile">
      <div ref={setActivatorNodeRef} {...listeners} className="drag-surface" />

      {isVideo ? (
        <video
          src={url} // Eğer thumb_path video itself ise burada çalışır
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
          playsInline
          loop={false}
          onMouseOver={e => e.currentTarget.play()}
          onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={url}
          alt={item.alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}

      {isVideo && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, pointerEvents: 'none' }}>
          Video
        </div>
      )}

      <div className="media-tile-actions" onClick={(e) => e.stopPropagation()}>
        {!isVideo && ( // Video için crop şimdilik devre dışı
          <Button
            size="small"
            disabled={disabled}
            icon={<ScissorOutlined />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCrop(item);
            }}
            style={{ height: 32, width: 32, padding: 0, borderRadius: 10, fontWeight: 700 }}
          />
        )}
      </div>

      <div className="media-tile-delete">
        <Popconfirm
          title="Medyayı sil?"
          onConfirm={(e) => { e?.preventDefault(); e?.stopPropagation(); onDelete(item); }}
        >
          <div className="delete-x" onClick={(e) => e.stopPropagation()}>
            <CloseOutlined />
          </div>
        </Popconfirm>
      </div>

      <style jsx>{`
        .drag-surface {
          position: absolute;
          inset: 0;
          z-index: 5;
        }
        .media-tile-delete {
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          transition: all 0.2s;
          z-index: 10;
        }
        .media-tile-actions {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: all 0.2s;
          z-index: 12;
        }
        .media-tile:hover .media-tile-delete {
          opacity: 1;
        }
        .media-tile:hover .media-tile-actions {
          opacity: 1;
        }
        .delete-x {
          font-size: 18px;
          color: #ffffff;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-x:hover {
          color: #ef4444;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

export function MediaManager({
  scope,
  ownerId,
  items,
  onItemsChange,
  onUploadingChange,
  disabled,
}: MediaManagerProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [internalUploading, setInternalUploading] = useState(false);

  const setUploading = (val: boolean) => {
    setInternalUploading(val);
    if (onUploadingChange) onUploadingChange(val);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const sorted = useMemo(() => {
    return [...(items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [items]);

  const applyExternalUpdate = (payload: { media?: MediaItem; deleted_id?: number; id?: number } | null) => {
    if (!payload) return;
    if (payload.deleted_id || payload.id) {
      const deletedId = Number(payload.deleted_id ?? payload.id);
      if (Number.isFinite(deletedId) && deletedId > 0) {
        const next = sorted.filter((x) => x.id !== deletedId).map((m, i) => ({ ...m, position: i }));
        if (next.length !== sorted.length) onItemsChange(next);
      }
      return;
    }
    if (payload.media) {
      const updated = payload.media;
      const next = sorted.map((m) => (m.id === updated.id ? { ...m, ...updated } : m));
      const changed = next.some((m, i) => m !== sorted[i]);
      if (changed) onItemsChange(next);
    }
  };

  useEffect(() => {
    // One-shot sync: when navigating back from the editor, we might have a pending update.
    try {
      const raw = sessionStorage.getItem("media:last_update");
      if (raw) {
        sessionStorage.removeItem("media:last_update");
        const parsed = JSON.parse(raw) as { media?: MediaItem; deleted_id?: number };
        applyExternalUpdate(parsed);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    // Live sync (best-effort) with fallback for browsers without BroadcastChannel
    let bc: BroadcastChannel | null = null;
    let storageListener: ((e: StorageEvent) => void) | null = null;

    // Try BroadcastChannel first (modern browsers)
    if ('BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel("media-events");
        bc.onmessage = (ev) => {
          const raw: unknown = ev?.data;
          if (!raw || typeof raw !== "object") return;
          const data = raw as { type?: unknown; media?: unknown; id?: unknown };
          if (data.type === "updated" && data.media && typeof data.media === "object") {
            applyExternalUpdate({ media: data.media as MediaItem });
          }
          if (data.type === "deleted") {
            const id = typeof data.id === "number" ? data.id : Number(data.id);
            if (Number.isFinite(id) && id > 0) applyExternalUpdate({ deleted_id: id });
          }
        };
      } catch {
        bc = null;
      }
    }

    // Fallback: localStorage events (for Safari < 15.4, Firefox private mode)
    if (!bc) {
      storageListener = (e: StorageEvent) => {
        if (e.key?.startsWith('media-events-')) {
          try {
            const data = JSON.parse(e.newValue || '{}') as { type?: unknown; media?: unknown; id?: unknown };
            if (data.type === "updated" && data.media && typeof data.media === "object") {
              applyExternalUpdate({ media: data.media as MediaItem });
            }
            if (data.type === "deleted") {
              const id = typeof data.id === "number" ? data.id : Number(data.id);
              if (Number.isFinite(id) && id > 0) applyExternalUpdate({ deleted_id: id });
            }
          } catch {
            // ignore parse errors
          }
        }
      };
      window.addEventListener('storage', storageListener);
    }

    return () => {
      try {
        bc?.close();
      } catch {
        // ignore
      }
      if (storageListener) {
        window.removeEventListener('storage', storageListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);


  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("scope", scope);
    if (scope === "product") {
      if (!ownerId) throw new Error("ownerId is required for product scope");
      formData.append("product_id", String(ownerId));
    } else if (scope === "variant") {
      if (!ownerId) throw new Error("ownerId is required for variant scope");
      formData.append("product_variant_id", String(ownerId));
    }
    // Speed: generate variants after response on backend. This makes uploads feel instant.
    formData.append("generate_variants", "1");
    formData.append("file", file);
    const res = await apiFetch<UploadResponse>("/api/media/upload", { method: "POST", body: formData });
    return res.media;
  };

  async function mapConcurrent<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let cursor = 0;

    const workers = new Array(Math.max(1, Math.min(limit, items.length))).fill(0).map(async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await mapper(items[index], index);
      }
    });

    await Promise.all(workers);
    return results;
  }

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;
    setUploading(true);
    try {
      const files = Array.from(fileList);
      const next: MediaItem[] = [...sorted];

      // Upload concurrently with a small limit to avoid overloading the backend.
      const createdItems = await mapConcurrent(files, 3, async (file) => uploadFile(file));
      createdItems.forEach((created) => next.push({ ...created, position: next.length }));

      onItemsChange(next.map((m, i) => ({ ...m, position: i })));
      message.success("Medya yüklendi");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Yükleme başarısız");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((x) => x.id === active.id);
    const newIndex = sorted.findIndex((x) => x.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(sorted, oldIndex, newIndex).map((m, i) => ({ ...m, position: i }));
    onItemsChange(next);
  };

  const deleteItem = async (item: MediaItem) => {
    try {
      await apiFetch(`/api/media/${item.id}`, { method: "DELETE" });
      onItemsChange(sorted.filter((x) => x.id !== item.id).map((m, i) => ({ ...m, position: i })));
      message.success("Silindi");
    } catch {
      message.error("Silme başarısız");
    }
  };

  const onLibrarySelect = async (selected: MediaItem[]) => {
    if (selected.length === 0) return;
    setAttaching(true);
    try {
      const res = await apiFetch<{ items: MediaItem[] }>("/api/media/attach-from-library", {
        method: "POST",
        json: { media_ids: selected.map((s) => s.id) },
      });
      const next = [...sorted];
      res.items.forEach((item) => next.push({ ...item, position: next.length }));
      onItemsChange(next.map((m, i) => ({ ...m, position: i })));
      message.success(`${selected.length} medya eklendi`);
    } catch {
      message.error("Kütüphaneden ekleme başarısız");
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {internalUploading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.7)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)', borderRadius: 16
        }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16, fontWeight: 500 }}>Yükleniyor...</Text>
        </div>
      )}
      {/* Medyadan Seç Butonu - Sağ Üst */}
      <div style={{ position: "absolute", top: -45, right: 0, zIndex: 10 }}>
        <Button
          icon={<PictureOutlined />}
          loading={attaching}
          disabled={disabled}
          onClick={() => setLibraryOpen(true)}
          style={{
            borderRadius: 8,
            height: 36,
            fontWeight: 600,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
          }}
        >
          Kütüphaneden Seç
        </Button>
      </div>

      <div
        onDragOver={(e) => !disabled && e.preventDefault()}
        onDrop={(e) => { if (!disabled) { e.preventDefault(); void onFiles(e.dataTransfer.files); } }}
        style={{
          border: "2px dashed #e2e8f0",
          borderRadius: 16,
          padding: sorted.length > 0 ? "24px" : "64px 24px",
          textAlign: "center",
          background: "#f8fafc",
          transition: "all 0.3s ease",
          minHeight: sorted.length > 0 ? "180px" : "260px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}
      >
        {sorted.length === 0 ? (
          <>
            <div style={{
              width: 56, height: 56, background: "#ffffff", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 20, color: "#94a3b8"
            }}>
              <CloudUploadOutlined style={{ fontSize: 28 }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <Button
                type="link"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: 0, height: "auto", fontSize: 16, fontWeight: 700, color: "#5E5CE6" }}
              >
                Bilgisayardan Yükle
              </Button>
              <Text style={{ display: "block", color: "#64748b", fontSize: 13, marginTop: 8 }}>
                veya dosyaları buraya sürükleyip bırakın
              </Text>
            </div>

            <Text type="secondary" style={{ fontSize: 11, maxWidth: 300 }}>
              JPG, PNG, WEBP veya MP4 (Maks. 10MB)
            </Text>
          </>
        ) : (
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <SortableContext items={sorted.map((x) => x.id)}>
                  {sorted.map((item) => (
                    <div key={item.id} style={{ position: "relative" }}>
                      <SortableTile
                        key={item.id}
                        item={item}
                        disabled={disabled}
                        onDelete={(m) => void deleteItem(m)}
                        onCrop={(m) => {
                          const qs = searchParams?.toString();
                          const returnTo = `${pathname}${qs ? `?${qs}` : ""}`;
                          router.push(`/admin/media/editor/${m.id}?return=${encodeURIComponent(returnTo)}`);
                        }}
                      />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>

              {/* Upload More Box */}
              <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 12,
                  border: "2px dashed #cbd5e1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: disabled ? "not-allowed" : "pointer",
                  color: "#64748b",
                  background: "#ffffff40",
                  transition: "all 0.2s"
                }}
                className="upload-more-box"
              >
                <PlusOutlined style={{ fontSize: 20 }} />
                <Text style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Yükle</Text>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => void onFiles(e.target.files)}
        />
      </div>

      <MediaLibraryModal
        open={libraryOpen}
        onCancel={() => setLibraryOpen(false)}
        onSelect={onLibrarySelect}
      />

      <style jsx>{`
        .upload-more-box:hover {
          border-color: #5E5CE6;
          color: #5E5CE6;
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}
