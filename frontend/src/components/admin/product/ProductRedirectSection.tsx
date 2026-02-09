"use client";

import { useState, useEffect } from "react";
import { Form, Radio, Card, Typography, Select, Alert, Space, Badge } from "antd";
import { 
  Ban, 
  Trash2, 
  FolderOpen, 
  Folder, 
  Link as LinkIcon, 
  ArrowRightLeft,
  ExternalLink,
  HelpCircle,
  Search
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { t } from "@/lib/i18n";

const { Text, Title } = Typography;

// Redirect type options with FleetCart-like styling
const redirectOptions = [
  { 
    value: "404", 
    label: "Yönlendirme Yok", 
    desc: "404 (Sayfa Bulunamadı) döndürülür.",
    badge: "404",
    icon: Ban,
    color: "#6b7280"
  },
  { 
    value: "410", 
    label: "İçerik Kaldırıldı", 
    desc: "Google'a içeriğin kalıcı olarak silindiğini söyler.",
    badge: "410",
    icon: Trash2,
    color: "#991b1b"
  },
  { 
    value: "301-category", 
    label: "Kategoriye (Kalıcı)", 
    desc: "Ana kategoriye 301 yönlendirmesi yapar.",
    badge: "301",
    icon: FolderOpen,
    color: "#065f46"
  },
  { 
    value: "302-category", 
    label: "Kategoriye (Geçici)", 
    desc: "Kategoriye 302 yönlendirmesi yapar.",
    badge: "302",
    icon: Folder,
    color: "#92400e"
  },
  { 
    value: "301-product", 
    label: "Ürüne (Kalıcı)", 
    desc: "Benzer ürüne 301 yönlendirmesi yapar.",
    badge: "301",
    icon: LinkIcon,
    color: "#065f46"
  },
  { 
    value: "302-product", 
    label: "Ürüne (Geçici)", 
    desc: "Geçici olarak başka ürüne yönlendirme.",
    badge: "302",
    icon: ArrowRightLeft,
    color: "#92400e"
  },
];

interface ProductRedirectSectionProps {
  form: any;
  categories?: Array<{ id: number; name: string }>;
}

export function ProductRedirectSection({ form, categories = [] }: ProductRedirectSectionProps) {
  const redirectType = Form.useWatch("redirect_type", form) || "404";
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productOptions, setProductOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [productLoading, setProductLoading] = useState(false);

  const isCategoryTarget = redirectType.includes("category");
  const isProductTarget = redirectType.includes("product");
  const needsTarget = isCategoryTarget || isProductTarget;

  // Product search handler
  useEffect(() => {
    if (!isProductTarget || productSearchQuery.length < 2) return;

    const timer = setTimeout(async () => {
      setProductLoading(true);
      try {
        const res = await apiFetch<{ data: Array<{ id: number; name: string; sku?: string }> }>(
          `/api/products?search=${encodeURIComponent(productSearchQuery)}&limit=20`
        );
        const products = res.data || [];
        setProductOptions(products.map((p: any) => ({
          value: p.id,
          label: `${p.name}${p.sku ? ` (${p.sku})` : ""}`,
        })));
      } catch (e) {
        // Silently fail
      } finally {
        setProductLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearchQuery, isProductTarget]);

  // Get help text based on redirect type
  const getHelpText = () => {
    switch (redirectType) {
      case "404":
        return "Herhangi bir yönlendirme yapılmaz, kullanıcı hata sayfası ile karşılaşır.";
      case "410":
        return "SEO açısından en sağlıklısıdır; sayfanın kalıcı olarak kaldırıldığını belirtir.";
      case "301-category":
        return "Eski ürünün SEO değerini ana kategorisine aktararak sıralamayı korur.";
      case "302-category":
        return "Kısa süreli, geçici durumlar (stok yokluğu vb.) için uygundur.";
      case "301-product":
        return "Ziyaretçiyi doğrudan yeni veya benzer ürüne gönderir.";
      case "302-product":
        return "İleride geri gelecek ürünlerin yerine geçici yönlendirme sağlar.";
      default:
        return "";
    }
  };

  // Get badge color based on redirect type
  const getBadgeColor = () => {
    if (redirectType === "404") return "default";
    if (redirectType === "410") return "error";
    if (redirectType.startsWith("301")) return "success";
    if (redirectType.startsWith("302")) return "warning";
    return "default";
  };

  // Handle redirect type change
  const handleTypeChange = (value: string) => {
    form.setFieldsValue({ 
      redirect_type: value,
      redirect_target_id: undefined 
    });
    setProductSearchQuery("");
    setProductOptions([]);
  };

  return (
    <div className="space-y-6">
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={5} className="!mb-1 flex items-center gap-2">
            Gelişmiş Yönlendirme Kontrolü
            <Badge 
              count={redirectOptions.find(o => o.value === redirectType)?.badge || "404"} 
              style={{ 
                backgroundColor: redirectType === "404" ? "#6b7280" : 
                                redirectType === "410" ? "#ef4444" :
                                redirectType.startsWith("301") ? "#10b981" : "#f59e0b"
              }}
            />
          </Title>
          <Text type="secondary" className="text-sm">
            Ürün pasif olduğunda veya silindiğinde ziyaretçileri doğru sayfaya yönlendirerek SEO gücünü koruyun.
          </Text>
        </div>
      </div>

      {/* Redirect type options - Grid layout like FleetCart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {redirectOptions.map((option) => {
          const Icon = option.icon;
          const isActive = redirectType === option.value;
          
          return (
            <Card
              key={option.value}
              onClick={() => handleTypeChange(option.value)}
              className={`
                cursor-pointer transition-all duration-200 hover:shadow-md
                ${isActive ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/30" : "border-gray-200 hover:border-gray-300"}
              `}
              bodyStyle={{ padding: "16px" }}
            >
              <div className="flex items-start gap-3">
                <div 
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}
                  `}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Text strong className="block truncate">{option.label}</Text>
                    <span 
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: isActive ? option.color : "#e5e7eb",
                        color: isActive ? "white" : "#6b7280"
                      }}
                    >
                      {option.badge}
                    </span>
                  </div>
                  <Text type="secondary" className="text-xs block mt-1 line-clamp-2">
                    {option.desc}
                  </Text>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Hidden form field for redirect_type */}
      <Form.Item name="redirect_type" hidden initialValue="404">
        <input />
      </Form.Item>

      {/* Help alert */}
      <Alert
        message={
          <div className="flex items-center gap-2">
            <HelpCircle size={16} />
            <span>{getHelpText()}</span>
          </div>
        }
        type={redirectType === "410" ? "error" : redirectType.startsWith("301") ? "success" : redirectType.startsWith("302") ? "warning" : "info"}
        showIcon={false}
        className="!bg-opacity-50"
      />

      {/* Target selection area */}
      {needsTarget && (
        <Card className="border-blue-200 bg-blue-50/20">
          <Form.Item
            name="redirect_target_id"
            label={
              <div className="flex items-center gap-2">
                {isCategoryTarget ? <FolderOpen size={16} /> : <Search size={16} />}
                <span>{isCategoryTarget ? "Hedef Kategori Seçin" : "Hedef Ürünü Arayın"}</span>
              </div>
            }
            rules={[{ required: needsTarget, message: "Lütfen bir hedef seçin" }]}
          >
            {isCategoryTarget ? (
              <Select
                placeholder="Kategori seçin..."
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
              />
            ) : (
              <Select
                placeholder="Ürün adı veya SKU ile arayın..."
                options={productOptions}
                showSearch
                onSearch={setProductSearchQuery}
                loading={productLoading}
                filterOption={false}
                style={{ width: "100%" }}
                notFoundContent={productSearchQuery.length < 2 ? "En az 2 karakter yazın" : "Sonuç bulunamadı"}
              />
            )}
          </Form.Item>
        </Card>
      )}
    </div>
  );
}
