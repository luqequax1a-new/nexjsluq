"use client";

import React from "react";
import type { SchemaField } from "@/types/sectionBuilder";

interface ControlRendererProps {
  field: SchemaField;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  allSettings?: Record<string, any>;
}

export function ControlRenderer({ field, value, onChange, onBlur, allSettings }: ControlRendererProps) {
  // depends_on check: hide field if condition not met
  if (field.depends_on && allSettings) {
    const visible = Object.entries(field.depends_on).every(([depKey, depValue]) => {
      const current = allSettings[depKey];
      return current === depValue || (current !== undefined && String(current) === String(depValue));
    });
    if (!visible) return null;
  }
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    color: "#1f2937",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    background: "#fff",
  };

  const wrapperStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#6366f1";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
  };

  const handleBlurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#d1d5db";
    e.currentTarget.style.boxShadow = "none";
    onBlur?.();
  };

  switch (field.type) {
    case "text":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlurInput}
            style={inputStyle}
            placeholder={field.label}
          />
        </div>
      );

    case "textarea":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus as any}
            onBlur={handleBlurInput as any}
            rows={4}
            style={{
              ...inputStyle,
              height: "auto",
              padding: "10px 12px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
            placeholder={field.label}
          />
        </div>
      );

    case "number":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => onChange(Math.max((field.min ?? 0), (Number(value) || 0) - 1))}
              style={{
                width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 8,
                background: "#fff", cursor: "pointer", fontSize: 18, color: "#6b7280",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              −
            </button>
            <input
              type="number"
              value={value ?? ""}
              onChange={(e) => onChange(Number(e.target.value))}
              onFocus={handleFocus}
              onBlur={handleBlurInput}
              min={field.min}
              max={field.max}
              style={{ ...inputStyle, textAlign: "center", flex: 1 }}
            />
            <button
              onClick={() => onChange(Math.min((field.max ?? 99999), (Number(value) || 0) + 1))}
              style={{
                width: 40, height: 40, border: "1px solid #d1d5db", borderRadius: 8,
                background: "#fff", cursor: "pointer", fontSize: 18, color: "#6b7280",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              +
            </button>
          </div>
        </div>
      );

    case "toggle":
      return (
        <div style={{ ...wrapperStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>{field.label}</label>
          <button
            onClick={() => { onChange(!value); onBlur?.(); }}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: value ? "#6366f1" : "#e5e7eb",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                position: "absolute",
                top: 2,
                left: value ? 22 : 2,
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
      );

    case "select":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <select
            value={value || ""}
            onChange={(e) => { onChange(e.target.value); onBlur?.(); }}
            onFocus={handleFocus as any}
            onBlur={handleBlurInput as any}
            style={{
              ...inputStyle,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: 36,
            }}
          >
            {Object.entries(field.options || {}).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      );

    case "segment":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #d1d5db" }}>
            {Object.entries(field.options || {}).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { onChange(k); onBlur?.(); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  border: "none",
                  borderRight: "1px solid #d1d5db",
                  background: value === k ? "#6366f1" : "#fff",
                  color: value === k ? "#fff" : "#6b7280",
                  fontSize: 13,
                  fontWeight: value === k ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      );

    case "color":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => onBlur?.()}
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: 2,
                }}
              />
            </div>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlurInput}
              style={{ ...inputStyle, flex: 1, fontFamily: "monospace" }}
              placeholder="#000000"
            />
          </div>
        </div>
      );

    case "range":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 24, textAlign: "center" }}>
              {field.min ?? 0}
            </span>
            <input
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 100}
              value={value ?? field.default ?? 0}
              onChange={(e) => onChange(Number(e.target.value))}
              onMouseUp={() => onBlur?.()}
              onTouchEnd={() => onBlur?.()}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                appearance: "none",
                background: `linear-gradient(to right, #6366f1 ${((Number(value) - (field.min ?? 0)) / ((field.max ?? 100) - (field.min ?? 0))) * 100}%, #e5e7eb ${((Number(value) - (field.min ?? 0)) / ((field.max ?? 100) - (field.min ?? 0))) * 100}%)`,
                outline: "none",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 12, color: "#9ca3af", minWidth: 24, textAlign: "center" }}>
              {field.max ?? 100}
            </span>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>
            {value ?? field.default ?? 0}
          </div>
        </div>
      );

    case "image":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          {value ? (
            <div style={{ position: "relative" }}>
              <img
                src={value}
                alt={field.label}
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <label
                  style={{
                    flex: 1, textAlign: "center", padding: "8px 0", border: "1px solid #d1d5db",
                    borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#374151", fontWeight: 500,
                  }}
                >
                  Değiştir
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => { onChange(ev.target?.result as string); onBlur?.(); };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
                <button
                  onClick={() => { onChange(""); onBlur?.(); }}
                  style={{
                    padding: "8px 16px", border: "1px solid #fecaca", borderRadius: 8,
                    fontSize: 13, cursor: "pointer", color: "#ef4444", background: "transparent", fontWeight: 500,
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          ) : (
            <label
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "24px 16px", border: "2px dashed #d1d5db", borderRadius: 12,
                cursor: "pointer", transition: "all 0.15s", background: "#fafafa",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.background = "#f5f3ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.background = "#fafafa";
              }}
            >
              <span style={{ fontSize: 28, marginBottom: 8 }}>📷</span>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Görsel Yükle</span>
              <span style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>veya sürükle bırak</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => { onChange(ev.target?.result as string); onBlur?.(); };
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          )}
        </div>
      );

    case "repeater":
      return <RepeaterControl field={field} value={value} onChange={onChange} onBlur={onBlur} />;

    case "entity_select":
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <EntitySelectControl
            entity={field.entity || "category"}
            multiple={field.multiple || false}
            value={value}
            onChange={(val: any) => { onChange(val); onBlur?.(); }}
          />
        </div>
      );

    default:
      return (
        <div style={wrapperStyle}>
          <label style={labelStyle}>{field.label}</label>
          <input
            type="text"
            value={typeof value === "string" ? value : JSON.stringify(value)}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlurInput}
            style={inputStyle}
          />
        </div>
      );
  }
}

