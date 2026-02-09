"use client";

import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { App, Form, Button } from "antd";
import {
  InfoCircleOutlined, PictureOutlined,
  ProfileOutlined, DatabaseOutlined,
  GlobalOutlined, SolutionOutlined,
  ExperimentOutlined
} from "@ant-design/icons";
import { useRef, useState, useEffect, useMemo } from "react";
import { VariantManager } from "@/components/admin/VariantManager";
import { ProductMediaSection } from "@/components/admin/product/ProductMediaSection";
import { ProductPayload } from "@/types/product";
import { cleanupDraftMedia } from "@/lib/media";
import { ProductSeoSection } from "@/components/admin/product/ProductSeoSection";
import { GoogleCategorySelect } from "@/components/admin/product/GoogleCategorySelect";
import { CategorySection } from "@/components/admin/product/CategorySection";
import { OptionManager } from "@/components/admin/product/OptionManager";
import { ProductAttributeManager } from "@/components/admin/product/ProductAttributeManager";
import { useUnit } from "@/hooks/useUnit";
import { PageLoader } from "@/components/admin/PageLoader";
import { t } from "@/lib/i18n";
import { useI18n } from "@/context/I18nContext";
import { ProductRedirectSection } from "@/components/admin/product/ProductRedirectSection";

// Yeni Modüler Bileşenler
import { ProductGeneralSection } from "@/components/admin/product/ProductGeneralSection";
import { ProductPricingSection } from "@/components/admin/product/ProductPricingSection";
import { ProductInventorySection } from "@/components/admin/product/ProductInventorySection";
import { ProductDescriptionSection } from "@/components/admin/product/ProductDescriptionSection";

// Yeni Hooklar
import { useProductStaticData } from "@/hooks/useProductStaticData";
import { useProductTags } from "@/hooks/useProductTags";
import { useProductFormEffects } from "@/hooks/useProductFormEffects";
import { useScrollOptimization, useTouchOptimization } from "@/hooks/usePerformanceOptimization";
import { useBrandOptions } from "@/hooks/useBrandOptions";

