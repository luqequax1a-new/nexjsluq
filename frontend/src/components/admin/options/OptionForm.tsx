"use client";

import React from 'react';
import {
    Form, Input, Select, Switch,
    Button, Space, Row, Col,
    Card, InputNumber, Divider,
    Typography, Table
} from "antd";
import { PlusOutlined, DeleteOutlined, DragOutlined } from "@ant-design/icons";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";

const { Option } = Select;
const { Text } = Typography;

interface OptionValue {
    key: string;
    label: string;
    price: number | null;
    price_type: 'fixed' | 'percent';
    position: number;
}

interface OptionFormProps {
    form: any;
    initialValues?: any;
}

// Draggable Row Component
const DraggableRow = ({ children, ...props }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        cursor: 'move',
        ...(isDragging ? { position: 'relative', zIndex: 9999, background: '#fafafa' } : {}),
    };

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    return React.cloneElement(child as React.ReactElement, {
                        children: (
                            <div {...listeners} style={{ cursor: "grab", padding: 4 }}>
                                <DragOutlined style={{ color: "#999" }} />
                            </div>
                        ),
                    });
                }
                return child;
            })}
        </tr>
    );
};

import { t } from "@/lib/i18n";

export function OptionForm({ form, initialValues }: OptionFormProps) {
    const type = Form.useWatch("type", form);
    const [values, setValues] = useState<OptionValue[]>([]);

    useEffect(() => {
        if (initialValues?.values) {
            setValues(initialValues.values.map((v: any, i: number) => ({
                ...v,
                key: v.id ? String(v.id) : `new_${i}`,
                position: i
            })));
        }
    }, [initialValues]);

    const showValues = ["dropdown", "checkbox", "radio", "multiple_select"].includes(type);

    const handleAddValue = () => {
        const newKey = `new_${Date.now()}`;
        setValues([...values, {
            key: newKey,
            label: "",
            price: 0,
            price_type: 'fixed',
            position: values.length
        }]);
    };

    const handleDeleteValue = (key: string) => {
        setValues(values.filter(v => v.key !== key));
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setValues((prev) => {
                const activeIndex = prev.findIndex((i) => i.key === active.id);
                const overIndex = prev.findIndex((i) => i.key === over?.id);

                if (activeIndex < 0 || overIndex < 0) return prev; // Safety check

                const newItems = [...prev];
                const [removed] = newItems.splice(activeIndex, 1);
                newItems.splice(overIndex, 0, removed);

                // Update positions
                const updated = newItems.map((item, index) => ({ ...item, position: index }));

                // Sync with form immediately to prevents visual glithces
                form.setFieldsValue({ values: updated });

                return updated;
            });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        })
    );

    const columns = [
        {
            key: 'sort',
            width: 30,
            render: () => <DragOutlined />, // Placeholder, overridden by DraggableRow
        },
        {
            title: t('admin.options.form.value_label', 'Etiket'),
            dataIndex: "label",
            render: (_: any, record: OptionValue, index: number) => (
                <Form.Item
                    name={['values', index, 'label']}
                    initialValue={record.label}
                    rules={[{ required: true, message: t('admin.common.required', 'Gerekli') }]}
                    style={{ marginBottom: 0 }}
                >
                    <Input
                        placeholder={t('admin.options.form.value_placeholder', 'Örn: Kırmızı, Büyük Boy')}
                        onChange={(e) => {
                            const newVals = [...values];
                            newVals[index].label = e.target.value;
                            setValues(newVals);
                        }}
                    />
                </Form.Item>
            )
        },
        {
            title: t('admin.product.form.price.label', 'Fiyat'),
            dataIndex: "price",
            width: 150,
            render: (_: any, record: OptionValue, index: number) => (
                <Form.Item
                    name={['values', index, 'price']}
                    initialValue={record.price}
                    style={{ marginBottom: 0 }}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        placeholder="0.00"
                        onChange={(v) => {
                            const newVals = [...values];
                            newVals[index].price = Number(v);
                            setValues(newVals);
                        }}
                    />
                </Form.Item>
            )
        },
        {
            title: t('admin.options.form.price_type_label', 'Fiyat Tipi'),
            dataIndex: "price_type",
            width: 120,
            render: (_: any, record: OptionValue, index: number) => (
                <Form.Item
                    name={['values', index, 'price_type']}
                    initialValue={record.price_type}
                    style={{ marginBottom: 0 }}
                >
                    <Select
                        onChange={(v) => {
                            const newVals = [...values];
                            newVals[index].price_type = v;
                            setValues(newVals);
                        }}
                    >
                        <Option value="fixed">{t('admin.common.fixed', 'Sabit')}</Option>
                        <Option value="percent">{t('admin.common.percent', 'Yüzde')}</Option>
                    </Select>
                </Form.Item>
            )
        },
        {
            title: "",
            key: "action",
            width: 50,
            render: (_: any, record: OptionValue) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteValue(record.key)}
                />
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
            <Card title={t('admin.common.general_info', 'Genel Bilgiler')} bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item
                            name="name"
                            label={t('admin.options.columns.name', 'Seçenek Adı')}
                            rules={[{ required: true, message: t('admin.options.form.name_required', 'Lütfen seçenek adını girin') }]}
                        >
                            <Input placeholder={t('admin.options.form.name_placeholder', 'Örn: Renk, Beden, Hafıza')} size="large" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="type"
                            label={t('admin.options.columns.type', 'Türü')}
                            initialValue="dropdown"
                            rules={[{ required: true }]}
                        >
                            <Select size="large">
                                <Option value="dropdown">{t('admin.options.types.dropdown', 'Açılır Liste')}</Option>
                                <Option value="checkbox">{t('admin.options.types.checkbox', 'Onay Kutusu')}</Option>
                                <Option value="radio">{t('admin.options.types.radio', 'Radyo Butonu')}</Option>
                                <Option value="multiple_select">{t('admin.options.types.multiple_select', 'Çoklu Seçim')}</Option>
                                {/* <Option value="date">Tarih</Option> */}
                                {/* <Option value="time">Saat</Option> */}
                                <Option value="text">{t('admin.options.types.text', 'Metin Kutusu')}</Option>
                                <Option value="textarea">{t('admin.options.types.textarea', 'Metin Alanı')}</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="is_required" valuePropName="checked" label={t('admin.options.columns.is_required', 'Zorunlu Alan')}>
                            <Switch />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {showValues && (
                <Card
                    title={t('admin.options.form.values_title', 'Değerler')}
                    bordered={false}
                    extra={
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddValue}>
                            {t('admin.options.form.add_value', 'Değer Ekle')}
                        </Button>
                    }
                >
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <SortableContext
                            items={values.map((i) => i.key)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Table
                                components={{
                                    body: {
                                        row: DraggableRow,
                                    },
                                }}
                                rowKey="key"
                                columns={columns}
                                dataSource={values}
                                pagination={false}
                                size="small"
                            />
                        </SortableContext>
                    </DndContext>
                </Card>
            )}
        </div>
    );
}
