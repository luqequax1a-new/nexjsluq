"use client";

import { App, Button, Dropdown, Space, Table, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckOutlined, DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined, StopOutlined, PlusOutlined } from "@ant-design/icons";

import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";

type PageRow = {
  id: number;
  slug: string;
  title: string;
  is_published: boolean;
  updated_at?: string;
};

export default function AdminPagesListPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ data: PageRow[]; total: number } | PageRow[] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/settings/pages");
      setData(res);
    } catch (e: any) {
      message.error(e?.message || "Sayfalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (page: PageRow, next: boolean) => {
    try {
      await apiFetch(`/api/settings/pages/${page.id}/toggle`, {
        method: "PUT",
        json: { is_published: next },
      });
      message.success(next ? "Yayına alındı" : "Pasif yapıldı");
      void load();
    } catch (e: any) {
      message.error(e?.message || "İşlem başarısız");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo<PageRow[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as PageRow[];
    if (Array.isArray((data as any).data)) return (data as any).data;
    return [];
  }, [data]);

  usePageHeader({
    title: "Sayfalar",
    breadcrumb: [{ label: "Sayfalar" }],
    extra: (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => router.push("/admin/pages/new")}
        style={{ background: "#111827", borderColor: "#111827", borderRadius: 8, fontWeight: 700, height: 40 }}
      >
        Yeni Sayfa
      </Button>
    ),
  });

  const handleDelete = (page: PageRow) => {
    modal.confirm({
      title: "Silmek istediğinize emin misiniz?",
      content: "Bu işlem geri alınamaz.",
      okText: "Sil",
      okType: "danger",
      cancelText: "Vazgeç",
      onOk: async () => {
        try {
          await apiFetch(`/api/settings/pages/${page.id}`, { method: "DELETE" });
          message.success("Silindi");
          void load();
        } catch (e: any) {
          message.error(e?.message || "Silinemedi");
        }
      },
    });
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <Table
        loading={loading}
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: "Başlık",
            dataIndex: "title",
            key: "title",
            render: (v: string, r: PageRow) => (
              <div style={{ fontWeight: 700 }}>
                {v}
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>/ {r.slug}</div>
              </div>
            ),
          },
          {
            title: "Durum",
            dataIndex: "is_published",
            key: "is_published",
            width: 120,
            render: (v: boolean) => (v ? <Tag color="green">Yayında</Tag> : <Tag> Taslak</Tag>),
          },
          {
            title: "Aksiyon",
            key: "actions",
            width: 120,
            render: (_: unknown, r: PageRow) => (
              <Dropdown
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: "view",
                      icon: <EyeOutlined />,
                      label: (
                        <Link href={`/${encodeURIComponent(r.slug)}`} target="_blank">
                          Önizle
                        </Link>
                      ),
                    },
                    r.is_published
                      ? {
                          key: "unpublish",
                          icon: <StopOutlined />,
                          label: "Pasif Yap",
                          onClick: () => void togglePublish(r, false),
                        }
                      : {
                          key: "publish",
                          icon: <CheckOutlined />,
                          label: "Yayınla",
                          onClick: () => void togglePublish(r, true),
                        },
                    {
                      key: "edit",
                      icon: <EditOutlined />,
                      label: "Düzenle",
                      onClick: () => router.push(`/admin/pages/${r.id}/edit`),
                    },
                    {
                      key: "delete",
                      danger: true,
                      icon: <DeleteOutlined />,
                      label: "Sil",
                      onClick: () => handleDelete(r),
                    },
                  ],
                }}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]}
      />
    </div>
  );
}