export default function NewProductEditPage() {
  const { locale } = useI18n();
  const directionality = locale === 'ar' ? 'rtl' : 'ltr';
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<ProductPayload>();

  // Performance optimizations
  useScrollOptimization();
  useTouchOptimization();

  // Debug helper: expose form in DevTools when enabled
  useEffect(() => {
    const debug = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_VARIANT_DEBUG === '1' || process.env.NEXT_PUBLIC_VARIANT_DEBUG === 'true');
    if (!debug) return;
    (window as any).__productForm = form;
    (window as any).__dumpProductVariants = () => console.log(form.getFieldValue('variants'));
    (window as any).__dumpProductVariations = () => console.log(form.getFieldValue('variations'));
  }, [form]);
  const shouldCleanupDraftMediaRef = useRef(true);
  const draftMediaIdsRef = useRef<number[]>([]);
  const draftVariantMediaIdsRef = useRef<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch categories for redirect section
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch<{ data: Array<{ id: number; name: string }> }>('/api/categories?per_page=1000');
        setCategories(res.data || []);
      } catch (e) {
        // Silently fail
      }
    };
    fetchCategories();
  }, []);

  // Merkezi Veriler ve Hooklar
  const { units, taxClasses, loading: dataLoading } = useProductStaticData();
  const { tagOptions, tagLoading, searchTags } = useProductTags();
  const { brandOptions, loading: brandLoading } = useBrandOptions();

  const variants = Form.useWatch("variants", form);
  const variations = Form.useWatch("variations", form);
  // FleetCart behavior: if any variation exists, price/stock is managed by variants.
  // Only consider it a variant product if there are active variants
  const hasAnyVariant = (variants?.filter((v: any) => v?.is_active !== false && v?.is_active !== 0).length ?? 0) > 0;
  const unitType = Form.useWatch("unit_type", form);
  const saleUnitId = Form.useWatch("sale_unit_id", form);
  const customUnit = Form.useWatch("custom_unit", form);

  const { selectedUnit, isDecimalAllowed } = useUnit(
    unitType === 'custom' ? customUnit : saleUnitId,
    units
  );

  const { handleValuesChange } = useProductFormEffects({
    form,
    effectiveUnit: selectedUnit,
    isDecimalAllowed,
    message
  });

  // Medya Temizleme Mantığı
  useEffect(() => {
    return () => {
      if (!shouldCleanupDraftMediaRef.current) return;
      const ids = Array.from(new Set([...draftMediaIdsRef.current, ...draftVariantMediaIdsRef.current]));
      void cleanupDraftMedia(ids);
    };
  }, []);

  const save = async () => {
    try {
      await form.validateFields();
      setSaving(true);
      const values = form.getFieldsValue(true);
      const media_ids = (form.getFieldValue('media_ids') ?? []).map((id: any) => Number(id)).filter((id: number) => id > 0);

      const liveVariations = form.getFieldValue('variations') ?? values.variations;

      // Ensure variant fields are taken from current form state (avoids missing qty/discount on save)
      const currentFormVariants = (form.getFieldValue('variants') ?? []) as any[];
      const rowIdOf = (v: any, idx: number) => String(v?.id ?? v?.uids ?? v?.key ?? v?._tableIndex ?? idx);
      const currentByRowId = new Map<string, any>(
        (Array.isArray(currentFormVariants) ? currentFormVariants : []).map((v, idx) => [rowIdOf(v, idx), v]),
      );
      const toNumberOrNull = (val: any) => {
        if (val === "" || val === undefined) return null;
        if (val === null) return null;
        if (typeof val === "number") return val;
        const n = Number(val);
        return Number.isNaN(n) ? null : n;
      };

      // Product-level validation:
      // - Selling price cannot be empty
      // - Discount price cannot exceed selling price
      const activeVariantsForBase = (Array.isArray(values.variants) ? values.variants : []).filter((v: any) => v?.is_active !== false && v?.is_active !== 0);
      const hasActiveVariants = activeVariantsForBase.length > 0;

      const productPrice = toNumberOrNull(values.price);
      if (hasActiveVariants) {
        const defaultVariant =
          activeVariantsForBase.find((v: any) => v?.is_default === true || v?.is_default === 1) ||
          activeVariantsForBase[0];
        const variantPrice = toNumberOrNull(defaultVariant?.price);
        if (!variantPrice || variantPrice <= 0) {
          message.error("Varsayılan varyant satış fiyatı boş olamaz.");
          setSaving(false);
          return;
        }
        values.price = variantPrice;
        values.discount_price = toNumberOrNull(defaultVariant?.discount_price ?? defaultVariant?.special_price) ?? null;
        values.discount_start = defaultVariant?.discount_start ?? defaultVariant?.special_price_start ?? null;
        values.discount_end = defaultVariant?.discount_end ?? defaultVariant?.special_price_end ?? null;
        if (values.discount_price && Number(values.discount_price) > Number(values.price ?? 0)) {
          message.error("Varsayılan varyant indirimli fiyatı normal fiyattan büyük olamaz.");
          setSaving(false);
          return;
        }
      } else if (!productPrice || productPrice <= 0) {
        message.error("Ürün satış fiyatı boş olamaz.");
        setSaving(false);
        return;
      }

      const productDiscount = toNumberOrNull(values.discount_price);
      if (!hasActiveVariants && productDiscount && productDiscount > Number(values.price ?? 0)) {
        message.error("Ürün indirimli fiyatı normal fiyattan büyük olamaz.");
        setSaving(false);
        return;
      }

      // Validate variants
      if (values.variants && Array.isArray(values.variants) && values.variants.length > 0) {
        for (let i = 0; i < values.variants.length; i++) {
          const variant = values.variants[i];

          // Check if price is set
          if (!variant.price || variant.price <= 0) {
            message.error(`Varyant ${i + 1}: Fiyat zorunludur ve 0'dan büyük olmalıdır.`);
            setSaving(false);
            return;
          }

          // Check if discount price is greater than regular price
          if (variant.discount_price && variant.discount_price > variant.price) {
            message.error(`Varyant ${i + 1}: İndirimli fiyat normal fiyattan büyük olamaz.`);
            setSaving(false);
            return;
          }
        }
      }

      // Clean up _tableIndex from variants (frontend-only field)
      // IMPORTANT: Preserve id field for UPDATE operations (though new products won't have IDs)
      let cleanedVariants = values.variants?.map((v: any, idx: number) => {
        const key = rowIdOf(v, idx);
        const live = currentByRowId.get(key) ?? {};
        const merged = { ...v, ...live };
        const { _tableIndex, ...rest } = v;
        const normalizedQty = toNumberOrNull(merged.qty);
        const allowBackorder = Boolean(merged.allow_backorder);
        // Ensure id is included if it exists (for copy/duplicate scenarios)
        return {
          ...rest,
          id: merged.id || rest.id,
          uids: merged.uids ?? rest.uids,
          sku: merged.sku ?? rest.sku,
          price: toNumberOrNull(merged.price),
          discount_price: toNumberOrNull(merged.discount_price),
          special_price: toNumberOrNull(merged.special_price ?? merged.discount_price),
          discount_start: merged.discount_start ?? null,
          discount_end: merged.discount_end ?? null,
          special_price_start: merged.special_price_start ?? merged.discount_start ?? null,
          special_price_end: merged.special_price_end ?? merged.discount_end ?? null,
          qty: normalizedQty,
          allow_backorder: allowBackorder,
          in_stock: allowBackorder || Number(normalizedQty ?? 0) > 0,
          is_active: merged.is_active ?? rest.is_active,
          is_default: merged.is_default ?? rest.is_default,
          values: merged.values ?? rest.values,
          media_ids: Array.isArray(merged.media_ids)
            ? merged.media_ids.map((id: any) => Number(id)).filter((id: number) => id > 0)
            : undefined,
        };
      });

      // Ensure exactly one default variant
      if (Array.isArray(cleanedVariants) && cleanedVariants.length > 0) {
        const firstDefault = cleanedVariants.findIndex((v: any) => v?.is_default === true || v?.is_default === 1);
        const defaultIndex = firstDefault >= 0 ? firstDefault : 0;
        cleanedVariants = cleanedVariants.map((v: any, idx: number) => ({ ...v, is_default: idx === defaultIndex }));
      }

      const created = await apiFetch<any>("/api/products", {
        method: "POST",
        json: {
          ...values,
          variations: liveVariations,
          list_variants_separately: values.separate_listing ?? values.list_variants_separately,
          variants: cleanedVariants,
          status: values.is_active !== false ? 'published' : 'draft',
          media_ids
        },
      });

      // Sync specification attributes
      const productId = Number(created?.product?.id);
      const specAttrs = Array.isArray(values.spec_attributes) ? values.spec_attributes : [];
      if (productId && specAttrs.length > 0) {
        await apiFetch(`/api/products/${productId}/attributes`, {
          method: 'POST',
          json: { attributes: specAttrs },
        });
      }

      message.success(t('admin.product.form.save_success', 'Ürün başarıyla oluşturuldu.'));
      shouldCleanupDraftMediaRef.current = false;
      router.push("/admin/products");
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const navItems = useMemo(() => [
    { key: "general", label: t('admin.product.form.tabs.general', 'Temel Bilgi'), icon: <InfoCircleOutlined /> },
    { key: "categories", label: t('admin.product.form.tabs.categories', 'Kategoriler'), icon: <GlobalOutlined /> },
    { key: "google_category", label: t('admin.product.form.tabs.google_category', 'Google Kategori'), icon: <GlobalOutlined /> },
    { key: "media", label: t('admin.product.form.tabs.media', 'Medya'), icon: <PictureOutlined /> },
    { key: "pricing", label: t('admin.product.form.tabs.pricing', 'Fiyatlandırma'), icon: <SolutionOutlined /> },
    { key: "inventory", label: t('admin.product.form.tabs.inventory', 'Envanter'), icon: <DatabaseOutlined /> },
    { key: "details", label: t('admin.product.form.tabs.details', 'Ürün Detayı'), icon: <ProfileOutlined /> },
    { key: "attributes", label: t('admin.attributes.title', 'Özellikler'), icon: <ProfileOutlined /> },
    { key: "variant", label: t('admin.product.form.tabs.variant', 'Varyantlar'), icon: <ExperimentOutlined /> },
    { key: "options", label: t('admin.product.form.tabs.options', 'Seçenekler'), icon: <SolutionOutlined /> },
    { key: "seo", label: t('admin.product.form.tabs.seo', 'SEO'), icon: <GlobalOutlined /> },
    { key: "redirect", label: t('admin.product.form.tabs.redirect', 'Yönlendirme Ayarları'), icon: <GlobalOutlined /> },
  ], []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    const scrollContainer = document.getElementById('admin-focus-content');
    if (element && scrollContainer) {
      const elementRect = element.getBoundingClientRect().top;
      const containerRect = scrollContainer.getBoundingClientRect().top;
      scrollContainer.scrollBy({ top: elementRect - containerRect - 64, behavior: "smooth" });
      setActiveTab(id);
    }
  };

  useEffect(() => {
    const scrollContainer = document.getElementById('admin-focus-content');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollOffset = 64;
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerTop = containerRect.top;

      let currentSection = navItems[0].key;

      for (const item of navItems) {
        const element = document.getElementById(item.key);
        if (element) {
          const elementTopRelative = element.getBoundingClientRect().top - containerTop;
          if (elementTopRelative <= (scrollOffset + 20)) {
            currentSection = item.key;
          }
        }
      }

      setActiveTab((prev) => prev !== currentSection ? currentSection : prev);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  const productName = Form.useWatch("name", form);

  const breadcrumb = useMemo(() => [
    { label: t('admin.catalog.title', 'Katalog'), href: "/admin/products" },
    { label: t('admin.products.title', 'Ürünler'), href: "/admin/products" },
    { label: t('admin.common.new', 'Ürün Ekle') }
  ], []);

  const headerExtra = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Button
        type="primary"
        onClick={() => save()}
        loading={saving}
        style={{
          height: 40,
          background: '#6f55ff',
          borderRadius: '8px',
          fontWeight: 600,
          padding: '0 20px',
          border: 'none',
          boxShadow: '0 2px 4px rgba(111, 85, 255, 0.2)'
        }}
      >
        {t('admin.common.save', 'Kaydet')}
      </Button>
    </div>
  );

  usePageHeader({
    title: productName ? productName : t('admin.product.new_title', 'Yeni Ürün Ekle'),
    variant: "dark",
    breadcrumb,
    onBack: () => router.push('/admin/products'),
    extra: headerExtra
  });

  if (dataLoading) return <PageLoader />;

  return (
    <>
      <div className="style__TabsOutWrapper-sc-qv7pln-1 eVQtki" style={{ position: "sticky", top: 0, zIndex: 90, backgroundColor: "#ffffff", width: "100%", height: "clamp(44px, 8vw, 55px)", display: "flex", alignItems: "flex-end", justifyContent: "center", borderBottom: "1px solid #e2e8f0" }}>
        <div className="style__TabsWrapper-sc-qv7pln-0 jrQRht">
          <div className="ant-tabs ant-tabs-top sc-fydGpi kNaWur css-1srkwla">
            <div role="tablist" className="ant-tabs-nav" style={{ marginBottom: 0 }}>
              <div className="ant-tabs-nav-wrap">
                <div className="hide-scrollbar ant-tabs-nav-list" style={{ display: "flex", gap: "clamp(16px, 3vw, 40px)", justifyContent: "center", overflowX: "auto", scrollbarWidth: "none" }}>
                  {navItems.map(item => (
                    <div key={item.key} className={`ant-tabs-tab ${activeTab === item.key ? "ant-tabs-tab-active" : ""}`} onClick={() => scrollToSection(item.key)} style={{ margin: 0 }}>
                      <div role="tab" aria-selected={activeTab === item.key} className="ant-tabs-tab-btn" style={{ padding: "8px 12px 12px 12px", cursor: "pointer", fontSize: "clamp(12px, 2.5vw, 14px)", fontWeight: 500, color: activeTab === item.key ? "#6f55ff" : "#64748b", borderBottom: `2px solid ${activeTab === item.key ? "#6f55ff" : "transparent"}`, transition: "all 0.3s", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "clamp(14px, 3vw, 16px)" }}>{item.icon}</span>
                        <span className="group">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="admin-focus-content" style={{ width: "100%", paddingBottom: 100, height: '100%', overflowY: 'auto' }} dir={directionality}>
        <Form<ProductPayload>
          form={form}
          layout="vertical"
          initialValues={{ status: "published", unit_type: "global", categories: [], primary_category_id: null, is_active: true, allow_backorder: false, in_stock: true, spec_attributes: [], redirect_type: "404", redirect_target_id: null }}
          style={{ width: "100%" }}
          onValuesChange={handleValuesChange}
        >
          <div style={{ maxWidth: "clamp(600px, 90vw, 1200px)", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) 24px 0 24px" }}>
            <ProductGeneralSection tagOptions={tagOptions} tagLoading={tagLoading} onSearchTags={searchTags} brandOptions={brandOptions} brandLoading={brandLoading} units={units} />

            <SectionCard title={t('admin.product.form.tabs.categories', 'Kategoriler')} id="categories">
              <CategorySection />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.google_category', 'Google Ürün Kategorisi')} id="google_category">
              <GoogleCategorySelect />
            </SectionCard>

            <SectionCard title={t('admin.attributes.title', 'Özellikler')} id="attributes">
              <ProductAttributeManager form={form} />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.media', 'Medya')} id="media">
              <ProductMediaSection
                draftItems={(form.getFieldValue('media' as any) || [])}
                onDraftItemsChange={(items: any) => {
                  form.setFieldValue('media_ids', items.map((m: any) => m.id));
                  form.setFieldValue('media' as any, items);
                }}
              />
            </SectionCard>

            <ProductPricingSection units={units} taxClasses={taxClasses} hasAnyVariant={hasAnyVariant} selectedUnit={selectedUnit} />

            <ProductInventorySection units={units} hasAnyVariant={hasAnyVariant} selectedUnit={selectedUnit} />

            <ProductDescriptionSection key={`description-new`} />

            <SectionCard title={t('admin.product.form.tabs.variant', 'Varyantlar')} id="variant">
              <VariantManager form={form} unit={selectedUnit} mode="create" />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.options', 'Seçenekler')} id="options">
              <OptionManager form={form} />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.redirect', 'Yönlendirme Ayarları')} id="redirect">
              <ProductRedirectSection form={form} categories={categories} />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.seo', 'Arama Motoru Optimizasyonu (SEO)')} id="seo">
              <ProductSeoSection />
            </SectionCard>
          </div>
        </Form>
      </div>
    </>
  );
}
