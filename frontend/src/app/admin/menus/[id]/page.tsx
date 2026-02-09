'use client';

import { useParams } from 'next/navigation';
import { usePageHeader } from '@/hooks/usePageHeader';
import { t } from '@/lib/i18n';
import { AdminMenuBuilder } from '@/components/admin/menu/MenuBuilder';

export default function MenuBuilderPage() {
  const params = useParams<{ id: string }>();
  const menuId = Number(params?.id);

  usePageHeader({
    title: t('admin.menus.title', 'Menüler'),
    variant: 'light',
  });

  if (!menuId) {
    return <div style={{ padding: '16px 24px', color: '#64748b' }}>{t('admin.common.loading', 'Yükleniyor...')}</div>;
  }

  return <AdminMenuBuilder menuId={menuId} />;
}
