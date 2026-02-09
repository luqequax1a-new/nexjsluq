"use client";

import { Button, Dropdown, Space } from "antd";
import type { MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function AdminTopbar() {
  const router = useRouter();
  const { me, logout } = useAuth();

  const items: MenuProps["items"] = [
    {
      key: "logout",
      label: "Logout",
      onClick: async () => {
        await logout();
        router.replace("/admin/login");
      },
    },
  ];

  return (
    <Space size={16}>
      <div style={{ textAlign: "right", lineHeight: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{me?.user?.name || "Admin"}</div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{me?.user?.email}</div>
      </div>
      <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
        <Button
          type="text"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            padding: 0
          }}
        >
          {me?.user?.name?.charAt(0).toUpperCase() || "A"}
        </Button>
      </Dropdown>
    </Space>
  );
}
