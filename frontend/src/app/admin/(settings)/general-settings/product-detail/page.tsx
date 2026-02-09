"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Image,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Dropdown,
  Switch,
} from "antd";
import {
  TagsOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  CloseOutlined,
  PictureOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { adminApiFetch, apiFetch } from "@/lib/api";
import { getImageUrl } from "@/lib/media/getImageUrl";
import { useRouter } from "next/navigation";

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface ProductDetailSettings {
  storefront_show_stock_quantity: boolean;
  related_products_enabled: boolean;
  related_products_count: number;
  related_products_source: "same_category" | "selected_category" | "selected_products";
  related_products_category_id?: number | null;
  related_products_product_ids?: number[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  depth?: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  selling_price?: number;
  media?: Array<{ url?: string; path?: string }>;
  base_image_thumb?: { url?: string; path?: string } | null;
  in_stock?: boolean;
}

export default function ProductDetailSettingsPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<ProductDetailSettings>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Product selector dropdown state
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const flattenCategories = (nodes: any[], depth = 0): Category[] => {
    if (!Array.isArray(nodes)) return [];
    return nodes.flatMap((node) => {
      if (!node) return [];
      const current: Category = {
        id: Number(node.id),
        name: String(node.name ?? "").trim(),
        slug: String(node.slug ?? "").trim(),
        depth,
      };
      const children = flattenCategories(node.children || [], depth + 1);
      return [current, ...children];
    });
  };

  const moduleEnabled = Form.useWatch("related_products_enabled", form);

  const headerExtra = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Button
        type="primary"
        onClick={() => form.submit()}
        loading={saving}
        style={{
          height: 40,
          background: "#6f55ff",
          borderRadius: "8px",
          fontWeight: 600,
          padding: "0 20px",
          border: "none",
          boxShadow: "0 2px 4px rgba(111, 85, 255, 0.2)",
        }}
      >
        Kaydet
      </Button>
      <Dropdown
        trigger={["click"]}
        placement="bottomRight"
        menu={{
          items: [
            {
              key: "toggle",
              label: moduleEnabled
                ? "Modülü Pasif Yap"
                : "Modülü Aktif Yap",
              onClick: () =>
                form.setFieldValue("related_products_enabled", !moduleEnabled),
            },
          ],
        }}
      >
        <Button
          type="default"
          style={{
            height: 40,
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 12px",
          }}
          icon={<MoreOutlined />}
        />
      </Dropdown>
    </div>
  );

  usePageHeader({
    title: "Ürün Detay Sayfası Ayarları",
    variant: "dark",
    breadcrumb: [
      { label: "Ayarlar", href: "/admin/general-settings" },
      { label: "Ürün Detay Sayfası" },
    ],
    onBack: () => router.push("/admin/general-settings"),
    extra: headerExtra,
  });

  const normalizeProductIds = (value: unknown): number[] => {
    if (Array.isArray(value)) {
      return value.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
        }
      } catch {
        return [];
      }
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return [value];
    }
    return [];
  };

  // Fetch settings and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch settings
        const settingsRes: any = await apiFetch("/api/storefront/settings", {
          auth: "admin",
        });
        
        // Fetch categories
        const categoriesRes: any = await adminApiFetch(
          "/api/categories?paginate=false&type=normal"
        );
        const categoryList = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.data || categoriesRes?.categories || [];

        if (Array.isArray(categoryList) && categoryList.length > 0) {
          setCategories(categoryList);
        } else {
          const treeRes: any = await adminApiFetch("/api/categories-tree?type=normal");
          const treeList = flattenCategories(treeRes?.categories || []);
          setCategories(treeList);
        }

        const productIds = normalizeProductIds(
          settingsRes.related_products_product_ids
        );
        setSelectedProductIds(productIds);
        
        // Set form values
        form.setFieldsValue({
          storefront_show_stock_quantity: settingsRes.storefront_show_stock_quantity === '1' || settingsRes.storefront_show_stock_quantity === 'true' || settingsRes.storefront_show_stock_quantity === true,
          related_products_enabled: settingsRes.related_products_enabled ?? true,
          related_products_count: settingsRes.related_products_count ?? 8,
          related_products_source: settingsRes.related_products_source ?? "same_category",
          related_products_category_id: settingsRes.related_products_category_id || undefined,
          related_products_product_ids: productIds,
        });

        // Fetch products if source is selected_products
        if (settingsRes.related_products_source === "selected_products") {
          fetchSelectedProducts(productIds);
        } else {
          setSelectedProducts([]);
        }
      } catch (error) {
        message.error("Ayarlar yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [form]);

  const fetchSelectedProducts = async (ids: number[]) => {
    try {
      if (!ids.length) {
        setSelectedProducts([]);
        return;
      }
      const res: any = await apiFetch(`/api/storefront/products?per_page=200`);
      const allProducts = res.data || [];
      const filtered = allProducts.filter((p: Product) => ids.includes(p.id));
      setSelectedProducts(filtered);
    } catch (error) {
      console.error("Seçili ürünler yüklenirken hata:", error);
    }
  };

  const fetchProductOptions = useCallback(async (search = "") => {
    try {
      setProductLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("page", "1");
      params.set("per_page", "20");
      
      const res: any = await apiFetch(`/api/storefront/products?${params.toString()}`);
      setProductOptions(res.data || []);
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
    } finally {
      setProductLoading(false);
    }
  }, []);

  const removeSelectedProduct = (productId: number) => {
    const newIds = selectedProductIds.filter(id => id !== productId);
    setSelectedProductIds(newIds);
    form.setFieldValue("related_products_product_ids", newIds);
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleSave = async (values: ProductDetailSettings) => {
    try {
      setSaving(true);
      const payload = {
        storefront_show_stock_quantity: values.storefront_show_stock_quantity ? "1" : "0",
        related_products_enabled: values.related_products_enabled ? "1" : "0",
        related_products_count:
          values.related_products_count !== undefined
            ? String(values.related_products_count)
            : "",
        related_products_source: values.related_products_source ?? "same_category",
        related_products_category_id:
          values.related_products_category_id !== undefined &&
          values.related_products_category_id !== null
            ? String(values.related_products_category_id)
            : "",
        related_products_product_ids: JSON.stringify(selectedProductIds ?? []),
      };
      await adminApiFetch("/api/storefront/settings", {
        method: "POST",
        json: {
          ...payload,
        },
      });
      message.success("Ayarlar başarıyla kaydedildi");
      router.push("/admin/general-settings");
    } catch (error) {
      message.error("Ayarlar kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const sourceType = Form.useWatch("related_products_source", form);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 24px 48px" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          storefront_show_stock_quantity: false,
          related_products_enabled: true,
          related_products_count: 8,
          related_products_source: "same_category",
        }}
      >
        <div
          style={{
            maxWidth: "clamp(600px, 90vw, 1200px)",
            margin: "0 auto",
            padding: "clamp(20px, 4vw, 40px) 24px 0 24px",
          }}
        >
          <SectionCard title="Stok Gösterimi" id="stock-display">
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Ürün detay sayfasında stok miktarının gösterilip gösterilmeyeceğini ayarlayın.
              Aktif edildiğinde stok miktarı ürünün birim bilgisiyle birlikte (ör: "24.5 Metre", "150 Adet") gösterilir.
            </Paragraph>

            <Form.Item
              name="storefront_show_stock_quantity"
              label="Stok Miktarını Göster"
              valuePropName="checked"
              extra="Aktif edildiğinde ürün detay sayfasında stok miktarı birim bilgisiyle birlikte gösterilir. Kapalıyken sadece 'Stokta' veya 'Tükendi' yazısı görünür."
            >
              <Switch checkedChildren="Göster" unCheckedChildren="Gizle" />
            </Form.Item>
          </SectionCard>

          <SectionCard title="Benzer Ürünler Modülü" id="related-products">
            <Paragraph type="secondary" style={{ marginBottom: 24 }}>
              Ürün detay sayfalarında gösterilecek benzer ürünleri burada yönetebilirsiniz.
            </Paragraph>

            <Form.Item
              name="related_products_enabled"
              valuePropName="checked"
              hidden
            >
              <input type="hidden" />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.related_products_enabled !== curr.related_products_enabled
              }
            >
              {({ getFieldValue }) => {
                const enabled = getFieldValue("related_products_enabled");
                if (!enabled) return null;

                return (
                  <>
                    <Divider />

                    <Form.Item
                      name="related_products_count"
                      label="Listelenecek Ürün Sayısı"
                      rules={[{ required: true, message: "Ürün sayısı girin" }]}
                    >
                      <InputNumber
                        min={1}
                        max={20}
                        style={{ width: 200 }}
                        placeholder="Örn: 8"
                      />
                    </Form.Item>

                    <Form.Item
                      name="related_products_source"
                      label="Ürün Seçim Mantığı"
                      rules={[{ required: true }]}
                    >
                      <Radio.Group>
                        <Space direction="vertical">
                          <Radio value="same_category">
                            <Space>
                              <AppstoreOutlined />
                              <Text>Aynı Kategoriden</Text>
                              <Tag color="blue">Otomatik</Tag>
                            </Space>
                            <Paragraph
                              type="secondary"
                              style={{ marginLeft: 24, marginTop: 4 }}
                            >
                              Mevcut ürün ile aynı kategorideki ürünleri otomatik gösterir.
                            </Paragraph>
                          </Radio>

                          <Radio value="selected_category">
                            <Space>
                              <AppstoreOutlined />
                              <Text>Seçili Kategori</Text>
                              <Tag color="orange">Özel</Tag>
                            </Space>
                            <Paragraph
                              type="secondary"
                              style={{ marginLeft: 24, marginTop: 4 }}
                            >
                              Belirli bir kategoriden ürünleri gösterir.
                            </Paragraph>
                          </Radio>

                          <Radio value="selected_products">
                            <Space>
                              <ShoppingOutlined />
                              <Text>Seçili Ürünler</Text>
                              <Tag color="green">Manuel</Tag>
                            </Space>
                            <Paragraph
                              type="secondary"
                              style={{ marginLeft: 24, marginTop: 4 }}
                            >
                              Belirli ürünleri manuel olarak seçersiniz.
                            </Paragraph>
                          </Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>

                    {sourceType === "selected_category" && (
                      <Form.Item
                        name="related_products_category_id"
                        label="Kategori Seçin"
                        rules={[{ required: true, message: "Kategori seçin" }]}
                      >
                        <Select
                          placeholder="Kategori seçin"
                          style={{ width: "100%" }}
                          showSearch
                          optionFilterProp="children"
                        >
                          {categories.map((cat) => (
                            <Option key={cat.id} value={cat.id}>
                              {cat.depth ? `${"— ".repeat(cat.depth)}${cat.name}` : cat.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}

                    {sourceType === "selected_products" && (
                      <Form.Item label="Seçili Ürünler" required>
                        <div style={{ marginBottom: 16 }}>
                          <Select
                            mode="multiple"
                            value={selectedProductIds}
                            placeholder="Ürün ara ve seç"
                            style={{ width: "100%" }}
                            showSearch
                            filterOption={false}
                            optionLabelProp="label"
                            onSearch={(value) => {
                              setProductSearch(value);
                              fetchProductOptions(value);
                            }}
                            onFocus={() => fetchProductOptions(productSearch)}
                            loading={productLoading}
                            onChange={(values) => {
                              const ids = values.map((v) => Number(v));
                              setSelectedProductIds(ids);
                              form.setFieldValue("related_products_product_ids", ids);
                              fetchSelectedProducts(ids);
                            }}
                          >
                            {Array.from(
                              new Map(
                                [...selectedProducts, ...productOptions].map((p) => [p.id, p])
                              ).values()
                            ).map((product) => (
                              <Option
                                key={product.id}
                                value={product.id}
                                label={product.name}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  {product.base_image_thumb ? (
                                    <Image
                                      src={getImageUrl(
                                        product.base_image_thumb.url ||
                                          product.base_image_thumb.path
                                      )}
                                      alt={product.name}
                                      width={32}
                                      height={32}
                                      style={{ objectFit: "cover", borderRadius: 6 }}
                                      preview
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 6,
                                        background: "#f5f5f5",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#94a3b8",
                                        fontSize: 12,
                                      }}
                                    >
                                      <PictureOutlined />
                                    </div>
                                  )}
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <Text style={{ fontSize: 13 }}>{product.name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {product.selling_price ? `₺${product.selling_price}` : ""}
                                    </Text>
                                  </div>
                                </div>
                              </Option>
                            ))}
                          </Select>
                        </div>

                        {selectedProducts.length > 0 && (
                          <Card
                            size="small"
                            title={`${selectedProducts.length} Ürün Seçili`}
                            extra={
                              <Button
                                type="link"
                                danger
                                size="small"
                                onClick={() => {
                                  setSelectedProducts([]);
                                  setSelectedProductIds([]);
                                  form.setFieldValue("related_products_product_ids", []);
                                }}
                              >
                                Tümünü Temizle
                              </Button>
                            }
                          >
                            <Row gutter={[8, 8]}>
                              {selectedProducts.map((product) => (
                                <Col key={product.id} xs={24} sm={12} lg={8}>
                                  <Card
                                    size="small"
                                    style={{
                                      position: "relative",
                                      borderRadius: 12,
                                      overflow: "hidden",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                    }}
                                    cover={
                                      product.base_image_thumb ? (
                                        <Image
                                          src={getImageUrl(
                                            product.base_image_thumb.url ||
                                              product.base_image_thumb.path
                                          )}
                                          alt={product.name}
                                          style={{
                                            width: "100%",
                                            aspectRatio: "4 / 3",
                                            objectFit: "cover",
                                          }}
                                          preview={false}
                                        />
                                      ) : (
                                        <div
                                          style={{
                                            width: "100%",
                                            aspectRatio: "4 / 3",
                                            background: "#f5f5f5",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <PictureOutlined
                                            style={{ fontSize: 24, color: "#999" }}
                                          />
                                        </div>
                                      )
                                    }
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<CloseOutlined />}
                                      style={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        background: "rgba(255,255,255,0.9)",
                                        borderRadius: "50%",
                                        width: 24,
                                        height: 24,
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                      onClick={() => removeSelectedProduct(product.id)}
                                    />
                                    <div style={{ padding: "8px 0" }}>
                                      <Text strong ellipsis style={{ display: "block" }}>
                                        {product.name}
                                      </Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        ₺{product.selling_price}
                                      </Text>
                                      {!product.in_stock && (
                                        <Badge
                                          count="Tükendi"
                                          style={{
                                            backgroundColor: "#ff4d4f",
                                            fontSize: 10,
                                            marginTop: 4,
                                          }}
                                        />
                                      )}
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </Card>
                        )}

                        {selectedProducts.length === 0 && (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Henüz ürün seçilmedi"
                          />
                        )}
                      </Form.Item>
                    )}
                  </>
                );
              }}
            </Form.Item>
          </SectionCard>

          <SectionCard title="Özet & İpuçları" id="summary">
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Benzer ürünler modülünü kapatırsanız ürün detay sayfasında bu blok görünmez.
            </Paragraph>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <Text type="secondary">Seçili Ürün</Text>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {selectedProductIds.length || 0}
                </div>
              </div>
              <div>
                <Text type="secondary">Kategori</Text>
                <div style={{ fontSize: 14 }}>
                  {sourceType === "selected_category"
                    ? "Özel kategori"
                    : sourceType === "selected_products"
                      ? "Manuel ürünler"
                      : "Otomatik (kategori bazlı)"}
                </div>
              </div>
              <div>
                <Text type="secondary">Öneri</Text>
                <div style={{ fontSize: 14 }}>
                  Ürün seçimi manuel yapılacaksa 6-12 arası ürün önerilir.
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </Form>
    </div>
  );
}
