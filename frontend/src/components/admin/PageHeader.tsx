"use client";

import React from "react";
import { LeftOutlined, MoreOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Dropdown, MenuProps, Space, Typography } from "antd";
import Link from "next/link";

export type PageHeaderProps = {
  title: string;
  breadcrumb?: { href?: string; label: string }[];
  onBack?: () => void;
  onSave?: () => void;
  saving?: boolean;
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: MenuProps['items'];
  variant?: "dark" | "light"; // dark: edit sayfaları, light: liste sayfaları
};

export function PageHeader({
  title,
  breadcrumb = [],
  onBack,
  onSave,
  saving,
  extra,
  footer,
  actions = [],
  variant = "dark",
}: PageHeaderProps) {
  const isDark = variant === "dark";

  const horizontalPadding = isDark ? "clamp(16px, 3vw, 32px)" : "clamp(12px, 3vw, 24px)";

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
      {/* Top Bar */}
      <div
        style={{
          padding: `0 ${horizontalPadding}`,
          height: isDark ? "clamp(56px, 8vw, 72px)" : "clamp(52px, 7vw, 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isDark ? "#000000" : "#ffffff",
          color: isDark ? "#ffffff" : "#0f172a",
          borderBottom: (isDark || footer) ? "none" : "1px solid #e2e8f0",
          boxShadow: (isDark || footer) ? "none" : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {onBack && (
            <Button
              type="text"
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3333 8H2.66663M2.66663 8L6.66663 12M2.66663 8L6.66663 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>}
              onClick={onBack}
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "clamp(12px, 2vw, 24px)",
                background: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                borderRadius: "4px",
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e2e8f0",
                color: isDark ? "#ffffff" : "#0f172a"
              }}
            />
          )}
          <div style={{ display: "flex", alignItems: "center" }}>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {b.href ? (
                    <Link href={b.href} style={{
                      color: isDark ? "#DCFB6E" : "#0f172a",
                      fontWeight: 400,
                      fontSize: isDark ? "clamp(1rem, 2.5vw, 1.25rem)" : "clamp(12px, 2vw, 14px)",
                      lineHeight: isDark ? "clamp(1.5rem, 3vw, 1.875rem)" : "clamp(1rem, 2vw, 1.25rem)",
                      transition: "color 300ms",
                      display: "flex",
                      height: "auto",
                      padding: 0
                    }}>
                      {b.label}
                    </Link>
                  ) : (
                    <Typography.Text
                      style={{
                        color: isDark ? "#ffffff" : "#0f172a",
                        fontWeight: 400,
                        fontSize: isDark ? "clamp(1rem, 2.5vw, 1.25rem)" : "clamp(12px, 2vw, 14px)",
                        lineHeight: isDark ? "clamp(1.5rem, 3vw, 1.875rem)" : "clamp(1rem, 2vw, 1.25rem)",
                      }}
                    >
                      {b.label}
                    </Typography.Text>
                  )}
                  {i < breadcrumb.length && (
                    <span style={{
                      margin: isDark ? "0 12px" : "0 8px",
                      display: "flex",
                      alignItems: "center",
                      color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </span>
                  )}
                </div>
              </React.Fragment>
            ))}
            <Typography.Text
              style={{
                color: isDark ? "#ffffff" : "#0f172a",
                fontWeight: 600,
                fontSize: isDark ? "clamp(1rem, 2.5vw, 1.25rem)" : "clamp(12px, 2vw, 14px)",
                lineHeight: isDark ? "clamp(1.5rem, 3vw, 1.875rem)" : "clamp(1rem, 2vw, 1.25rem)",
              }}
            >
              {title}
            </Typography.Text>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 1.5vw, 12px)" }}>
          {extra}
          {onSave && (
            <Button
              type="primary"
              onClick={onSave}
              loading={saving}
              className={isDark ? "erMLXP" : ""}
              style={{
                background: isDark ? "#6f55ff" : "#000000",
                borderColor: isDark ? "#6f55ff" : "#000000",
                color: "#ffffff",
                fontWeight: 500,
                height: isDark ? "clamp(36px, 5vw, 40px)" : "clamp(32px, 4.5vw, 36px)",
                padding: isDark ? "clamp(0 12px, 2vw, 16px)" : "clamp(0 16px, 2.5vw, 20px)",
                borderRadius: "4px",
                fontSize: isDark ? "clamp(0.75rem, 2vw, 0.875rem)" : "clamp(11px, 1.8vw, 13px)",
                lineHeight: isDark ? 1 : 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none"
              }}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          )}
          {actions && actions.length > 0 && (
            <Dropdown menu={{ items: actions }} placement="bottomRight">
              <Button
                type="text"
                icon={<MoreOutlined style={{ color: isDark ? "#ffffff" : "#0f172a", fontSize: 18 }} />}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  width: "clamp(32px, 4vw, 36px)",
                  height: "clamp(32px, 4vw, 36px)",
                  borderRadius: "4px",
                  border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #e2e8f0"
                }}
              />
            </Dropdown>
          )}
        </div>
      </div>

      {/* Footer / Sub-bar */}
      {footer && (
        <div style={{
          background: isDark ? "#000000" : "#ffffff",
          padding: isDark ? "0 clamp(16px, 3vw, 32px) clamp(12px, 2vw, 16px) clamp(16px, 3vw, 32px)" : "0 clamp(12px, 3vw, 24px) clamp(12px, 2vw, 16px) clamp(12px, 3vw, 24px)",
          borderBottom: isDark ? "none" : "1px solid #e2e8f0",
          boxShadow: isDark ? "none" : "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}>
          {footer}
        </div>
      )}

      <style jsx global>{`
        .ant-breadcrumb-separator {
           display: flex;
           align-items: center;
        }
        .erMLXP {
            transition: 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
        }
      `}</style>
    </div>
  );
}
