"use client";

import { Card, Checkbox, Form, Input, Select, Space, Switch } from "antd";
import { trSelectFilterOption } from "@/lib/trSearch";

const { TextArea } = Input;

interface ShippingAddressCardProps {
  selectedCity: string | null;
  setShippingCity: (v: string | null) => void;
  shipToDifferentAddress: boolean;
  setShipToDifferentAddress: (next: boolean) => void;
  setBillingCity: (v: string | null) => void;
  provinces: string[];
  districtsByProvince: Record<string, string[]>;
  form: any;
  createAccount: boolean;
  setCreateAccount: (next: boolean) => void;
}

export function ShippingAddressCard({
  selectedCity,
  setShippingCity,
  shipToDifferentAddress,
  setShipToDifferentAddress,
  setBillingCity,
  provinces,
  districtsByProvince,
  form,
  createAccount,
  setCreateAccount,
}: ShippingAddressCardProps) {
  const sanitizeTrPhone = (value: unknown) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    const noLeadingZero = digits.replace(/^0+/, "");
    return noLeadingZero.slice(0, 10);
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-6 pb-4 border-b">Teslimat Adresi</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item name="shipping_city" label="Şehir" rules={[{ required: true, message: "Lütfen şehir seçin!" }]}>
          <Select
            placeholder="Şehir seçin"
            showSearch
            filterOption={trSelectFilterOption}
            onChange={(value) => {
              setShippingCity(value);
              form.setFieldsValue({ shipping_district: undefined });
              if (!shipToDifferentAddress) {
                form.setFieldsValue({ billing_city: value, billing_district: undefined });
                setBillingCity(value);
              }
            }}
          >
            {provinces.map((province) => (
              <Select.Option key={province} value={province}>
                {province}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="shipping_district" label="İlçe" rules={[{ required: true, message: "Lütfen ilçe seçin!" }]}>
          <Select
            placeholder="İlçe seçin"
            showSearch
            filterOption={trSelectFilterOption}
            disabled={!selectedCity}
            onChange={(value) => {
              if (!shipToDifferentAddress) {
                form.setFieldsValue({ billing_district: value });
              }
            }}
          >
            {selectedCity && districtsByProvince[selectedCity]?.map((district) => (
              <Select.Option key={district} value={district}>
                {district}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item name="shipping_address" label="Adres" rules={[{ required: true, message: "Lütfen adresinizi girin!" }]}>
        <TextArea rows={3} placeholder="Mahalle, Sokak, Kapı No" />
      </Form.Item>

      <Form.Item name="ship_to_different_address" valuePropName="checked">
        <Checkbox
          onChange={(e) => {
            const checked = e.target.checked;
            setShipToDifferentAddress(checked);

            if (!checked) {
              const current = form.getFieldsValue([
                "shipping_city",
                "shipping_district",
                "shipping_address",
              ]);

              form.setFieldsValue({
                billing_city: current.shipping_city,
                billing_district: current.shipping_district,
                billing_address: current.shipping_address,
              });

              setBillingCity(current.shipping_city ?? null);
            }
          }}
        >
          Fatura adresim farklı
        </Checkbox>
      </Form.Item>

      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-900 leading-tight">
              Misafir siparişini müşteri hesabına çevirmek ister misiniz?
            </div>
            <div className="text-[12px] font-medium text-slate-600 mt-1 leading-tight">
              Daha hızlı sipariş, adres kaydı ve sipariş takibi için hesap oluşturabilirsiniz.
            </div>
          </div>

          <Form.Item name="create_account" valuePropName="checked" className="!mb-0">
            <Switch checked={createAccount} onChange={(checked) => setCreateAccount(checked)} />
          </Form.Item>
        </div>
      </div>

      {createAccount ? (
        <>
          <Form.Item
            name="password"
            label="Şifre"
            className="mt-4"
            rules={[
              { required: true, message: "Lütfen şifre girin!" },
              { min: 6, message: "Şifre en az 6 karakter olmalıdır!" }
            ]}
          >
            <Input.Password placeholder="Şifre" />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            label="Şifre Tekrar"
            dependencies={['password']}
            rules={[
              { required: true, message: "Lütfen şifrenizi tekrar girin!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Şifre Tekrar" />
          </Form.Item>
        </>
      ) : null}
    </Card>
  );
}
