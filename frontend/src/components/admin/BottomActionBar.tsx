"use client";

import { Button, Space } from "antd";
import { useI18n } from "@/context/I18nContext";
import { t } from "@/lib/i18n";

export function BottomActionBar({
  onBack,
  onSave,
  saving,
}: {
  onBack?: () => void;
  onSave?: () => void;
  saving?: boolean;
}) {
  const { locale } = useI18n();

  return (
    <div
      className="safe-area-bottom"
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 30,
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        padding: "16px 24px",
        display: "block",
      }}
    >
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        {onBack ? (
          <Button 
            onClick={onBack}
            style={{
              height: 40,
              borderRadius: '8px',
              fontWeight: 500,
              padding: '0 20px'
            }}
          >
            {t('admin.common.back', 'Geri')}
          </Button>
        ) : <div />}
        {onSave ? (
          <Button 
            type="primary" 
            onClick={onSave} 
            loading={saving}
            style={{
              height: 40,
              background: '#6f55ff',
              borderRadius: '8px',
              fontWeight: 600,
              padding: '0 24px',
              border: 'none',
              boxShadow: '0 2px 4px rgba(111, 85, 255, 0.2)'
            }}
          >
            {t('admin.common.save', 'Kaydet')}
          </Button>
        ) : null}
      </Space>
    </div>
  );
}
