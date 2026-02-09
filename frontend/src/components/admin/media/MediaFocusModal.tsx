"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App, Button, Modal, Slider, Space, Typography } from "antd";
import type { MediaItem } from "@/types/media";
import { apiFetch } from "@/lib/api";

const { Text } = Typography;

function resolvePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/${normalized}`;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

function toErrorMessage(e: unknown): string {
  if (!e) return "İşlem başarısız";
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "İşlem başarısız";
}

export function MediaFocusModal({
  open,
  item,
  onCancel,
  onSaved,
}: {
  open: boolean;
  item: MediaItem | null;
  onCancel: () => void;
  onSaved: (next: MediaItem) => void;
}) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const [fx, setFx] = useState(0.5);
  const [fy, setFy] = useState(0.5);

  useEffect(() => {
    if (!open || !item) return;
    setFx(clamp01(Number(item.focal_x ?? 0.5)));
    setFy(clamp01(Number(item.focal_y ?? 0.5)));
  }, [open, item]);

  const src = useMemo(() => {
    if (!item) return null;
    const p = item.path;
    return resolvePublicUrl(p.startsWith("media/") ? p : p);
  }, [item]);

  const markerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${fx * 100}%`,
    top: `${fy * 100}%`,
    transform: "translate(-50%, -50%)",
    width: 18,
    height: 18,
    borderRadius: 999,
    border: "2px solid #fff",
    background: "#5E5CE6",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    pointerEvents: "none",
  };

  const save = async () => {
    if (!item) return;
    try {
      setSaving(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${item.id}/focal-point`, {
        method: "PUT",
        json: { focal_x: fx, focal_y: fy },
      });
      message.success("Odak noktası kaydedildi.");
      onSaved(res.media);
      onCancel();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Odak Noktası"
      open={open}
      onCancel={onCancel}
      width={980}
      footer={
        <Space>
          <Button onClick={onCancel} style={{ height: 40 }}>
            Vazgeç
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={save}
            style={{ height: 40, background: "#5E5CE6", borderRadius: 10, fontWeight: 700 }}
          >
            Kaydet
          </Button>
        </Space>
      }
    >
      {!item || !src ? (
        <div style={{ padding: 24 }}>
          <Text>Görsel seçilmedi.</Text>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <div
            style={{
              position: "relative",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "#0b1220",
              aspectRatio: "16/10",
              cursor: "crosshair",
            }}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              setFx(clamp01(x));
              setFy(clamp01(y));
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={item.alt ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              loading="lazy"
              decoding="async"
            />
            <div style={markerStyle} />
          </div>

          <div>
            <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 14 }}>
              <Text style={{ fontWeight: 700 }}>İpucu</Text>
              <div style={{ marginTop: 8, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                Görselin önemli kısmına tıkla. Sistem küçük thumbnail’larda o noktayı merkezleyerek kırpar.
              </div>
            </div>

            <div style={{ marginTop: 12, padding: 12, border: "1px solid #e2e8f0", borderRadius: 14 }}>
              <Text style={{ fontWeight: 700 }}>İnce Ayar</Text>
              <div style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: "#64748b" }}>X</Text>
                <Slider min={0} max={1} step={0.01} value={fx} onChange={(v) => setFx(Number(v))} />
                <Text style={{ fontSize: 12, color: "#64748b" }}>Y</Text>
                <Slider min={0} max={1} step={0.01} value={fy} onChange={(v) => setFy(Number(v))} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
