"use client";

import { App, Button, Card, Form, Input, Modal, Space, Table, Tag, Popconfirm, Select } from "antd";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { usePageHeader } from "@/hooks/usePageHeader";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  created_at: string;
}

interface UsersResponse {
  users: User[];
  roles: Role[];
}

export default function UsersPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  usePageHeader({
    title: "Ekip ve Yetkiler",
    extra: (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingUser(null);
          form.resetFields();
          setModalOpen(true);
        }}
        style={{ background: "#5E5CE6", borderRadius: 8 }}
      >
        Yeni Üye Ekle
      </Button>
    ),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<UsersResponse>("/api/settings/users");
      setUsers(res.users || []);
      setRoles(res.roles || []);
    } catch (e: any) {
      message.error("Veriler yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async (values: any) => {
    try {
      if (editingUser) {
        await apiFetch(`/api/settings/users/${editingUser.id}`, {
          method: "PUT",
          json: values,
        });
        message.success("Kullanıcı güncellendi");
      } else {
        await apiFetch("/api/settings/users", {
          method: "POST",
          json: values,
        });
        message.success("Kullanıcı oluşturuldu");
      }
      setModalOpen(false);
      void loadData();
    } catch (e: any) {
      message.error(e.message || "İşlem başarısız");
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await apiFetch(`/api/settings/users/${user.id}`, { method: "DELETE" });
      message.success("Kullanıcı silindi");
      void loadData();
    } catch (e: any) {
      message.error(e.message || "Silme başarısız");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.roles[0]?.name,
    });
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <Table<User>
          rowKey="id"
          loading={loading}
          dataSource={users}
          pagination={false}
          columns={[
            {
              title: "Kullanıcı",
              key: "user",
              render: (_, user) => (
                <Space>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#f0f2f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserOutlined />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user.email}</div>
                  </div>
                </Space>
              ),
            },
            {
              title: "Rol",
              key: "role",
              render: (_, user) => (
                <Space wrap>
                  {user.roles.map((role) => (
                    <Tag key={role.id} color="blue" style={{ textTransform: 'capitalize' }}>
                      {role.name}
                    </Tag>
                  ))}
                  {user.roles.length === 0 && <Tag color="default">Rol Atanmamış</Tag>}
                </Space>
              ),
            },
            {
              title: "Katılma Tarihi",
              dataIndex: "created_at",
              key: "created_at",
              render: (date) => new Date(date).toLocaleDateString('tr-TR'),
            },
            {
              title: "İşlemler",
              key: "actions",
              align: "right",
              width: 200,
              render: (_, user) => (
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(user)}
                    style={{ color: "#5E5CE6" }}
                  >
                    Düzenle
                  </Button>
                  <Popconfirm
                    title="Bu kullanıcıyı silmek istediğinize emin misiniz?"
                    onConfirm={() => handleDelete(user)}
                    okText="Evet"
                    cancelText="Hayır"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      Sil
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingUser ? "Kullanıcı Düzenle" : "Yeni Üye Ekle"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={500}
        okText="Kaydet"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Ad Soyad"
            rules={[{ required: true, message: "Ad Soyad gereklidir" }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="E-posta"
            rules={[
              { required: true, message: "E-posta gereklidir" },
              { type: 'email', message: "Geçerli bir e-posta girin" }
            ]}
          >
            <Input placeholder="john@example.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: "Bir rol seçmelisiniz" }]}
          >
            <Select
              placeholder="Rol seçin"
              loading={loading}
              disabled={loading || roles.length === 0}
            >
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.name}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? "Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)" : "Şifre"}
            rules={editingUser ? [] : [{ required: true, message: "Şifre gereklidir" }]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            label="Şifre Tekrar"
            dependencies={['password']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
