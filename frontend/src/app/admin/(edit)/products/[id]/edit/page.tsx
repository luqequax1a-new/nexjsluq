"use client";

import { SectionCard } from "@/components/admin/SectionCard";
import { usePageHeader } from "@/hooks/usePageHeader";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { App, Form, Dropdown, Button } from "antd";
import {
  CopyOutlined, DeleteOutlined,
  InfoCircleOutlined, PictureOutlined,
  ProfileOutlined, DatabaseOutlined,
  GlobalOutlined, SolutionOutlined,
  ExperimentOutlined, MoreOutlined,
  CheckOutlined, StopOutlined
} from "@ant-design/icons";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { VariantManager } from "@/components/admin/VariantManager";
import { ProductMediaSection } from "@/components/admin/product/ProductMediaSection";
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

// Modüler Bileşenler
import { ProductGeneralSection } from "@/components/admin/product/ProductGeneralSection";
import { ProductPricingSection } from "@/components/admin/product/ProductPricingSection";
import { ProductInventorySection } from "@/components/admin/product/ProductInventorySection";
import { ProductDescriptionSection } from "@/components/admin/product/ProductDescriptionSection";

// Hooklar
import { useProductStaticData } from "@/hooks/useProductStaticData";
import { useProductTags } from "@/hooks/useProductTags";
import { useProductFormEffects } from "@/hooks/useProductFormEffects";
import { ProductPayload, ProductVariant } from "@/types/product";
import { useBrandOptions } from "@/hooks/useBrandOptions";
import { useScrollOptimization, useTouchOptimization } from "@/hooks/usePerformanceOptimization";

const VARIANT_DEBUG = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_VARIANT_DEBUG === '1' || process.env.NEXT_PUBLIC_VARIANT_DEBUG === 'true');

function summarizeVariantsForLog(arr: any) {
  const list = Array.isArray(arr) ? arr : [];
  let emptyLabelCount = 0;
  let totalValueCount = 0;
  for (const v of list) {
    const vals = Array.isArray(v?.values) ? v.values : [];
    for (const val of vals) {
      totalValueCount += 1;
      const lbl = (val?.label ?? val?.name ?? val?.value ?? '').toString().trim();
      if (!lbl) emptyLabelCount += 1;
    }
  }
  return {
    count: list.length,
    totalValueCount,
    emptyLabelCount,
    sample: list.slice(0, 5).map((v: any) => ({ uids: v?.uids, name: v?.name, values: (v?.values ?? []).slice?.(0, 4) })),
  };
}

