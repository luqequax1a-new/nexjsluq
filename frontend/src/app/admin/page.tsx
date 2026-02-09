"use client";

import React, { useMemo, useState } from "react";
import { Row, Col, Card, Table, Space, Button, Typography, Select, Switch, Spin, Alert, Tag, Tabs } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingOutlined,
  DownOutlined,
  HistoryOutlined,
  CalendarOutlined,
  EyeOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined
} from "@ant-design/icons";
import {
  CircleDollarSign,
  Users,
  MousePointer2,
  TrendingUp,
  Package,
  Tag as TagIcon
} from "lucide-react";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useAnalytics } from "@/hooks/useAnalytics";
import { t } from "@/lib/i18n";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(value);
};

// Format number
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('tr-TR').format(value);
};

export default function DashboardPage() {
  const [activeMetric, setActiveMetric] = useState("revenue");
  const [compareWith, setCompareWith] = useState<'yesterday' | null>('yesterday');
  const [topPerformersTab, setTopPerformersTab] = useState('products');
  const [dateRange] = useState({
    start: dayjs().startOf('day').toISOString(),
    end: dayjs().toISOString(),
  });

  // Fetch dashboard data
  const { data: dashboardData, loading, error, refetch } = useAnalytics<any>('/api/analytics/dashboard', {
    startDate: dateRange.start,
    endDate: dateRange.end,
    compareWith: compareWith || undefined,
    interval: 'hour',
  }, {
    refreshInterval: 60000,
  });

  // Fetch top brands
  const { data: topBrandsData, loading: brandsLoading } = useAnalytics<any>('/api/analytics/top-brands', {
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 10,
  }, {
    refreshInterval: 60000,
  });

  // Fetch top categories
  const { data: topCategoriesData, loading: categoriesLoading } = useAnalytics<any>('/api/analytics/top-categories', {
    startDate: dateRange.start,
    endDate: dateRange.end,
    limit: 10,
  }, {
    refreshInterval: 60000,
  });

  const openStorefront = () => {
    if (typeof window === "undefined") return;
    window.open(`/`, "_blank", "noopener,noreferrer");
  };

  usePageHeader({
    title: t("admin.dashboard.title", "Kontrol Paneli"),
    extra: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button
          icon={<div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', marginRight: 8, display: 'inline-block' }} />}
          className="live-visitor-btn"
        >
          {dashboardData?.metrics?.total_sessions || 0} Anlık Ziyaretçi
        </Button>

        <Button
          icon={<EyeOutlined />}
          className="live-visitor-btn"
          onClick={openStorefront}
        >
          {t("admin.dashboard.visit_store", "Mağazayı Ziyaret Et")}
        </Button>

        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={loading}
        >
          Yenile
        </Button>
      </div>
    )
  });

  const metrics = useMemo(() => {
    if (!dashboardData?.metrics) {
      return [
        { key: "revenue", label: "Toplam Satış", value: "₺ 0.00", change: "%0.00", trend: 'neutral' as const, icon: <CircleDollarSign size={16} /> },
        { key: "orders", label: "Sipariş Sayısı", value: "0", change: "%0.00", trend: 'neutral' as const, icon: <ShoppingOutlined /> },
        { key: "sessions", label: "Oturum Sayısı", value: "0", change: "%0.00", trend: 'neutral' as const, icon: <Users size={16} /> },
        { key: "conversion", label: "Dönüşüm Oranı", value: "%0.00", change: "%0.00", trend: 'neutral' as const, icon: <MousePointer2 size={16} /> },
        { key: "refunds", label: "İadeler", value: "₺ 0.00", change: "%0.00", trend: 'neutral' as const, icon: <HistoryOutlined /> },
      ];
    }

    const m = dashboardData.metrics;
    const comp = m.comparison || {};

    return [
      {
        key: "revenue",
        label: "Toplam Satış",
        value: formatCurrency(m.total_revenue || 0),
        change: comp.total_revenue ? `%${comp.total_revenue.change}` : "%0.00",
        trend: comp.total_revenue?.trend || 'neutral',
        icon: <CircleDollarSign size={16} />
      },
      {
        key: "orders",
        label: "Sipariş Sayısı",
        value: String(m.total_orders || 0),
        change: comp.total_orders ? `%${comp.total_orders.change}` : "%0.00",
        trend: comp.total_orders?.trend || 'neutral',
        icon: <ShoppingOutlined />
      },
      {
        key: "sessions",
        label: "Oturum Sayısı",
        value: String(m.total_sessions || 0),
        change: comp.total_sessions ? `%${comp.total_sessions.change}` : "%0.00",
        trend: comp.total_sessions?.trend || 'neutral',
        icon: <Users size={16} />
      },
      {
        key: "conversion",
        label: "Dönüşüm Oranı",
        value: `%${(m.conversion_rate || 0).toFixed(2)}`,
        change: comp.conversion_rate ? `%${comp.conversion_rate.change}` : "%0.00",
        trend: comp.conversion_rate?.trend || 'neutral',
        icon: <MousePointer2 size={16} />
      },
      {
        key: "refunds",
        label: "İadeler",
        value: formatCurrency(m.total_refunds || 0),
        change: comp.total_refunds ? `%${comp.total_refunds.change}` : "%0.00",
        trend: comp.total_refunds?.trend || 'neutral',
        icon: <HistoryOutlined />
      },
    ];
  }, [dashboardData]);

  const trafficSources = useMemo(() => {
    if (!dashboardData?.traffic_sources) {
      return [
        { source: 'Organik Arama', sessions: 0, percentage: 0, color: '#10b981', icon: '🔍' },
        { source: 'Sosyal Medya', sessions: 0, percentage: 0, color: '#3b82f6', icon: '📱' },
        { source: 'Ücretli Reklam', sessions: 0, percentage: 0, color: '#8b5cf6', icon: '💰' },
        { source: 'Direkt', sessions: 0, percentage: 0, color: '#64748b', icon: '🌐' },
      ];
    }
    return dashboardData.traffic_sources;
  }, [dashboardData]);

  const activeData = useMemo(() => {
    if (!dashboardData?.chart_data) return [];
    const chartData = activeMetric === 'revenue' ? dashboardData.chart_data.revenue : dashboardData.chart_data.orders;
    return chartData || [];
  }, [dashboardData, activeMetric]);

  const maxVal = useMemo(() => {
    if (activeData.length === 0) return 100;
    const values = activeData.map((d: any) => d.value);
    return Math.max(...values) * 1.2 || 100;
  }, [activeData]);

  // Chart statistics
  const chartStats = useMemo(() => {
    if (!activeData.length) return { total: 0, avg: 0, peak: 0, peakTime: '' };

    const values = activeData.map((d: any) => d.value);
    const total = values.reduce((sum: number, val: number) => sum + val, 0);
    const avg = total / values.length;
    const peak = Math.max(...values);
    const peakItem = activeData.find((d: any) => d.value === peak);

    return {
      total,
      avg,
      peak,
      peakTime: peakItem?.label || ''
    };
  }, [activeData]);

  if (error) {
    return (
      <div className="ikas-dashboard-container">
        <Alert
          message="Veri Yükleme Hatası"
          description={error.message || "Dashboard verileri yüklenirken bir hata oluştu."}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()}>
              Tekrar Dene
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="ikas-dashboard-container">
      {/* Top Filter Bar */}
      <div className="ikas-filter-bar">
        <Space size={16}>
          <Select
            defaultValue="all"
            style={{ width: 180 }}
            className="ikas-select"
            options={[{ value: 'all', label: 'Tüm Satış Kanalları' }]}
            suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
          />
          <div className="ikas-select-with-icon">
            <CalendarOutlined className="prefix-icon" />
            <Select
              defaultValue="today"
              style={{ width: 140 }}
              className="ikas-select"
              options={[{ value: 'today', label: 'Bugün' }]}
            />
          </div>
          <div className="compare-toggle">
            <Switch size="small" checked={compareWith === 'yesterday'} onChange={(checked) => setCompareWith(checked ? 'yesterday' : null)} />
            <Text style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>Düne göre</Text>
          </div>
        </Space>
      </div>

      {/* Main Stats & Chart Area */}
      <Spin spinning={loading}>
        <div className="ikas-main-card">
          {/* Metric Tabs */}
          <div className="ikas-metric-tabs">
            {metrics.map(m => (
              <div
                key={m.key}
                className={`metric-tab ${activeMetric === m.key ? 'active' : ''}`}
                onClick={() => setActiveMetric(m.key)}
              >
                <Text className="label">{m.label}</Text>
                <div className="value-row">
                  <Text className="value">{m.value}</Text>
                  <div className="change-badge">
                    {m.trend === 'up' && <RiseOutlined style={{ fontSize: 10, marginRight: 4 }} />}
                    {m.trend === 'down' && <FallOutlined style={{ fontSize: 10, marginRight: 4 }} />}
                    <Text className={`change ${m.trend}`}>{m.change}</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Chart Section */}
          <div className="ikas-chart-section">
            {/* Chart Stats Bar */}
            <div className="chart-stats-bar">
              <div className="stat-item">
                <Text className="stat-label">Toplam</Text>
                <Text className="stat-value">{activeMetric === 'revenue' ? formatCurrency(chartStats.total) : formatNumber(chartStats.total)}</Text>
              </div>
              <div className="stat-item">
                <Text className="stat-label">Ortalama</Text>
                <Text className="stat-value">{activeMetric === 'revenue' ? formatCurrency(chartStats.avg) : formatNumber(Math.round(chartStats.avg))}</Text>
              </div>
              <div className="stat-item">
                <Text className="stat-label">Zirve</Text>
                <Text className="stat-value">{activeMetric === 'revenue' ? formatCurrency(chartStats.peak) : formatNumber(chartStats.peak)}</Text>
                <Text className="stat-time">{chartStats.peakTime}</Text>
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="chart-canvas-container">
              <svg width="100%" height="280" viewBox="0 0 1000 280" preserveAspectRatio="none" className="analytics-chart">
                {/* Grid */}
                {[0, 25, 50, 75, 100].map(p => (
                  <line key={p} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#f1f5f9" strokeWidth="1" />
                ))}

                {/* Area Fill */}
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {activeData.length > 0 && (
                  <>
                    <path
                      d={`M0,280 ${activeData.map((item: any, i: number) => {
                        const x = (i / (activeData.length - 1)) * 1000;
                        const y = 280 - (item.value / maxVal) * 280;
                        return `L${x},${y}`;
                      }).join(' ')} L1000,280 Z`}
                      fill="url(#chartGradient)"
                    />

                    <path
                      d={activeData.map((item: any, i: number) => {
                        const x = (i / (activeData.length - 1)) * 1000;
                        const y = 280 - (item.value / maxVal) * 280;
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="main-line"
                    />

                    {activeData.map((item: any, i: number) => {
                      const x = (i / (activeData.length - 1)) * 1000;
                      const y = 280 - (item.value / maxVal) * 280;
                      return (
                        <g key={i} className="chart-node">
                          <circle cx={x} cy={y} r="5" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
                          {item.value === chartStats.peak && (
                            <circle cx={x} cy={y} r="8" fill="none" stroke="#6366f1" strokeWidth="2" opacity="0.3" />
                          )}
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              <div className="chart-x-axis">
                {activeData.map((item: any, i: number) => (
                  i % 3 === 0 && <Text key={i} className="x-label">{item.label}</Text>
                ))}
              </div>
            </div>
          </div>

          {/* Traffic Source Grid */}
          <div className="ikas-source-grid">
            <Row gutter={16}>
              {trafficSources.map((s: any, idx: number) => (
                <Col span={6} key={idx}>
                  <div className="source-card">
                    <div className="source-header">
                      <Space size={8}>
                        <div className="source-icon" style={{ background: `${s.color}15` }}>
                          <span style={{ fontSize: 18 }}>{s.icon}</span>
                        </div>
                        <Text className="label">{s.source}</Text>
                      </Space>
                      <div className="progress-ring" style={{ '--progress': s.percentage, '--color': s.color } as any}>
                        <Text className="percent">%{s.percentage}</Text>
                      </div>
                    </div>
                    <Title level={4} className="val">{formatNumber(s.sessions)}</Title>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${s.percentage}%`, background: s.color }} />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </Spin>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        {/* Top Performers (Tabbed) */}
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            className="ikas-bottom-card"
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text strong style={{ fontSize: 15 }}>En Çok Satanlar</Text>
              </div>
            }
          >
            <Tabs activeKey={topPerformersTab} onChange={setTopPerformersTab} className="performers-tabs">
              <TabPane tab={<span><Package size={14} style={{ marginRight: 6 }} />Ürünler</span>} key="products">
                <Table
                  loading={loading}
                  pagination={false}
                  className="ikas-simple-table"
                  dataSource={dashboardData?.top_products || []}
                  rowKey={(record) => `${record.product_id}-${record.variant_id || 0}`}
                  columns={[
                    {
                      title: 'ÜRÜN ADI',
                      dataIndex: 'name',
                      render: (name: string, record: any) => (
                        <div>
                          <Text strong>{record.product_name}</Text>
                          {record.variant_name && (
                            <>
                              <br />
                              <Tag color="blue" style={{ fontSize: 11, marginTop: 4 }}>{record.variant_name}</Tag>
                            </>
                          )}
                          <br />
                          <Text type="secondary" style={{ fontSize: 11 }}>{record.sku}</Text>
                        </div>
                      )
                    },
                    {
                      title: 'ADET',
                      dataIndex: 'quantity_display',
                      align: 'center' as const,
                      render: (qty: string) => <Text strong style={{ color: '#6366f1' }}>{qty}</Text>
                    },
                    {
                      title: 'TOPLAM GELİR',
                      dataIndex: 'total_revenue',
                      align: 'right' as const,
                      render: (revenue: number) => <Text strong>{formatCurrency(revenue)}</Text>
                    }
                  ]}
                />
              </TabPane>

              <TabPane tab={<span><TrendingUp size={14} style={{ marginRight: 6 }} />Markalar</span>} key="brands">
                <Table
                  loading={brandsLoading}
                  pagination={false}
                  className="ikas-simple-table"
                  dataSource={topBrandsData?.brands || []}
                  rowKey="id"
                  columns={[
                    {
                      title: 'MARKA ADI',
                      dataIndex: 'name',
                      render: (name: string) => <Text strong>{name}</Text>
                    },
                    {
                      title: 'ÜRÜN SAYISI',
                      dataIndex: 'product_count',
                      align: 'center' as const,
                      render: (count: number) => <Text>{formatNumber(count)}</Text>
                    },
                    {
                      title: 'SİPARİŞ',
                      dataIndex: 'order_count',
                      align: 'center' as const,
                      render: (count: number) => <Text>{formatNumber(count)}</Text>
                    },
                    {
                      title: 'TOPLAM SATIŞ',
                      dataIndex: 'total_sales',
                      align: 'right' as const,
                      render: (sales: number) => <Text strong>{formatCurrency(sales)}</Text>
                    }
                  ]}
                />
              </TabPane>

              <TabPane tab={<span><TagIcon size={14} style={{ marginRight: 6 }} />Kategoriler</span>} key="categories">
                <Table
                  loading={categoriesLoading}
                  pagination={false}
                  className="ikas-simple-table"
                  dataSource={topCategoriesData?.categories || []}
                  rowKey="id"
                  columns={[
                    {
                      title: 'KATEGORİ ADI',
                      dataIndex: 'name',
                      render: (name: string) => <Text strong>{name}</Text>
                    },
                    {
                      title: 'ÜRÜN SAYISI',
                      dataIndex: 'product_count',
                      align: 'center' as const,
                      render: (count: number) => <Text>{formatNumber(count)}</Text>
                    },
                    {
                      title: 'SİPARİŞ',
                      dataIndex: 'order_count',
                      align: 'center' as const,
                      render: (count: number) => <Text>{formatNumber(count)}</Text>
                    },
                    {
                      title: 'PAY',
                      dataIndex: 'percentage',
                      align: 'center' as const,
                      render: (percentage: number) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: '#6366f1', borderRadius: 3 }} />
                          </div>
                          <Text style={{ fontSize: 11, fontWeight: 600 }}>%{percentage.toFixed(1)}</Text>
                        </div>
                      )
                    },
                    {
                      title: 'TOPLAM SATIŞ',
                      dataIndex: 'total_sales',
                      align: 'right' as const,
                      render: (sales: number) => <Text strong>{formatCurrency(sales)}</Text>
                    }
                  ]}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Growth Metrics */}
        <Col xs={24} lg={8}>
          <Card
            variant="borderless"
            className="ikas-bottom-card"
            title={<Text strong style={{ fontSize: 15 }}>Büyüme Metrikleri</Text>}
          >
            <div className="growth-box">
              <div className="growth-item">
                <Text type="secondary" className="lbl">Ort. İade Oranı</Text>
                <div className="val-row">
                  <Title level={3} className="val">%{dashboardData?.growth_metrics?.refund_rate?.toFixed(2) || '0.00'}</Title>
                  <Text type="secondary" className="sub">%0.00</Text>
                </div>
              </div>
              <div className="growth-item" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
                <Text type="secondary" className="lbl">Tekrar Alım Oranı</Text>
                <div className="val-row">
                  <Title level={3} className="val">%{dashboardData?.growth_metrics?.repeat_purchase_rate?.toFixed(2) || '0.00'}</Title>
                  <Text type="success" className="sub" style={{ color: '#10b981' }}>+2.1%</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .ikas-select-with-icon {
            position: relative;
            display: flex;
            align-items: center;
        }
        .ikas-select-with-icon .prefix-icon {
            position: absolute;
            left: 12px;
            z-index: 2;
            color: #64748b;
            font-size: 14px;
            pointer-events: none;
        }
        .ikas-select-with-icon .ikas-select .ant-select-selector {
            padding-left: 32px !important;
        }

        .ikas-dashboard-container {
            padding: 4px 0 40px 0;
            background: #f8fafc;
        }
        
        .ikas-filter-bar {
            margin-bottom: 24px;
            display: flex;
            align-items: center;
        }
        .ikas-select .ant-select-selector {
            border-radius: 6px !important;
            border: 1px solid #e2e8f0 !important;
            height: 38px !important;
            display: flex !important;
            align-items: center !important;
            box-shadow: none !important;
        }
        .live-visitor-btn {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            height: 38px !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            color: #1e293b !important;
        }

        .ikas-main-card {
            background: #ffffff;
            border: 1px solid #f1f5f9;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            overflow: hidden;
        }

        .ikas-metric-tabs {
            display: flex;
            border-bottom: 1px solid #f1f5f9;
        }
        .metric-tab {
            flex: 1;
            padding: 24px;
            border-right: 1px solid #f1f5f9;
            cursor: pointer;
            position: relative;
            transition: all 0.2s;
        }
        .metric-tab:last-child { border-right: none; }
        .metric-tab:hover { background: #fafafa; }
        .metric-tab.active { background: #ffffff; }
        .metric-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 100%;
            height: 3px;
            background: #6366f1;
        }
        .metric-tab .label { font-size: 13px; color: #64748b; font-weight: 500; display: block; margin-bottom: 12px; }
        .metric-tab .value-row { display: flex; align-items: baseline; gap: 12px; }
        .metric-tab .value { font-size: 20px; font-weight: 800; color: #1e293b; }
        .metric-tab .change-badge { display: flex; align-items: center; }
        .metric-tab .change { font-size: 12px; font-weight: 600; }
        .metric-tab .change.up { color: #10b981; }
        .metric-tab .change.down { color: #ef4444; }
        .metric-tab .change.neutral { color: #94a3b8; }

        .ikas-chart-section {
            padding: 24px;
        }
        
        .chart-stats-bar {
            display: flex;
            gap: 32px;
            margin-bottom: 24px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .stat-item {
            flex: 1;
        }
        .stat-label {
            font-size: 11px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 6px;
        }
        .stat-value {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
            display: block;
        }
        .stat-time {
            font-size: 10px;
            color: #6366f1;
            font-weight: 600;
            display: block;
            margin-top: 2px;
        }

        .chart-canvas-container {
            position: relative;
        }
        .analytics-chart {
            filter: drop-shadow(0px 4px 12px rgba(99, 102, 241, 0.15));
        }
        .chart-x-axis {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
            padding: 0 8px;
        }
        .chart-x-axis .x-label {
            font-size: 11px;
            color: #94a3b8;
            font-weight: 600;
        }

        .ikas-source-grid {
            padding: 24px;
            background: #fbfbfb;
            border-top: 1px solid #f1f5f9;
        }
        .source-card {
            background: #ffffff;
            border: 1px solid #f1f5f9;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.2s;
        }
        .source-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .source-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .source-header .label {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
        }
        .progress-ring {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: conic-gradient(var(--color) calc(var(--progress) * 1%), #f1f5f9 0);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .progress-ring::before {
            content: '';
            position: absolute;
            width: 28px;
            height: 28px;
            background: white;
            border-radius: 50%;
        }
        .progress-ring .percent {
            position: relative;
            z-index: 1;
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
        }
        .source-card .val {
            margin: 0 0 12px 0 !important;
            font-weight: 800 !important;
            font-size: 22px !important;
        }
        .source-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .progress-bar {
            height: 4px;
            background: #f1f5f9;
            border-radius: 2px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        .ikas-bottom-card {
            border-radius: 12px !important;
            border: 1px solid #f1f5f9 !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
        }
        .ikas-bottom-card .ant-card-head {
            border-bottom: 1px solid #f1f5f9 !important;
            padding: 0 24px !important;
            min-height: 56px !important;
        }
        
        .performers-tabs .ant-tabs-nav {
            margin: 0 !important;
            padding: 0 24px !important;
        }
        .performers-tabs .ant-tabs-tab {
            padding: 12px 16px !important;
            font-weight: 600 !important;
            font-size: 13px !important;
        }
        
        .ikas-simple-table .ant-table-thead > tr > th {
            background: #fbfbfc !important;
            border-bottom: 1px solid #f1f5f9 !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            color: #64748b !important;
            padding: 16px !important;
        }
        .ikas-simple-table .ant-table-tbody > tr > td {
            padding: 16px !important;
            border-bottom: 1px solid #f1f5f9 !important;
        }

        .growth-box { padding: 8px 0; }
        .growth-item .lbl {
            font-size: 13px;
            font-weight: 500;
            display: block;
            margin-bottom: 8px;
        }
        .growth-item .val-row {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
        }
        .growth-item .val {
            margin: 0 !important;
            font-weight: 800 !important;
        }
        .growth-item .sub {
            font-size: 12px;
            font-weight: 700;
        }
      `}</style>
    </div>
  );
}
