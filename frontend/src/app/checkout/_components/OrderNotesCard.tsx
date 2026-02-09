"use client";

import { Card, Form, Input } from "antd";

const { TextArea } = Input;

export function OrderNotesCard() {
  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-6 pb-4 border-b">Sipariş Notları</h3>
      <Form.Item name="order_notes" label="Siparişinizle ilgili notlarınız">
        <TextArea rows={4} placeholder="Siparişinizle ilgili notlarınız..." />
      </Form.Item>
    </Card>
  );
}
