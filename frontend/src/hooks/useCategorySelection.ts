import { useState, useEffect } from 'react';
import { getCategoryTree } from '@/lib/api/categories';
import { CategoryTreeNode } from '@/types/category';
import { App } from 'antd';

export interface CategoryPath {
    id: number;
    name: string;
}

export function useCategorySelection() {
    const { message } = App.useApp();
    const [modalOpen, setModalOpen] = useState(false);
    const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
    const [selectedExplicitKeys, setSelectedExplicitKeys] = useState<number[]>([]);
    const [tempSelectedExplicitKeys, setTempSelectedExplicitKeys] = useState<number[]>([]);
    const [primaryCategoryId, setPrimaryCategoryId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (modalOpen) {
            fetchCategories();
        }
    }, [modalOpen]);



    // Helper to check array equality (simple number arrays)
    const arraysEqual = (a: number[], b: number[]) => {
        if (a === b) return true;
        if (a.length !== b.length) return false;
        const sA = [...a].sort((x, y) => x - y);
        const sB = [...b].sort((x, y) => x - y);
        return sA.every((v, i) => v === sB[i]);
    };

    useEffect(() => {
        if (categories.length === 0) return;
        if (selectedKeys.length === 0) return;

        // If explicit selection has not been set separately (common when loading saved effective keys),
        // normalize it to leaf-most selections.
        if (selectedExplicitKeys.length === 0 || selectedExplicitKeys.length === selectedKeys.length) {
            const normalized = deriveExplicitFromEffective(selectedKeys);

            // Only update if different
            if (!arraysEqual(normalized, selectedExplicitKeys)) {
                setSelectedExplicitKeys(normalized);
            }

            const normalizedPrimary = normalizePrimaryToLeaf(primaryCategoryId, normalized);
            if (normalizedPrimary !== primaryCategoryId) {
                setPrimaryCategoryId(normalizedPrimary);
            }
        }
    }, [categories, selectedKeys]);

    useEffect(() => {
        if (categories.length === 0) return;
        if (selectedExplicitKeys.length === 0) {
            if (primaryCategoryId !== null) setPrimaryCategoryId(null);
            return;
        }

        const normalizedPrimary = normalizePrimaryToLeaf(primaryCategoryId, selectedExplicitKeys);
        if (normalizedPrimary !== primaryCategoryId) {
            setPrimaryCategoryId(normalizedPrimary);
        }
    }, [categories, selectedExplicitKeys]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategoryTree('normal');
            setCategories(response.categories || []);
        } catch (error) {
            message.error('Kategoriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const buildTreeData = (cats: CategoryTreeNode[]): any[] => {
        return cats.map(cat => ({
            title: cat.name,
            key: cat.id,
            children: cat.children && cat.children.length > 0 ? buildTreeData(cat.children) : [],
        }));
    };

    const buildDepthMap = (cats: CategoryTreeNode[]) => {
        const depthById = new Map<number, number>();
        const visit = (nodes: CategoryTreeNode[], depth: number) => {
            for (const node of nodes) {
                depthById.set(node.id, depth);
                if (node.children && node.children.length > 0) {
                    visit(node.children, depth + 1);
                }
            }
        };
        visit(cats, 1);
        return depthById;
    };

    const getDeepestExplicit = (explicitKeys: number[]) => {
        if (explicitKeys.length === 0) return null;
        const depthById = buildDepthMap(categories);

        let bestId: number | null = null;
        let bestDepth = -1;
        for (const id of explicitKeys) {
            const depth = depthById.get(id) ?? 0;
            if (depth > bestDepth) {
                bestDepth = depth;
                bestId = id;
            }
        }

        return bestId ?? explicitKeys[0] ?? null;
    };

    const isDescendantOrSelf = (maybeAncestorId: number, nodeId: number, parentById: Map<number, number | null>) => {
        if (maybeAncestorId === nodeId) return true;
        let current = parentById.get(nodeId) ?? null;
        while (current) {
            if (current === maybeAncestorId) return true;
            current = parentById.get(current) ?? null;
        }
        return false;
    };

    const normalizePrimaryToLeaf = (primaryId: number | null, explicitKeys: number[]) => {
        if (!primaryId) return getDeepestExplicit(explicitKeys);
        if (explicitKeys.length === 0) return null;

        // If primary already points to an explicitly selected leaf/category, keep it.
        if (explicitKeys.includes(primaryId)) return primaryId;

        // If primary is an ancestor (or equal) of any explicit keys, pick the deepest explicit under that branch.
        const parentById = buildParentMap(categories);
        const depthById = buildDepthMap(categories);

        let bestId: number | null = null;
        let bestDepth = -1;
        for (const id of explicitKeys) {
            if (!isDescendantOrSelf(primaryId, id, parentById)) continue;
            const depth = depthById.get(id) ?? 0;
            if (depth > bestDepth) {
                bestDepth = depth;
                bestId = id;
            }
        }

        return bestId ?? getDeepestExplicit(explicitKeys);
    };

    const buildParentMap = (cats: CategoryTreeNode[]) => {
        const parentById = new Map<number, number | null>();
        const visit = (nodes: CategoryTreeNode[], parentId: number | null) => {
            for (const node of nodes) {
                parentById.set(node.id, parentId);
                if (node.children && node.children.length > 0) {
                    visit(node.children, node.id);
                }
            }
        };
        visit(cats, null);
        return parentById;
    };

    const getAncestorIds = (id: number, parentById: Map<number, number | null>) => {
        const ancestors: number[] = [];
        let current = parentById.get(id) ?? null;
        while (current) {
            ancestors.push(current);
            current = parentById.get(current) ?? null;
        }
        return ancestors;
    };

    const getDerivedSelection = (explicitKeys: number[]) => {
        const parentById = buildParentMap(categories);
        const explicitSet = new Set(explicitKeys);
        const ancestorSet = new Set<number>();
        for (const key of explicitKeys) {
            for (const ancestorId of getAncestorIds(key, parentById)) {
                if (!explicitSet.has(ancestorId)) ancestorSet.add(ancestorId);
            }
        }

        return {
            checked: [...explicitSet],
            halfChecked: [...ancestorSet],
            effective: [...new Set([...explicitSet, ...ancestorSet])],
        };
    };

    const buildChildrenMap = (cats: CategoryTreeNode[]) => {
        const childrenById = new Map<number, number[]>();
        const visit = (nodes: CategoryTreeNode[]) => {
            for (const node of nodes) {
                childrenById.set(node.id, (node.children || []).map(c => c.id));
                if (node.children && node.children.length > 0) {
                    visit(node.children);
                }
            }
        };
        visit(cats);
        return childrenById;
    };

    const deriveExplicitFromEffective = (effectiveKeys: number[]) => {
        const selectedSet = new Set(effectiveKeys);
        const childrenById = buildChildrenMap(categories);

        const hasSelectedDescendant = (id: number): boolean => {
            const children = childrenById.get(id) || [];
            for (const childId of children) {
                if (selectedSet.has(childId) || hasSelectedDescendant(childId)) return true;
            }
            return false;
        };

        return effectiveKeys.filter(id => !hasSelectedDescendant(id));
    };

    const getCategoryById = (id: number, cats: CategoryTreeNode[] = categories): CategoryTreeNode | null => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children && cat.children.length > 0) {
                const found = getCategoryById(id, cat.children);
                if (found) return found;
            }
        }
        return null;
    };

    const getCategoryPath = (id: number): CategoryPath[] => {
        const findPath = (cats: CategoryTreeNode[], targetId: number, path: CategoryPath[] = []): CategoryPath[] | null => {
            for (const cat of cats) {
                const currentPath = [...path, { id: cat.id, name: cat.name }];
                if (cat.id === targetId) return currentPath;
                if (cat.children && cat.children.length > 0) {
                    const found = findPath(cat.children, targetId, currentPath);
                    if (found) return found;
                }
            }
            return null;
        };
        return findPath(categories, id) || [];
    };

    const openModal = () => {
        setTempSelectedExplicitKeys([...selectedExplicitKeys]);
        setModalOpen(true);
    };

    const closeModal = () => {
        setTempSelectedExplicitKeys([]);
        setModalOpen(false);
        setSearchText('');
    };

    const handleSave = () => {
        const { effective } = getDerivedSelection(tempSelectedExplicitKeys);
        setSelectedExplicitKeys([...tempSelectedExplicitKeys]);
        setSelectedKeys([...effective]);

        setPrimaryCategoryId(prev => normalizePrimaryToLeaf(prev, tempSelectedExplicitKeys));

        closeModal();
    };

    const removeCategory = (id: number) => {
        const newExplicit = selectedExplicitKeys.filter(k => k !== id);
        const { effective } = getDerivedSelection(newExplicit);
        setSelectedExplicitKeys(newExplicit);
        setSelectedKeys(effective);

        setPrimaryCategoryId(prev => normalizePrimaryToLeaf(prev, newExplicit));
    };

    const setPrimary = (id: number) => {
        setPrimaryCategoryId(normalizePrimaryToLeaf(id, selectedExplicitKeys));
    };

    return {
        modalOpen,
        openModal,
        closeModal,
        handleSave,
        categories,
        loading,
        searchText,
        setSearchText,
        selectedKeys,
        setSelectedKeys,
        selectedExplicitKeys,
        setSelectedExplicitKeys,
        tempSelectedExplicitKeys,
        setTempSelectedExplicitKeys,
        primaryCategoryId,
        setPrimaryCategoryId,
        buildTreeData,
        getDerivedSelection,
        deriveExplicitFromEffective,
        getCategoryById,
        getCategoryPath,
        removeCategory,
        setPrimary,
        normalizePrimaryToLeaf,
    };
}
