"use client";

import { App, Button, Dropdown, Input, Modal, Form, Select, Switch, Table, Tag, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  StopOutlined,
  SwapOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import { apiFetch } from "@/lib/api";
import { usePageHeader } from "@/hooks/usePageHeader";

type RedirectRow = {
  id: number;
  source_path: string;
  target_url: string;
  target_type: string;
  status_code: number;
  is_active: boolean;
  is_auto: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function AdminRedirectsPage() {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  const load = async (p = page, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), per_page: "25" });
      if (q) params.set("search", q);
      const res = await apiFetch<any>(`/api/redirects?${params}`);
      setData(res);
    } catch (e: any) {
      message.error(e?.message || "Yönlendirmeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo<RedirectRow[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const total = data?.total || rows.length;

  usePageHeader({
    title: "URL Yönlendirmeleri",
    breadcrumb: [{ label: "SEO" }, { label: "Yönlendirmeler" }],
    extra: (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => openForm()}
        style={{ background: "#111827", borderColor: "#111827", borderRadius: 8, fontWeight: 700, height: 40 }}
      >
        Yeni Yönlendirme
      </Button>
    ),
  });

  const openForm = (row?: RedirectRow) => {
    if (row) {
      setEditingId(row.id);
      form.setFieldsValue({
        source_path: row.source_path,
        target_url: row.target_url,
        status_code: row.status_code,
        is_active: row.is_active,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ status_code: 301, is_active: true });
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);

      if (editingId) {
        await apiFetch(`/api/redirects/${editingId}`, { method: "PUT", json: values });
        message.success("Yönlendirme güncellendi");
      } else {
        await apiFetch("/api/redirects", { method: "POST", json: values });
        message.success("Yönlendirme oluşturuldu");
      }

      setFormOpen(false);
      form.resetFields();
      void load();
    } catch (e: any) {
      if (e?.message) message.error(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (row: RedirectRow) => {
    modal.confirm({
      title: "Silmek istediğinize emin misiniz?",
      content: `${row.source_path} → ${row.target_url}`,
      okText: "Sil",
      okType: "danger",
      cancelText: "Vazgeç",
      onOk: async () => {
        try {
          await apiFetch(`/api/redirects/${row.id}`, { method: "DELETE" });
          message.success("Silindi");
          void load();
        } catch (e: any) {
          message.error(e?.message || "Silinemedi");
        }
      },
    });
  };

  const handleToggle = async (row: RedirectRow) => {
    try {
      await apiFetch(`/api/redirects/${row.id}/toggle`, { method: "POST" });
      message.success(row.is_active ? "Pasif yapıldı" : "Aktif edildi");
      void load();
    } catch (e: any) {
      message.error(e?.message || "İşlem başarısız");
    }
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Kaynak veya hedef URL ara..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => { setPage(1); void load(1, search); }}
          allowClear
          onClear={() => { setSearch(""); setPage(1); void load(1, ""); }}
          style={{ maxWidth: 400 }}
        />
      </div>

      <Table
        loading={loading}
        rowKey="id"
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: 25,
          total,
          onChange: (p) => { setPage(p); void load(p, search); },
          showTotal: (t) => `Toplam ${t} yönlendirme`,
        }}
        columns={[
          {
            title: "Kaynak → Hedef",
            key: "paths",
            render: (_: unknown, r: RedirectRow) => (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  <span style={{ color: "#dc2626" }}>{r.source_path}</span>
                  <SwapOutlined style={{ margin: "0 8px", color: "#94a3b8" }} />
                  <span style={{ color: "#16a34a" }}>{r.target_url}</span>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {r.is_auto && <Tag color="blue" style={{ fontSize: 10 }}>Otomatik</Tag>}
                  {r.created_at && new Date(r.created_at).toLocaleDateString("tr-TR")}
                </div>
              </div>
            ),
          },
          {
            title: "Kod",
            dataIndex: "status_code",
            key: "status_code",
            width: 80,
            render: (v: number) => (
              <Tag color={v === 301 ? "orange" : "blue"}>{v}</Tag>
            ),
          },
          {
            title: "Durum",
            dataIndex: "is_active",
            key: "is_active",
            width: 100,
            render: (v: boolean) =>
              v ? <Tag color="green">Aktif</Tag> : <Tag>Pasif</Tag>,
          },
          {
            title: "Aksiyon",
            key: "actions",
            width: 80,
            render: (_: unknown, r: RedirectRow) => (
              <Dropdown
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: "edit",
                      icon: <EditOutlined />,
                      label: "Düzenle",
                      onClick: () => openForm(r),
                    },
                    r.is_active
                      ? {
                          key: "deactivate",
                          icon: <StopOutlined />,
                          label: "Pasif Yap",
                          onClick: () => void handleToggle(r),
                        }
                      : {
                          key: "activate",
                          icon: <CheckOutlined />,
                          label: "Aktif Et",
                          onClick: () => void handleToggle(r),
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

      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {editingId ? "Yönlendirme Düzenle" : "Yeni Yönlendirme Oluştur"}
          </div>
        }
        open={formOpen}
        onCancel={() => { setFormOpen(false); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={formLoading}
        okText={editingId ? "Güncelle" : "Oluştur"}
        cancelText="Vazgeç"
        okButtonProps={{
          style: { background: "#111827", borderColor: "#111827", borderRadius: 8, fontWeight: 700, height: 40, minWidth: 120 },
        }}
        cancelButtonProps={{
          style: { borderRadius: 8, height: 40, minWidth: 100 },
        }}
        width={640}
        centered
        destroyOnClose
      >
        <div style={{ padding: "8px 0 0" }}>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
            Eski URL'den yeni URL'ye kalıcı veya geçici yönlendirme tanımlayın. SEO değerini korumak için 301 (kalıcı) tercih edilir.
          </p>

          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item
              name="source_path"
              label={<span style={{ fontWeight: 600 }}>Kaynak URL</span>}
              rules={[{ required: true, message: "Kaynak URL gerekli" }]}
              extra={<span style={{ color: "#94a3b8", fontSize: 12 }}>Yönlendirilecek eski sayfa yolu — Örn: /urun/eski-urun-slug</span>}
            >
              <Input placeholder="/eski-sayfa-yolu" size="large" />
            </Form.Item>

            <Form.Item
              name="target_url"
              label={<span style={{ fontWeight: 600 }}>Hedef URL</span>}
              rules={[{ required: true, message: "Hedef URL gerekli" }]}
              extra={<span style={{ color: "#94a3b8", fontSize: 12 }}>Ziyaretçinin yönlendirileceği yeni sayfa yolu — Örn: /urun/yeni-urun-slug</span>}
            >
              <Input placeholder="/yeni-sayfa-yolu" size="large" />
            </Form.Item>

            <div style={{ display: "flex", gap: 24 }}>
              <Form.Item
                name="status_code"
                label={<span style={{ fontWeight: 600 }}>Durum Kodu</span>}
                rules={[{ required: true }]}
                style={{ flex: 1 }}
              >
                <Select size="large">
                  <Select.Option value={301}>301 — Kalıcı Yönlendirme</Select.Option>
                  <Select.Option value={302}>302 — Geçici Yönlendirme</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="is_active"
                label={<span style={{ fontWeight: 600 }}>Durum</span>}
                valuePropName="checked"
              >
                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
