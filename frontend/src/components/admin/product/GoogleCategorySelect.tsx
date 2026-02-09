"use client";

import { Form, TreeSelect, Empty, Button } from "antd";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { apiFetch } from "@/lib/api";

type CategoryNode = {
    id: number;
    value: number;
    title: string;
    pId?: number;
    isLeaf: boolean;
    key: number;
    google_id: number;
    path_str?: string;
    children?: CategoryNode[];
};

const safeParse = (val: any) => {
    if (!val) return {};
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) {
            return { en: val, tr: val };
        }
    }
    return val;
};

const decodeText = (str: string) => {
    if (!str) return "";
    try {
        if (str.includes("\\u")) {
            return JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
        }
    } catch { }
    return str;
};

const transformNode = (n: any): CategoryNode => {
    // If backend already formatted it (it sends title, path_str, isLeaf)
    if (n.title || n.value) {
        const titleRaw = n.title || "";
        const pathRaw = n.path_str || titleRaw;

        return {
            id: n.id,
            value: n.id, // Ensure value is set
            key: n.key || n.id,
            google_id: n.google_id,
            title: decodeText(titleRaw),
            path_str: decodeText(pathRaw),
            isLeaf: n.isLeaf !== undefined ? n.isLeaf : !!n.is_leaf,
            pId: n.pId || n.parent_google_id,
            children: n.children ? n.children.map(transformNode) : undefined
        };
    }

    // Fallback for raw model data (if structure changes)
    const nameObj = safeParse(n.name) || {};
    const pathObj = safeParse(n.full_path) || {};

    let trRaw = nameObj.tr || nameObj.en || (typeof n.name === 'string' ? n.name : "");
    let pathRaw = pathObj.tr || pathObj.en || (typeof n.full_path === 'string' ? n.full_path : trRaw);

    if (!trRaw && !pathRaw) {
        trRaw = `Category #${n.id}`;
    }

    const trTitle = decodeText(trRaw);
    const pathStr = decodeText(pathRaw);

    return {
        id: n.id,
        value: n.id,
        key: n.id,
        google_id: n.google_id,
        title: trTitle || pathStr || "Unknown",
        path_str: pathStr || trTitle,
        isLeaf: !!n.is_leaf,
        pId: n.parent_google_id,
        children: n.children ? n.children.map(transformNode) : undefined
    };
};

