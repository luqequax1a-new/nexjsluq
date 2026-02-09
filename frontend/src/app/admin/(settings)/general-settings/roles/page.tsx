"use client";

import { apiFetch } from "@/lib/api";
import { useAuth, hasPermission } from "@/lib/auth";
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { CheckSquareOutlined, CloseSquareOutlined, MinusSquareOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState, useCallback } from "react";

type Permission = {
  id: number;
  name: string;
};

type Role = {
  id: number;
  name: string;
  guard_name: string;
  permissions: string[]; // Changed from Permission[] to string[]
  created_at: string;
};

type RolesResponse = {
  roles: Role[];
  permissions: Permission[];
};

export default function RolesPage() {
  const { me } = useAuth();
  const { message } = App.useApp();
  const canManage = hasPermission(me, "roles.edit");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RolesResponse | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    return (data?.permissions ?? []).reduce((acc, p) => {
      const [module] = p.name.split('.');
      if (!acc[module]) acc[module] = [];
      acc[module].push(p);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [data]);

  // All permission names
  const allPermissionNames = useMemo(() => {
    return (data?.permissions ?? []).map(p => p.name);
  }, [data]);

  const load = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiFetch<Role[]>("/api/settings/roles", { method: "GET" }),
        apiFetch<Permission[]>("/api/settings/permissions", { method: "GET" }),
      ]);
      setData({ roles: rolesRes, permissions: permsRes });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load roles";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEdit = (role: Role) => {
    setActiveRole(role);
    setSelected(role.permissions); // Already string[]
    setModalOpen(true);
  };

  const save = async () => {
    if (!activeRole) return;
    if (!canManage) {
      message.error("No permission");
      return;
    }

    setSaving(true);
    try {
      await apiFetch<{ role: Role }>(`/api/settings/roles/${activeRole.id}`, {
        method: "PUT",
        json: { permissions: selected },
      });
      message.success("Saved");
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Save failed";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Toggle single permission - FIX: Properly handles individual checkbox changes
  const togglePermission = useCallback((permName: string, checked: boolean) => {
    setSelected(prev => {
      if (checked) {
        return prev.includes(permName) ? prev : [...prev, permName];
      } else {
        return prev.filter(p => p !== permName);
      }
    });
  }, []);

  // Select all permissions
  const selectAll = useCallback(() => {
    setSelected(allPermissionNames);
  }, [allPermissionNames]);

  // Deselect all permissions
  const deselectAll = useCallback(() => {
    setSelected([]);
  }, []);

  // Toggle all permissions in a module
  const toggleModule = useCallback((module: string, perms: Permission[]) => {
    const permNames = perms.map(p => p.name);
    const allSelected = permNames.every(p => selected.includes(p));

    if (allSelected) {
      // Deselect all in this module
      setSelected(prev => prev.filter(p => !permNames.includes(p)));
    } else {
      // Select all in this module
      setSelected(prev => {
        const newSelected = [...prev];
        permNames.forEach(p => {
          if (!newSelected.includes(p)) {
            newSelected.push(p);
          }
        });
        return newSelected;
      });
    }
  }, [selected]);

  // Check module selection state
  const getModuleState = useCallback((perms: Permission[]) => {
    const permNames = perms.map(p => p.name);
    const selectedCount = permNames.filter(p => selected.includes(p)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === permNames.length) return 'all';
    return 'partial';
  }, [selected]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Space style={{ justifyContent: "space-between" }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: "1.75rem" }}>
          Roles
        </Typography.Title>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          Permissions are editable via modal
        </div>
      </Space>

      <Table<Role>
        rowKey="id"
        loading={loading}
        dataSource={data?.roles ?? []}
        pagination={false}
        bordered={false}
        style={{ marginTop: 20 }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>
          },
          {
            title: "Permissions",
            render: (_, r) => <Tag color="blue">{r.permissions.length} Permissions</Tag>,
          },
          {
            title: "Actions",
            align: "right",
            render: (_, r) => (
              <Button
                onClick={() => openEdit(r)}
                disabled={!canManage}
                style={{ height: 36, borderRadius: 8 }}
                type="text"
              >
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title={activeRole ? `Rol Yetkilerini Düzenle: ${activeRole.name}` : "Rol Düzenle"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={save}
        okButtonProps={{ loading: saving, disabled: !canManage }}
        cancelButtonProps={{ disabled: saving }}
        width={850}
        okText="Değişiklikleri Kaydet"
      >
        {/* Quick Actions Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid #e6e9f5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Typography.Text strong style={{ fontSize: 14, color: '#374151' }}>
              Hızlı İşlemler
            </Typography.Text>
            <Tag color="purple" style={{ margin: 0 }}>
              {selected.length} / {allPermissionNames.length} seçili
            </Tag>
          </div>
          <Space size="small">
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              onClick={selectAll}
              size="small"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: 6,
                fontWeight: 500
              }}
            >
              Tümünü Seç
            </Button>
            <Button
              danger
              icon={<CloseSquareOutlined />}
              onClick={deselectAll}
              size="small"
              style={{ borderRadius: 6, fontWeight: 500 }}
            >
              Seçimi Kaldır
            </Button>
          </Space>
        </div>

        <div style={{ maxHeight: '55vh', overflowY: 'auto', padding: '4px 0' }}>
          {Object.entries(groupedPermissions).map(([module, perms]) => {
            const state = getModuleState(perms);
            return (
              <Card
                key={module}
                size="small"
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <span style={{ textTransform: 'uppercase', fontSize: 13, fontWeight: 700, color: '#5E5CE6' }}>
                        {module}
                      </span>
                      <Tag color={state === 'all' ? 'success' : state === 'partial' ? 'warning' : 'default'} style={{ fontSize: 11 }}>
                        {perms.filter(p => selected.includes(p.name)).length}/{perms.length}
                      </Tag>
                    </Space>
                    <Button
                      type="text"
                      size="small"
                      icon={state === 'all' ? <MinusSquareOutlined /> : <CheckSquareOutlined />}
                      onClick={() => toggleModule(module, perms)}
                      style={{
                        fontSize: 12,
                        color: state === 'all' ? '#ef4444' : '#10b981',
                        fontWeight: 500
                      }}
                    >
                      {state === 'all' ? 'Kaldır' : 'Hepsini Seç'}
                    </Button>
                  </div>
                }
                style={{ marginBottom: 12, borderRadius: 10, border: '1px solid #e5e7eb' }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <Row gutter={[16, 10]}>
                  {perms.map(p => (
                    <Col span={6} key={p.name}>
                      <Checkbox
                        checked={selected.includes(p.name)}
                        onChange={(e) => togglePermission(p.name, e.target.checked)}
                        style={{ fontSize: 13 }}
                      >
                        <span style={{
                          textTransform: 'capitalize',
                          color: selected.includes(p.name) ? '#1f2937' : '#6b7280'
                        }}>
                          {p.name.split('.')[1]}
                        </span>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Card>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
