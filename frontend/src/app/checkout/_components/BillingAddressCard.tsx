"use client";

import { Card, Form, Input, Select } from "antd";
import { trSelectFilterOption } from "@/lib/trSearch";

const { TextArea } = Input;

interface BillingAddressCardProps {
  selectedBillingCity: string | null;
  setBillingCity: (v: string | null) => void;
  provinces: string[];
  districtsByProvince: Record<string, string[]>;
  form: any;
}

export function BillingAddressCard({
  selectedBillingCity,
  setBillingCity,
  provinces,
  districtsByProvince,
  form,
}: BillingAddressCardProps) {
  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-6 pb-4 border-b">Fatura Adresi</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Form.Item name="billing_company" label="Firma Adı">
          <Input placeholder="Firma Adı" />
        </Form.Item>

        <Form.Item name="billing_tax_office" label="Vergi Dairesi">
          <Input placeholder="Vergi Dairesi" />
        </Form.Item>
      </div>

      <Form.Item
        name="billing_tax_number"
        label="Vergi No"
        rules={[
          {
            validator: async (_rule, value) => {
              if (!value) return; // Optional field
              const cleaned = String(value).replace(/\D/g, '');
              if (cleaned.length !== 10 && cleaned.length !== 11) {
                throw new Error('Vergi numarası 10 veya 11 haneli olmalıdır.');
              }
            },
          },
        ]}
      >
        <Input placeholder="Vergi No" inputMode="numeric" maxLength={11} />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item name="billing_city" label="Şehir" rules={[{ required: true, message: "Lütfen şehir seçin!" }]}>
          <Select
            placeholder="Şehir seçin"
            showSearch
            filterOption={trSelectFilterOption}
            onChange={(value) => {
              setBillingCity(value);
              form.setFieldsValue({ billing_district: undefined });
            }}
          >
            {provinces.map((province) => (
              <Select.Option key={province} value={province}>
                {province}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="billing_district" label="İlçe" rules={[{ required: true, message: "Lütfen ilçe seçin!" }]}>
          <Select
            placeholder="İlçe seçin"
            showSearch
            filterOption={trSelectFilterOption}
            disabled={!selectedBillingCity}
          >
            {selectedBillingCity && districtsByProvince[selectedBillingCity]?.map((district) => (
              <Select.Option key={district} value={district}>
                {district}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item name="billing_address" label="Adres" rules={[{ required: true, message: "Lütfen adresinizi girin!" }]}>
        <TextArea rows={3} placeholder="Mahalle, Sokak, Kapı No" />
      </Form.Item>

    </Card>
  );
}
