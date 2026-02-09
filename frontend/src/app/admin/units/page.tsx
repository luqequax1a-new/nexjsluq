"use client";

import { App, Button, Drawer, Form, Input, InputNumber, Space, Switch, Table } from "antd";
import { PlusOutlined, SearchOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useRouter } from "next/navigation";

import { t } from "@/lib/i18n";

type UnitRow = {
  id: number;
  name: string;
  label?: string | null;
  quantity_prefix?: string | null;
  short_name?: string | null;
  suffix?: string | null;
  min: string;
  max?: string | null;
  step: string;
  default_qty?: string | null;
  info_top?: string | null;
  info_bottom?: string | null;
  price_prefix?: string | null;
  stock_prefix?: string | null;
  is_decimal_stock: boolean;
  is_active: boolean;
};

export default function UnitsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [query, setQuery] = useState("");

  const headerExtra = useMemo(() => (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      style={{ background: "#6f55ff", borderColor: "#6f55ff", fontWeight: 700, height: 40, borderRadius: 8 }}
      onClick={() => router.push("/admin/units/new")}
    >
      {t('admin.units.add_button', 'Birim Ekle')}
    </Button>
  ), [router]);

  usePageHeader({
    title: t('admin.units.title', 'Birimler'),
    variant: "light",
    extra: headerExtra
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<UnitRow[]>("/api/units", { method: "GET" });
      setRows(res);
    } catch (e: any) {
      message.error(e?.message || t('admin.units.load_failed', 'Birimler yüklenemedi'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDecimal = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    const num = Number(v);
    if (isNaN(num)) return v;
    return parseFloat(num.toString()).toString(); // Strips trailing zeros
  };

  return (
    <>
      <Table<UnitRow>
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        pagination={false}
        className="ikas-style-table"
        columns={[
          { title: t('admin.units.columns.name', 'Ad'), dataIndex: "name", render: (v) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{v}</span> },
          { title: t('admin.units.columns.label', 'Etiket'), dataIndex: "label" },
          { title: t('admin.units.columns.min', 'Min'), dataIndex: "min", render: formatDecimal },
          { title: t('admin.units.columns.max', 'Max'), dataIndex: "max", render: formatDecimal },
          { title: t('admin.units.columns.step', 'Step'), dataIndex: "step", render: formatDecimal },
          { title: t('admin.units.columns.default', 'Default'), dataIndex: "default_qty", render: formatDecimal },
          { title: "Miktar Prefix", dataIndex: "quantity_prefix" },
          { title: t('admin.units.columns.price_prefix', 'Fiyat Prefix'), dataIndex: "price_prefix" },
          { title: t('admin.units.columns.stock_prefix', 'Stok Prefix'), dataIndex: "stock_prefix" },
          {
            title: t('admin.units.columns.decimal', 'Ondalık'),
            dataIndex: "is_decimal_stock",
            render: (v) => (v ? t('admin.common.yes', 'Evet') : t('admin.common.no', 'Hayır')),
          },
          {
            title: t('admin.units.columns.active', 'Aktif'),
            dataIndex: "is_active",
            render: (v) => (v ? <span style={{ color: "#22c55e", fontWeight: 600 }}>{t('admin.units.status.active', 'Aktif')}</span> : <span style={{ color: "#94a3b8" }}>{t('admin.units.status.passive', 'Pasif')}</span>),
          },
          {
            title: "",
            key: "action",
            width: 80,
            render: (_, record) => (
              <Button
                type="text"
                icon={<EditOutlined style={{ color: "#6f55ff" }} />}
                onClick={() => router.push(`/admin/units/${record.id}/edit`)}
              />
            )
          }
        ]}
      />

      <style jsx global>{`
        .ikas-style-table {
            background: #ffffff;
            border-radius: 12px;
            padding: 16px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .ikas-style-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid #f1f5f9 !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 16px 8px !important;
        }
        .ikas-style-table .ant-table-tbody > tr > td {
          padding: 16px 8px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .ikas-style-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
      `}</style>
    </>
  );
}
