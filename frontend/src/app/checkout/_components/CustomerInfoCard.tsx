"use client";

import { Card, Checkbox, Form, Input, Space } from "antd";

interface CustomerInfoCardProps {
  createAccount: boolean;
  setCreateAccount: (next: boolean) => void;
}

export function CustomerInfoCard({ createAccount, setCreateAccount }: CustomerInfoCardProps) {
  const sanitizeTrPhone = (value: unknown) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    const noLeadingZero = digits.replace(/^0+/, "");
    return noLeadingZero.slice(0, 10);
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-6 pb-4 border-b">Müşteri Bilgileri</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item name="first_name" label="Adınız" rules={[{ required: true, message: "Lütfen adınızı girin!" }]}>
          <Input placeholder="Adınız" />
        </Form.Item>

        <Form.Item name="last_name" label="Soyadınız" rules={[{ required: true, message: "Lütfen soyadınızı girin!" }]}>
          <Input placeholder="Soyadınız" />
        </Form.Item>

        <Form.Item
          name="email"
          label="E-posta"
          rules={[
            { required: true, message: "Lütfen e-posta adresinizi girin!" },
            { type: "email", message: "Geçerli bir e-posta adresi girin!" },
          ]}
        >
          <Input placeholder="ornek@email.com" />
        </Form.Item>

        <Form.Item label="Telefon">
          <Space.Compact style={{ width: "100%" }}>
            <Input value={"+90"} readOnly style={{ width: 72, textAlign: "center" }} tabIndex={-1} />
            <Form.Item
              name="phone"
              noStyle
              getValueFromEvent={(e) => sanitizeTrPhone(e?.target?.value)}
              rules={[
                { required: true, message: "Lütfen telefon numaranızı girin!" },
                {
                  validator: async (_rule, value) => {
                    const v = sanitizeTrPhone(value);
                    if (!v) throw new Error("Lütfen telefon numaranızı girin!");
                    if (v.length !== 10) throw new Error("Telefon numarası 10 haneli olmalıdır.");
                    if (v.startsWith("0")) throw new Error("Telefon numarası 0 ile başlayamaz.");
                  },
                },
              ]}
            >
              <Input inputMode="numeric" maxLength={10} placeholder="5XXXXXXXXX" />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
      </div>

      <Form.Item name="create_account" valuePropName="checked">
        <Checkbox onChange={(e) => setCreateAccount(e.target.checked)}>Hesap oluştur</Checkbox>
      </Form.Item>

      {createAccount ? (
        <Form.Item name="password" label="Şifre" rules={[{ required: true, message: "Lütfen şifre girin!" }]}>
          <Input.Password placeholder="Şifre" />
        </Form.Item>
      ) : null}
    </Card>
  );
}
