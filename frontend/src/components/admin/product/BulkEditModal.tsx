"use client";

import { Modal, Select, Input, InputNumber, Radio, Button, TreeSelect, App } from "antd";
import { CloseOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BulkScope = "selected" | "all";

type ActionMode =
  | "set"
  | "increase_percent"
  | "decrease_percent"
  | "increase_fixed"
  | "decrease_fixed"
  | "clear"
  | "add"
  | "remove"
  | "search_replace"
  | "prefix"
  | "suffix";

interface BulkAction {
  id: string;
  attribute: string;
  mode: ActionMode;
  value: any;
}

interface AttrOption {
  label: string;
  value: string;
  type: "number" | "text" | "toggle" | "primary_category" | "categories" | "brand" | "inventory";
  modes: { value: ActionMode; label: string }[];
}

interface BulkEditModalProps {
  open: boolean;
  selectedIds: (string | number)[];
  onClose: () => void;
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/*  Attribute Options for "İşlem Ekle" dropdown                        */
/* ------------------------------------------------------------------ */

const ATTR_OPTIONS: AttrOption[] = [
  {
    label: "Fiyat",
    value: "price",
    type: "number",
    modes: [
      { value: "set", label: "Güncelle" },
      { value: "increase_percent", label: "% Artır" },
      { value: "decrease_percent", label: "% Azalt" },
      { value: "increase_fixed", label: "Tutar Artır" },
      { value: "decrease_fixed", label: "Tutar Azalt" },
    ],
  },
  {
    label: "İndirimli Fiyat",
    value: "special_price",
    type: "number",
    modes: [
      { value: "set", label: "Güncelle" },
      { value: "increase_percent", label: "% Artır" },
      { value: "decrease_percent", label: "% Azalt" },
      { value: "increase_fixed", label: "Tutar Artır" },
      { value: "decrease_fixed", label: "Tutar Azalt" },
      { value: "clear", label: "Temizle" },
    ],
  },
  {
    label: "Stok",
    value: "inventory",
    type: "inventory",
    modes: [{ value: "set", label: "Güncelle" }],
  },
  {
    label: "Ana Kategori",
    value: "primary_category",
    type: "primary_category",
    modes: [{ value: "set", label: "Seç" }],
  },
  {
    label: "Kategori Ekle/Çıkar",
    value: "category_action",
    type: "categories",
    modes: [
      { value: "add", label: "Ekle" },
      { value: "remove", label: "Çıkar" },
    ],
  },
  {
    label: "Durum",
    value: "is_active",
    type: "toggle",
    modes: [{ value: "set", label: "Güncelle" }],
  },
  {
    label: "Marka",
    value: "brand_id",
    type: "brand",
    modes: [
      { value: "set", label: "Güncelle" },
      { value: "clear", label: "Temizle" },
    ],
  },
  {
    label: "Ürün Adı",
    value: "name",
    type: "text",
    modes: [
      { value: "set", label: "Güncelle" },
      { value: "search_replace", label: "Bul/Değiştir" },
      { value: "prefix", label: "Başına Ekle" },
      { value: "suffix", label: "Sonuna Ekle" },
    ],
  },
  {
    label: "Açıklama",
    value: "description",
    type: "text",
    modes: [
      { value: "set", label: "Güncelle" },
      { value: "search_replace", label: "Bul/Değiştir" },
      { value: "prefix", label: "Başına Ekle" },
      { value: "suffix", label: "Sonuna Ekle" },
    ],
  },
];

const getAttrOption = (attr: string) => ATTR_OPTIONS.find((o) => o.value === attr);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BulkEditModal({ open, selectedIds, onClose, onSuccess }: BulkEditModalProps) {
  const { message } = App.useApp();
  const [scope, setScope] = useState<BulkScope>("selected");
  const [actions, setActions] = useState<BulkAction[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Reference data
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);

  // Load reference data once (not tied to open/close)
  const refLoaded = useRef(false);
  useEffect(() => {
    if (refLoaded.current) return;
    refLoaded.current = true;

    apiFetch<any>("/api/categories-tree")
      .then((res) => {
        const raw = res?.categories || res?.data || res;
        setCategoryTree(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {});

    apiFetch<any>("/api/brands?paginate=false")
      .then((res) => {
        const raw = Array.isArray(res) ? res : res?.data || [];
        setBrands(Array.isArray(raw) ? raw.map((b: any) => ({ id: b.id, name: b.name })) : []);
      })
      .catch(() => {});
  }, []);

  // Reset actions/scope when modal opens
  useEffect(() => {
    if (!open) return;
    setActions([]);
    setScope(selectedIds.length > 0 ? "selected" : "all");
  }, [open]);

  const buildTreeData = (nodes: any[]): any[] =>
    (Array.isArray(nodes) ? nodes : []).map((n: any) => ({
      title: n.name,
      value: n.id,
      key: n.id,
      children: n.children?.length ? buildTreeData(n.children) : undefined,
    }));

  const treeData = buildTreeData(categoryTree);

  const addAction = useCallback((attr: string) => {
    const opt = getAttrOption(attr);
    if (!opt) return;
    setActions((prev) => [
      ...prev,
      {
        id: `${attr}_${Date.now()}`,
        attribute: attr,
        mode: opt.modes[0].value,
        value: null,
      },
    ]);
  }, []);

  const removeAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAction = useCallback((id: string, updates: Partial<BulkAction>) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const collectPayloadActions = (): any[] => {
    const result: any[] = [];
    for (const action of actions) {
      if (action.attribute === "inventory") {
        const inv = action.value || {};
        result.push({ attribute: "qty", mode: "set", value: inv.qty ?? 0 });
        result.push({ attribute: "in_stock", mode: "set", value: (inv.qty ?? 0) > 0 ? 1 : 0 });
        continue;
      }
      result.push({
        attribute: action.attribute,
        mode: action.mode,
        value: action.value,
      });
    }
    return result;
  };

  const handleSave = async () => {
    const payloadActions = collectPayloadActions();
    if (payloadActions.length === 0) {
      message.warning("Lütfen en az bir işlem ekleyin.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string; updated_count: number }>("/api/products/bulk-update", {
        method: "POST",
        json: {
          product_ids: scope === "all" ? [] : selectedIds.map(Number),
          actions: payloadActions,
          apply_to_variants: true,
        },
      });
      message.success(res.message || "İşlem başarılı.");
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.message || "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={640}
      centered
      footer={null}
      closable={false}
      destroyOnClose
      styles={{
        body: { padding: 0 },
        content: { borderRadius: 12, overflow: "hidden", padding: 0 },
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px 0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1a1a2e" }}>
            {selectedCount > 0
              ? `${selectedCount} Ürünü Düzenle`
              : "Ürünleri Düzenle"}
          </h3>
          <InfoCircleOutlined style={{ color: "#bbb", fontSize: 14 }} />
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#999",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
          }}
        >
          <CloseOutlined />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px 0 24px" }}>
        {/* Scope */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
            Hangi ürünlerinizi düzenleyeceğinizi seçin
          </div>
          <Radio.Group
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
          >
            <Radio value="all" style={{ fontSize: 14, color: "#333" }}>
              Tüm Ürünler
            </Radio>
            <Radio value="selected" style={{ fontSize: 14, color: "#333" }}>
              Seçilen {selectedCount} ürün
            </Radio>
          </Radio.Group>
        </div>

        {/* İşlem Ekle dropdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
            Seçili ürünleri düzenlemek için işlem ekleyin
          </div>
          <Select
            placeholder="İşlem Ekle"
            style={{ width: "100%" }}
            size="large"
            value={null as any}
            onChange={(val: string) => {
              if (val) addAction(val);
            }}
            options={ATTR_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>

        {/* Action Rows */}
        {actions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
            {actions.map((action) => (
              <ActionRow
                key={action.id}
                action={action}
                treeData={treeData}
                brands={brands}
                onUpdate={updateAction}
                onRemove={removeAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        padding: "16px 24px",
        borderTop: actions.length > 0 ? "1px solid #f0f0f0" : "none",
      }}>
        <Button onClick={onClose} style={{ borderRadius: 8, fontWeight: 500 }}>
          Vazgeç
        </Button>
        <Button
          type="primary"
          onClick={handleSave}
          loading={submitting}
          disabled={actions.length === 0}
          style={{
            borderRadius: 8,
            fontWeight: 500,
            background: "#5E5CE6",
            borderColor: "#5E5CE6",
          }}
        >
          Kaydet
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionRow — matches ikas screenshot exactly                        */
/* ------------------------------------------------------------------ */

function ActionRow({
  action,
  treeData,
  brands,
  onUpdate,
  onRemove,
}: {
  action: BulkAction;
  treeData: any[];
  brands: { id: number; name: string }[];
  onUpdate: (id: string, updates: Partial<BulkAction>) => void;
  onRemove: (id: string) => void;
}) {
  const opt = getAttrOption(action.attribute);
  if (!opt) return null;

  const renderValueInput = () => {
    if (action.mode === "clear") return null;

    if (opt.type === "inventory") {
      const inv = action.value || { qty: 0 };
      return (
        <InputNumber
          style={{ flex: 1 }}
          placeholder="Miktar"
          value={inv.qty}
          min={0}
          onChange={(v) => onUpdate(action.id, { value: { ...inv, qty: v ?? 0 } })}
        />
      );
    }

    if (opt.type === "primary_category") {
      return (
        <TreeSelect
          style={{ flex: 1 }}
          placeholder="Ana kategori seçin (1 adet)"
          treeData={treeData}
          value={action.value || undefined}
          onChange={(v) => onUpdate(action.id, { value: v })}
          treeDefaultExpandAll
          allowClear
        />
      );
    }

    if (opt.type === "categories") {
      return (
        <TreeSelect
          style={{ flex: 1 }}
          placeholder="Kategori seçin"
          treeData={treeData}
          value={action.value || undefined}
          onChange={(v) => onUpdate(action.id, { value: v })}
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          treeDefaultExpandAll
          maxTagCount={2}
          allowClear
        />
      );
    }

    if (opt.type === "brand") {
      return (
        <Select
          style={{ flex: 1 }}
          placeholder="Marka seçin"
          value={action.value}
          onChange={(v) => onUpdate(action.id, { value: v })}
          showSearch
          optionFilterProp="label"
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
        />
      );
    }

    if (opt.type === "toggle") {
      return (
        <Select
          style={{ flex: 1 }}
          value={action.value ?? 1}
          onChange={(v) => onUpdate(action.id, { value: v })}
          options={[
            { value: 1, label: "Aktif" },
            { value: 0, label: "Pasif" },
          ]}
        />
      );
    }

    if (action.mode === "search_replace") {
      const sr = action.value || { search: "", replace: "" };
      return (
        <div style={{ display: "flex", gap: 8, flex: 1 }}>
          <Input
            placeholder="Aranan"
            value={sr.search}
            onChange={(e) => onUpdate(action.id, { value: { ...sr, search: e.target.value } })}
            style={{ flex: 1 }}
          />
          <Input
            placeholder="Yeni"
            value={sr.replace}
            onChange={(e) => onUpdate(action.id, { value: { ...sr, replace: e.target.value } })}
            style={{ flex: 1 }}
          />
        </div>
      );
    }

    if (opt.type === "number") {
      return (
        <InputNumber
          style={{ flex: 1 }}
          placeholder="Değer"
          value={action.value}
          onChange={(v) => onUpdate(action.id, { value: v })}
          step={0.01}
        />
      );
    }

    return (
      <Input
        style={{ flex: 1 }}
        placeholder="Değer"
        value={action.value ?? ""}
        onChange={(e) => onUpdate(action.id, { value: e.target.value })}
      />
    );
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 0",
    }}>
      {/* Label */}
      <div style={{
        minWidth: 90,
        fontSize: 14,
        fontWeight: 500,
        color: "#333",
        flexShrink: 0,
      }}>
        {opt.label}
      </div>

      {/* Mode Select */}
      {opt.modes.length > 1 && (
        <Select
          value={action.mode}
          onChange={(v) => onUpdate(action.id, { mode: v as ActionMode, value: null })}
          style={{ width: 110, flexShrink: 0 }}
          options={opt.modes}
        />
      )}

      {/* Value Input */}
      <div style={{ flex: 1, display: "flex" }}>
        {renderValueInput()}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onRemove(action.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "#ccc",
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; }}
      >
        <DeleteOutlined />
      </button>
    </div>
  );
}
