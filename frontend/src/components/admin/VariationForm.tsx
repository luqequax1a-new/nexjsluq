"use client";

import { useEffect, useState } from "react";
import {
    Form, Input, Select, Button, Space,
    Card, Table, ColorPicker, Upload, Typography
} from "antd";
import {
    PlusOutlined, DeleteOutlined,
    MenuOutlined
} from "@ant-design/icons";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Variation, VariationType } from "@/types/product";

const { Text } = Typography;

const VARIATION_TYPE_OPTIONS: Array<{ value: VariationType; label: string }> = [
    { value: "text", label: "Metin (Dropdown/Radio)" },
    { value: "button", label: "Buton (Metin gorunumu)" },
    { value: "dropdown", label: "Acilir Liste (Metin gorunumu)" },
    { value: "pill", label: "Pill (Yuvarlak etiket)" },
    { value: "radio", label: "Radio (Daire secim)" },
    { value: "color", label: "Renk (Visual Swatch)" },
    { value: "image", label: "Gorsel (Image Swatch)" },
];

interface VariationFormProps {
    id?: string;
    initialValues?: Variation;
    onSave: (values: any) => Promise<void>;
    loading?: boolean;
}

interface ValueItem {
    key: string;
    id?: number;
    label: string;
    value?: string;
    position: number;
}

export function VariationForm({ id, initialValues, onSave, loading }: VariationFormProps) {
    const [form] = Form.useForm();
    const [type, setType] = useState<string>("text");
    const [values, setValues] = useState<ValueItem[]>([]);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
                type: initialValues.type
            });
            setType(initialValues.type);
            setValues(initialValues.values.map((v, index) => ({
                key: `exist-${v.id}`,
                id: v.id,
                label: v.label,
                value: v.value,
                position: v.position ?? index
            })));
        } else {
            // Default empty value row
            setValues([{ key: 'new-0', label: '', position: 0 }]);
        }
    }, [initialValues, form]);

    const handleTypeChange = (val: string) => {
        setType(val);
    };

    const handleAddValue = () => {
        setValues([...values, {
            key: `new-${Date.now()}`,
            label: '',
            value: type === 'color' ? '#000000' : undefined,
            position: values.length
        }]);
    };

    const handleRemoveValue = (key: string) => {
        setValues(values.filter(v => v.key !== key));
    };

    const handleValueChange = (key: string, field: 'label' | 'value', val: any) => {
        setValues(values.map(v => v.key === key ? { ...v, [field]: val } : v));
    };

    const onFinish = async (formData: any) => {
        // Validate values
        const validValues = values.filter(v => v.label.trim() !== '');
        if (validValues.length === 0) {
            // message.error? handled by parent or show inline error
            return;
        }

        await onSave({
            ...formData,
            values: validValues.map((v, i) => ({
                id: v.id,
                label: v.label,
                value: v.value,
                position: i
            }))
        });
    };

    // Sortable Row
    const Row = (props: any) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
            id: props['data-row-key'],
        });

        const style: React.CSSProperties = {
            ...props.style,
            transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
            transition,
            cursor: 'move',
            ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
        };

        return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        }),
    );

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setValues((prev) => {
                const activeIndex = prev.findIndex((i) => i.key === active.id);
                const overIndex = prev.findIndex((i) => i.key === over?.id);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    const columns = [
        {
            key: 'sort',
            width: 30,
            render: () => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />,
        },
        {
            title: 'Değer (Label)',
            dataIndex: 'label',
            key: 'label',
            render: (text: string, record: ValueItem) => (
                <Input
                    value={record.label}
                    onChange={e => handleValueChange(record.key, 'label', e.target.value)}
                    placeholder="Örn: Kırmızı, XL"
                />
            )
        },
        ...(type === 'color' ? [{
            title: 'Renk',
            dataIndex: 'value',
            key: 'value',
            width: 100,
            render: (text: string, record: ValueItem) => (
                <ColorPicker
                    value={record.value || '#000000'}
                    onChange={(c) => handleValueChange(record.key, 'value', c.toHexString())}
                    showText
                />
            )
        }] : []),
        ...(type === 'image' ? [{
            title: 'Görsel',
            dataIndex: 'value',
            key: 'value',
            render: (text: string, record: ValueItem) => (
                <div style={{ color: '#999', fontSize: 12 }}>Görsel yükleme yakında...</div>
            )
        }] : []),
        {
            title: '',
            key: 'action',
            width: 50,
            render: (_: any, record: ValueItem) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveValue(record.key)}
                />
            )
        }
    ];

    return (
        <Form id={id} form={form} layout="vertical" onFinish={onFinish}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
                {/* Sol Taraf: Genel Ayarlar */}
                <Card title="Genel" variant="borderless">
                    <Form.Item name="name" label="Varyant Adı" rules={[{ required: true }]}>
                        <Input placeholder="Örn: Renk" />
                    </Form.Item>
                    <Form.Item name="type" label="Türü" rules={[{ required: true }]}>
                        <Select onChange={handleTypeChange} options={VARIATION_TYPE_OPTIONS} />
                    </Form.Item>
                </Card>

                {/* Sağ Taraf: Değerler */}
                <Card
                    title="Seçenek Değerleri"
                    variant="borderless"
                    extra={<Button type="dashed" onClick={handleAddValue} icon={<PlusOutlined />}>Değer Ekle</Button>}
                >
                    <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                        <SortableContext items={values.map((i) => i.key)} strategy={verticalListSortingStrategy}>
                            <Table
                                dataSource={values}
                                columns={columns}
                                rowKey="key"
                                pagination={false}
                                components={{ body: { row: Row } }}
                            />
                        </SortableContext>
                    </DndContext>
                </Card>
            </div>
        </Form>
    );
}

