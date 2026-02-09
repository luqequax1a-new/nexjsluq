"use client";

import { App, Button, Card, Form, Input, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ApiError } from "@/lib/api";

type LaravelValidationDetails = {
  message?: unknown;
  errors?: Record<string, unknown>;
};

function firstValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const d = details as LaravelValidationDetails;
  const errors = d.errors;
  if (!errors || typeof errors !== "object") return null;
  const first = Object.values(errors)[0];
  if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  return null;
}

export default function AdminLoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <main
      className="admin-login"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      }}
    >
      <style jsx global>{`
        .admin-login .ant-input,
        .admin-login .ant-input-affix-wrapper {
          background: transparent !important;
        }

        .admin-login .ant-input:focus,
        .admin-login .ant-input-focused,
        .admin-login .ant-input-affix-wrapper:focus,
        .admin-login .ant-input-affix-wrapper-focused {
          box-shadow: none !important;
          border-color: #cbd5e1 !important;
        }

        .admin-login input:-webkit-autofill,
        .admin-login input:-webkit-autofill:hover,
        .admin-login input:-webkit-autofill:focus,
        .admin-login input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: inherit !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Typography.Title level={3} style={{ margin: 0, fontWeight: 800 }}>
            Luq Admin
          </Typography.Title>
          <Typography.Text type="secondary">Welcome back, please login</Typography.Text>
        </div>

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            setLoading(true);
            try {
              await login(values.email, values.password);
              const next = searchParams.get("next") || "/admin";
              router.replace(next);
            } catch (e: unknown) {
              const err = e as ApiError;
              const msg = firstValidationMessage(err?.details) || err?.message || "Login failed";
              message.error(msg);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input size="large" placeholder="admin@demo.com" autoComplete="email" style={{ background: "transparent" }} />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password size="large" placeholder="••••••••" autoComplete="current-password" style={{ background: "transparent" }} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ height: 48, marginTop: 12, borderRadius: 8 }}
          >
            Sign In
          </Button>
        </Form>
      </Card>
    </main>
  );
}
