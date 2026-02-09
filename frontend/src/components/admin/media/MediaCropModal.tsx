"use client";

import { apiFetch } from "@/lib/api";
import type { MediaItem } from "@/types/media";
import { App, Button, Modal, Slider, Space, Typography } from "antd";
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

export function MediaCropModal({
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
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [preset, setPreset] = useState<AspectPreset>("1:1");
  const [zoom, setZoom] = useState(1.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const src = useMemo(() => (item ? resolvePublicUrl(item.path) : ""), [item]);

  useEffect(() => {
    if (!open || !item) return;
    setPreset("1:1");
    setZoom(1.2);
    setOffset({ x: 0, y: 0 });
    setNatural(null);
  }, [open, item]);

  useEffect(() => {
    if (!open || !src) return;
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
  }, [open, src]);

  const frameAspect = useMemo(() => {
    if (preset === "free") {
      if (natural?.w && natural?.h) return natural.w / natural.h;
      return 1;
    }
    return aspectToNumber(preset) ?? 1;
  }, [preset, natural?.w, natural?.h]);

  const computeCrop = (): { crop_x: number; crop_y: number; crop_w: number; crop_h: number } | null => {
    if (!item) return null;
    const frame = frameRef.current;
    if (!frame) return null;

    const rect = frame.getBoundingClientRect();
    const frameW = rect.width;
    const frameH = rect.height;
    if (frameW <= 0 || frameH <= 0) return null;

    // We need natural image size.
    const ow = natural?.w;
    const oh = natural?.h;
    if (!ow || !oh) return null;

    // Base scale: cover the frame.
    const baseScale = Math.max(frameW / ow, frameH / oh);
    const scale = baseScale * zoom;

    const dispW = ow * scale;
    const dispH = oh * scale;

    // Image top-left inside frame
    const imgLeft = (frameW - dispW) / 2 + offset.x;
    const imgTop = (frameH - dispH) / 2 + offset.y;

    // Frame corresponds to this region in original image coords
    let cropLeft = (-imgLeft) / scale;
    let cropTop = (-imgTop) / scale;
    let cropW = frameW / scale;
    let cropH = frameH / scale;

    // Clamp within image bounds
    cropLeft = clamp(cropLeft, 0, Math.max(0, ow - cropW));
    cropTop = clamp(cropTop, 0, Math.max(0, oh - cropH));
    cropW = clamp(cropW, 1, ow);
    cropH = clamp(cropH, 1, oh);

    const nx = cropLeft / ow;
    const ny = cropTop / oh;
    const nw = cropW / ow;
    const nh = cropH / oh;

    return {
      crop_x: clamp(nx, 0, 1),
      crop_y: clamp(ny, 0, 1),
      crop_w: clamp(nw, 0, 1),
      crop_h: clamp(nh, 0, 1),
    };
  };

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

    return {
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    };
  };

  useEffect(() => {
    if (!open) return;
    setOffset((prev) => clampOffsetToBounds(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zoom, preset, natural?.w, natural?.h]);

  const save = async () => {
    if (!item) return;
    const crop = computeCrop();
    if (!crop) {
      message.error("Görsel boyutu okunamadı (width/height yok). Önce optimize et veya sayfayı yenile.");
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${item.id}/crop`, {
        method: "PUT",
        json: crop,
      });
      message.success("Kırpma kaydedildi.");
      onSaved(res.media);
      onCancel();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!item) return;
    try {
      setSaving(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${item.id}/crop`, {
        method: "PUT",
        json: { crop_x: null, crop_y: null, crop_w: null, crop_h: null },
      });
      message.success("Kırpma sıfırlandı.");
      onSaved(res.media);
      onCancel();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  };

  // Frame layout: always fit inside a fixed max box so the modal never "shifts" or overflows.
  const { frameWidth, frameHeight } = useMemo(() => {
    const maxW = 680;
    const maxH = 440;
    const ratio = frameAspect || 1;
    let w = maxW;
    let h = Math.round(w / ratio);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }
    return { frameWidth: w, frameHeight: h };
  }, [frameAspect]);

  const ratioOptions: { key: AspectPreset; label: string; hint?: string }[] = [
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
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width="100vw"
      style={{ top: 0, paddingBottom: 0 }}
      centered={false}
      destroyOnHidden
      wrapClassName="media-fullscreen-modal"
      styles={{
        content: { padding: 0, borderRadius: 0, height: "100vh", maxWidth: "100vw" },
        body: { padding: 0, height: "100vh" },
      }}
    >
      <div className="mf-root">
        <div className="mf-topbar">
          <div className="mf-title">Kırpma</div>
          <Space>
            <Button onClick={() => void reset()} loading={saving} style={{ height: 36, borderRadius: 10, fontWeight: 700 }}>
              Sıfırla
            </Button>
            <Button onClick={onCancel} style={{ height: 36, borderRadius: 10, fontWeight: 700 }}>
              Kapat
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => void save()}
              style={{ height: 36, background: "#5E5CE6", borderRadius: 10, fontWeight: 900 }}
            >
              Kaydet
            </Button>
          </Space>
        </div>

        {!item ? (
          <div style={{ padding: 24 }}>
            <Text>Görsel seçilmedi.</Text>
          </div>
        ) : (
          <div className="mf-grid">
            <aside className="mf-sidebar">
              <div className="mf-card">
                <Text style={{ fontWeight: 900, display: "block", marginBottom: 10 }}>Oran</Text>
                <div className="mf-ratio-grid">
                  {ratioOptions.map((opt) => {
                    const active = opt.key === preset;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPreset(opt.key)}
                        className={active ? "mf-ratio-btn active" : "mf-ratio-btn"}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
                  Görseli sürükle, zoom’u ayarla. Kaydedince thumbnail’lar bu kırpıma göre üretilir.
                </div>
              </div>

              <div className="mf-card">
                <Text style={{ fontWeight: 900, display: "block", marginBottom: 10 }}>Zoom</Text>
                <Slider min={1} max={4} step={0.01} value={zoom} onChange={(v) => setZoom(Number(v))} />
                <Space style={{ marginTop: 10 }}>
                  <Button onClick={() => setOffset({ x: 0, y: 0 })}>Ortala</Button>
                </Space>
              </div>
            </aside>

            <main className="mf-preview">
              <div className="mf-preview-inner">
                <div
                  ref={frameRef}
                  className="mf-frame"
                  style={{ width: frameWidth, height: frameHeight }}
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
                  <div className="mf-img-wrap" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={item.alt ?? item.original_name ?? ""}
                      className="mf-img"
                      style={{ transform: `scale(${zoom})` }}
                      draggable={false}
                    />
                  </div>

                  <div className="mf-overlay" />
                  <div className="mf-center-dot" />
                </div>
              </div>
            </main>
          </div>
        )}
      </div>

      <style jsx>{`
        .mf-root {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0b1220;
        }
        .mf-topbar {
          height: 56px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(11, 18, 32, 0.9);
          backdrop-filter: blur(10px);
        }
        .mf-title {
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.2px;
        }
        .mf-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 360px 1fr;
          min-height: 0;
        }
        .mf-sidebar {
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          padding: 16px;
          overflow: auto;
        }
        .mf-card {
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
        }
        .mf-card + .mf-card {
          margin-top: 12px;
        }
        .mf-ratio-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .mf-ratio-btn {
          height: 44px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          font-weight: 900;
          font-size: 12px;
          cursor: pointer;
        }
        .mf-ratio-btn.active {
          border: 2px solid #5e5ce6;
          background: rgba(94, 92, 230, 0.08);
          color: #5e5ce6;
        }
        .mf-preview {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .mf-preview-inner {
          width: 100%;
          height: 100%;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: radial-gradient(1200px 800px at 20% 20%, rgba(94, 92, 230, 0.18), transparent 55%),
            radial-gradient(900px 700px at 80% 70%, rgba(34, 197, 94, 0.08), transparent 55%),
            #0b1220;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mf-frame {
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          background: #0b1220;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: grab;
          user-select: none;
        }
        .mf-img-wrap {
          position: absolute;
          inset: 0;
          will-change: transform;
          pointer-events: none;
        }
        .mf-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform-origin: center;
          will-change: transform;
          opacity: 0.95;
          pointer-events: none;
        }
        .mf-overlay {
          position: absolute;
          inset: 0;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-radius: 14px;
          pointer-events: none;
          box-shadow: inset 0 0 0 999px rgba(0, 0, 0, 0.35);
        }
        .mf-center-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 24px;
          height: 24px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          pointer-events: none;
        }

        @media (max-width: 980px) {
          .mf-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }
          .mf-sidebar {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .mf-ratio-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>
    </Modal>
  );
}
