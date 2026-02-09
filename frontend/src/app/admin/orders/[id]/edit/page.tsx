"use client";

import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { App, Form, Button, Input, Select, Row, Col, Divider, Table, Tag, Card as AntCard, Space, Typography, Statistic, Timeline, Avatar, Tabs } from "antd";
import {
    ShoppingOutlined,
    UserOutlined,
    EnvironmentOutlined,
    CreditCardOutlined,
    CarOutlined,
    FileTextOutlined,
    HistoryOutlined,
    DollarOutlined,
    MessageOutlined,
    WhatsAppOutlined,
    MailOutlined,
    SendOutlined
} from "@ant-design/icons";
import { useState, useEffect, useMemo } from "react";
import { PageLoader } from "@/components/admin/PageLoader";
import { t } from "@/lib/i18n";
import dayjs from "dayjs";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";

const { TextArea } = Input;
const { Text, Title } = Typography;

interface OrderDetailResponse {
    order: Order;
    customer_stats: {
        total_orders: number;
        total_spent: number;
        customer_order_number: number;
    } | null;
    customer_orders: any[];
}

export default function OrderEditPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;
    const { message } = App.useApp();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orderData, setOrderData] = useState<OrderDetailResponse | null>(null);
    const [activeTab, setActiveTab] = useState("general");
    const [messageChannel, setMessageChannel] = useState<'whatsapp' | 'email'>('whatsapp');
    const [messageSending, setMessageSending] = useState(false);
    const [whatsappForm] = Form.useForm();
    const [emailForm] = Form.useForm();

    // Whatsapp templates mock (In real app, fetch from backend)
    const whatsappTemplates = [
        { value: 'hello_world', label: 'Merhaba (Test)' },
        { value: 'order_confirmation', label: 'Sipariş Onayı' },
        { value: 'shipping_confirmation', label: 'Kargo Bilgisi' },
        { value: 'custom_message', label: 'Özel Mesaj (Serbest)' }
    ];

    useEffect(() => {
        if (!orderId) return;
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const data = await apiFetch<OrderDetailResponse>(`/api/orders/${orderId}`);
            setOrderData(data);

            form.setFieldsValue({
                status: data.order.status,
                payment_status: data.order.payment_status,
                payment_method: data.order.payment_method,
                shipping_tracking_number: data.order.shipping_tracking_number,
                shipping_carrier: data.order.shipping_carrier,
                admin_note: data.order.admin_note,
            });
        } catch (error: any) {
            message.error(error?.message || "Sipariş yüklenemedi");
            router.push("/admin/orders");
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        try {
            await form.validateFields();
            setSaving(true);
            const values = form.getFieldsValue();

            await apiFetch(`/api/orders/${orderId}`, {
                method: "PUT",
                json: values,
            });

            message.success("Sipariş başarıyla güncellendi");
            await loadOrder(); // Reload to get updated data
        } catch (e: any) {
            if (e.errorFields) return;
            message.error(e?.message || "Kayıt sırasında hata oluştu");
        } finally {
            setSaving(false);
        }
    };

    const navItems = useMemo(() => [
        { key: "general", label: "Genel Bilgiler", icon: <ShoppingOutlined /> },
        { key: "customer", label: "Müşteri Bilgileri", icon: <UserOutlined /> },
        { key: "items", label: "Sipariş Ürünleri", icon: <FileTextOutlined /> },
        { key: "addresses", label: "Adresler", icon: <EnvironmentOutlined /> },
        { key: "payment", label: "Ödeme & Kargo", icon: <CreditCardOutlined /> },
        { key: "message", label: "Müşteri İletişimi", icon: <MessageOutlined /> },
        { key: "history", label: "Geçmiş", icon: <HistoryOutlined /> },
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
        { label: "Siparişler", href: "/admin/orders" },
        { label: orderData?.order.order_number || "Sipariş Düzenle" }
    ], [orderData]);

    const headerExtra = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        title: orderData?.order.order_number || "Sipariş Düzenle",
        variant: "dark",
        breadcrumb,
        onBack: () => router.push('/admin/orders'),
        extra: headerExtra
    });

    if (loading) return <PageLoader />;
    if (!orderData) return null;

    const { order, customer_stats, customer_orders } = orderData;

    const itemColumns = [
        {
            title: 'Ürün',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: any) => (
                <Space>
                    {record.image && (
                        <Avatar src={record.image} shape="square" size={48} />
                    )}
                    <div>
                        <Text strong>{name}</Text>
                        {record.variant?.name && (
                            <>
                                <br />
                                <Tag color="blue" style={{ fontSize: 11 }}>{record.variant.name}</Tag>
                            </>
                        )}
                        {record.sku && (
                            <>
                                <br />
                                <Text type="secondary" style={{ fontSize: 11 }}>SKU: {record.sku}</Text>
                            </>
                        )}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Birim Fiyat',
            dataIndex: 'unit_price',
            key: 'unit_price',
            align: 'right' as const,
            render: (price: number) => `₺${Number(price || 0).toFixed(2)}`,
        },
        {
            title: 'Miktar',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
            render: (qty: number, record: any) => `${qty} ${record.unit_label || 'adet'}`,
        },
        {
            title: 'Toplam',
            dataIndex: 'line_total',
            key: 'line_total',
            align: 'right' as const,
            render: (total: number) => (
                <Text strong style={{ color: '#10b981' }}>
                    ₺{Number(total || 0).toFixed(2)}
                </Text>
            ),
        },
    ];

    const customerOrderColumns = [
        {
            title: 'Sipariş No',
            dataIndex: 'order_number',
            key: 'order_number',
            render: (text: string, record: any) => (
                <a onClick={() => router.push(`/admin/orders/${record.id}/edit`)} style={{ color: '#6f55ff', fontWeight: 600 }}>
                    {text}
                </a>
            ),
        },
        {
            title: 'Tarih',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
        },
        {
            title: 'Durum',
            dataIndex: 'status_label',
            key: 'status',
            render: (label: string) => <Tag>{label}</Tag>,
        },
        {
            title: 'Toplam',
            dataIndex: 'grand_total',
            key: 'grand_total',
            align: 'right' as const,
            render: (total: number) => `₺${Number(total || 0).toFixed(2)}`,
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
                        <SectionCard title="Genel Bilgiler" icon={<ShoppingOutlined />} id="general">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Sipariş Durumu" name="status">
                                        <Select>
                                            <Select.Option value="pending">Beklemede</Select.Option>
                                            <Select.Option value="confirmed">Onaylandı</Select.Option>
                                            <Select.Option value="processing">Hazırlanıyor</Select.Option>
                                            <Select.Option value="shipped">Kargoda</Select.Option>
                                            <Select.Option value="delivered">Teslim Edildi</Select.Option>
                                            <Select.Option value="cancelled">İptal Edildi</Select.Option>
                                            <Select.Option value="refunded">İade Edildi</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Ödeme Durumu" name="payment_status">
                                        <Select>
                                            <Select.Option value="pending">Bekliyor</Select.Option>
                                            <Select.Option value="paid">Ödendi</Select.Option>
                                            <Select.Option value="failed">Başarısız</Select.Option>
                                            <Select.Option value="refunded">İade</Select.Option>
                                            <Select.Option value="partial_refund">Kısmi İade</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <AntCard>
                                        <Statistic
                                            title="Ara Toplam"
                                            value={order.subtotal}
                                            precision={2}
                                            prefix="₺"
                                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                                        />
                                    </AntCard>
                                </Col>
                                <Col span={8}>
                                    <AntCard>
                                        <Statistic
                                            title="Kargo"
                                            value={order.shipping_total}
                                            precision={2}
                                            prefix="₺"
                                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}
                                        />
                                    </AntCard>
                                </Col>
                                <Col span={8}>
                                    <AntCard>
                                        <Statistic
                                            title="Genel Toplam"
                                            value={order.grand_total}
                                            precision={2}
                                            prefix="₺"
                                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}
                                        />
                                    </AntCard>
                                </Col>
                            </Row>

                            <Divider />

                            <Form.Item label="Yönetici Notu" name="admin_note">
                                <TextArea rows={4} placeholder="Sipariş hakkında notlar..." />
                            </Form.Item>
                        </SectionCard>

                        {/* Customer Information */}
                        <SectionCard title="Müşteri Bilgileri" icon={<UserOutlined />} id="customer">
                            {order.customer ? (
                                <>
                                    <Row gutter={16}>
                                        <Col span={18}>
                                            <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
                                                {order.customer.full_name}
                                            </Title>
                                            <Space direction="vertical">
                                                <Text><strong>E-posta:</strong> {order.customer.email}</Text>
                                                <Text><strong>Telefon:</strong> {order.customer.phone || '-'}</Text>
                                                <Text><strong>Grup:</strong> {order.customer.group}</Text>
                                            </Space>
                                        </Col>
                                        <Col span={6}>
                                            <Button
                                                type="link"
                                                onClick={() => router.push(`/admin/customers/${order.customer_id}/edit`)}
                                                style={{ padding: 0 }}
                                            >
                                                Müşteri Detayı
                                            </Button>
                                        </Col>
                                    </Row>

                                    {customer_stats && (
                                        <>
                                            <Divider />
                                            <Row gutter={16}>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Toplam Sipariş"
                                                        value={customer_stats.total_orders}
                                                        valueStyle={{ color: '#6f55ff', fontWeight: 700 }}
                                                    />
                                                </Col>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Toplam Harcama"
                                                        value={customer_stats.total_spent}
                                                        precision={2}
                                                        prefix="₺"
                                                        valueStyle={{ color: '#10b981', fontWeight: 700 }}
                                                    />
                                                </Col>
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Bu Sipariş"
                                                        value={`${customer_stats.customer_order_number}. Sipariş`}
                                                        valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: 16 }}
                                                    />
                                                </Col>
                                            </Row>

                                            {customer_orders && customer_orders.length > 0 && (
                                                <>
                                                    <Divider />
                                                    <Title level={5}>Müşterinin Diğer Siparişleri</Title>
                                                    <Table
                                                        dataSource={customer_orders}
                                                        columns={customerOrderColumns}
                                                        rowKey="id"
                                                        pagination={false}
                                                        size="small"
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <Text type="secondary">Misafir sipariş</Text>
                            )}
                        </SectionCard>

                        {/* Order Items */}
                        <SectionCard title="Sipariş Ürünleri" icon={<FileTextOutlined />} id="items">
                            <Table
                                dataSource={order.items || []}
                                columns={itemColumns}
                                rowKey="id"
                                pagination={false}
                            />
                        </SectionCard>

                        {/* Addresses */}
                        <SectionCard title="Adresler" icon={<EnvironmentOutlined />} id="addresses">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <AntCard title="Fatura Adresi" size="small">
                                        {order.billing_address ? (
                                            <>
                                                <Text strong>{order.billing_address.full_name}</Text><br />
                                                <Text>{order.billing_address.phone}</Text><br />
                                                <Text>{order.billing_address.email}</Text><br />
                                                <Divider style={{ margin: '12px 0' }} />
                                                <Text type="secondary">{order.billing_address.full_address}</Text>
                                            </>
                                        ) : (
                                            <Text type="secondary">Adres bilgisi yok</Text>
                                        )}
                                    </AntCard>
                                </Col>
                                <Col span={12}>
                                    <AntCard title="Teslimat Adresi" size="small">
                                        {order.shipping_address ? (
                                            <>
                                                <Text strong>{order.shipping_address.full_name}</Text><br />
                                                <Text>{order.shipping_address.phone}</Text><br />
                                                <Divider style={{ margin: '12px 0' }} />
                                                <Text type="secondary">{order.shipping_address.full_address}</Text>
                                            </>
                                        ) : (
                                            <Text type="secondary">Adres bilgisi yok</Text>
                                        )}
                                    </AntCard>
                                </Col>
                            </Row>
                        </SectionCard>

                        {/* Payment & Shipping */}
                        <SectionCard title="Ödeme & Kargo" icon={<CreditCardOutlined />} id="payment">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="Ödeme Yöntemi" name="payment_method">
                                        <Input prefix={<CreditCardOutlined />} placeholder="Ödeme yöntemi" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Kargo Firması" name="shipping_carrier">
                                        <Input prefix={<CarOutlined />} placeholder="Kargo firması" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Kargo Takip Numarası" name="shipping_tracking_number">
                                <Input placeholder="Takip numarası" />
                            </Form.Item>
                        </SectionCard>

                        {/* Customer Communication */}
                        <SectionCard title="Müşteri İletişimi" icon={<MessageOutlined />} id="message">
                            <Tabs
                                activeKey={messageChannel}
                                onChange={(key) => setMessageChannel(key as any)}
                                items={[
                                    {
                                        key: 'whatsapp',
                                        label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><WhatsAppOutlined style={{ color: '#25d366' }} /> WhatsApp</span>,
                                        children: (
                                            <div style={{ paddingTop: 16 }}>
                                                <Form layout="vertical" form={whatsappForm}>
                                                    <Form.Item label="Şablon Seçin" name="template">
                                                        <Select
                                                            placeholder="Bir şablon seçin"
                                                            options={whatsappTemplates}
                                                            onChange={(val) => {
                                                                // Here you could fill the textarea if allow custom editing
                                                            }}
                                                        />
                                                    </Form.Item>
                                                    <Form.Item
                                                        label="Mesaj İçeriği"
                                                        name="message"
                                                        help="Şu an sadece şablon gönderimi desteklenmektedir. Serbest metin yazdığınızda 'custom_message' şablonu kullanılır."
                                                    >
                                                        <TextArea rows={4} placeholder="Mesajınızı yazın..." />
                                                    </Form.Item>
                                                    <Button
                                                        type="primary"
                                                        icon={<SendOutlined />}
                                                        style={{ background: '#25d366', borderColor: '#25d366' }}
                                                        onClick={async () => {
                                                            try {
                                                                await whatsappForm.validateFields();
                                                                setMessageSending(true);
                                                                const values = whatsappForm.getFieldsValue();
                                                                // Mock template selection. Real implementation should take form values
                                                                await apiFetch(`/api/orders/${orderId}/messages`, {
                                                                    method: 'POST',
                                                                    json: {
                                                                        channel: 'whatsapp',
                                                                        template: values.template || 'hello_world'
                                                                    }
                                                                });
                                                                message.success('WhatsApp mesajı gönderildi');
                                                                whatsappForm.resetFields();
                                                            } catch (e: any) {
                                                                message.error(e.message || 'Gönderilemedi');
                                                            } finally {
                                                                setMessageSending(false);
                                                            }
                                                        }}
                                                        loading={messageSending}
                                                    >
                                                        WhatsApp Gönder
                                                    </Button>
                                                </Form>
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'email',
                                        label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MailOutlined style={{ color: '#ea4335' }} /> E-posta</span>,
                                        children: (
                                            <div style={{ paddingTop: 16 }}>
                                                <Form layout="vertical" form={emailForm}>
                                                    <Form.Item label="Konu" name="subject">
                                                        <Input placeholder="Siparişiniz hakkında" />
                                                    </Form.Item>
                                                    <Form.Item label="İçerik" name="content">
                                                        <TextArea rows={6} placeholder="Merhaba..." />
                                                    </Form.Item>
                                                    <Button icon={<SendOutlined />} type="primary">
                                                        E-posta Gönder
                                                    </Button>
                                                </Form>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </SectionCard>

                        {/* History */}
                        <SectionCard title="Sipariş Geçmişi" icon={<HistoryOutlined />} id="history">
                            {order.histories && order.histories.length > 0 ? (
                                <Timeline
                                    items={order.histories.map((h: any) => ({
                                        children: (
                                            <>
                                                <Text strong>{h.action_label || h.action}</Text>
                                                {h.note && (
                                                    <>
                                                        <br />
                                                        <Text type="secondary">{h.note}</Text>
                                                    </>
                                                )}
                                                <br />
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(h.created_at).format('DD.MM.YYYY HH:mm')}
                                                    {h.user && ` - ${h.user.name}`}
                                                </Text>
                                            </>
                                        ),
                                    }))}
                                />
                            ) : (
                                <Text type="secondary">Henüz geçmiş kaydı yok</Text>
                            )}
                        </SectionCard>

                    </div>
                </Form>
            </div>
        </>
    );
}
