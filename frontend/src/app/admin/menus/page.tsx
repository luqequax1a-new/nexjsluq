'use client';

import { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { usePageHeader } from '@/hooks/usePageHeader';
import { t } from '@/lib/i18n';
import { getMenuByCode } from '@/lib/api/menus';
import { AdminMenuBuilder } from '@/components/admin/menu/MenuBuilder';

export default function MenusPage() {
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [categoriesId, setCategoriesId] = useState<number | null>(null);

  usePageHeader({
    title: t('admin.menus.title', 'Menü Yönlendirmeleri'),
    variant: 'light',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([
          getMenuByCode('storefront_primary'),
          getMenuByCode('storefront_categories'),
        ]);

        if (!mounted) return;
        setPrimaryId(p.menu.id);
        setCategoriesId(c.menu.id);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tabItems = [
    {
      key: 'categories',
      label: t('admin.menus.tabs.categories', 'Kategoriler (Mobil & Desktop)'),
      children: categoriesId ? <AdminMenuBuilder menuId={categoriesId} showImportCategories /> : <div style={{ padding: '16px 24px', color: '#64748b' }}>{t('admin.common.loading', 'Yükleniyor...')}</div>,
    },
    {
      key: 'primary',
      label: t('admin.menus.tabs.primary', 'Ana Menü (Navigasyon)'),
      children: primaryId ? <AdminMenuBuilder menuId={primaryId} showImportCategories /> : <div style={{ padding: '16px 24px', color: '#64748b' }}>{t('admin.common.loading', 'Yükleniyor...')}</div>,
    },
  ];

  return (
    <div style={{ paddingTop: 8 }}>
      <Tabs
        defaultActiveKey="categories"
        items={tabItems as any}
        style={{ padding: '0 24px' }}
      />
    </div>
  );
}
