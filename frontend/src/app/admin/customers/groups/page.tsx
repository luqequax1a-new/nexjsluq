"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    Table,
    Button,
    Input,
    Space,
    Tag,
    Modal,
    Form,
    InputNumber,
    Switch,
    Typography,
    App,
    Card,
    Tooltip,
    Divider,
    Checkbox,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    TeamOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useAuth, hasPermission } from "@/lib/auth";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface CustomerGroup {
    id: number;
    name: string;
    description: string | null;
    discount_percentage: number;
    is_active: boolean;
    customer_count: number;
    auto_assignment_rules: any | null;
    created_at: string;
}

export default function CustomerGroupsPage() {
    const { message, modal } = App.useApp();
    const { me } = useAuth();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadGroups = async (searchStr = search) => {
        setLoading(true);
        try {
            const res = await apiFetch<CustomerGroup[]>(`/api/customers/groups?search=${searchStr}`);
            setGroups(res);
        } catch (error) {
            message.error(t("admin.customer_groups.load_failed", "Müşteri grupları yüklenemedi"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const handleSearch = (v: string) => {
        setSearch(v);
        loadGroups(v);
    };

    const handleAdd = () => {
        setEditingGroup(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (group: CustomerGroup) => {
        setEditingGroup(group);
        form.setFieldsValue({
            ...group,
            has_auto_rules: !!group.auto_assignment_rules,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (group: CustomerGroup) => {
        modal.confirm({
            title: t("admin.common.are_you_sure", "Emin misiniz?"),
            content: t("admin.customer_groups.delete_confirm", "Bu müşteri grubunu silmek istediğinize emin misiniz?"),
            okText: t("admin.common.yes", "Evet"),
            okType: "danger",
            cancelText: t("admin.common.no", "Hayır"),
            onOk: async () => {
                try {
                    await apiFetch(`/api/customers/groups/${group.id}`, { method: "DELETE" });
                    message.success(t("admin.customer_groups.delete_success", "Müşteri grubu silindi"));
                    loadGroups();
                } catch (error: any) {
                    message.error(error.message || t("admin.common.error", "Bir hata oluştu"));
                }
            },
        });
    };

    const handleRunAssignment = async (group: CustomerGroup) => {
        try {
            const res: any = await apiFetch(`/api/customers/groups/${group.id}/run-assignment`, { method: "POST" });
            message.success(res.message);
            loadGroups();
        } catch (error: any) {
            message.error(error.message || "İşlem sırasında bir hata oluştu");
        }
    };

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const url = editingGroup ? `/api/customers/groups/${editingGroup.id}` : "/api/customers/groups";
            const method = editingGroup ? "PUT" : "POST";

            if (!values.has_auto_rules) {
                values.auto_assignment_rules = null;
            }

            await apiFetch(url, {
                method,
                json: values,
            });

            message.success(editingGroup ? t("admin.common.updated", "Güncellendi") : t("admin.common.created", "Oluşturuldu"));
            setIsModalOpen(false);
            loadGroups();
        } catch (error: any) {
            message.error(error.message || t("admin.common.error", "Bir hata oluştu"));
        } finally {
            setSubmitting(false);
        }
    };

    const headerExtra = useMemo(() => (
        <Space>
            <Input
                placeholder={t("admin.customer_groups.search_placeholder", "Grup ismi ile ara...")}
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                style={{ width: 300, borderRadius: 8 }}
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={() => handleSearch(search)}
            />
            {hasPermission(me, "customer_groups.create") && (
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ borderRadius: 8, height: 40, padding: "0 24px" }}
                >
                    {t("admin.customer_groups.new_group", "Yeni Grup")}
                </Button>
            )}
        </Space>
    ), [me, search]);

    usePageHeader({
        title: t("admin.customer_groups.title", "Müşteri Grupları"),
        extra: headerExtra,
    });

    const columns = [
        {
            title: t("admin.customer_groups.columns.name", "Grup Adı"),
            dataIndex: "name",
            key: "name",
            render: (text: string, record: CustomerGroup) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.description || "-"}</Text>
                </Space>
            ),
        },
        {
            title: t("admin.customer_groups.columns.discount", "İndirim Oranı"),
            dataIndex: "discount_percentage",
            key: "discount_percentage",
            render: (val: number) => val > 0 ? <Tag color="green">%{val} İndirim</Tag> : <Text type="secondary">-</Text>,
        },
        {
            title: t("admin.customer_groups.columns.customer_count", "Müşteri Sayısı"),
            dataIndex: "customer_count",
            key: "customer_count",
            render: (count: number) => (
                <Space>
                    <TeamOutlined style={{ color: "#8c8c8c" }} />
                    <Text>{count}</Text>
                </Space>
            ),
        },
        {
            title: t("admin.customer_groups.columns.type", "Tip"),
            key: "type",
            render: (_: any, record: CustomerGroup) => (
                record.auto_assignment_rules ? (
                    <Tag icon={<ThunderboltOutlined />} color="processing">Dinamik</Tag>
                ) : (
                    <Tag color="default">Statik</Tag>
                )
            ),
        },
        {
            title: t("admin.common.status", "Durum"),
            dataIndex: "is_active",
            key: "is_active",
            render: (active: boolean) => (
                <Tag color={active ? "success" : "default"}>
                    {active ? t("admin.common.active", "Aktif") : t("admin.common.passive", "Pasif")}
                </Tag>
            ),
        },
        {
            title: t("admin.common.actions", "İşlemler"),
            key: "actions",
            width: 150,
            align: "right" as const,
            render: (_: any, record: CustomerGroup) => (
                <Space>
                    {record.auto_assignment_rules && hasPermission(me, "customer_groups.edit") && (
                        <Tooltip title="Otomatik Atamayı Çalıştır">
                            <Button type="text" icon={<ThunderboltOutlined />} onClick={() => handleRunAssignment(record)} />
                        </Tooltip>
                    )}
                    {hasPermission(me, "customer_groups.edit") && (
                        <Tooltip title={t("admin.common.edit", "Düzenle")}>
                            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                        </Tooltip>
                    )}
                    {hasPermission(me, "customer_groups.destroy") && (
                        <Tooltip title={t("admin.common.delete", "Sil")}>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card variant="borderless" style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}>
                <Table
                    columns={columns}
                    dataSource={groups}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                />
            </Card>

            <Modal
                title={editingGroup ? t("admin.customer_groups.edit_group", "Grubu Düzenle") : t("admin.customer_groups.new_group", "Yeni Müşteri Grubu")}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                width={600}
                centered
                okText={t("admin.common.save", "Kaydet")}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ is_active: true, discount_percentage: 0 }}
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="name"
                        label={t("admin.customer_groups.form.name", "Grup Adı")}
                        rules={[{ required: true, message: t("admin.common.required", "Bu alan zorunludur") }]}
                    >
                        <Input placeholder="Örn: VIP Müşteriler" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={t("admin.common.description", "Açıklama")}
                    >
                        <TextArea rows={2} />
                    </Form.Item>

                    <Form.Item
                        name="discount_percentage"
                        label={t("admin.customer_groups.form.discount", "Grup İndirim Oranı (%)")}
                        extra="Bu gruba dahil olan tüm müşterilere otomatik uygulanacak indirim oranı."
                    >
                        <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="is_active" valuePropName="checked" label={t("admin.common.status", "Durum")}>
                        <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                    </Form.Item>

                    <Divider />

                    <Form.Item name="has_auto_rules" valuePropName="checked">
                        <Checkbox onChange={() => { }}>
                            <Text strong>Otomatik Atama Kuralları</Text>
                        </Checkbox>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.has_auto_rules !== curr.has_auto_rules}
                    >
                        {({ getFieldValue }) => getFieldValue('has_auto_rules') && (
                            <Card size="small" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                                    Aşağıdaki kriterleri sağlayan müşteriler bu gruba otomatik olarak dahil edilir.
                                </Paragraph>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Form.Item
                                        name={['auto_assignment_rules', 'min_total_spent']}
                                        label="Minimum Toplam Harcama (₺)"
                                        style={{ marginBottom: 12 }}
                                    >
                                        <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item
                                        name={['auto_assignment_rules', 'min_total_orders']}
                                        label="Minimum Sipariş Sayısı"
                                        style={{ marginBottom: 4 }}
                                    >
                                        <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Space>
                            </Card>
                        )}
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
