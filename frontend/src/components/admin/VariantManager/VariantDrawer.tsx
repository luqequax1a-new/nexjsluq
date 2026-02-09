"use client";

import {
    Drawer, Form, Input,
    Radio, Space, Button,
    Typography, Checkbox,
    Divider, Tag, App, Select,
    Tabs, Spin, Empty, ColorPicker
} from "antd";
import { useState, useEffect, useRef } from "react";
import { UnorderedListOutlined, BgColorsOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, EditOutlined, FileImageOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { Variation, VariationType } from "@/types/product";

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const VARIATION_TYPE_OPTIONS: Array<{
    value: VariationType;
    title: string;
    subtitle: string;
    icon: JSX.Element;
}> = [
    { value: "text", title: "Metin", subtitle: "Liste", icon: <UnorderedListOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
    { value: "button", title: "Buton", subtitle: "Metin Buton", icon: <UnorderedListOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
    { value: "dropdown", title: "Acilir", subtitle: "Secim Listesi", icon: <UnorderedListOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
    { value: "pill", title: "Pill", subtitle: "Yuvarlak Etiket", icon: <UnorderedListOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
    { value: "radio", title: "Radio", subtitle: "Daire Secim", icon: <UnorderedListOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
    { value: "color", title: "Renk", subtitle: "Renk Secimi", icon: <BgColorsOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
    { value: "image", title: "Gorsel", subtitle: "Resim Secimi", icon: <FileImageOutlined style={{ fontSize: 20, marginBottom: 8, display: "block" }} /> },
];

interface VariantDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: (values: any) => void;
    initialValues?: any;
}

export function VariantDrawer({ open, onClose, onSave, initialValues }: VariantDrawerProps) {
    const [form] = Form.useForm();
    const watchedType = Form.useWatch('type', form);
    const { message } = App.useApp();
    const [mode, setMode] = useState<"template" | "custom">("template");
    const [globalVariations, setGlobalVariations] = useState<Variation[]>([]);
    const [loadingGlobals, setLoadingGlobals] = useState(false);
    const [selectedGlobalId, setSelectedGlobalId] = useState<number | null>(null);
    const [selectedGlobalValues, setSelectedGlobalValues] = useState<string[]>([]);

    // Manual Creation State
    const [manualInput, setManualInput] = useState("");
    const manualValueIdRef = useRef(0);
    const [manualValues, setManualValues] = useState<{ id: string, label: string, color?: string, image?: string, position?: number }[]>([]);

    useEffect(() => {
        if (open) {
            fetchGlobalVariations();
            form.resetFields();
            setSelectedGlobalId(null);
            setSelectedGlobalValues([]);
            setManualValues([]);
            setManualInput("");

            if (initialValues) {
                const isGlobal = Boolean((initialValues as any).is_global);

                if (isGlobal) {
                    // Global şema: ürün içinde sadece seçim yapılır
                    setMode("template");
                    setSelectedGlobalId((initialValues as any).global_id ?? null);
                    setSelectedGlobalValues(
                        Array.isArray((initialValues as any).values)
                            ? (initialValues as any).values.map((v: any) => v.label)
                            : [],
                    );
                } else {
                    // Ürüne özel: değer ekle/çıkar yapılır
                    setMode("custom");
                    form.setFieldsValue({
                        ...initialValues,
                    });

                    if ((initialValues as any).values) {
                        setManualValues((initialValues as any).values.map((v: any, i: number) => ({
                            id: String(v?.id ?? `temp-manual-${Date.now()}-${manualValueIdRef.current++}-${i}`),
                            label: v.label,
                            color: v.color,
                            image: v.image,
                            position: v.position
                        })));
                    } else if ((initialValues as any).options) {
                        setManualValues(
                            (initialValues as any).options
                                .split(",")
                                .map((v: string, i: number) => ({
                                    id: `temp-manual-${Date.now()}-${manualValueIdRef.current++}-${i}`,
                                    label: v.trim()
                                }))
                                .filter((v: any) => v.label)
                        )
                    }
                }
            }
        }
    }, [open, initialValues, form]);

    const fetchGlobalVariations = async () => {
        try {
            setLoadingGlobals(true);
            const data = await apiFetch<Variation[]>("/api/variations");
            setGlobalVariations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingGlobals(false);
        }
    };

    const handleGlobalSelect = (id: number) => {
        setSelectedGlobalId(id);
        const variation = globalVariations.find(v => v.id === id);
        if (variation) {
            form.setFieldsValue({
                name: variation.name,
                type: variation.type,
            });
            // Pre-select all values by default or let user choose
            // FleetCart usually imports all, let's select all but allow toggle
            setSelectedGlobalValues(variation.values.map(v => v.label));
        }
    };

    const toggleGlobalValue = (label: string) => {
        setSelectedGlobalValues(prev =>
            prev.includes(label)
                ? prev.filter(v => v !== label)
                : [...prev, label]
        );
    };

    const handleAddManualValue = () => {
        if (!manualInput.trim()) return;
        const exists = manualValues.some(v => v.label.toLowerCase() === manualInput.trim().toLowerCase());
        if (exists) {
            message.warning("Bu değer zaten eklenmiş.");
            return;
        }
        const id = `temp-manual-${Date.now()}-${manualValueIdRef.current++}`;
        setManualValues([...manualValues, { id, label: manualInput.trim() }]);
        setManualInput("");
    };

    const handleSave = async () => {
        try {
            if (mode === "template" && selectedGlobalId) {
                const variation = globalVariations.find(v => v.id === selectedGlobalId);
                if (!variation) return;

                if (selectedGlobalValues.length === 0) {
                    message.warning("Lütfen en az bir değer seçin");
                    return;
                }

                const values = variation.values
                    .filter(v => selectedGlobalValues.includes(v.label))
                    .map((v, i) => ({
                        id: v.id,
                        label: v.label,
                        color: v.color,
                        image: v.image,
                        position: i
                    }));

                onSave({
                    // edit ise aynı kaydı güncellemek için id taşı
                    id: (initialValues as any)?.id,
                    name: variation.name,
                    type: variation.type,
                    values: values,
                    is_global: true,
                    global_id: variation.id
                });
                onClose();

            } else {
                // Manual Mode
                const values = await form.validateFields();

                if (manualValues.length === 0) {
                    message.warning("Lütfen en az bir varyant değeri girin");
                    return;
                }

                const type = values.type;
                const cleanedValues = manualValues.map((v, i) => ({
                    id: v.id,
                    label: v.label,
                    color: type === 'color' ? v.color : undefined,
                    image: type === 'image' ? v.image : undefined,
                    position: i
                }));

                onSave({
                    ...initialValues,
                    ...values,
                    values: cleanedValues
                });
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Drawer
            title={<Title level={4} style={{ margin: 0 }}>Varyant Ekle</Title>}
            placement="right"
            width={520}
            onClose={onClose}
            open={open}
            footer={
                <div style={{ display: "flex", gap: 12, padding: "16px 24px" }}>
                    <Button onClick={onClose} size="large" style={{ width: 120 }}>Vazgeç</Button>
                    <Button type="primary" onClick={handleSave} style={{ backgroundColor: "#5E5CE6", flex: 1 }} size="large">
                        {mode === 'template' ? 'İçe Aktar' : 'Kaydet'}
                    </Button>
                </div>
            }
        >
            <Tabs
                activeKey={mode}
                onChange={(k) => setMode(k as any)}
                items={[
                    { label: "Hazır Şema Seç", key: "template" },
                    { label: "Ürüne Özel Oluştur", key: "custom" }
                ]}
                style={{ marginBottom: 24 }}
            />

            <div style={{ display: mode === 'template' ? "flex" : "none", flexDirection: "column", gap: 24 }}>
                <div>
                    <Text strong style={{ display: "block", marginBottom: 8, fontSize: 16 }}>Şema Seçimi</Text>
                    <Select
                        style={{ width: "100%", height: 50 }}
                        placeholder="Bir varyant şablonu seçin (Örn: Renk, Beden)"
                        loading={loadingGlobals}
                        onChange={handleGlobalSelect}
                        value={selectedGlobalId}
                        size="large"
                        optionLabelProp="label"
                        allowClear
                        onClear={() => {
                            setSelectedGlobalId(null);
                            setSelectedGlobalValues([]);
                        }}
                    >
                        {globalVariations.map(v => (
                            <Option key={v.id} value={v.id} label={v.name}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>{v.name}</span>
                                    <Tag bordered={false}>{v.type}</Tag>
                                </div>
                            </Option>
                        ))}
                    </Select>
                    {/* Helper text moved or refined */}
                </div>

                {selectedGlobalId ? (
                    <div>
                        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text strong style={{ fontSize: 14 }}>
                                Kullanılacak Değerler
                                <span style={{ fontWeight: 400, color: "#64748B", marginLeft: 8 }}>
                                    ({selectedGlobalValues.length} seçildi)
                                </span>
                            </Text>
                            <Space>
                                <Button size="small" type="text" onClick={() => {
                                    const v = globalVariations.find(g => g.id === selectedGlobalId);
                                    if (v) setSelectedGlobalValues(v.values.map(x => x.label));
                                }}>Tümünü Seç</Button>
                                <Button size="small" type="text" danger onClick={() => setSelectedGlobalValues([])}>Temizle</Button>
                            </Space>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                            gap: 12,
                            maxHeight: 400,
                            overflowY: "auto",
                            padding: 2
                        }}>
                            {globalVariations.find(v => v.id === selectedGlobalId)?.values.map((val, valIdx) => {
                                const isSelected = selectedGlobalValues.includes(val.label);
                                return (
                                    <div
                                        key={`global-val-${val.id ?? valIdx}-${valIdx}`}
                                        onClick={() => toggleGlobalValue(val.label)}
                                        style={{
                                            cursor: "pointer",
                                            border: isSelected ? "2px solid #5E5CE6" : "1px solid #E2E8F0",
                                            borderRadius: 8,
                                            padding: "12px",
                                            background: isSelected ? "#F5F3FF" : "#fff",
                                            textAlign: "center",
                                            transition: "all 0.2s ease",
                                            position: "relative",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            minHeight: 60
                                        }}
                                    >
                                        {val.color && (
                                            <div style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: "50%",
                                                backgroundColor: val.color,
                                                border: "1px solid rgba(0,0,0,0.1)",
                                                marginBottom: 8
                                            }} />
                                        )}
                                        <Text strong={isSelected} style={{ color: isSelected ? "#5E5CE6" : "inherit" }}>
                                            {val.label}
                                        </Text>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    !loadingGlobals && globalVariations.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, background: "#F8FAFC", borderRadius: 12 }}>
                            <Empty description={
                                <span>
                                    Henüz hiç global varyant şeması oluşturulmamış. <br />
                                    <a href="/admin/products/variations" target="_blank">Şema oluşturmak için tıklayın</a>
                                </span>
                            } />
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
                            Lütfen yukarıdan bir şema seçin.
                        </div>
                    )
                )}
            </div>

            <Form form={form} layout="vertical" initialValues={{ type: "text" }} style={{ display: mode === 'custom' ? 'block' : 'none' }}>
                <Form.Item
                    name="name"
                    label={<Text strong>Varyant Türü Adı *</Text>}
                    rules={[{ required: true, message: "Lütfen varyant türü adını girin" }]}
                >
                    <Input placeholder="Örn: Beden, Kumaş" maxLength={100} size="large" />
                </Form.Item>

                <Form.Item name="type" label={<Text strong>Görünüm Stili *</Text>}>
                    <Radio.Group
                        style={{ width: "100%" }}
                        onChange={(e) => {
                            // Tip değişince değerlerin 'yan verilerini' (renk, resim) temizle
                            const newType = e.target.value;
                            setManualValues(prev => prev.map(p => ({
                                id: p.id,
                                label: p.label,
                                position: p.position,
                                // Eğer yeni tip renk ise varsayılan siyah, değilse undefined
                                color: newType === 'color' ? '#000000' : undefined,
                                image: undefined // Görsel desteği eklenirse burası da yönetilmeli
                            })));
                        }}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(108px, 1fr))", gap: 12 }}>
                            {VARIATION_TYPE_OPTIONS.map((opt) => (
                                <Radio.Button key={opt.value} value={opt.value} style={{ height: "auto", padding: 16, borderRadius: 8, textAlign: "center" }}>
                                    {opt.icon}
                                    <Text strong>{opt.title}</Text>
                                    <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{opt.subtitle}</div>
                                </Radio.Button>
                            ))}
                        </div>
                    </Radio.Group>
                </Form.Item>

                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text strong>Varyantlar *</Text>
                        {manualValues.length > 0 && (
                            <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => setManualValues([])}
                            >
                                Tümünü Sil
                            </Button>
                        )}
                    </div>

                    <Input
                        placeholder="Değer yazıp Enter'a basın (Örn: Kırmızı)"
                        size="large"
                        value={manualInput}
                        onChange={e => setManualInput(e.target.value)}
                        onPressEnter={handleAddManualValue}
                        suffix={<Text type="secondary" style={{ fontSize: 12 }}>↵ Enter</Text>}
                        style={{ marginBottom: 16 }}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {manualValues.map((val, index) => (
                            <div key={`manual-val-${val.id ?? index}-${index}`} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                background: "#fff",
                                border: "1px solid #E2E8F0",
                                padding: "8px 12px",
                                borderRadius: 6
                            }}>
                                <HolderOutlined style={{ color: "#94A3B8", cursor: "grab" }} />

                                {watchedType === 'color' && (
                                    <ColorPicker
                                        size="small"
                                        value={val.color || "#000000"}
                                        onChange={(c) => {
                                            const newVals = [...manualValues];
                                            newVals[index].color = c.toHexString();
                                            setManualValues(newVals);
                                        }}
                                    />
                                )}

                                {watchedType === 'image' && (
                                    <div 
                                        style={{
                                            width: 48,
                                            height: 48,
                                            background: val.image ? "transparent" : "#F1F5F9",
                                            border: val.image ? "1px solid #E2E8F0" : "1px dashed #CBD5E1",
                                            borderRadius: 6,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            position: "relative"
                                        }}
                                        onClick={() => {
                                            // TODO: Open media picker for this value
                                            message.info("Görsel seçmek için ürün kaydettikten sonra varyant medya yönetimini kullanın");
                                        }}
                                        title="Görsel ekle"
                                    >
                                        {val.image ? (
                                            <img 
                                                src={typeof val.image === 'string' ? val.image : (val.image as any)?.path || (val.image as any)?.url} 
                                                alt={val.label} 
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                            />
                                        ) : (
                                            <FileImageOutlined style={{ color: "#94A3B8", fontSize: 18 }} />
                                        )}
                                    </div>
                                )}

                                <Input
                                    variant="borderless"
                                    value={val.label}
                                    onChange={(e) => {
                                        const newVals = [...manualValues];
                                        newVals[index].label = e.target.value;
                                        setManualValues(newVals);
                                    }}
                                    style={{ padding: 0 }}
                                />

                                <div style={{ display: "flex", gap: 4 }}>
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        onClick={() => {
                                            const newVals = [...manualValues];
                                            newVals.splice(index, 1);
                                            setManualValues(newVals);
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {manualValues.length === 0 && (
                        <div style={{ textAlign: "center", padding: "20px", color: "#94A3B8", border: "1px dashed #E2E8F0", borderRadius: 6 }}>
                            Henüz değer eklenmedi.
                        </div>
                    )}
                </div>

                <Form.Item name="separate_listing" valuePropName="checked">
                    <Checkbox>
                        Bu seçeneği ürün listelerinde ayrı kartlar olarak göster (Örn: Her renk ayrı ürün gibi)
                    </Checkbox>
                </Form.Item>
            </Form>
        </Drawer >
    );
}

