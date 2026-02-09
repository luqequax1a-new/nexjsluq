"use client";

import { apiFetch } from "@/lib/api";
import type { MediaItem } from "@/types/media";
import { App, Button, Slider, Space, Typography } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";

const { Text } = Typography;

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
  }
  return "İşlem başarısız";
}

type AspectPreset =
  | "free"
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:5"
  | "5:4"
  | "3:4"
  | "4:3"
  | "3:2"
  | "2:3";

function aspectToNumber(preset: AspectPreset): number | null {
  if (preset === "1:1") return 1;
  if (preset === "16:9") return 16 / 9;
  if (preset === "9:16") return 9 / 16;
  if (preset === "4:5") return 4 / 5;
  if (preset === "5:4") return 5 / 4;
  if (preset === "3:4") return 3 / 4;
  if (preset === "4:3") return 4 / 3;
  if (preset === "3:2") return 3 / 2;
  if (preset === "2:3") return 2 / 3;
  return null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CropEditorView({
  mediaId,
  onClose,
}: {
  mediaId: number;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaItem | null>(null);

  const [preset, setPreset] = useState<AspectPreset>("1:1");
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const src = useMemo(() => (media ? resolvePublicUrl(media.path) : ""), [media]);

  const publishMediaUpdate = (next: MediaItem) => {
    try {
      sessionStorage.setItem("media:last_update", JSON.stringify({ ts: Date.now(), media: next }));
    } catch {
      // ignore
    }
    try {
      const bc = new BroadcastChannel("media-events");
      bc.postMessage({ type: "updated", media: next });
      bc.close();
    } catch {
      // ignore
    }
  };

  const load = async () => {
    if (!Number.isFinite(mediaId) || mediaId <= 0) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${mediaId}`, { method: "GET" });
      setMedia(res.media);
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Medya alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  const frameAspect = useMemo(() => {
    if (preset === "free") {
      if (natural?.w && natural?.h) return natural.w / natural.h;
      return 1;
    }
    return aspectToNumber(preset) ?? 1;
  }, [preset, natural?.w, natural?.h]);

  const { frameWidth, frameHeight } = useMemo(() => {
    const maxW = 760;
    const maxH = 600;
    const ratio = frameAspect || 1;
    let w = maxW;
    let h = Math.round(w / ratio);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }
    return { frameWidth: w, frameHeight: h };
  }, [frameAspect]);

  const clampOffsetToBounds = (next: { x: number; y: number }) => {
    const frame = frameRef.current;
    const ow = natural?.w;
    const oh = natural?.h;
    if (!frame || !ow || !oh) return next;
    const rect = frame.getBoundingClientRect();
    const frameW = rect.width;
    const frameH = rect.height;
    if (frameW <= 0 || frameH <= 0) return next;

    const baseScale = Math.max(frameW / ow, frameH / oh);
    const scale = baseScale * zoom;
    const dispW = ow * scale;
    const dispH = oh * scale;

    const maxX = Math.max(0, (dispW - frameW) / 2);
    const maxY = Math.max(0, (dispH - frameH) / 2);

    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  };

  useEffect(() => {
    setOffset((prev) => clampOffsetToBounds(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, preset, natural?.w, natural?.h]);

  const computeCrop = (): { crop_x: number; crop_y: number; crop_w: number; crop_h: number } | null => {
    const frame = frameRef.current;
    const ow = natural?.w;
    const oh = natural?.h;
    if (!frame || !ow || !oh) return null;
    const rect = frame.getBoundingClientRect();
    const frameW = rect.width;
    const frameH = rect.height;
    if (frameW <= 0 || frameH <= 0) return null;

    const baseScale = Math.max(frameW / ow, frameH / oh);
    const scale = baseScale * zoom;
    const dispW = ow * scale;
    const dispH = oh * scale;

    const imgLeft = (frameW - dispW) / 2 + offset.x;
    const imgTop = (frameH - dispH) / 2 + offset.y;

    let cropLeft = (-imgLeft) / scale;
    let cropTop = (-imgTop) / scale;
    const cropW = frameW / scale;
    const cropH = frameH / scale;

    cropLeft = clamp(cropLeft, 0, Math.max(0, ow - cropW));
    cropTop = clamp(cropTop, 0, Math.max(0, oh - cropH));

    return {
      crop_x: clamp(cropLeft / ow, 0, 1),
      crop_y: clamp(cropTop / oh, 0, 1),
      crop_w: clamp(cropW / ow, 0, 1),
      crop_h: clamp(cropH / oh, 0, 1),
    };
  };

  const save = async () => {
    if (!media) return;
    const crop = computeCrop();
    if (!crop) {
      message.error("Kırpma hesaplanamadı (görsel boyutu okunamadı).");
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${media.id}/crop`, {
        method: "PUT",
        json: crop,
      });
      setMedia(res.media);
      publishMediaUpdate(res.media);
      message.success("Kaydedildi.");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!media) return;
    try {
      setLoading(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${media.id}/crop`, {
        method: "PUT",
        json: { crop_x: null, crop_y: null, crop_w: null, crop_h: null },
      });
      setMedia(res.media);
      publishMediaUpdate(res.media);
      message.success("Sıfırlandı.");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const ratioOptions: { key: AspectPreset; label: string }[] = [
    { key: "free", label: "Free" },
    { key: "1:1", label: "1:1" },
    { key: "16:9", label: "16:9" },
    { key: "9:16", label: "9:16" },
    { key: "4:5", label: "4:5" },
    { key: "5:4", label: "5:4" },
    { key: "3:4", label: "3:4" },
    { key: "4:3", label: "4:3" },
    { key: "3:2", label: "3:2" },
    { key: "2:3", label: "2:3" },
  ];

  return (
    <div style={{ height: "100%", minHeight: 0, display: "grid", gridTemplateColumns: "360px 1fr" }}>
      <aside style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0", padding: 16, overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Kırp</div>
          <Button onClick={onClose} style={{ fontWeight: 800 }}>
            Geri
          </Button>
        </div>

        <div style={{ marginTop: 12, padding: 12, border: "1px solid #e2e8f0", borderRadius: 14 }}>
          <Text style={{ fontWeight: 900, display: "block", marginBottom: 10 }}>Oran</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
            {ratioOptions.map((opt) => {
              const active = opt.key === preset;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPreset(opt.key)}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: active ? "2px solid #5E5CE6" : "1px solid #e2e8f0",
                    background: active ? "rgba(94,92,230,0.08)" : "#ffffff",
                    color: active ? "#5E5CE6" : "#0f172a",
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14 }}>
            <Text style={{ fontWeight: 900, display: "block", marginBottom: 10 }}>Zoom</Text>
            <Slider min={1} max={4} step={0.01} value={zoom} onChange={(v) => setZoom(Number(v))} />
            <Space style={{ marginTop: 10 }}>
              <Button onClick={() => setOffset({ x: 0, y: 0 })}>Ortala</Button>
              <Button onClick={() => void reset()} loading={loading}>
                Sıfırla
              </Button>
            </Space>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <Button type="primary" loading={loading} onClick={() => void save()} style={{ fontWeight: 900 }}>
            Kaydet
          </Button>
        </div>

        <div style={{ marginTop: 12, color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
          Bu ekran ürün düzenlemeden çıkmadan açılır; geri dediğinde ürün formundaki değişiklikler kaybolmaz.
        </div>
      </aside>

      <main style={{ background: "#0b1220", padding: 18, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(1200px 800px at 20% 20%, rgba(94, 92, 230, 0.18), transparent 55%), radial-gradient(900px 700px at 80% 70%, rgba(34, 197, 94, 0.08), transparent 55%), #0b1220",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {!media ? (
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>{loading ? "Yükleniyor..." : "Medya bulunamadı"}</Text>
          ) : (
            <div
              ref={frameRef}
              style={{
                width: frameWidth,
                height: frameHeight,
                borderRadius: 14,
                overflow: "hidden",
                position: "relative",
                background: "#0b1220",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "grab",
                userSelect: "none",
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
              }}
              onPointerMove={(e) => {
                if (!dragRef.current) return;
                const dx = e.clientX - dragRef.current.startX;
                const dy = e.clientY - dragRef.current.startY;
                setOffset(clampOffsetToBounds({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy }));
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
            >
              <div style={{ position: "absolute", inset: 0, transform: `translate(${offset.x}px, ${offset.y}px)`, willChange: "transform", pointerEvents: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={media.alt ?? media.original_name ?? ""}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${zoom})`,
                    transformOrigin: "center",
                    willChange: "transform",
                    opacity: 0.95,
                    pointerEvents: "none",
                  }}
                  draggable={false}
                />
              </div>
              <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(255,255,255,0.25)", borderRadius: 14, pointerEvents: "none", boxShadow: "inset 0 0 0 999px rgba(0,0,0,0.35)" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 24, height: 24, transform: "translate(-50%, -50%)", borderRadius: 999, border: "2px solid rgba(255,255,255,0.8)", boxShadow: "0 8px 20px rgba(0,0,0,0.35)", pointerEvents: "none" }} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
