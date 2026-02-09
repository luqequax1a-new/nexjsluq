"use client";

import React, { useState, useEffect } from "react";
import { App, Button, Card, Space, Typography, Table, Switch } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, EditOutlined } from "@ant-design/icons";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  settings: {
    fee_operation?: 'add' | 'discount';
    fee_type?: 'fixed' | 'percentage';
    fee_amount?: number;
    fee_percentage?: number;
    bank_info?: string;
    min_amount?: number;
    max_amount?: number;
  };
  created_at: string;
  updated_at: string;
}

export default function PaymentMethodsPage() {
  const { message: antMessage } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<PaymentMethod[]>("/api/settings/payment-methods");
        setPaymentMethods(data);
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        antMessage.error("Ödeme yöntemleri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await apiFetch(`/api/settings/payment-methods/${id}/toggle`, {
        method: "PUT",
        json: { enabled },
      });
      
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === id ? { ...method, enabled } : method
        )
      );
      
      antMessage.success(enabled ? "Ödeme yöntemi aktif edildi" : "Ödeme yöntemi pasif edildi");
    } catch (error) {
      antMessage.error("İşlem başarısız");
    }
  };

  const getPaymentIcon = (code: string) => {
    switch (code) {
      case 'cash_on_delivery':
        return <DollarOutlined />;
      case 'bank_transfer':
        return <BankOutlined />;
      case 'credit_card':
        return <CreditCardOutlined />;
      default:
        return <CreditCardOutlined />;
    }
  };

  const getFeeText = (settings: PaymentMethod['settings']) => {
    const op = settings.fee_operation || 'add';
    const sign = op === 'discount' ? '-' : '+';
    if (settings.fee_type === 'percentage' && settings.fee_percentage) {
      return `${sign}%${settings.fee_percentage}`;
    }
    if (settings.fee_type === 'fixed' && settings.fee_amount) {
      return `${sign}₺${settings.fee_amount}`;
    }
    return 'Ücretsiz';
  };

  const columns = [
    {
      title: 'Ödeme Yöntemi',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PaymentMethod) => (
        <div className="flex items-center gap-3">
          <div className="text-lg text-blue-600">
            {getPaymentIcon(record.code)}
          </div>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Kod',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
          {code}
        </span>
      ),
    },
    {
      title: 'Ek Ücret',
      key: 'fee',
      render: (record: PaymentMethod) => (
        <span className="font-medium text-orange-600">
          {getFeeText(record.settings)}
        </span>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: PaymentMethod) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
          loading={loading}
        />
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: PaymentMethod) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/payment-methods/${record.id}/edit`)}
          >
            Düzenle
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <Title level={2} className="mb-2">
                Ödeme Yöntemleri
              </Title>
              <Text type="secondary">
                Mağazanızda kabul edilen ödeme yöntemlerini yönetin
              </Text>
            </div>
          </div>
        </div>

        {/* Payment Methods Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={paymentMethods}
            rowKey="id"
            loading={loading}
            pagination={false}
            className="payment-methods-table"
          />
        </Card>
      </div>

      <style jsx>{`
        .payment-methods-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
        }
        
        .payment-methods-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}
