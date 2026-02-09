"use client";

import { apiFetch } from "@/lib/api";
import type { MediaItem } from "@/types/media";
import {
  CheckCircleFilled,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const { Text, Title } = Typography;

type LibraryResponse = {
  data: MediaItem[];
  total: number;
  current_page: number;
  per_page: number;
};

export type MediaLibraryModalProps = {
  open: boolean;
  onCancel: () => void;
  onSelect: (selected: MediaItem[]) => void;
  multiple?: boolean;
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
  }
  return "İşlem başarısız";
}

export function MediaLibraryModal({
  open,
  onCancel,
  onSelect,
  multiple = true,
}: MediaLibraryModalProps) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [selectedById, setSelectedById] = useState<Record<number, MediaItem>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const selectedCount = useMemo(() => Object.keys(selectedById).length, [selectedById]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = type !== "all" ? `&type=${type}` : "";
      const res = await apiFetch<LibraryResponse>(
        `/api/media/library?page=${page}&q=${encodeURIComponent(search)}${typeParam}`,
        { method: "GET" }
      );
      setData(res);
    } catch (e: unknown) {
      setData({ data: [], total: 0, current_page: page, per_page: 36 });
      message.error(toErrorMessage(e) || "Medya kütüphanesi yüklenemedi. Giriş yaptığınızdan emin olun.");
    } finally {
      setLoading(false);
    }
  }, [message, page, search, type]);

  useEffect(() => {
    if (!open) {
      setSelectedById({});
      setSearch("");
      setType("all");
      setPage(1);
      setData(null);
      setPreviewOpen(false);
      setPreviewItem(null);
      return;
    }
    void fetchLibrary();
  }, [open, fetchLibrary]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setPage(1);
      void fetchLibrary();
    }, 400);
    return () => clearTimeout(timer);
  }, [open, search, fetchLibrary]);

  const toggleSelect = (item: MediaItem) => {
    if (!multiple) {
      onSelect([item]);
      onCancel();
      return;
    }
    setSelectedById((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });
  };

  const handleConfirm = () => {
    onSelect(Object.values(selectedById));
    onCancel();
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("scope", "global");
        formData.append("generate_variants", "1");
        formData.append("file", file);
        await apiFetch("/api/media/upload", { method: "POST", body: formData });
      }
      message.success("Medya yüklendi.");
      setPage(1);
      await fetchLibrary();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openPreview = (item: MediaItem) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const deleteFromLibrary = async (item: MediaItem) => {
    Modal.confirm({
      title: 'Medyayı Sil',
      content: `"${item.original_name || 'Bu dosya'}" silinecek. Emin misiniz?`,
      okText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiFetch(`/api/media/${item.id}`, { method: "DELETE" });
          message.success("Silindi.");
          setSelectedById((prev) => {
            const next = { ...prev };
            delete next[item.id];
            return next;
          });
          if (previewItem?.id === item.id) {
            setPreviewOpen(false);
            setPreviewItem(null);
          }
          await fetchLibrary();
        } catch (e: unknown) {
          message.error(toErrorMessage(e) || "Silme başarısız.");
        }
      },
    });
  };

  const importLegacy = async () => {
    setImporting(true);
    try {
      const res = await apiFetch<{ result: { created: number; skipped: number; missing_files: number } }>(
        "/api/media/import-legacy",
        { method: "POST", json: { limit: 500, generate_variants: true } }
      );
      const r = res?.result;
      message.success(`Import bitti. Yeni: ${r?.created ?? 0}, Atlanan: ${r?.skipped ?? 0}, Eksik: ${r?.missing_files ?? 0}`);
      setPage(1);
      await fetchLibrary();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Import başarısız.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ padding: "8px 0" }}>
          <Space size={12}>
            <div
              style={{
                width: 36,
                height: 36,
                background: "#f1f5f9",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              <FileImageOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                Medya Kütüphanesi
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Dosyalarınızı buradan seçip yönetebilirsiniz
              </Text>
            </div>
          </Space>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={1100}
      okText={selectedCount > 0 ? `${selectedCount} Dosyayı Ekle` : "Dosyaları Ekle"}
      cancelText="Vazgeç"
      okButtonProps={{
        disabled: selectedCount === 0 && multiple,
        style: {
          height: 42,
          paddingInline: 24,
          borderRadius: 8,
          background: "#5E5CE6",
          borderColor: "#5E5CE6",
          fontWeight: 600,
          fontSize: 14,
          boxShadow: "0 4px 12px rgba(94, 92, 230, 0.2)",
        },
      }}
      cancelButtonProps={{
        style: {
          height: 42,
          borderRadius: 8,
          fontWeight: 500,
          fontSize: 14,
          paddingInline: 20,
          border: "1px solid #e2e8f0",
          color: "#64748b",
        },
      }}
      centered
      closeIcon={
        <div className="close-btn-round">
          <CloseOutlined />
        </div>
      }
      styles={{
        header: { marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 },
        body: { padding: "0 24px" },
        footer: { padding: "16px 24px", marginTop: 0, borderTop: "1px solid #f1f5f9" },
      }}
    >
      {selectedCount > 0 ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <CheckCircleFilled style={{ color: "#22c55e" }} />
            <Text style={{ fontWeight: 800 }}>{selectedCount} seçili</Text>
            <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              (sayfalar arası seçim desteklenir)
            </Text>
          </div>
          <Button size="small" onClick={() => setSelectedById({})}>
            Seçimi Temizle
          </Button>
        </div>
      ) : null}

      <div style={{ margin: "20px 0", display: "flex", gap: 12, alignItems: "center" }}>
        <Input
          placeholder="Dosya adı ile ara..."
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          size="middle"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{
            borderRadius: 8,
            height: 40,
            border: "1px solid #e2e8f0",
            width: 320,
          }}
        />
        <Select
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
          suffixIcon={<FilterOutlined style={{ color: "#94a3b8" }} />}
          style={{ width: 160, height: 40 }}
          options={[
            { value: "all", label: "Tüm Dosyalar" },
            { value: "image", label: "Görseller" },
            { value: "video", label: "Videolar" },
          ]}
          className="library-select"
        />

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <Button
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 40,
              borderRadius: 8,
              fontWeight: 700,
              border: "1px solid #e2e8f0",
            }}
          >
            Yükle
          </Button>
          <Tooltip title="Eski sistemden gelen görselleri kütüphaneye aktar">
            <Button
              loading={importing}
              icon={<ReloadOutlined />}
              onClick={() => void importLegacy()}
              style={{ height: 40, borderRadius: 8, fontWeight: 700, border: "1px solid #e2e8f0" }}
            >
              Import
            </Button>
          </Tooltip>
        </div>
      </div>

      <div
        style={{
          minHeight: 480,
          maxHeight: "calc(100vh - 400px)",
          overflowY: "auto",
          padding: "4px 4px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 18,
        }}
        className="library-scrollbar"
      >
        {loading ? (
          <div
            style={{
              gridColumn: "1/-1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 100,
            }}
          >
            <Spin />
            <Text style={{ marginTop: 16, color: "#94a3b8", fontSize: 13 }}>Yükleniyor...</Text>
          </div>
        ) : (data?.data ?? []).length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: 80 }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">Sonuç bulunamadı</Text>} />
          </div>
        ) : (
          (data?.data ?? []).map((item) => {
            const isSelected = !!selectedById[item.id];
            const isVideo = item.type === 'video' || item.mime?.startsWith('video/');
            // For images: use thumb_path if available, otherwise original path
            // For videos: use thumb_path for thumbnail image, video path for video element
            const thumbnailUrl = item.thumb_path ? resolvePublicUrl(item.thumb_path) : resolvePublicUrl(item.path);
            const videoUrl = resolvePublicUrl(item.path);
            const fileName = item.alt || item.original_name || item.path.split("/").pop() || "adsiz-dosya";
            const usedCount = Number(item.used_count ?? 0);
            const canDelete = usedCount <= 0;

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: 14,
                    border: isSelected ? "2px solid #5E5CE6" : "1px solid #f1f5f9",
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.2s ease",
                    background: "#f8fafc",
                    boxShadow: isSelected ? "0 4px 12px rgba(94, 92, 230, 0.15)" : "none",
                  }}
                  className="library-img-box group"
                >
                  {isVideo ? (
                    // Show thumbnail image if available, otherwise show video with poster
                    item.thumb_path && item.thumb_path !== item.path ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbnailUrl}
                        alt={fileName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <video
                        src={videoUrl}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        muted
                        playsInline
                        loop={false}
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                    )
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={thumbnailUrl}
                      alt={fileName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  {/* Actions: Right Top, Hover visible */}
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ position: "absolute", right: 6, top: 6, display: "flex", gap: 4 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Önizle (HD)">
                      <div
                        onClick={() => openPreview(item)}
                        style={{
                          background: 'rgba(255,255,255,0.9)', borderRadius: 6, width: 26, height: 26,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <EyeOutlined style={{ fontSize: 14, color: '#475569' }} />
                      </div>
                    </Tooltip>

                    {canDelete && (
                      <Tooltip title="Sil">
                        <div
                          onClick={() => void deleteFromLibrary(item)}
                          style={{
                            background: 'rgba(255,255,255,0.9)', borderRadius: 6, width: 26, height: 26,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <DeleteOutlined style={{ fontSize: 14, color: '#ef4444' }} />
                        </div>
                      </Tooltip>
                    )}
                  </div>

                  <div style={{ position: "absolute", left: 8, bottom: 8 }}>
                    {usedCount > 0 ? (
                      <Tag color="green" style={{ margin: 0, borderRadius: 999, fontWeight: 800, fontSize: 10, padding: '0 6px' }}>
                        Kullanımda
                      </Tag>
                    ) : (
                      item.type === 'video' && (
                        <div style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                          Video
                        </div>
                      )
                    )}
                  </div>

                  {isSelected ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "#5E5CE6",
                        color: "white",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        zIndex: 10,
                      }}
                    >
                      <CheckCircleFilled />
                    </div>
                  ) : null}
                </div>

                <div style={{ padding: "0 2px" }}>
                  <Tooltip title={fileName}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "#5E5CE6" : "#475569",
                        textAlign: "center",
                        display: "block",
                      }}
                      ellipsis
                    >
                      {fileName}
                    </Text>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          margin: "20px 0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
          padding: "10px 16px",
          borderRadius: 10,
        }}
      >
        <Text style={{ fontSize: 12, color: "#64748b" }}>{data ? `Toplam ${data.total} dosya` : ""}</Text>

        <Pagination
          current={page}
          total={data?.total ?? 0}
          pageSize={36}
          onChange={(p) => setPage(p)}
          showSizeChanger={false}
          size="small"
          className="library-pagination"
        />
      </div>

      <Modal
        title="Önizleme"
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewItem(null);
        }}
        footer={null}
        width="92vw"
        style={{ maxWidth: 1100 }}
        centered
      >
        {!previewItem ? null : (
          <div className="preview-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                background: "#0b1220",
                aspectRatio: "16/10",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvePublicUrl(previewItem.path)}
                alt={previewItem.alt ?? previewItem.original_name ?? ""}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                loading="eager"
                decoding="async"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 14 }}>
                <Text style={{ fontWeight: 900, display: "block", marginBottom: 8 }}>Bilgi</Text>
                <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <Text type="secondary">Dosya</Text>
                    <Text style={{ fontWeight: 800, textAlign: "right" }}>
                      {previewItem.alt || previewItem.original_name || previewItem.path.split("/").slice(-1)[0]}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <Text type="secondary">Tür</Text>
                    <Text style={{ fontWeight: 800, textAlign: "right" }}>{previewItem.type}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <Text type="secondary">Boyut</Text>
                    <Text style={{ fontWeight: 800, textAlign: "right" }}>
                      {previewItem.size ? `${Math.round(Number(previewItem.size) / 1024)} KB` : "-"}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <Text type="secondary">Kullanımda</Text>
                    <Text style={{ fontWeight: 800, textAlign: "right" }}>{Number(previewItem.used_count ?? 0)}</Text>
                  </div>
                </div>

                <Space style={{ marginTop: 12 }} wrap>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(resolvePublicUrl(previewItem.path));
                        message.success("Link kopyalandı.");
                      } catch {
                        message.error("Kopyalanamadı.");
                      }
                    }}
                  >
                    Linki Kopyala
                  </Button>
                  <Button
                    danger
                    disabled={Number(previewItem.used_count ?? 0) > 0}
                    icon={<DeleteOutlined />}
                    onClick={() => void deleteFromLibrary(previewItem)}
                  >
                    Sil
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .library-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .library-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .library-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        .library-img-box:hover {
          border-color: #5e5ce6;
          background: #ffffff;
        }

        .close-btn-round {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .close-btn-round:hover {
          background: #f1f5f9;
          color: #ef4444;
        }

        :global(.library-pagination .ant-pagination-item) {
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
        }
        :global(.library-pagination .ant-pagination-item-active) {
          border-color: #5e5ce6 !important;
          background: #5e5ce6 !important;
        }
        :global(.library-pagination .ant-pagination-item-active a) {
          color: white !important;
        }
        :global(.library-select .ant-select-selector) {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }

        @media (max-width: 920px) {
          .preview-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Modal>
  );
}
