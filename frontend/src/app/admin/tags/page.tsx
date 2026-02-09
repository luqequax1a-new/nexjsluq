"use client";

import { App, Button, Drawer, Form, Input, Table } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";

import { t } from "@/lib/i18n";

type TagRow = {
  id: number;
  name: string;
};

export default function TagsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TagRow[]>([]);
  const [query, setQuery] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  const headerExtra = useMemo(() => (
    <Button type="primary" icon={<PlusOutlined />} style={{ background: "#5E5CE6", borderColor: "#5E5CE6", fontWeight: 700, height: 40, borderRadius: 8 }} onClick={() => setDrawerOpen(true)}>
      {t('admin.tags.add_button', 'Etiket Ekle')}
    </Button>
  ), []);

  usePageHeader({
    title: t('admin.tags.title', 'Etiketler'),
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
      const res = await apiFetch<Array<{ id: number; name: string }>>("/api/tags?query=&limit=50", { method: "GET" });
      setRows(res);
    } catch (e: any) {
      message.error(e?.message || t('admin.tags.load_failed', 'Etiketler yüklenemedi'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await apiFetch("/api/tags", { method: "POST", json: values });
      message.success(t('admin.tags.saved', 'Etiket eklendi'));
      setDrawerOpen(false);
      form.resetFields();
      await load();
    } catch (e: any) {
      if (e?.name === "ValidateError") return;
      message.error(e?.message || t('admin.tags.save_failed', 'Kayıt başarısız'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ padding: "16px 24px 0", marginBottom: 16 }}>
        <Input
          placeholder={t('admin.tags.search_placeholder', 'Etiketlerde arama yapın...')}
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 320, height: 40, borderRadius: 8 }}
        />
      </div>

      <Table<TagRow>
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        pagination={false}
        className="ikas-style-table"
        columns={[
          {
            title: t('admin.tags.columns.name', 'Ad'),
            dataIndex: "name",
            render: (v) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{v}</span>
          }
        ]}
      />

      <Drawer
        title={<span style={{ fontWeight: 700 }}>{t('admin.tags.drawer_title', 'Etiket Ekle')}</span>}
        placement="right"
        width={420}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{
          header: { borderBottom: "1px solid #f1f5f9" },
          footer: { borderTop: "1px solid #f1f5f9", padding: "16px 24px" }
        }}
        footer={
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ height: 40, borderRadius: 8, fontWeight: 500 }}>
              {t('admin.common.vazgec', 'Vazgeç')}
            </Button>
            <Button type="primary" onClick={save} loading={saving} style={{ background: "#5E5CE6", borderColor: "#5E5CE6", flex: 1, height: 40, borderRadius: 8, fontWeight: 600 }}>
              {t('admin.common.save', 'Kaydet')}
            </Button>
          </div>
        }
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label={t('admin.tags.form.name_label', 'Ad *')} rules={[{ required: true, message: t('admin.tags.form.name_required', 'Ad zorunludur') }]}>
            <Input placeholder={t('admin.tags.form.name_placeholder', 'Etiket adı yazın...')} style={{ height: 40, borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Drawer>

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
