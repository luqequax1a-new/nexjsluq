import React, { useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Button,
    Col,
    Collapse,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Typography,
    Checkbox,
    Table,
    Tooltip,
    Tag
} from 'antd';
import {
    DeleteOutlined,
    PlusOutlined,
    EditOutlined,
    InfoCircleOutlined,
    DragOutlined
} from '@ant-design/icons';
import { ProductOption, OptionValue } from '@/types/product';
import { apiFetch } from '@/lib/api';

const { Option } = Select;

interface OptionManagerProps {
    form: any;
}

function SortableOptionItem({
    option,
    index,
    updateOption,
    removeOption,
    isExpanded,
    toggleExpand
}: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: option.uid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 12,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const
    };

    // Columns for Option Values Table
    const valueColumns = [
        {
            title: 'Etiket (Label)',
            dataIndex: 'label',
            key: 'label',
            render: (_: any, record: any, valIndex: number) => (
                <Input
                    value={record.label}
                    onChange={(e) => {
                        const newVals = [...(option.values || [])];
                        newVals[valIndex].label = e.target.value;
                        updateOption(index, { values: newVals });
                    }}
                />
            )
        },
        {
            title: 'Fiyat',
            dataIndex: 'price',
            key: 'price',
            width: 150,
            render: (_: any, record: any, valIndex: number) => (
                <Space.Compact style={{ width: '100%' }}>
                    <div
                        style={{
                            padding: '0 10px',
                            display: 'flex',
                            alignItems: 'center',
                            background: '#fafafa',
                            border: '1px solid #d9d9d9',
                            borderRight: 'none',
                            borderRadius: '6px 0 0 6px',
                            color: '#475569',
                            fontWeight: 600,
                            height: 32,
                        }}
                    >
                        {record.price_type === 'percent' ? '%' : '₺'}
                    </div>
                    <InputNumber
                        style={{ width: '100%' }}
                        value={record.price}
                        onChange={(val) => {
                            const newVals = [...(option.values || [])];
                            newVals[valIndex].price = val;
                            updateOption(index, { values: newVals });
                        }}
                    />
                </Space.Compact>
            )
        },
        {
            title: 'Tip',
            dataIndex: 'price_type',
            key: 'price_type',
            width: 110,
            render: (_: any, record: any, valIndex: number) => (
                <Select
                    value={record.price_type}
                    style={{ width: '100%' }}
                    onChange={(val) => {
                        const newVals = [...(option.values || [])];
                        newVals[valIndex].price_type = val;
                        updateOption(index, { values: newVals });
                    }}
                >
                    <Option value="fixed">Sabit</Option>
                    <Option value="percent">Yüzde</Option>
                </Select>
            )
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_: any, record: any, valIndex: number) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                        const newVals = [...(option.values || [])];
                        newVals.splice(valIndex, 1);
                        updateOption(index, { values: newVals });
                    }}
                />
            )
        }
    ];

    const isSelectType = ['dropdown', 'checkbox', 'radio', 'multiple_select', 'checkbox_custom', 'radio_custom'].includes(option.type);
    const isTextType = ['field', 'textarea', 'date', 'date_time', 'time', 'file'].includes(option.type);

    return (
        <div ref={setNodeRef} style={style}>
            {/* Header Row - Ikas Style */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    cursor: 'default',
                    borderBottom: isExpanded ? '1px solid #f0f0f0' : 'none'
                }}
                onClick={(e) => {
                    // Only toggle if not clicking on controls
                    if (!(e.target as HTMLElement).closest('.ant-input') && !(e.target as HTMLElement).closest('.ant-btn') && !(e.target as HTMLElement).closest('.ant-select-selector')) {
                        toggleExpand(option.uid);
                    }
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    {/* Drag Handle */}
                    <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#cbd5e1' }} onClick={e => e.stopPropagation()}>
                        <DragOutlined style={{ fontSize: 16 }} />
                    </div>

                    {/* Icon or Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{option.name || '(İsimsiz Seçenek)'}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>({option.type})</span>
                        {option.is_required && <Tag color="error" style={{ margin: 0 }}>Zorunlu</Tag>}
                    </div>

                    {/* Values Preview (Badges) if collapsed or just generally useful */}
                    {!isExpanded && (option.values || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
                            {(option.values || []).slice(0, 3).map((v: any, i: number) => (
                                <div key={i} style={{
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 4
                                }}>
                                    {v.label}
                                </div>
                            ))}
                            {(option.values || []).length > 3 && (
                                <span style={{ color: '#94a3b8', fontSize: 11 }}>+{option.values.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={isExpanded ? "Kapat" : "Düzenle"}>
                        <Button
                            type="text"
                            icon={<EditOutlined style={{ color: isExpanded ? '#5E5CE6' : '#64748b' }} />}
                            onClick={() => toggleExpand(option.uid)}
                        />
                    </Tooltip>
                    <Tooltip title="Sil">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeOption(index)}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Content Body - Only visible if expanded */}
            {isExpanded && (
                <div style={{ padding: 20, cursor: 'auto' }} onPointerDown={(e) => e.stopPropagation()}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Seçenek Adı" required style={{ marginBottom: 12 }}>
                                <Input
                                    value={option.name}
                                    onChange={(e) => updateOption(index, { name: e.target.value })}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Tip" required style={{ marginBottom: 12 }}>
                                <Select
                                    value={option.type}
                                    onChange={(val) => updateOption(index, { type: val })}
                                    popupMatchSelectWidth={false}
                                >
                                    <Select.OptGroup label="Metin">
                                        <Option value="field">Kısa Metin</Option>
                                        <Option value="textarea">Uzun Metin (Not)</Option>
                                    </Select.OptGroup>
                                    <Select.OptGroup label="Seçim">
                                        <Option value="dropdown">Açılır Liste (Dropdown)</Option>
                                        <Option value="checkbox">Çoklu Seçim (Checkbox)</Option>
                                        <Option value="radio">Tekli Seçim (Radio)</Option>
                                        <Option value="multiple_select">Çoklu Liste</Option>
                                    </Select.OptGroup>
                                    <Select.OptGroup label="Tarih & Dosya">
                                        <Option value="date">Tarih</Option>
                                        <Option value="date_time">Tarih & Saat</Option>
                                        <Option value="time">Saat</Option>
                                        <Option value="file">Dosya Yükleme (PDF/Resim)</Option>
                                    </Select.OptGroup>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item label="Zorunlu" style={{ marginBottom: 12 }}>
                                <Checkbox
                                    checked={option.is_required}
                                    onChange={(e) => updateOption(index, { is_required: e.target.checked })}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* VALUES SECTION with Table */}
                    {isSelectType && (
                        <div style={{ marginTop: 12 }}>
                            <Table
                                dataSource={option.values || []}
                                columns={valueColumns}
                                pagination={false}
                                rowKey="uid"
                                size="small"
                                bordered
                                style={{ borderRadius: 6, overflow: 'hidden' }}
                            />
                            <Button
                                type="dashed"
                                block
                                style={{ marginTop: 8 }}
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    const newVals = [...(option.values || [])];
                                    newVals.push({
                                        uid: crypto.randomUUID(),
                                        label: '',
                                        price: 0,
                                        price_type: 'fixed',
                                        position: newVals.length
                                    });
                                    updateOption(index, { values: newVals });
                                }}
                            >
                                Yeni Değer Ekle
                            </Button>
                        </div>
                    )}

                    {isTextType && (
                        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 6, border: '1px dashed #e2e8f0' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                <InfoCircleOutlined /> Bu seçenek tipi için kullanıcı serbest giriş yapar. Fiyatlandırma eklemek isterseniz geliştirme gerekebilir.
                            </Typography.Text>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function OptionManager({ form }: OptionManagerProps) {
    const [options, setOptions] = useState<ProductOption[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Watch form to sync external changes if needed, but primarily we drive form from local state
    // Actually, watching forms is good for initialization
    const watchedOptions = Form.useWatch('options', form);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Initialization logic
        if (initialized) return;

        const currentOpts = form.getFieldValue('options');

        if (Array.isArray(currentOpts)) {
            if (currentOpts.length > 0) {
                const mapped = currentOpts.map((o: any) => ({
                    ...o,
                    uid: o.uid ? String(o.uid) : (o.id ? String(o.id) : crypto.randomUUID()),
                    values: (o.values || []).map((v: any) => ({
                        ...v,
                        uid: v.uid ? String(v.uid) : (v.id ? String(v.id) : crypto.randomUUID())
                    }))
                }));
                setOptions(mapped);
            }
            setInitialized(true);
        }
    }, [form, initialized]);

    // Fetch Templates separately
    useEffect(() => {
        apiFetch('/api/options', { method: 'GET' })
            .then((res: any) => setTemplates(res))
            .catch(() => { });
    }, []);

    // Sync state -> form
    useEffect(() => {
        if (!initialized) return;
        form.setFieldValue('options', options);
    }, [options, form, initialized]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setOptions((items) => {
                const oldIndex = items.findIndex((i) => i.uid === active.id);
                const newIndex = items.findIndex((i) => i.uid === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addOption = () => {
        const newOpt: ProductOption = {
            uid: crypto.randomUUID(),
            name: '',
            type: 'dropdown',
            is_required: false,
            is_global: false,
            position: options.length,
            is_open: true, // Auto open new items
            values: []
        };
        setOptions([...options, newOpt]);
    };

    const updateOption = (index: number, updates: Partial<ProductOption>) => {
        const newOpts = [...options];
        newOpts[index] = { ...newOpts[index], ...updates };
        setOptions(newOpts);
    };

    const removeOption = (index: number) => {
        const newOpts = [...options];
        newOpts.splice(index, 1);
        setOptions(newOpts);
    };

    const toggleExpand = (uid: string) => {
        setOptions(options.map(o => o.uid === uid ? { ...o, is_open: !o.is_open } : o));
    };

    const importTemplate = (templateId: number) => {
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;

        const newOpt: ProductOption = {
            uid: crypto.randomUUID(),
            name: tpl.name,
            type: tpl.type,
            is_required: !!tpl.is_required,
            is_global: false,
            position: options.length,
            is_open: true,
            values: (tpl.values || []).map((v: any) => ({
                uid: crypto.randomUUID(),
                label: v.label,
                price: v.price,
                price_type: v.price_type,
                position: v.position
            }))
        };
        setOptions([...options, newOpt]);
    };

    return (
        <div style={{ padding: '8px 0' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Typography.Text style={{ color: '#64748b' }}>
                    Ürüne özel seçenekler ekleyin.
                </Typography.Text>

                <Space>
                    <Select
                        placeholder="Şablon İçe Aktar"
                        style={{ width: 180 }}
                        onChange={importTemplate}
                        value={null}
                        size='middle'
                    >
                        {templates.map(t => (
                            <Option key={t.id} value={t.id}>{t.name}</Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={addOption}
                        style={{
                            backgroundColor: '#fff',
                            color: '#5E5CE6',
                            borderColor: '#5E5CE6',
                            boxShadow: 'none'
                        }}
                    >
                        Seçenek Ekle
                    </Button>
                </Space>
            </div>

            {/* Options List with Dnd */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={options.map(o => o.uid!)}
                    strategy={verticalListSortingStrategy}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {options.map((opt, i) => (
                            <SortableOptionItem
                                key={opt.uid}
                                option={opt}
                                index={i}
                                updateOption={updateOption}
                                removeOption={removeOption}
                                isExpanded={opt.is_open}
                                toggleExpand={toggleExpand}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {options.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px dashed #cbd5e1',
                    color: '#64748b'
                }}>
                    Henüz hiç seçenek eklenmemiş.
                </div>
            )}
        </div>
    );
}