export function GoogleCategorySelect({ initialCategory }: { initialCategory?: any }) {
    const [treeData, setTreeData] = useState<CategoryNode[]>([]);
    const [defaultTreeData, setDefaultTreeData] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);
    const [lang, setLang] = useState<string>("tr");
    const form = Form.useFormInstance();
    const fieldValue = Form.useWatch('google_product_category_id', form);

    // Fetch settings for language
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiFetch<any>('/api/settings/general');
                if (res && res.default_locale) {
                    setLang(res.default_locale);
                }
            } catch (e) {
                console.warn("Could not load language settings", e);
            }
        };
        void fetchSettings();
    }, []);

    useEffect(() => {
        if (initialCategory) {
            const nameObj = safeParse(initialCategory.name) || {};
            const pathObj = safeParse(initialCategory.full_path) || {};

            // Try to match current lang or fallback
            let rawTitle = nameObj[lang] || nameObj.en || nameObj.tr || "Bilinmeyen Başlık";
            let rawPath = pathObj[lang] || pathObj.en || pathObj.tr || rawTitle;

            const decodedTitle = decodeText(rawTitle);
            const decodedPath = decodeText(rawPath);

            const node: CategoryNode = {
                id: initialCategory.id,
                value: initialCategory.id,
                google_id: initialCategory.google_id,
                title: decodedTitle,
                isLeaf: !!initialCategory.is_leaf,
                key: initialCategory.id,
                path_str: decodedPath,
            };
            setSelectedNode(node);
        }
    }, [initialCategory, lang]);

    useEffect(() => {
        if (!fieldValue) {
            if (selectedNode) setSelectedNode(null);
            return;
        }

        const id = Number(fieldValue);
        if (selectedNode?.id === id) return;

        const findById = (nodes: CategoryNode[], targetId: number): CategoryNode | null => {
            for (const n of nodes) {
                if (n.id === targetId) return n;
                if (n.children && n.children.length) {
                    const found = findById(n.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        const fromTree = findById(defaultTreeData, id) || findById(treeData, id);
        if (fromTree) {
            setSelectedNode(fromTree);
        }
    }, [fieldValue, defaultTreeData, treeData, selectedNode]);

    useEffect(() => {
        void loadRoot();
    }, [lang]);

    const loadRoot = async () => {
        setLoading(true);
        try {
            const res = await apiFetch<any[]>(`/api/google-categories?lang=${lang}`, { method: "GET" });
            const nodes = (res || []).map(transformNode);
            setTreeData(nodes);
            setDefaultTreeData(nodes);
        } catch (e) {
            console.error("Load root failed", e);
        } finally {
            setLoading(false);
        }
    };


    const onLoadData = async (node: any) => {
        const { id, children, google_id } = node;
        if (children && children.length > 0) return;

        if (!google_id) {
            console.warn("Node missing google_id:", node);
            return;
        }

        try {
            const res = await apiFetch<any[]>(`/api/google-categories?parent_id=${google_id}&lang=${lang}`, { method: "GET" });

            if (!res || !Array.isArray(res)) {
                return;
            }

            const formatted = res.map(transformNode);

            setTreeData((origin) => {
                const newData = updateTreeData(origin, id, formatted);
                setDefaultTreeData(newData);
                return newData;
            });
        } catch (e: any) {
            console.error("Failed to load categories:", e);
        }
    };

    const updateTreeData = (list: CategoryNode[], key: React.Key, children: CategoryNode[], markLeaf = false): CategoryNode[] => {
        return list.map((node) => {
            if (String(node.id) === String(key)) {
                if (markLeaf) return { ...node, isLeaf: true };
                return { ...node, children };
            }
            if (node.children) {
                return { ...node, children: updateTreeData(node.children, key, children, markLeaf) };
            }
            return node;
        });
    };

    const hasNodeById = (list: CategoryNode[], id: number): boolean => {
        return list.some(node => node.id === id || (node.children && hasNodeById(node.children, id)));
    };

    const handleSearch = (value: string) => {
        setSearchValue(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!value) {
            setTreeData(defaultTreeData);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                // Search query
                const res = await apiFetch<any[]>(`/api/google-categories?q=${encodeURIComponent(value)}&lang=${lang}`, { method: "GET" });

                if (!res || !Array.isArray(res)) {
                    setTreeData([]);
                    return;
                }

                const data = res.map(transformNode);

                // When searching, we want to show the full path in the dropdown items to be helpful
                // Ant Design TreeSelect uses 'title' for display. We can temporarily swap title with path for search results.
                const searchData = data.map(d => ({
                    ...d,
                    title: d.path_str || d.title // Use path string for better context in search
                }));

                setTreeData(searchData);
            } catch (e: any) {
                console.warn("Google category search failed", e);
                setTreeData([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    };

    const onSelect = (value: any, node: any) => {
        setSelectedNode(node);
        setSearchValue("");
        setTreeData(defaultTreeData);
    };

    const handleClear = () => {
        setSelectedNode(null);
        setSearchValue("");
        setTreeData(defaultTreeData);
        form.setFieldValue('google_product_category_id', null);
    };

    const displayTreeData = useMemo(() => {
        if (searchValue) return treeData;

        if (selectedNode) {
            const exists = hasNodeById(treeData, selectedNode.id);
            if (!exists) {
                return [...treeData, { ...selectedNode, children: undefined, isLeaf: true }];
            }
        }
        return treeData;
    }, [treeData, searchValue, selectedNode]);

    const emptyContent = (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div style={{ padding: '0 20px' }}>
                    <div style={{ color: '#475569', fontWeight: 600, fontSize: 13 }}>Sonuç bulunamadı</div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                        Farklı kelimelerle aramayı deneyin veya kategorileri manuel olarak gözlemleyin.
                    </div>
                </div>
            }
        />
    );

    return (
        <Form.Item
            name="google_product_category_id"
            label={
                <span style={{ fontWeight: 600, color: '#374151' }}>
                    Google Ürün Kategorisi
                    <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>(Merchant Center)</span>
                </span>
            }
        >
            <div>
                <TreeSelect
                    style={{ width: '100%' }}
                    size="large"
                    treeData={displayTreeData}
                    value={fieldValue ?? undefined}
                    placeholder="Bir kategori arayın (örn: Kumaşlar, Giyim...)"
                    loading={loading}
                    loadData={onLoadData}
                    treeDefaultExpandAll={!!searchValue}
                    allowClear
                    onClear={handleClear}
                    showSearch
                    filterTreeNode={false}
                    searchValue={searchValue}
                    onSearch={handleSearch}
                    onChange={(v) => {
                        form.setFieldValue('google_product_category_id', v ?? null);
                    }}
                    onSelect={onSelect}
                    autoClearSearchValue={true}
                    notFoundContent={emptyContent}
                    listHeight={400}
                    treeNodeFilterProp="title"
                    styles={{
                        popup: {
                            root: {
                                borderRadius: 12,
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                padding: '8px'
                            }
                        }
                    }}
                    treeLine={{ showLeafIcon: false }}
                    treeIcon
                    switcherIcon={<div style={{ fontSize: 10, color: '#94a3b8' }}>▼</div>}
                />
                {selectedNode && (
                    <div style={{
                        marginTop: 12,
                        padding: '12px 16px',
                        background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Seçili Merchant Center Yolu
                            </div>
                            <Button
                                type="text"
                                size="small"
                                onClick={handleClear}
                                style={{ 
                                    fontSize: 11, 
                                    height: 'auto', 
                                    padding: '2px 8px',
                                    color: '#ef4444',
                                    borderColor: '#ef4444'
                                }}
                            >
                                Kaldır
                            </Button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            {(selectedNode.path_str || selectedNode.title).split('>').map((part, i, arr) => (
                                <React.Fragment key={i}>
                                    <span style={{
                                        fontSize: 13,
                                        color: i === arr.length - 1 ? '#4F46E5' : '#475569',
                                        fontWeight: i === arr.length - 1 ? 600 : 400
                                    }}>
                                        {part.trim()}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>/</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Form.Item>
    );
}