// ─── Repeater Control ───
function RepeaterControl({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: SchemaField;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
}) {
  const items: any[] = Array.isArray(value) ? value : [];
  const subFields = field.fields || [];

  const addItem = () => {
    const newItem: Record<string, any> = {};
    subFields.forEach((f) => {
      newItem[f.key] = f.default ?? "";
    });
    onChange([...items, newItem]);
    onBlur?.();
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    onBlur?.();
  };

  const updateItem = (index: number, key: string, val: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: val };
    onChange(newItems);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
        {field.label}
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, index) => (
          <RepeaterItem
            key={index}
            index={index}
            item={item}
            subFields={subFields}
            onUpdate={(key, val) => updateItem(index, key, val)}
            onRemove={() => removeItem(index)}
            onBlur={onBlur}
            label={item.title || item.text || item.name || item.question || `${field.button_label?.replace("Ekle", "").trim() || "Öğe"} ${index + 1}`}
          />
        ))}
      </div>

      <button
        onClick={addItem}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "10px 0",
          border: "2px dashed #c7d2fe",
          borderRadius: 8,
          background: "transparent",
          color: "#6366f1",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6366f1";
          e.currentTarget.style.background = "#f5f3ff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#c7d2fe";
          e.currentTarget.style.background = "transparent";
        }}
      >
        + {field.button_label || "Ekle"}
      </button>
    </div>
  );
}

