"use client";

import { Layout } from "antd";

const { Content } = Layout;

export function EditShell({
  header,
  children,
  maxWidth = 1200,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "#000000",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }}
      >
        {header}
      </div>
      <Content style={{ padding: "32px 40px 80px" }}>
        <div style={{ margin: "0 auto", maxWidth }}>
          {children}
        </div>
      </Content>
    </Layout>
  );
}
