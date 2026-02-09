"use client";

import { apiFetch } from "@/lib/api";
import type { MediaItem } from "@/types/media";
import { AimOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Input, Modal, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

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

export function MediaEditModal({
  open,
  item,
  onCancel,
  onUpdated,
  onDeleted,
  onOpenFocus,
  onOpenCrop,
}: {
  open: boolean;
  item: MediaItem | null;
  onCancel: () => void;
  onUpdated: (next: MediaItem) => void;
  onDeleted?: (id: number) => void;
  onOpenFocus?: (item: MediaItem) => void;
  onOpenCrop?: (item: MediaItem) => void;
}) {
  const { message, modal } = App.useApp();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setName(item.alt ?? item.original_name ?? item.path.split("/").slice(-1)[0] ?? "");
  }, [open, item]);

  const previewUrl = useMemo(() => {
    if (!item) return "";
    return resolvePublicUrl(item.path);
  }, [item]);

  const saveName = async () => {
    if (!item) return;
    try {
      setSaving(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${item.id}`, {
        method: "PUT",
        json: { alt: name.trim() || null },
      });
      onUpdated(res.media);
      message.success("İsim güncellendi.");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const optimize = async () => {
    if (!item) return;
    try {
      setOptimizing(true);
      const res = await apiFetch<{ media: MediaItem }>(`/api/media/${item.id}/regenerate`, { method: "POST" });
      onUpdated(res.media);
      message.success("Optimize edildi.");
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "İşlem başarısız.");
    } finally {
      setOptimizing(false);
    }
  };

  const confirmDelete = async () => {
    if (!item) return;
    if (Number(item.used_count ?? 0) > 0) {
      message.error("Bu medya kullanımda. Önce bağlı olduğu yerlerden kaldır.");
      return;
    }
    modal.confirm({
      title: "Görsel silinsin mi?",
      content: "Bu işlem geri alınamaz.",
      okText: "Sil",
      okButtonProps: { danger: true },
      cancelText: "Vazgeç",
      onOk: async () => {
        try {
          setDeleting(true);
          await apiFetch(`/api/media/${item.id}`, { method: "DELETE" });
          message.success("Silindi.");
          if (onDeleted) onDeleted(item.id);
          onCancel();
        } catch (e: unknown) {
          message.error(toErrorMessage(e) || "Silme başarısız.");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

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
          <div className="mf-title">Medya Düzenle</div>
          <Button onClick={onCancel} style={{ height: 36, borderRadius: 10, fontWeight: 700 }}>
            Kapat
          </Button>
        </div>

        {!item ? (
          <div style={{ padding: 24 }}>
            <Text>Medya seçilmedi.</Text>
          </div>
        ) : (
          <div className="mf-grid">
            <aside className="mf-sidebar">
              <div className="mf-card">
                <Text style={{ fontWeight: 900, display: "block", marginBottom: 8 }}>İsim</Text>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Görsel adı" />
                <Space style={{ marginTop: 10 }} wrap>
                  <Button type="primary" loading={saving} onClick={() => void saveName()}>
                    Kaydet
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(previewUrl);
                        message.success("Link kopyalandı.");
                      } catch {
                        message.error("Kopyalanamadı.");
                      }
                    }}
                  >
                    Linki Kopyala
                  </Button>
                </Space>
              </div>

              <div className="mf-card">
                <Text style={{ fontWeight: 900, display: "block", marginBottom: 8 }}>Araçlar</Text>
                <div className="mf-actions">
                  <Button
                    icon={<AimOutlined />}
                    onClick={() => {
                      if (onOpenCrop) onOpenCrop(item);
                    }}
                  >
                    Kırp
                  </Button>
                  <Button
                    icon={<AimOutlined />}
                    onClick={() => {
                      if (onOpenFocus) onOpenFocus(item);
                    }}
                  >
                    Odak
                  </Button>
                  <Button icon={<ReloadOutlined />} loading={optimizing} onClick={() => void optimize()}>
                    Optimize Et
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleting}
                    onClick={() => void confirmDelete()}
                    disabled={Number(item.used_count ?? 0) > 0}
                  >
                    Sil
                  </Button>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                  Kullanımda: <b>{Number(item.used_count ?? 0)}</b>
                </div>
              </div>
            </aside>

            <main className="mf-preview">
              <div className="mf-preview-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={item.alt ?? item.original_name ?? ""}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                  loading="eager"
                  decoding="async"
                />
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
        .mf-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
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

        @media (max-width: 980px) {
          .mf-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }
          .mf-sidebar {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .mf-preview {
            padding: 12px;
          }
        }
      `}</style>
    </Modal>
  );
}
