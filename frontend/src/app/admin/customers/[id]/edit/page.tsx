"use client";

import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { App, Form, Button, Input, Select, Switch, Row, Col, Divider, Table, Tag, Statistic, Card as AntCard, Space, Typography, Dropdown } from "antd";
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    ShoppingOutlined,
    HistoryOutlined,
    IdcardOutlined,
    MoreOutlined,
    StopOutlined,
    CheckCircleOutlined,
    DeleteOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { type MenuProps, Modal } from "antd";
import { useState, useEffect, useMemo } from "react";
import { PageLoader } from "@/components/admin/PageLoader";
import { t } from "@/lib/i18n";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Text, Title } = Typography;

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string | null;
    national_id: string | null;
    group: 'normal' | 'vip' | 'wholesale';
    total_spent: number;
    total_orders: number;
    last_order_at: string | null;
    notes: string | null;
    is_active: boolean;
    accepts_marketing: boolean;
    created_at: string;
    addresses?: any[];
}

interface CustomerStats {
    total_orders: number;
    total_spent: number;
    avg_order_value: number;
    last_order_date: string | null;
}

export default function CustomerEditPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = params?.id as string;
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        if (!customerId) return;
        loadCustomer();
    }, [customerId]);

    const loadCustomer = async () => {
        try {
            setLoading(true);
            const data = await apiFetch<Customer>(`/api/customers/${customerId}`);
            setCustomer(data);
            form.setFieldsValue({
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                national_id: data.national_id,
                group: data.group,
                notes: data.notes,
                is_active: data.is_active,
                accepts_marketing: data.accepts_marketing,
            });

            // Load stats
            const statsData = await apiFetch<CustomerStats>(`/api/customers/${customerId}/stats`);
            setStats(statsData);

            // Load recent orders
            const ordersData = await apiFetch<any>(`/api/customers/${customerId}/orders?limit=5`);
            setRecentOrders(ordersData.data || []);
        } catch (error: any) {
            message.error(error?.message || "Müşteri yüklenemedi");
            router.push("/admin/customers");
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        try {
            await form.validateFields();
            setSaving(true);
            const values = form.getFieldsValue();

            await apiFetch(`/api/customers/${customerId}`, {
                method: "PUT",
                json: values,
            });

            message.success("Müşteri başarıyla güncellendi");
            router.push("/admin/customers");
        } catch (e: any) {
            if (e.errorFields) return;
            message.error(e?.message || "Kayıt sırasında hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async () => {
        if (!customer) return;
        const newStatus = !customer.is_active;
        try {
            setLoading(true);
            await apiFetch(`/api/customers/${customerId}`, {
                method: "PUT",
                json: { ...customer, is_active: newStatus }
            });
            setCustomer({ ...customer, is_active: newStatus });
            message.success(`Müşteri ${newStatus ? 'aktif' : 'pasif'} duruma getirildi`);
        } catch (e: any) {
            message.error(e?.message || "Durum güncellenemedi");
        } finally {
            setLoading(false);
        }
    };

    const deleteCustomer = () => {
        Modal.confirm({
            title: "Müşteriyi Sil",
            content: "Bu müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
            okText: "Sil",
            okType: "danger",
            cancelText: "İptal",
            onOk: async () => {
                try {
                    await apiFetch(`/api/customers/${customerId}`, { method: "DELETE" });
                    message.success("Müşteri silindi");
                    router.push("/admin/customers");
                } catch (e: any) {
                    message.error(e?.message || "Silme işlemi başarısız");
                }
            }
        });
    };

    const navItems = useMemo(() => [
        { key: "general", label: "Genel Bilgiler", icon: <UserOutlined /> },
        { key: "stats", label: "İstatistikler", icon: <ShoppingOutlined /> },
        { key: "orders", label: "Sipariş Geçmişi", icon: <HistoryOutlined /> },
        { key: "addresses", label: "Adresler", icon: <HomeOutlined /> },
    ], []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        const scrollContainer = document.getElementById('admin-focus-content');
        if (element && scrollContainer) {
            const elementRect = element.getBoundingClientRect().top;
            const containerRect = scrollContainer.getBoundingClientRect().top;
            scrollContainer.scrollBy({ top: elementRect - containerRect - 64, behavior: "smooth" });
            setActiveTab(id);
        }
    };

    useEffect(() => {
        const scrollContainer = document.getElementById('admin-focus-content');
        if (!scrollContainer) return;

        const handleScroll = () => {
            const scrollOffset = 64;
            const containerRect = scrollContainer.getBoundingClientRect();
            const containerTop = containerRect.top;

            let currentSection = navItems[0].key;

            for (const item of navItems) {
                const element = document.getElementById(item.key);
                if (element) {
                    const elementTopRelative = element.getBoundingClientRect().top - containerTop;
                    if (elementTopRelative <= (scrollOffset + 20)) {
                        currentSection = item.key;
                    }
                }
            }

            setActiveTab((prev) => prev !== currentSection ? currentSection : prev);
        };

        scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, [navItems]);

    const breadcrumb = useMemo(() => [
        { label: "Müşteriler", href: "/admin/customers" },
        { label: customer?.full_name || "Müşteri Düzenle" }
    ], [customer]);

    const actionItems: MenuProps['items'] = [
        {
            key: 'status',
            label: customer?.is_active ? 'Pasife Al' : 'Aktifleştir',
            icon: customer?.is_active ? <StopOutlined /> : <CheckCircleOutlined />,
            onClick: toggleStatus
        },
        {
            type: 'divider'
        },
        {
            key: 'delete',
            label: 'Müşteriyi Sil',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: deleteCustomer
        }
    ];

    const headerExtra = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dropdown menu={{ items: actionItems }} trigger={['click']}>
                <Button icon={<MoreOutlined />} style={{ borderRadius: '8px' }} />
            </Dropdown>
            <Button
                type="primary"
                onClick={() => save()}
                loading={saving}
                style={{
                    height: 40,
                    background: '#6f55ff',
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '0 20px',
                    border: 'none',
                    boxShadow: '0 2px 4px rgba(111, 85, 255, 0.2)'
                }}
            >
                Kaydet
            </Button>
        </div>
    );

    usePageHeader({
        title: customer?.full_name || "Müşteri Düzenle",
        variant: "dark",
        breadcrumb,
        onBack: () => router.push('/admin/customers'),
        extra: headerExtra
    });

    if (loading) return <PageLoader />;

    const orderColumns = [
        {
            title: 'Sipariş No',
            dataIndex: 'order_number',
            key: 'order_number',
            render: (text: string, record: any) => (
                <a onClick={() => router.push(`/admin/orders/${record.id}`)} style={{ color: '#6f55ff', fontWeight: 600 }}>
                    {text}
                </a>
            ),
        },
        {
            title: 'Tarih',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
        },
        {
            title: 'Durum',
            dataIndex: 'status_label',
            key: 'status',
            render: (label: string, record: any) => (
                <Tag color={record.status === 'delivered' ? 'success' : record.status === 'cancelled' ? 'error' : 'processing'}>
                    {label}
                </Tag>
            ),
        },
        {
            title: 'Toplam',
            dataIndex: 'grand_total',
            key: 'grand_total',
            align: 'right' as const,
            render: (total: number) => (
                <Text strong style={{ color: '#10b981' }}>
                    ₺{Number(total || 0).toFixed(2)}
                </Text>
            ),
        },
    ];

    return (
        <>
            <div className="style__TabsOutWrapper-sc-qv7pln-1 eVQtki" style={{ position: "sticky", top: 0, zIndex: 90, backgroundColor: "#ffffff", width: "100%", height: "clamp(44px, 8vw, 55px)", display: "flex", alignItems: "flex-end", justifyContent: "center", borderBottom: "1px solid #e2e8f0" }}>
                <div className="style__TabsWrapper-sc-qv7pln-0 jrQRht">
                    <div className="ant-tabs ant-tabs-top sc-fydGpi kNaWur css-1srkwla">
                        <div role="tablist" className="ant-tabs-nav" style={{ marginBottom: 0 }}>
                            <div className="ant-tabs-nav-wrap">
                                <div className="hide-scrollbar ant-tabs-nav-list" style={{ display: "flex", gap: "clamp(16px, 3vw, 40px)", justifyContent: "center", overflowX: "auto", scrollbarWidth: "none" }}>
                                    {navItems.map(item => (
                                        <div key={item.key} className={`ant-tabs-tab ${activeTab === item.key ? "ant-tabs-tab-active" : ""}`} onClick={() => scrollToSection(item.key)} style={{ margin: 0 }}>
                                            <div role="tab" aria-selected={activeTab === item.key} className="ant-tabs-tab-btn" style={{ padding: "8px 12px 12px 12px", cursor: "pointer", fontSize: "clamp(12px, 2.5vw, 14px)", fontWeight: 500, color: activeTab === item.key ? "#6f55ff" : "#64748b", borderBottom: `2px solid ${activeTab === item.key ? "#6f55ff" : "transparent"}`, transition: "all 0.3s", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                                                <span style={{ fontSize: "clamp(14px, 3vw, 16px)" }}>{item.icon}</span>
                                                <span className="group">{item.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="admin-focus-content" style={{ width: "100%", paddingBottom: 100, height: '100%', overflowY: 'auto' }}>
                <Form
                    form={form}
                    layout="vertical"
                    style={{ width: "100%" }}
                >
                    <div style={{ maxWidth: "clamp(600px, 90vw, 1200px)", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) 24px 0 24px" }}>

                        {/* General Information */}
                        <SectionCard title="Genel Bilgiler" icon={<UserOutlined />} id="general">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Ad"
                                        name="first_name"
                                        rules={[{ required: true, message: 'Ad zorunludur' }]}
                                    >
                                        <Input prefix={<UserOutlined />} placeholder="Ad" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Soyad"
                                        name="last_name"
                                        rules={[{ required: true, message: 'Soyad zorunludur' }]}
                                    >
                                        <Input prefix={<UserOutlined />} placeholder="Soyad" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="E-posta"
                                        name="email"
                                        rules={[
                                            { required: true, message: 'E-posta zorunludur' },
                                            { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
                                        ]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder="ornek@email.com" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Telefon"
                                        name="phone"
                                    >
                                        <Input prefix={<PhoneOutlined />} placeholder="+90 555 123 4567" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="TC Kimlik No"
                                        name="national_id"
                                    >
                                        <Input prefix={<IdcardOutlined />} placeholder="12345678901" maxLength={11} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Müşteri Grubu"
                                        name="group"
                                    >
                                        <Select>
                                            <Select.Option value="normal">Normal</Select.Option>
                                            <Select.Option value="vip">VIP</Select.Option>
                                            <Select.Option value="wholesale">Toptan</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                label="Notlar"
                                name="notes"
                            >
                                <TextArea rows={4} placeholder="Müşteri hakkında notlar..." />
                            </Form.Item>

                            <Divider />

                            <Form.Item
                                label="Pazarlama E-postaları"
                                name="accepts_marketing"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Evet" unCheckedChildren="Hayır" />
                            </Form.Item>
                        </SectionCard>

                        {/* Statistics */}
                        <SectionCard title="İstatistikler" icon={<ShoppingOutlined />} id="stats">
                            <Row gutter={16}>
                                <Col span={6}>
                                    <AntCard>
                                        <Statistic
                                            title="Toplam Sipariş"
                                            value={stats?.total_orders || 0}
                                            valueStyle={{ color: '#6f55ff', fontWeight: 700 }}
                                        />
                                    </AntCard>
                                </Col>
                                <Col span={6}>
                                    <AntCard>
                                        <Statistic
                                            title="Toplam Harcama"
                                            value={stats?.total_spent || 0}
                                            precision={2}
                                            prefix="₺"
                                            valueStyle={{ color: '#10b981', fontWeight: 700 }}
                                        />
                                    </AntCard>
                                </Col>
                                <Col span={6}>
                                    <AntCard>
                                        <Statistic
                                            title="Ortalama Sipariş"
                                            value={stats?.avg_order_value || 0}
                                            precision={2}
                                            prefix="₺"
                                            valueStyle={{ color: '#f59e0b', fontWeight: 700 }}
                                        />
                                    </AntCard>
                                </Col>
                                <Col span={6}>
                                    <AntCard>
                                        <Statistic
                                            title="Son Sipariş"
                                            value={stats?.last_order_date ? dayjs(stats.last_order_date).format('DD.MM.YYYY') : '-'}
                                            valueStyle={{ color: '#64748b', fontWeight: 700, fontSize: 16 }}
                                        />
                                    </AntCard>
                                </Col>
                            </Row>
                        </SectionCard>

                        {/* Recent Orders */}
                        <SectionCard title="Son Siparişler" icon={<HistoryOutlined />} id="orders">
                            <Table
                                dataSource={recentOrders}
                                columns={orderColumns}
                                rowKey="id"
                                pagination={false}
                                locale={{ emptyText: 'Henüz sipariş bulunmuyor' }}
                            />
                            {recentOrders.length > 0 && (
                                <div style={{ marginTop: 16, textAlign: 'center' }}>
                                    <Button type="link" onClick={() => router.push(`/admin/orders?customer_id=${customerId}`)}>
                                        Tüm Siparişleri Görüntüle
                                    </Button>
                                </div>
                            )}
                        </SectionCard>

                        {/* Addresses */}
                        <SectionCard title="Adresler" icon={<HomeOutlined />} id="addresses">
                            {customer?.addresses && customer.addresses.length > 0 ? (
                                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                    {customer.addresses.map((address: any) => (
                                        <AntCard key={address.id} size="small">
                                            <Row gutter={16}>
                                                <Col span={18}>
                                                    <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                                                        {address.title || 'Adres'}
                                                        {address.is_default_billing && <Tag color="blue" style={{ marginLeft: 8 }}>Fatura</Tag>}
                                                        {address.is_default_shipping && <Tag color="green" style={{ marginLeft: 8 }}>Teslimat</Tag>}
                                                    </Title>
                                                    <Text>{address.full_name}</Text><br />
                                                    <Text type="secondary">{address.phone}</Text><br />
                                                    <Text type="secondary">{address.full_address}</Text>
                                                </Col>
                                                <Col span={6} style={{ textAlign: 'right' }}>
                                                    <Tag color={address.type === 'corporate' ? 'purple' : 'default'}>
                                                        {address.type === 'corporate' ? 'Kurumsal' : 'Bireysel'}
                                                    </Tag>
                                                </Col>
                                            </Row>
                                        </AntCard>
                                    ))}
                                </Space>
                            ) : (
                                <Text type="secondary">Henüz kayıtlı adres bulunmuyor</Text>
                            )}
                        </SectionCard>

                    </div>
                </Form>
            </div>
        </>
    );
}
