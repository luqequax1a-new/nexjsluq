"use client";

import { Card, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export function SectionCard({
  title,
  icon,
  children,
  id,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <Card
      id={id}
      styles={{
        body: { padding: "32px" },
        header: { minHeight: 56, padding: "0 32px", borderBottom: "1px solid #f1f5f9" }
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && <span style={{ fontSize: 18, color: "#6f55ff", display: "flex" }}>{icon}</span>}
          <span className="admin-section-title" style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{title}</span>
          <Tooltip title="Daha fazla bilgi">
            <InfoCircleOutlined style={{ fontSize: 14, color: "#94a3b8", cursor: "help", marginLeft: "auto" }} />
          </Tooltip>
        </div>
      }
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        marginBottom: 32,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        background: "#ffffff"
      }}
    >
      {children}
    </Card>
  );
}