export default function ProductEditPage() {
  const { locale } = useI18n();
  const directionality = locale === 'ar' ? 'rtl' : 'ltr';
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<ProductPayload>();

  // Performance optimizations
  useScrollOptimization();
  useTouchOptimization();

  // Debug helper: expose form in DevTools when enabled
  useEffect(() => {
    if (!VARIANT_DEBUG) return;
    (window as any).__productForm = form;
    (window as any).__dumpProductVariants = () => console.log(form.getFieldValue('variants'));
    (window as any).__dumpProductVariations = () => console.log(form.getFieldValue('variations'));
  }, [form]);

  const shouldCleanupDraftMediaRef = useRef(true);
  const draftMediaIdsRef = useRef<number[]>([]);
  const draftVariantMediaIdsRef = useRef<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [isActive, setIsActive] = useState(true);
  const [initialGoogleCategory, setInitialGoogleCategory] = useState<any>(null);
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
  const { units, taxClasses, loading: staticLoading } = useProductStaticData();
  const { tagOptions, tagLoading, searchTags } = useProductTags();
  const { brandOptions, loading: brandLoading, brands } = useBrandOptions();

  const unitType = Form.useWatch("unit_type", form);
  const saleUnitId = Form.useWatch("sale_unit_id", form);
  const customUnit = Form.useWatch("custom_unit", form);
  const brandId = Form.useWatch("brand_id", form);

  // Merge current brand into options to ensure it displays correctly while loading
  const enrichedBrandOptions = useMemo(() => {
    const currentBrandId = brandId;
    if (!currentBrandId || brandOptions.some(b => b.value === currentBrandId)) {
      return brandOptions;
    }
    // If current brand not in options yet, find it from product data or use placeholder
    return [
      { value: currentBrandId, label: t('admin.common.loading', 'Yükleniyor...') },
      ...brandOptions
    ];
  }, [brandOptions, brandId]);

  const apiUnit = Form.useWatch("unit", form); // API'den gelen hazır unit objesi
  const variants = Form.useWatch("variants", form);
  const variations = Form.useWatch("variations", form);
  // FleetCart behavior: if any variation exists, price/stock is managed by variants.
  // Consider it a variant product if there is any selected variation or any active variant.
  // This prevents base price/stock inputs from flashing visible while variants are being generated.
  const hasAnyVariant = (Array.isArray(variations) && variations.length > 0)
    || ((variants?.filter((v: any) => v?.is_active !== false && v?.is_active !== 0).length ?? 0) > 0);

  // API'den gelen unit varsa onu kullan, yoksa form field'larından hesapla
  const effectiveUnitInput = apiUnit || (unitType === 'custom' ? customUnit : saleUnitId);

  const { selectedUnit, isDecimalAllowed } = useUnit(
    effectiveUnitInput,
    units
  );

  const { handleValuesChange } = useProductFormEffects({
    form,
    effectiveUnit: selectedUnit,
    isDecimalAllowed,
    message
  });

  // Veri Çekme
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<{ product: any }>(`/api/products/${id}`);
        const p = res.product;

        setInitialGoogleCategory((p as any).googleProductCategory ?? (p as any).google_product_category ?? null);

        const normalizeVariant = (v: any) => ({
          ...v,
          price: v?.price !== null && v?.price !== undefined ? Number(v.price) : v?.price,
          discount_price: (v?.discount_price !== null && v?.discount_price !== undefined)
            ? Number(v.discount_price)
            : (v?.special_price !== null && v?.special_price !== undefined)
              ? Number(v.special_price)
              : v?.discount_price,
          discount_start: v?.discount_start ?? v?.special_price_start ?? null,
          discount_end: v?.discount_end ?? v?.special_price_end ?? null,
          qty: v?.qty !== null && v?.qty !== undefined ? Number(v.qty) : v?.qty,
          allow_backorder: Boolean(v?.allow_backorder),
          media_ids: Array.isArray(v?.media)
            ? v.media.map((m: any) => Number(m?.id)).filter((id: number) => Number.isFinite(id) && id > 0)
            : (Array.isArray(v?.media_ids)
              ? v.media_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0)
              : undefined),
        });

        const normalizeVariations = (raw: any) => {
          const list = Array.isArray(raw) ? raw : [];
          return list
            .filter(Boolean)
            .map((vr: any, idx: number) => {
              const values = Array.isArray(vr?.values) ? vr.values : [];
              return {
                id: vr?.id,
                name: vr?.name,
                type: vr?.type,
                position: vr?.pivot?.position ?? vr?.position ?? idx,
                is_global: Boolean(vr?.is_global),
                global_id: vr?.is_global ? String(vr?.id) : null,
                values: values.map((vv: any, i: number) => ({
                  id: vv?.id,
                  label: vv?.label,
                  value: vv?.value,
                  color: vv?.color,
                  image: vv?.image,
                  position: vv?.position ?? i,
                  variation_id: vv?.variation_id ?? vr?.id,
                })),
              };
            });
        };

        const rawCustomUnit = (p as any).custom_unit;

        const normalizeOptions = (raw: any) => {
          const list = Array.isArray(raw) ? raw : [];
          return list.map((o: any, idx: number) => {
            const values = Array.isArray(o?.values) ? o.values : [];
            return {
              ...o,
              uid: o?.uid ? String(o.uid) : (o?.id ? String(o.id) : crypto.randomUUID()),
              is_required: Boolean(o?.is_required),
              is_global: Boolean(o?.is_global),
              position: Number.isFinite(Number(o?.position)) ? Number(o.position) : idx,
              values: values.map((v: any, vIdx: number) => ({
                ...v,
                uid: v?.uid ? String(v.uid) : (v?.id ? String(v.id) : crypto.randomUUID()),
                position: Number.isFinite(Number(v?.position)) ? Number(v.position) : vIdx,
                price_type: (v?.price_type === 'percent' ? 'percent' : 'fixed'),
              })),
            };
          });
        };
        const formData: any = {
          // IMPORTANT: Do not spread the full API product object into form state.
          // It may include circular references (Eloquent relations) and breaks rc-field-form deep compare,
          // causing fields to appear blank on revisit.
          id: p.id,
          name: p.name ?? '',
          sku: (p as any).sku ?? null,
          gtin: (p as any).gtin ?? null,
          slug: (p as any).slug ?? null,
          price: (p as any).price ?? null,
          discount_price: (p as any).discount_price ?? null,
          discount_start: (p as any).discount_start ?? null,
          discount_end: (p as any).discount_end ?? null,
          tax_class_id: (p as any).tax_class_id ?? null,
          brand_id: (p as any).brand_id ?? null,
          meta_title: (p as any).meta_title ?? null,
          meta_description: (p as any).meta_description ?? null,
          short_description: (p as any).short_description ?? (p as any).shortDescription ?? '',
          description: (p as any).description ?? (p as any).full_description ?? (p as any).fullDescription ?? '',

          show_unit_pricing: (p as any).show_unit_pricing ?? false,
          unit_type:
            (p as any).unit_type === "global" || (p as any).unit_type === "custom"
              ? (p as any).unit_type
              : ((p as any).sale_unit_id ? "global" : null),
          sale_unit_id: (p as any).sale_unit_id ?? null,
          qty: (p as any).qty ?? null,
          allow_backorder: Boolean((p as any).allow_backorder),
          in_stock: (p as any).in_stock ?? true,

          tags: Array.isArray((p as any).tags) ? (p as any).tags.map((t: any) => t.name).filter(Boolean) : [],
          categories: Array.isArray((p as any).categories) ? (p as any).categories.map((c: any) => c.id).filter((n: any) => Number(n) > 0) : [],
          primary_category_id: (p as any).categories?.find((c: any) => c.pivot?.is_primary)?.id || null,

          is_active: (p as any).status === 'published',
          separate_listing: (p as any).list_variants_separately ?? (p as any).separate_listing ?? false,
          redirect_type: (p as any).redirect_type ?? '404',
          redirect_target_id: (p as any).redirect_target_id ?? null,

          // Keep both media (for display) and media_ids (for save)
          media: Array.isArray((p as any).media) ? (p as any).media : [],
          media_ids: Array.isArray((p as any).media) ? (p as any).media.map((m: any) => m.id).filter((n: any) => Number(n) > 0) : [],

          // Variants / variations
          variants: Array.isArray((p as any).variants) ? (p as any).variants.map(normalizeVariant) : [],
          variations: normalizeVariations((p as any).variations),

          // Options
          options: normalizeOptions((p as any).options),

          // Custom unit (normalize checkbox)
          custom_unit: rawCustomUnit
            ? {
              ...rawCustomUnit,
              is_decimal_stock: (rawCustomUnit?.is_decimal_stock === true
                || rawCustomUnit?.is_decimal_stock === 1
                || String(rawCustomUnit?.is_decimal_stock).toLowerCase() === 'true'
                || String(rawCustomUnit?.is_decimal_stock).toLowerCase() === '1'),
            }
            : rawCustomUnit,

          // Spec attributes (map from product.attributes relation)
          spec_attributes: Array.isArray((p as any)?.attributes)
            ? (p as any).attributes
              .map((a: any) => {
                const attributeId = Number(a?.attribute_id ?? a?.attributeId ?? a?.attribute?.id ?? 0);
                const vals = Array.isArray(a?.values) ? a.values : [];
                const valueIds = vals
                  .map((v: any) => Number(
                    v?.attribute_value_id
                    ?? v?.attributeValue?.id
                    ?? v?.attribute_value?.id
                    ?? 0
                  ))
                  .filter((n: number) => Number.isFinite(n) && n > 0);

                if (!attributeId || valueIds.length === 0) return null;

                return {
                  attribute_id: attributeId,
                  value_ids: valueIds,
                };
              })
              .filter(Boolean)
            : [],
        };

        setIsActive(formData.is_active);
        form.setFieldsValue(formData);

        if (VARIANT_DEBUG) {
          // Use requestIdleCallback for non-critical debug operations
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              const sample = Array.isArray(formData.variants) ? formData.variants[0] : null;
              console.debug('[ProductEditPage] loaded product variants', {
                count: Array.isArray(formData.variants) ? formData.variants.length : 0,
                sample: sample ? {
                  id: sample.id,
                  uids: sample.uids,
                  sku: sample.sku,
                  price: sample.price,
                  discount_price: sample.discount_price,
                  qty: sample.qty,
                  types: {
                    price: typeof sample.price,
                    discount_price: typeof sample.discount_price,
                    qty: typeof sample.qty,
                  },
                  valuesCount: Array.isArray(sample.values) ? sample.values.length : 0,
                  mediaCount: Array.isArray(sample.media) ? sample.media.length : (Array.isArray(sample.medias) ? sample.medias.length : 0),
                } : null,
              });
            });
          }
        }

        // Force a re-render after setting form values
        setTimeout(() => {
          form.validateFields().catch(() => { });
        }, 100);

        setLoading(false);
      } catch (e) {
        message.error(t('admin.product.load_failed', 'Ürün yüklenemedi'));
        router.push("/admin/products");
      }
    };
    fetchData();
  }, [id, form, router, message]);

  // Medya Temizleme
  useEffect(() => {
    return () => {
      if (!shouldCleanupDraftMediaRef.current) return;
      const ids = Array.from(new Set([...draftMediaIdsRef.current, ...draftVariantMediaIdsRef.current]));
      void cleanupDraftMedia(ids);
    };
  }, []);

  const save = useCallback(async (customValues?: any) => {
    try {
      await form.validateFields();
      setSaving(true);
      const values = customValues || form.getFieldsValue(true);
      const media_ids = (form.getFieldValue('media_ids') ?? []).map((id: any) => Number(id)).filter((id: number) => id > 0);

      // Debug logging for variant media
      if (process.env.NODE_ENV === 'development') {
        console.log('[ProductEditPage] save - variants media_ids:',
          values.variants?.map((v: any) => ({
            name: v.name,
            uids: v.uids,
            media_ids: v.media_ids,
            media_count: Array.isArray(v.media) ? v.media.length : 0,
          }))
        );
      }

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
      // IMPORTANT: Preserve id field for UPDATE operations
      let cleanedVariants = values.variants?.map((v: any, idx: number) => {
        const key = rowIdOf(v, idx);
        const live = currentByRowId.get(key) ?? {};
        const merged = { ...v, ...live };
        const { _tableIndex, ...rest } = v;
        const normalizedQty = toNumberOrNull(merged.qty);
        const allowBackorder = Boolean(merged.allow_backorder);
        // Ensure id is included if it exists
        return {
          ...rest,
          id: merged.id || rest.id,
          uids: merged.uids ?? rest.uids,
          sku: merged.sku ?? rest.sku,
          price: toNumberOrNull(merged.price),
          discount_price: toNumberOrNull(merged.discount_price),
          discount_start: merged.discount_start ?? null,
          discount_end: merged.discount_end ?? null,
          special_price: toNumberOrNull(merged.special_price ?? merged.discount_price),
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
            : [],
        };
      });

      // Ensure exactly one default variant
      if (Array.isArray(cleanedVariants) && cleanedVariants.length > 0) {
        const firstDefault = cleanedVariants.findIndex((v: any) => v?.is_default === true || v?.is_default === 1);
        const defaultIndex = firstDefault >= 0 ? firstDefault : 0;
        cleanedVariants = cleanedVariants.map((v: any, idx: number) => ({ ...v, is_default: idx === defaultIndex }));
      }

      if (VARIANT_DEBUG && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          console.debug('[ProductEditPage] save payload variants summary', summarizeVariantsForLog(cleanedVariants));
          console.debug('[ProductEditPage] variant IDs being sent:', cleanedVariants?.map((v: any) => ({ id: v.id, sku: v.sku, name: v.name })));
          console.log('[ProductEditPage] save - description fields:', {
            short_description: values.short_description,
            description: values.description,
          });
        });
      }

      await apiFetch(`/api/products/${id}`, {
        method: "PUT",
        json: {
          ...values,
          short_description: values.short_description ?? '',
          description: values.description ?? '',
          variations: liveVariations,
          list_variants_separately: values.separate_listing ?? values.list_variants_separately,
          variants: cleanedVariants,
          status: values.is_active !== false ? 'published' : 'draft',
          media_ids,
        },
      });

      const specAttrs = Array.isArray(values.spec_attributes) ? values.spec_attributes : [];
      try {
        await apiFetch(`/api/products/${id}/attributes`, {
          method: 'POST',
          json: {
            attributes: specAttrs,
          },
        });
      } catch (e: any) {
        message.error(e?.message || 'Özellikler kaydedilemedi.');
        throw e;
      }
      if (!customValues) {
        shouldCleanupDraftMediaRef.current = false;
        window.location.href = '/admin/products';
      }
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }, [form, id, message, router, t]);

  const handleDuplicate = useCallback(async () => {
    try {
      setSaving(true);
      const res = await apiFetch<{ product: any }>(`/api/products/${id}/duplicate`, { method: "POST" });
      message.success(t('admin.product.form.duplicate_success', 'Ürün başarıyla kopyalandı.'));
      router.push(`/admin/products/${res.product.id}/edit`);
    } catch (e: any) {
      message.error(e.message || "Kopyalama başarısız.");
    } finally {
      setSaving(false);
    }
  }, [id, message, router, t]);

  const handleDelete = useCallback(() => {
    modal.confirm({
      title: t('admin.product.form.delete_title', 'Ürünü Sil'),
      content: t('admin.product.form.delete_desc', 'Bu ürünü silmek istediğinize emin misiniz?'),
      okText: t('admin.common.delete', 'Sil'),
      okType: "danger",
      onOk: async () => {
        try {
          await apiFetch(`/api/products/${id}`, { method: "DELETE" });
          message.success("Ürün silindi.");
          router.push("/admin/products");
        } catch (e: any) {
          message.error(e.message || "Silme işlemi başarısız.");
        }
      }
    });
  }, [id, message, router, modal, t]);

  const handleToggleStatus = useCallback(async () => {
    try {
      const newStatus = !isActive;
      const values = form.getFieldsValue(true);

      // Update UI optimistically
      setIsActive(newStatus);
      form.setFieldValue('is_active' as any, newStatus);

      // Save to backend
      const updatedValues = { ...values, is_active: newStatus };
      await save(updatedValues);

      message.success(newStatus ?
        t('admin.product.form.activated', 'Ürün aktif hale getirildi.') :
        t('admin.product.form.deactivated', 'Ürün pasif hale getirildi.')
      );
    } catch (error: any) {
      // Revert on error
      setIsActive(!isActive);
      form.setFieldValue('is_active' as any, !isActive);
      message.error(error?.message || t('admin.product.form.status_error', 'Durum güncellenemedi.'));
    }
  }, [isActive, form, save, message, t]);

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
      const scrollOffset = 64; // Based on scrollToSection offset
      const containerRect = scrollContainer.getBoundingClientRect();
      const containerTop = containerRect.top;

      let currentSection = navItems[0].key;

      // We look for the last section that has reached or passed the top of the container (+ offset)
      for (const item of navItems) {
        const element = document.getElementById(item.key);
        if (element) {
          const elementTopRelative = element.getBoundingClientRect().top - containerTop;
          // Use a small buffer (20px) to ensure we pick the right one during smooth scroll
          if (elementTopRelative <= (scrollOffset + 20)) {
            currentSection = item.key;
          }
        }
      }

      // Avoid unnecessary state updates if tab is already correct
      setActiveTab((prev) => prev !== currentSection ? currentSection : prev);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [navItems]);
  const productName = Form.useWatch("name", form);

  const breadcrumb = useMemo(() => [
    { label: t('admin.catalog.title', 'Katalog'), href: "/admin/products" },
    { label: t('admin.products.title', 'Ürünler'), href: "/admin/products" },
    { label: t('admin.common.edit', 'Ürün Düzenleme') }
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
      <Dropdown trigger={['click']} placement="bottomRight" menu={{
        items: [
          { key: 'duplicate', label: t('admin.product.form.actions.copy', 'Ürünü Kopyala'), icon: <CopyOutlined />, onClick: handleDuplicate },
          { key: 'toggle_status', label: isActive ? t('admin.product.form.actions.deactivate', 'Ürünü Pasif Yap') : t('admin.product.form.actions.activate', 'Ürünü Aktif Yap'), icon: isActive ? <StopOutlined /> : <CheckOutlined />, onClick: handleToggleStatus },
          { type: 'divider' },
          { key: 'delete', label: t('admin.product.form.actions.delete', 'Ürünü Sil'), icon: <DeleteOutlined />, danger: true, onClick: handleDelete },
        ]
      }}>
        <Button
          type="default"
          style={{
            height: 40,
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 12px'
          }}
          icon={<MoreOutlined />}
        />
      </Dropdown>
    </div>
  );

  usePageHeader({
    title: productName ? productName : t('admin.product.edit_title', 'Ürün Düzenleme'),
    variant: "dark",
    breadcrumb,
    onBack: () => router.push('/admin/products'),
    extra: headerExtra
  });

  // Use a more subtle loading approach to prevent layout issues
  const isLoading = loading || staticLoading;

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        position: 'relative'
      }}>
        <PageLoader fullScreen={false} size={40} />
      </div>
    );
  }

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
          style={{ width: "100%" }}
          onValuesChange={handleValuesChange}
        >
          <Form.Item name="variations" hidden>
            <div />
          </Form.Item>
          <Form.Item name="variants" hidden>
            <div />
          </Form.Item>
          <Form.Item name="deleted_variant_uids" hidden>
            <div />
          </Form.Item>
          <div style={{ maxWidth: "clamp(600px, 90vw, 1200px)", margin: "0 auto", padding: "clamp(20px, 4vw, 40px) 24px 0 24px" }}>
            <ProductGeneralSection tagOptions={tagOptions} tagLoading={tagLoading} onSearchTags={searchTags} brandOptions={enrichedBrandOptions} brandLoading={brandLoading} units={units} />

            <SectionCard title={t('admin.product.form.tabs.categories', 'Kategoriler')} id="categories">
              <CategorySection />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.google_category', 'Google Ürün Kategorisi')} id="google_category">
              <GoogleCategorySelect initialCategory={initialGoogleCategory} />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.media', 'Medya')} id="media">
              <ProductMediaSection
                productId={Number(id)}
                initialItems={(form.getFieldValue('media' as any) || [])}
                onDraftItemsChange={(items: any) => {
                  form.setFieldValue('media_ids', items.map((m: any) => m.id));
                  form.setFieldValue('media' as any, items);
                }}
              />
            </SectionCard>

            <ProductPricingSection units={units} taxClasses={taxClasses} hasAnyVariant={hasAnyVariant} selectedUnit={selectedUnit} />

            <ProductInventorySection units={units} hasAnyVariant={hasAnyVariant} selectedUnit={selectedUnit} />

            <ProductDescriptionSection key={`description-${loading ? 'loading' : 'loaded'}`} />

            <SectionCard title={t('admin.attributes.title', 'Özellikler')} id="attributes">
              <ProductAttributeManager form={form} />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.variant', 'Varyantlar')} id="variant">
              <VariantManager form={form} unit={selectedUnit} mode="edit" />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.options', 'Seçenekler')} id="options">
              <OptionManager form={form} />
            </SectionCard>

            <SectionCard title={t('admin.product.form.tabs.redirect', 'Yönlendirme Ayarları')} id="redirect">
              <ProductRedirectSection form={form} categories={categories.map((c: any) => ({ id: c.id, name: c.name }))} />
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