function RepeaterItem({
  index,
  item,
  subFields,
  onUpdate,
  onRemove,
  onBlur,
  label,
}: {
  index: number;
  item: Record<string, any>;
  subFields: SchemaField[];
  onUpdate: (key: string, val: any) => void;
  onRemove: () => void;
  onBlur?: () => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: "#fafafa",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: "#1f2937",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: "#9ca3af", cursor: "grab", fontSize: 12 }}>⠿</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "#9ca3af", padding: 2, borderRadius: 4, display: "flex",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          🗑
        </button>
      </div>

      {isOpen && (
        <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb" }}>
          {subFields.map((sf) => (
            <ControlRenderer
              key={sf.key}
              field={sf}
              value={item[sf.key] ?? sf.default ?? ""}
              onChange={(val: any) => onUpdate(sf.key, val)}
              onBlur={onBlur}
              allSettings={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Entity Select (async search dropdown with tree support) ───

interface EntityOption {
  id: number;
  name: string;
  slug?: string;
  image?: string;
  depth?: number;
  children?: EntityOption[];
}

const ENTITY_ENDPOINTS: Record<string, string> = {
  category: "/api/categories-tree",
  brand: "/api/brands",
  product: "/api/products",
  tag: "/api/tags",
};

const ENTITY_SEARCH_ENDPOINTS: Record<string, string> = {
  category: "/api/categories",
  brand: "/api/brands",
  product: "/api/products",
  tag: "/api/tags",
};

const ENTITY_LABELS: Record<string, string> = {
  category: "Kategori seç veya ara...",
  brand: "Marka seç veya ara...",
  product: "Ürün seç veya ara...",
  tag: "Etiket seç veya ara...",
};

// Flatten tree into indented list
function flattenTree(nodes: any[], depth = 0): EntityOption[] {
  const result: EntityOption[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name || node.title || `#${node.id}`,
      slug: node.slug,
      image: node.image || node.logo,
      depth,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

function EntitySelectControl({
  entity,
  multiple,
  value,
  onChange,
}: {
  entity: string;
  multiple: boolean;
  value: any;
  onChange: (val: any) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [allOptions, setAllOptions] = React.useState<EntityOption[]>([]);
  const [filteredOptions, setFilteredOptions] = React.useState<EntityOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [initialLoaded, setInitialLoaded] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<EntityOption[]>([]);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Load initial list (all items) on first open
  const loadInitialOptions = React.useCallback(async () => {
    if (initialLoaded || loading) return;
    setLoading(true);
    try {
      const { apiFetch } = await import("@/lib/api");
      const endpoint = ENTITY_ENDPOINTS[entity] || ENTITY_ENDPOINTS.category;
      const res = await apiFetch<any>(endpoint + (entity !== "category" ? "?per_page=50" : ""));
      const raw = entity === "category"
        ? (res.categories || res.data || res || [])
        : (res.data || res.items || res || []);
      const list = Array.isArray(raw) ? raw : [];

      if (entity === "category") {
        // Tree structure — flatten with depth
        setAllOptions(flattenTree(list));
      } else {
        setAllOptions(list.map((item: any) => ({
          id: item.id,
          name: item.name || item.title || `#${item.id}`,
          slug: item.slug,
          image: item.image || item.logo,
          depth: 0,
        })));
      }
      setInitialLoaded(true);
    } catch {
      setAllOptions([]);
    }
    setLoading(false);
  }, [entity, initialLoaded, loading]);

  // Resolve selected IDs to names on mount
  React.useEffect(() => {
    if (!value) { setSelectedItems([]); return; }

    const ids: number[] = multiple
      ? (Array.isArray(value) ? value : String(value).split(",").map(Number).filter(Boolean))
      : [Number(value)].filter(Boolean);

    if (ids.length === 0) { setSelectedItems([]); return; }

    const resolveNames = async () => {
      try {
        const { apiFetch } = await import("@/lib/api");
        const searchEndpoint = ENTITY_SEARCH_ENDPOINTS[entity] || ENTITY_SEARCH_ENDPOINTS.category;
        const params = ids.map((id) => `ids[]=${id}`).join("&");
        const res = await apiFetch<any>(`${searchEndpoint}?${params}&per_page=50`);
        const items = res.data || res.items || res || [];
        const list = Array.isArray(items) ? items : [];
        setSelectedItems(list.filter((item: any) => ids.includes(item.id)).map((item: any) => ({
          id: item.id,
          name: item.name || item.title || `#${item.id}`,
          slug: item.slug,
          image: item.image || item.logo,
        })));
      } catch {
        setSelectedItems(ids.map((id) => ({ id, name: `#${id}` })));
      }
    };
    resolveNames();
  }, []);

  // Filter options based on search (client-side for tree, server-side for products)
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!search.trim()) {
      setFilteredOptions(allOptions);
      return;
    }

    // For category/brand — client-side filter from loaded list
    if (entity === "category" || entity === "brand") {
      const q = search.toLowerCase();
      setFilteredOptions(allOptions.filter((o) => o.name.toLowerCase().includes(q)));
      return;
    }

    // For product — server-side search (too many items for client-side)
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { apiFetch } = await import("@/lib/api");
        const res = await apiFetch<any>(`/api/products?search=${encodeURIComponent(search)}&per_page=20`);
        const items = res.data || res.items || res || [];
        const list = Array.isArray(items) ? items : [];
        setFilteredOptions(list.map((item: any) => ({
          id: item.id,
          name: item.name || item.title || `#${item.id}`,
          slug: item.slug,
          image: item.image || item.logo,
          depth: 0,
        })));
      } catch {
        setFilteredOptions([]);
      }
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, allOptions, entity]);

  // When allOptions load, update filtered
  React.useEffect(() => {
    if (!search.trim()) setFilteredOptions(allOptions);
  }, [allOptions]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    loadInitialOptions();
  };

  const handleSelect = (item: EntityOption) => {
    if (multiple) {
      const exists = selectedItems.some((s) => s.id === item.id);
      if (exists) return;
      const newItems = [...selectedItems, item];
      setSelectedItems(newItems);
      onChange(newItems.map((i) => i.id));
    } else {
      setSelectedItems([item]);
      onChange(item.id);
      setIsOpen(false);
    }
    setSearch("");
  };

  const handleRemove = (id: number) => {
    const newItems = selectedItems.filter((s) => s.id !== id);
    setSelectedItems(newItems);
    if (multiple) {
      onChange(newItems.length > 0 ? newItems.map((i) => i.id) : null);
    } else {
      onChange(null);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {selectedItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#f0f0ff", border: "1px solid #e0e0ff", borderRadius: 6,
                padding: "3px 8px", fontSize: 12, color: "#4338ca",
              }}
            >
              <span style={{ fontWeight: 500 }}>{item.name}</span>
              <button
                onClick={() => handleRemove(item.id)}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#9ca3af", fontSize: 14, padding: 0, lineHeight: 1,
                  display: "flex",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); if (!isOpen) handleOpen(); }}
        onFocus={handleOpen}
        placeholder={ENTITY_LABELS[entity] || "Ara..."}
        style={{
          width: "100%", height: 40, padding: "0 12px",
          border: `1px solid ${isOpen ? "#6366f1" : "#d1d5db"}`,
          borderRadius: 8, fontSize: 13,
          color: "#1f2937", outline: "none", background: "#fff",
          boxShadow: isOpen ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      />

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto",
          marginTop: 4,
        }}>
          {loading && (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Yükleniyor...
            </div>
          )}
          {!loading && filteredOptions.length === 0 && (
            <div style={{ padding: "12px 16px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              {search.trim() ? "Sonuç bulunamadı" : "Veri yok"}
            </div>
          )}
          {!loading && filteredOptions.map((opt) => {
            const isSelected = selectedItems.some((s) => s.id === opt.id);
            const indent = (opt.depth || 0) * 20;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                disabled={isSelected}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: `6px 12px 6px ${12 + indent}px`,
                  border: "none", borderBottom: "1px solid #f3f4f6",
                  background: isSelected ? "#f0f0ff" : "transparent",
                  cursor: isSelected ? "default" : "pointer", textAlign: "left",
                  opacity: isSelected ? 0.5 : 1, transition: "background 0.1s",
                  fontSize: 13,
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "#f0f0ff" : "transparent"; }}
              >
                {/* Tree indent indicator */}
                {entity === "category" && (opt.depth || 0) > 0 && (
                  <span style={{ color: "#d1d5db", fontSize: 10, flexShrink: 0 }}>└</span>
                )}
                {opt.image && (
                  <img src={opt.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: (opt.depth || 0) === 0 ? 500 : 400,
                    color: "#1f2937",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontSize: (opt.depth || 0) > 0 ? 12 : 13,
                  }}>
                    {opt.name}
                  </div>
                </div>
                {isSelected && <span style={{ fontSize: 11, color: "#6366f1", flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
