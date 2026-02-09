"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, Card, Popconfirm, Space, Switch, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/usePageHeader";
import { deleteProductTab, listProductTabs, ProductTab, updateProductTab } from "@/lib/api/productTabs";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

function errorMessage(e: unknown): string | null {
  if (!e || typeof e !== "object") return null;
  const maybe = e as { message?: unknown };
  return typeof maybe.message === "string" ? maybe.message : null;
}

function summarizeConditions(tab: ProductTab): string {
  const c = tab.conditions || null;
  if (!c || (!c.product_ids?.length && !c.category_ids?.length && !c.tag_names?.length)) return "Tüm ürünler";

  const parts: string[] = [];
  if (c.product_ids?.length) parts.push(`${c.product_ids.length} ürün`);
  if (c.category_ids?.length) parts.push(`${c.category_ids.length} kategori`);
  if (c.tag_names?.length) parts.push(`${c.tag_names.length} etiket`);
  const join = (c.match || "any") === "all" ? "VE" : "VEYA";
  return parts.join(` ${join} `);
}

export default function ProductTabsListPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [tabs, setTabs] = useState<ProductTab[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTabs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listProductTabs();
      setTabs(Array.isArray(res?.tabs) ? res.tabs : []);
    } catch (e: unknown) {
      message.error(errorMessage(e) || "Sekmeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void fetchTabs();
  }, [fetchTabs]);

  usePageHeader({
    title: "Ürün Sekmeleri",
    breadcrumb: [
      { label: "Ayarlar", href: "/admin/general-settings" },
      { label: "Ürün Sekmeleri" },
    ],
    extra: (
      <Space>
        <Button icon={<ReloadOutlined />} onClick={fetchTabs} loading={loading} style={{ height: 40 }}>
          Yenile
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/admin/general-settings/product-tabs/new")}
          style={{ height: 40, background: "#5E5CE6", borderRadius: 10, fontWeight: 600 }}
        >
          Yeni Sekme
        </Button>
      </Space>
    ),
  });

  const columns: ColumnsType<ProductTab> = useMemo(
    () => ([
      {
        title: "Başlık",
        dataIndex: "title",
        key: "title",
        render: (v: unknown) => <Text style={{ fontWeight: 700 }}>{String(v ?? "")}</Text>,
      },
      {
        title: "Kapsam",
        key: "scope",
        render: (_: unknown, row: ProductTab) => <Text style={{ color: "#475569" }}>{summarizeConditions(row)}</Text>,
      },
      {
        title: "Sıra",
        dataIndex: "position",
        key: "position",
        width: 90,
      },
      {
        title: "Durum",
        dataIndex: "is_active",
        key: "is_active",
        width: 140,
        render: (v: unknown, row: ProductTab) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={Boolean(v)}
              onChange={async (next) => {
                try {
                  await updateProductTab(row.id, { is_active: next });
                  setTabs((prev) => prev.map((t) => (t.id === row.id ? { ...t, is_active: next } : t)));
                } catch (e: unknown) {
                  message.error(errorMessage(e) || "Güncellenemedi.");
                }
              }}
            />
            {row.is_active ? <Tag color="green">Aktif</Tag> : <Tag>Pasif</Tag>}
          </div>
        ),
      },
      {
        title: "",
        key: "actions",
        width: 140,
        render: (_: unknown, row: ProductTab) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => router.push(`/admin/general-settings/product-tabs/${row.id}`)} />
            <Popconfirm
              title="Sekme silinsin mi?"
              okText="Sil"
              cancelText="Vazgeç"
              onConfirm={async () => {
                try {
                  await deleteProductTab(row.id);
                  message.success("Sekme silindi.");
                  setTabs((prev) => prev.filter((t) => t.id !== row.id));
                } catch (e: unknown) {
                  message.error(errorMessage(e) || "Silinemedi.");
                }
              }}
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ]),
    [message, router],
  );

  return (
    <div style={{ padding: "0 24px 40px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <Card style={{ borderRadius: 14, border: "1px solid #f0f0f0" }}>
        <Title level={4} style={{ marginTop: 0, marginBottom: 12 }}>
          Sekmeler
        </Title>
        <Text style={{ color: "#64748b" }}>
          Buradan ürün detayında görünecek özel sekmeleri yönetebilirsin (tüm ürünler / kategori / etiket / ürün bazlı).
        </Text>

        <div style={{ marginTop: 16 }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={tabs}
            columns={columns}
            pagination={{ pageSize: 20 }}
          />
        </div>
      </Card>
    </div>
  );
}
