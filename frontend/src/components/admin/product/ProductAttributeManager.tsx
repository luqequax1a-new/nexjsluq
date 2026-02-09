"use client";

import { useEffect, useMemo, useState } from "react";
import { App, Form, Select, Spin, Typography } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { Text } = Typography;

interface Props {
    form: any;
}

function SortableRow({
    id,
    children,
}: {
    id: number;
    children: (opts: { listeners: any; attributes: any; setNodeRef: any; style: any }) => React.ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return <>{children({ listeners, attributes, setNodeRef, style })}</>;
}

export function ProductAttributeManager({ form }: Props) {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [sets, setSets] = useState<any[]>([]);

    const watched = Form.useWatch("spec_attributes", form);

    const selectedList = useMemo(() => {
        return (Array.isArray(watched) ? watched : [])
            .map((x: any) => ({
                attribute_id: Number(x?.attribute_id),
                value_ids: Array.isArray(x?.value_ids) ? x.value_ids.map((n: any) => Number(n)).filter((n: number) => n > 0) : [],
            }))
            .filter((x: any) => Number.isFinite(x.attribute_id) && x.attribute_id > 0);
    }, [watched]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await apiFetch<any[]>("/api/attribute-sets");
                setSets(Array.isArray(res) ? res : []);
            } catch (e: any) {
                message.error(e?.message || "Özellik setleri yüklenemedi");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [message]);

    const selectedMap = useMemo(() => {
        const arr = Array.isArray(watched) ? watched : [];
        const m = new Map<number, number[]>();
        arr.forEach((x: any) => {
            const aid = Number(x?.attribute_id);
            const vids = Array.isArray(x?.value_ids) ? x.value_ids.map((n: any) => Number(n)).filter((n: number) => n > 0) : [];
            if (aid > 0) m.set(aid, vids);
        });
        return m;
    }, [watched]);

    const setSelected = (attributeId: number, valueIds: number[]) => {
        const next = selectedList.map((row: any) => {
            if (Number(row.attribute_id) === Number(attributeId)) {
                return { ...row, value_ids: valueIds };
            }
            return row;
        });

        // If attribute isn't in list yet, append it
        if (!next.some((x: any) => Number(x.attribute_id) === Number(attributeId))) {
            next.push({ attribute_id: attributeId, value_ids: valueIds });
        }

        form.setFieldValue("spec_attributes", next);
    };

    const removeAttribute = (attributeId: number) => {
        const next = selectedList.filter((x: any) => Number(x.attribute_id) !== Number(attributeId));
        form.setFieldValue("spec_attributes", next);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
    );

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const a = Number(active.id);
        const b = Number(over.id);
        if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return;

        const oldIndex = selectedList.findIndex((x: any) => Number(x.attribute_id) === a);
        const newIndex = selectedList.findIndex((x: any) => Number(x.attribute_id) === b);
        if (oldIndex < 0 || newIndex < 0) return;

        const next = arrayMove(selectedList, oldIndex, newIndex);
        form.setFieldValue("spec_attributes", next);
    };

    const attributeIndex = useMemo(() => {
        const byId = new Map<number, { id: number; name: string; setName: string; values: any[] }>();
        (Array.isArray(sets) ? sets : []).forEach((set: any) => {
            const setName = String(set?.name ?? '').trim();
            (Array.isArray(set?.attributes) ? set.attributes : []).forEach((attr: any) => {
                const id = Number(attr?.id);
                if (!Number.isFinite(id) || id <= 0) return;
                byId.set(id, {
                    id,
                    name: String(attr?.name ?? '').trim(),
                    setName: setName || 'Özellikler',
                    values: Array.isArray(attr?.values) ? attr.values : [],
                });
            });
        });
        return byId;
    }, [sets]);

    const addOptions = useMemo(() => {
        const opts: Array<{ value: number; label: string }> = [];
        attributeIndex.forEach((a) => {
            const label = a.setName ? `${a.setName} • ${a.name}` : a.name;
            opts.push({ value: a.id, label });
        });
        opts.sort((a, b) => a.label.localeCompare(b.label, 'tr'));
        return opts;
    }, [attributeIndex]);

    const alreadySelected = useMemo(() => new Set(selectedList.map((x: any) => Number(x.attribute_id))), [selectedList]);
    const availableAddOptions = useMemo(() => addOptions.filter((o) => !alreadySelected.has(Number(o.value))), [addOptions, alreadySelected]);

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <Spin />
            </div>
        );
    }

    return (
        <div style={{ padding: 8 }}>
            <Form.Item name="spec_attributes" hidden>
                <div />
            </Form.Item>

            {sets.length === 0 && <Text type="secondary">Henüz özellik seti yok.</Text>}

            <div style={{ marginBottom: 20 }}>
                <Select
                    showSearch
                    allowClear
                    placeholder="Özellik seç ve ekle..."
                    options={availableAddOptions}
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    size="large"
                    styles={{ popup: { root: { minWidth: 320 } } }}
                    onChange={(v) => {
                        const id = Number(v);
                        if (!Number.isFinite(id) || id <= 0) return;
                        setSelected(id, []);
                    }}
                    value={undefined}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                    Sadece eklediklerin listelenir. Satırları yukarı/aşağı taşıyıp sıralayabilirsin.
                </Text>
            </div>

            {selectedList.length === 0 ? (
                <Text type="secondary">Henüz ürün için özellik seçilmedi.</Text>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={selectedList.map((x: any) => Number(x.attribute_id))} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {selectedList.map((row: any) => {
                                const aid = Number(row.attribute_id);
                                const meta = attributeIndex.get(aid);
                                const title = meta?.name || `#${aid}`;
                                const setName = meta?.setName;
                                const vals = Array.isArray(meta?.values) ? meta?.values : [];
                                const options = vals.map((v: any) => ({ value: Number(v.id), label: String(v.value) }));
                                const selected = selectedMap.get(aid) ?? row.value_ids ?? [];

                                return (
                                    <SortableRow key={aid} id={aid}>
                                        {({ listeners, attributes, setNodeRef, style }) => (
                                            <div
                                                ref={setNodeRef}
                                                style={{
                                                    ...style,
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: 12,
                                                    padding: 14,
                                                    background: '#fff',
                                                }}
                                            >
                                                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                                    <div
                                                        {...attributes}
                                                        {...listeners}
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 8,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#64748b',
                                                            cursor: 'grab',
                                                            border: '1px solid #e2e8f0',
                                                            background: '#f8fafc',
                                                        }}
                                                    >
                                                        <HolderOutlined />
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                                                        {setName ? <div style={{ fontSize: 12, color: '#64748b' }}>{setName}</div> : null}
                                                    </div>

                                                    <a
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            removeAttribute(aid);
                                                        }}
                                                        style={{ color: '#ef4444', fontWeight: 600 }}
                                                    >
                                                        Kaldır
                                                    </a>
                                                </div>

                                                <Select
                                                    mode="multiple"
                                                    allowClear
                                                    value={selected}
                                                    placeholder="Değer seç..."
                                                    options={options}
                                                    onChange={(v) => setSelected(aid, (v as any[]).map((x) => Number(x)).filter((n) => n > 0))}
                                                    style={{ width: '100%' }}
                                                    size="large"
                                                    styles={{ popup: { root: { minWidth: 280 } } }}
                                                    tagRender={(props) => {
                                                        const { label, closable, onClose } = props;
                                                        return (
                                                            <span
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    background: '#f1f5f9',
                                                                    border: '1px solid #e2e8f0',
                                                                    borderRadius: 6,
                                                                    padding: '4px 10px',
                                                                    margin: '2px 4px 2px 0',
                                                                    fontSize: 13,
                                                                    fontWeight: 500,
                                                                    color: '#334155',
                                                                    lineHeight: 1.4,
                                                                }}
                                                            >
                                                                {label}
                                                                {closable && (
                                                                    <span
                                                                        onClick={onClose}
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            color: '#94a3b8',
                                                                            fontSize: 14,
                                                                            fontWeight: 700,
                                                                            marginLeft: 2,
                                                                        }}
                                                                    >
                                                                        ×
                                                                    </span>
                                                                )}
                                                            </span>
                                                        );
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </SortableRow>
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
