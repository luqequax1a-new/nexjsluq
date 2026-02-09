"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Form, Input, InputNumber, Radio, Select, Switch, TreeSelect, Typography } from "antd";
import type { FormInstance } from "antd";
import { RichTextField } from "@/components/admin/RichTextField";
import { getCategoryTree } from "@/lib/api/categories";
import { apiFetch } from "@/lib/api";
import { useProductTags } from "@/hooks/useProductTags";
import type { ProductTab, ProductTabConditions } from "@/lib/api/productTabs";
import type { CategoryTreeNode } from "@/types/category";

const { Text } = Typography;

type CategoryTreeSelectNode = {
  title: string;
  value: number;
  key: number;
  children?: CategoryTreeSelectNode[];
};

function buildTreeData(nodes: CategoryTreeNode[]): CategoryTreeSelectNode[] {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: Number(n.id),
    key: Number(n.id),
    children: Array.isArray(n.children) && n.children.length > 0 ? buildTreeData(n.children) : undefined,
  }));
}

type ProductIndexResponse = { data?: Array<{ id: number; name?: string | null }> };

export type ProductTabFormProps = {
  initial?: Partial<ProductTab> | null;
  form: FormInstance;
  disabled?: boolean;
};

export function ProductTabForm({ initial, form, disabled }: ProductTabFormProps) {
  const [categoryTree, setCategoryTree] = useState<CategoryTreeSelectNode[]>([]);
  const { tagOptions, tagLoading, searchTags } = useProductTags();

  const [productOptions, setProductOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCategoryTree("normal");
        setCategoryTree(buildTreeData((res?.categories || []) as CategoryTreeNode[]));
      } catch {
        // ignore
      }
    })();
  }, []);

  const searchProducts = useCallback(async (q: string) => {
    try {
      setProductLoading(true);
      const res = await apiFetch<ProductIndexResponse>(`/api/products?search=${encodeURIComponent(q || "")}&per_page=10`, {
        method: "GET",
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      setProductOptions(
        items
          .map((p) => ({
            value: Number(p.id),
            label: `#${p.id} ${String(p.name ?? "").trim() || "(İsimsiz)"}`,
          }))
          .filter((x) => Number.isFinite(x.value) && x.value > 0),
      );
    } catch {
      // ignore
    } finally {
      setProductLoading(false);
    }
  }, []);

  useEffect(() => {
    void searchProducts("");
  }, [searchProducts]);

  useEffect(() => {
    if (!initial) return;
    form.setFieldsValue({
      title: initial.title ?? "",
      is_active: initial.is_active ?? true,
      position: initial.position ?? 0,
      content_html: initial.content_html ?? "",
      conditions: {
        match: "any",
        category_mode: "any",
        tag_mode: "any",
        product_ids: [],
        category_ids: [],
        tag_names: [],
        ...(initial.conditions || {}),
      },
    });
  }, [form, initial]);

  const watchedConditions = Form.useWatch("conditions", form) as ProductTabConditions | undefined;

  const conditionsHint = useMemo(() => {
    const c = (watchedConditions || {}) as ProductTabConditions;
    const hasAny =
      (Array.isArray(c.product_ids) && c.product_ids.length > 0) ||
      (Array.isArray(c.category_ids) && c.category_ids.length > 0) ||
      (Array.isArray(c.tag_names) && c.tag_names.length > 0);
    return hasAny ? null : "Boş bırakırsanız sekme tüm ürünlerde görünür.";
  }, [watchedConditions]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
      <div>
        <Card title="Genel" style={{ borderRadius: 12, border: "1px solid #f0f0f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px", gap: 12 }}>
            <Form.Item
              label="Başlık"
              name="title"
              rules={[{ required: true, message: "Başlık zorunludur." }]}
            >
              <Input disabled={disabled} placeholder="Örn: Kargo & İade" />
            </Form.Item>

            <Form.Item label="Aktif" name="is_active" valuePropName="checked">
              <Switch disabled={disabled} />
            </Form.Item>

            <Form.Item label="Sıra" name="position">
              <InputNumber disabled={disabled} min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Card>

        <Card title="İçerik" style={{ marginTop: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}>
          <Form.Item name="content_html" style={{ marginBottom: 0 }}>
            <RichTextField height={420} placeholder="Sekme içeriği..." disabled={disabled} />
          </Form.Item>
        </Card>

        <Card title="Kapsam" style={{ marginTop: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 1fr", gap: 12 }}>
            <Form.Item label="Kural Mantığı" name={["conditions", "match"]} initialValue="any">
              <Radio.Group
                disabled={disabled}
                options={[
                  { label: "VEYA (herhangi biri)", value: "any" },
                  { label: "VE (hepsi)", value: "all" },
                ]}
                optionType="button"
                buttonStyle="solid"
              />
            </Form.Item>

            <Form.Item label="Ürünler" name={["conditions", "product_ids"]}>
              <Select
                disabled={disabled}
                mode="multiple"
                allowClear
                showSearch
                placeholder="Ürün ara..."
                filterOption={false}
                onSearch={searchProducts}
                options={productOptions}
                loading={productLoading}
              />
            </Form.Item>

            <Form.Item label="Etiketler" name={["conditions", "tag_names"]}>
              <Select
                disabled={disabled}
                mode="multiple"
                allowClear
                showSearch
                placeholder="Etiket ara..."
                filterOption={false}
                onSearch={(q) => searchTags(q)}
                options={tagOptions}
                loading={tagLoading}
              />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12 }}>
            <Form.Item label="Etiket Eşleşme" name={["conditions", "tag_mode"]} initialValue="any">
              <Radio.Group
                disabled={disabled}
                options={[
                  { label: "Herhangi biri", value: "any" },
                  { label: "Hepsi", value: "all" },
                ]}
                optionType="button"
                buttonStyle="solid"
              />
            </Form.Item>

            <Form.Item label="Kategoriler" name={["conditions", "category_ids"]}>
              <TreeSelect
                disabled={disabled}
                treeData={categoryTree}
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                placeholder="Kategori seç..."
                allowClear
                multiple
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, alignItems: "center" }}>
            <Form.Item label="Kategori Eşleşme" name={["conditions", "category_mode"]} initialValue="any">
              <Radio.Group
                disabled={disabled}
                options={[
                  { label: "Herhangi biri", value: "any" },
                  { label: "Hepsi", value: "all" },
                ]}
                optionType="button"
                buttonStyle="solid"
              />
            </Form.Item>

            <div>
              <Text style={{ color: "#64748b" }}>{conditionsHint}</Text>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ position: "sticky", top: 84 }}>
        <Card
          title="İpucu"
          style={{ borderRadius: 12, border: "1px solid #f0f0f0" }}
        >
          <Text style={{ color: "#475569" }}>
            Kapsam alanlarını boş bırakırsan sekme tüm ürünlerde görünür. Sadece belirli kategori/etiket/ürün seçersen,
            sekme otomatik filtrelenir.
          </Text>
        </Card>

        <Card
          title="Güvenlik"
          style={{ marginTop: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}
        >
          <Text style={{ color: "#475569" }}>
            İçerik HTML olarak saklanır ve ürün sayfasında direkt basılır. Güvendiğin kullanıcılar dışında edit izni verme.
          </Text>
        </Card>
      </div>
    </div>
  );
}
