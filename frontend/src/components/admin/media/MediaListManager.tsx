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
import { DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm } from "antd";
import { useMemo, useRef } from "react";

type UploadResponse = { media: MediaItem };

type Props = {
  scope: MediaScope;
  ownerId?: number;
  items: MediaItem[];
  onItemsChange: (next: MediaItem[]) => void;
  disabled?: boolean;
};

function resolvePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/${normalized}`;
}

function toErrorMessage(e: unknown): string {
  if (!e) return "İşlem başarısız";
  if (typeof e === "string") return e;

  if (typeof e === "object" && e && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;

    type ApiError = { details?: { errors?: Record<string, unknown> } };
    const details = (e as ApiError).details;
    const errors = details && typeof details === "object" ? details.errors : null;
      if (errors && typeof errors === "object") {
        const first = Object.values(errors as Record<string, unknown>)[0];
        if (Array.isArray(first) && typeof first[0] === "string") {
          return String(first[0]);
        }
      }
  }

  return "İşlem başarısız";
}

function SortableRow({
  item,
  disabled,
  onDelete,
}: {
  item: MediaItem;
  disabled?: boolean;
  onDelete: (item: MediaItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#ffffff",
  };

  const url = item.thumb_path ? resolvePublicUrl(item.thumb_path) : resolvePublicUrl(item.path);
  const name =
    (item.original_name ?? "").trim() ||
    (item.alt ?? "").trim() ||
    (item.path ?? "").split("/").slice(-1)[0] ||
    `media-${item.id}`;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#98a2b3",
          cursor: disabled ? "not-allowed" : "grab",
        }}
      >
        <HolderOutlined />
      </div>

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          overflow: "hidden",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          flex: "0 0 auto",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={item.alt ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            color: "#121926",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={name}
        >
          {name}
        </div>
        <div style={{ fontSize: 12, color: "#667085" }}>{item.type === "video" ? "Video" : "Görsel"}</div>
      </div>

      <Popconfirm
        title="Bu görsel silinecek. Emin misiniz?"
        okText="Evet"
        cancelText="Hayır"
        onConfirm={() => onDelete(item)}
      >
        <Button type="text" danger icon={<DeleteOutlined />} disabled={disabled} />
      </Popconfirm>
    </div>
  );
}

export function MediaListManager({ scope, ownerId, items, onItemsChange, disabled }: Props) {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const sorted = useMemo(() => {
    return [...(items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
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

    formData.append("file", file);

    const res = await apiFetch<UploadResponse>("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    return res.media;
  };

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (disabled) return;

    try {
      const next: MediaItem[] = [...sorted];

      for (const file of Array.from(fileList)) {
        const created = await uploadFile(file);
        next.push({
          ...created,
          position: next.length,
        });
      }

      onItemsChange(next.map((m, i) => ({ ...m, position: i })));
      message.success("Medya yüklendi");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Yükleme başarısız");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const reorderRemote = async (ids: number[]) => {
    if (scope === "global") return;

    const url =
      scope === "product"
        ? `/api/products/${ownerId}/media/reorder`
        : `/api/variants/${ownerId}/media/reorder`;

    await apiFetch(url, {
      method: "PUT",
      json: { ids },
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((x) => x.id === active.id);
    const newIndex = sorted.findIndex((x) => x.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(sorted, oldIndex, newIndex).map((m, i) => ({ ...m, position: i }));
    onItemsChange(next);

    try {
      await reorderRemote(next.map((m) => m.id));
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Sıralama kaydedilemedi");
    }
  };

  const deleteItem = async (item: MediaItem) => {
    try {
      await apiFetch(`/api/media/${item.id}`, { method: "DELETE" });
      const next = sorted.filter((x) => x.id !== item.id).map((m, i) => ({ ...m, position: i }));
      onItemsChange(next);
      message.success("Silindi");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Silme başarısız");
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
        }}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (disabled) return;
          fileInputRef.current?.click();
        }}
        style={{
          border: "1px dashed #d1d5db",
          borderRadius: 8,
          padding: 20,
          textAlign: "center",
          background: "#fcfcfd",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ marginBottom: 10, color: "#98a2b3" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M4 7h3l2-2h6l2 2h3v12H4V7Z"
            />
          </svg>
        </div>
        <div style={{ fontWeight: 600, color: "#121926", marginBottom: 6 }}>Görsel seç veya sürükle</div>
        <div style={{ fontWeight: 600, color: "#5E5CE6" }}>+ Görsel Ekle</div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => void onFiles(e.target.files)}
        />
      </div>

      {sorted.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, color: "#121926", marginBottom: 10 }}>Yüklenen Görseller</div>

          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={sorted.map((x) => x.id)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sorted.map((m) => (
                  <SortableRow key={m.id} item={m} disabled={disabled} onDelete={(it) => void deleteItem(it)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div style={{ marginTop: 10, color: "#667085", fontSize: 12 }}>
            Sıralamayı değiştirmek için sürükleyip bırakabilirsiniz.
          </div>
        </div>
      ) : null}
    </div>
  );
}
