"use client";

import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { MediaItem, MediaScope, MediaType } from "@/types/media";
import {
  App,
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useRef, useState } from "react";

const { Text } = Typography;

type Paginated<T> = {
  current_page: number;
  data: T[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

function resolvePublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/storage/${normalized}`;
}

function toErrorMessage(e: unknown): string {
  if (!e) return t("admin.common.error", "İşlem başarısız");
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e) {
    const msg = (e as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return t("admin.common.error", "İşlem başarısız");
}

export default function AdminMediaPage() {
  const { message } = App.useApp();

  const [q, setQ] = useState<string>("");
  const [scope, setScope] = useState<MediaScope | "">("");
  const [type, setType] = useState<MediaType | "">("");
  const [used, setUsed] = useState<"" | "1" | "0">("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Paginated<MediaItem> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (q.trim()) params.set("q", q.trim());
    if (scope) params.set("scope", scope);
    if (type) params.set("type", type);
    if (used) params.set("used", used);
    return params.toString();
  }, [page, q, scope, type, used]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Paginated<MediaItem>>(`/api/media?${queryString}`);
      setResult(data);
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || t("admin.media.management.load_failed", "Medya listesi alınamadı"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, [queryString]);

  const columns: ColumnsType<MediaItem> = [
    {
      title: "",
      key: "thumb",
      width: 64,
      render: (_, record) => {
        const url = record.thumb_path
          ? resolvePublicUrl(record.thumb_path)
          : resolvePublicUrl(record.path);
        return (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              overflow: "hidden",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
            }}
          >
            <img
              src={url}
              alt={record.alt ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
          </div>
        );
      },
    },
    {
      title: t('admin.media.management.columns.file', 'Dosya'),
      key: "name",
      render: (_, record) => {
        const name =
          (record.original_name ?? "").trim() ||
          (record.alt ?? "").trim() ||
          (record.path ?? "").split("/").slice(-1)[0] ||
          `media-${record.id}`;

        return (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={name}
            >
              {name}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{record.mime ?? record.type}</div>
          </div>
        );
      },
    },
    {
      title: t('admin.media.management.columns.scope', 'Scope'),
      dataIndex: "scope",
      key: "scope",
      width: 110,
      render: (v) => <Tag>{String(v)}</Tag>,
    },
    {
      title: t('admin.media.management.columns.used', 'Bağlı'),
      key: "used",
      width: 120,
      render: (_, r) => {
        const isUsed = !!r.product_id || !!r.product_variant_id;
        return isUsed ? <Tag color="green">{t('admin.media.management.used_status', 'Kullanımda')}</Tag> : <Tag>{t('admin.media.management.orphan_status', 'Sahipsiz')}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 190,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setPreviewItem(record);
              setPreviewOpen(true);
            }}
          >
            {t('admin.media.management.preview', 'Önizle')}
          </Button>
          <Button
            size="small"
            danger
            disabled={!!record.product_id || !!record.product_variant_id}
            onClick={async () => {
              try {
                await apiFetch(`/api/media/${record.id}`, { method: "DELETE" });
                message.success(t('admin.media.management.delete_success', 'Silindi'));
                void fetchItems();
              } catch (e: unknown) {
                message.error(toErrorMessage(e) || t("admin.media.management.delete_failed", "Silme başarısız"));
              }
            }}
          >
            {t('admin.common.delete', 'Sil')}
          </Button>
        </Space>
      ),
    },
  ];

  const dataSource = result?.data ?? [];

  const previewUrl = previewItem
    ? resolvePublicUrl(previewItem.path)
    : "";

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
      message.success(t("admin.media.management.upload_success", "Medya yüklendi"));
      setPage(1);
      await fetchItems();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || t("admin.media.management.upload_failed", "Yükleme başarısız"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const importLegacy = async () => {
    setImporting(true);
    try {
      const res = await apiFetch<{ result: { created: number; skipped: number; missing_files: number } }>(
        "/api/media/import-legacy",
        { method: "POST", json: { limit: 500, generate_variants: true } }
      );
      const r = res?.result;
      message.success(
        `Import bitti. Yeni: ${r?.created ?? 0}, Atlanan: ${r?.skipped ?? 0}, Eksik dosya: ${r?.missing_files ?? 0}`
      );
      setPage(1);
      await fetchItems();
    } catch (e: unknown) {
      message.error(toErrorMessage(e) || "Import başarısız");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t('admin.media.management.title', 'Medya Yönetimi')}</div>
        <div style={{ color: "#64748b", fontSize: 14 }}>
          {t('admin.media.management.desc', 'Tüm görsel ve videoları buradan arayıp yönetebilirsiniz.')}
        </div>
      </div>

      <div style={{ padding: "16px 24px 0" }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('admin.media.management.search_placeholder', 'Ara (yol / alt / mime)')}
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            style={{ width: 280 }}
            allowClear
          />

          <Select
            value={scope}
            style={{ width: 160 }}
            onChange={(v) => {
              setPage(1);
              setScope(v);
            }}
            options={[
              { value: "", label: t('admin.media.management.scope_all', 'Scope: Hepsi') },
              { value: "global", label: "global" },
              { value: "product", label: "product" },
              { value: "variant", label: "variant" },
            ]}
          />

          <Select
            value={type}
            style={{ width: 160 }}
            onChange={(v) => {
              setPage(1);
              setType(v);
            }}
            options={[
              { value: "", label: t('admin.media.management.type_all', 'Tür: Hepsi') },
              { value: "image", label: "image" },
              { value: "video", label: "video" },
              { value: "file", label: "file" },
            ]}
          />

          <Select
            value={used}
            style={{ width: 160 }}
            onChange={(v) => {
              setPage(1);
              setUsed(v);
            }}
            options={[
              { value: "", label: t('admin.media.management.used_all', 'Bağlılık: Hepsi') },
              { value: "1", label: "Used" },
              { value: "0", label: "Orphan" },
            ]}
          />

          <Button
            onClick={() => {
              setQ("");
              setScope("");
              setType("");
              setUsed("");
              setPage(1);
            }}
          >
            {t('admin.media.management.reset', 'Sıfırla')}
          </Button>

          <Text type="secondary" style={{ marginLeft: 8 }}>
            {result ? t('admin.media.management.total', 'Toplam: :total').replace(':total', result.total.toString()) : ""}
          </Text>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <Button
            type="primary"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("admin.media.management.upload", "Yükle")}
          </Button>
          <Button
            loading={importing}
            onClick={() => void importLegacy()}
          >
            {t("admin.media.management.import_legacy", "Legacy Import")}
          </Button>
        </Space>
      </div>

      <Table
        rowKey={(r) => String(r.id)}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        locale={{
          emptyText: (
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {t("admin.media.management.empty_title", "Kütüphane boş")}
              </div>
              <div style={{ color: "#64748b" }}>
                {t(
                  "admin.media.management.empty_desc",
                  "İlk görselini eklemek için “Yükle” butonunu kullan."
                )}
              </div>
            </div>
          ),
        }}
        pagination={
          result
            ? {
              current: result.current_page,
              pageSize: result.per_page,
              total: result.total,
              onChange: (p) => setPage(p),
            }
            : false
        }
        size="small"
      />

      <Modal
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewItem(null);
        }}
        footer={null}
        width={860}
        title={previewItem?.original_name ?? "Önizleme"}
      >
        {previewItem ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={previewUrl}
              alt={previewItem.alt ?? ""}
              style={{ maxWidth: "800px", maxHeight: "800px", width: "100%", objectFit: "contain" }}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
