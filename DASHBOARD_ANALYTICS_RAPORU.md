# 📊 Dashboard Analytics ve Raporlama Sistemi - Kapsamlı Analiz ve Öneriler

**Tarih:** 2026-02-08  
**Proje:** LUQ Admin Monorepo  
**Kapsam:** Dashboard Analytics, İstatistikler, Raporlama Widgetları

---

## 📋 İçindekiler

1. [Mevcut Durum Analizi](#mevcut-durum-analizi)
2. [Eksik Özellikler](#eksik-özellikler)
3. [Önerilen Analytics Sistemi](#önerilen-analytics-sistemi)
4. [Database Şeması](#database-şeması)
5. [Backend API Endpoints](#backend-api-endpoints)
6. [Frontend Widgetlar](#frontend-widgetlar)
7. [Uygulama Planı](#uygulama-planı)

---

## 🔍 Mevcut Durum Analizi

### ✅ Var Olan Özellikler

#### Frontend (Dashboard Page)
**Dosya:** `frontend/src/app/admin/page.tsx`

**Mevcut Widgetlar:**
1. **Metric Cards (5 adet)**
   - Toplam Satış: ₺0.00
   - Sipariş Sayısı: 0
   - Oturum Sayısı: 223 (hardcoded)
   - Dönüşüm Oranı: %0.00
   - İadeler: ₺0.00

2. **Analytics Chart**
   - SVG tabanlı çizgi grafik
   - 12 saatlik zaman dilimi
   - Karşılaştırma çizgisi (dashed line)
   - Hover efektleri
   - **Sorun:** Tüm veriler hardcoded/mock

3. **Traffic Sources (4 adet)**
   - Ücretli Sosyal Medya: 89 (%39.91)
   - Sosyal Medya: 76 (%34.08)
   - Organik Arama: 47 (%21.07)
   - Direkt: 11 (%4.93)
   - **Sorun:** Hardcoded veriler

4. **En Çok Satanlar Tablosu**
   - 4 ürün gösteriliyor
   - Ürün adı, adet, toplam gelir
   - **Sorun:** Mock data

5. **Büyüme Metrikleri**
   - Ortalama İade Oranı: %0.00
   - Tekrar Alım Oranı: %12.4
   - **Sorun:** Hardcoded

**Mevcut Filtreler:**
- Satış Kanalları (sadece "Tüm Satış Kanalları")
- Tarih Seçimi (sadece "Bugün")
- Dün ile karşılaştırma toggle

**UI/UX Kalitesi:** ⭐⭐⭐⭐⭐ (Mükemmel - Ikas tarzı premium tasarım)

---

### ❌ Eksik Özellikler

#### Backend Tarafı
1. **Analytics Controller yok**
2. **Analytics Service yok**
3. **Analytics Models yok**
4. **Event Tracking sistemi yok**
5. **Analytics database tables yok**

#### Frontend Tarafı
1. **Gerçek veri entegrasyonu yok**
2. **Tarih aralığı seçimi çalışmıyor**
3. **Filtreler işlevsel değil**
4. **Real-time güncellemeler yok**

#### Eksik Analytics Özellikleri
1. ❌ Müşteri istatistikleri
2. ❌ Çok satan markalar
3. ❌ Çok satan kategoriler
4. ❌ En fazla görüntülenen ürünler
5. ❌ Aranan kelimeler
6. ❌ Sepet terk oranı
7. ❌ Ortalama sipariş değeri
8. ❌ Müşteri yaşam boyu değeri (LTV)
9. ❌ Coğrafi analiz
10. ❌ Cihaz/tarayıcı analizi
11. ❌ Ödeme yöntemi analizi
12. ❌ Kargo yöntemi analizi
13. ❌ Kupon kullanım analizi
14. ❌ Stok uyarıları
15. ❌ Gelir tahminleri

---

## 🎯 Önerilen Analytics Sistemi

### Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND DASHBOARD                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Metrics  │ │  Charts  │ │  Tables  │ │  Widgets │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                     │
        ┌────────────▼────────────┐
        │   API ENDPOINTS         │
        │  /api/analytics/*       │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  ANALYTICS SERVICE      │
        │  - Data Aggregation     │
        │  - Calculations         │
        │  - Caching              │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   DATABASE TABLES       │
        │  - analytics_events     │
        │  - analytics_sessions   │
        │  - analytics_pageviews  │
        │  - analytics_searches   │
        └─────────────────────────┘
```

---

## 🗄️ Database Şeması

### 1. analytics_events (Genel Event Tracking)

```sql
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', 'purchase', etc.
    session_id VARCHAR(100),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Event Data (JSON)
    event_data JSONB,
    
    -- Context
    url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Device Info
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Location
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_event_type (event_type),
    INDEX idx_session_id (session_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_created_at (created_at)
);
```

### 2. analytics_sessions (Oturum Tracking)

```sql
CREATE TABLE analytics_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Session Info
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INT,
    page_views INT DEFAULT 0,
    
    -- Traffic Source
    source VARCHAR(50), -- 'organic', 'paid_social', 'social', 'direct', 'email', 'referral'
    medium VARCHAR(50),
    campaign VARCHAR(100),
    
    -- Landing Page
    landing_page TEXT,
    exit_page TEXT,
    
    -- Device
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Location
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Conversion
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_started_at (started_at),
    INDEX idx_source (source)
);
```

### 3. analytics_product_views (Ürün Görüntülemeleri)

```sql
CREATE TABLE analytics_product_views (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    
    -- View Duration
    duration_seconds INT,
    
    -- Context
    referrer TEXT,
    source VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
);
```

### 4. analytics_searches (Arama Sorguları)

```sql
CREATE TABLE analytics_searches (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    session_id VARCHAR(100),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Results
    results_count INT DEFAULT 0,
    clicked_product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    
    -- Context
    source VARCHAR(50), -- 'header_search', 'category_filter', etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_query (query),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
);
```

### 5. analytics_cart_abandonment (Sepet Terk)

```sql
CREATE TABLE analytics_cart_abandonment (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Cart Info
    items_count INT,
    cart_value DECIMAL(10,2),
    
    -- Abandonment Stage
    stage VARCHAR(50), -- 'cart', 'checkout_info', 'checkout_shipping', 'checkout_payment'
    
    -- Recovery
    recovered BOOLEAN DEFAULT FALSE,
    recovered_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cart_id (cart_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
);
```

### 6. analytics_daily_summary (Günlük Özet - Cache)

```sql
CREATE TABLE analytics_daily_summary (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    
    -- Sales
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Traffic
    total_sessions INT DEFAULT 0,
    total_pageviews INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    
    -- Conversion
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    cart_abandonment_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Products
    total_product_views INT DEFAULT 0,
    total_searches INT DEFAULT 0,
    
    -- Customers
    new_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (date)
);
```

---

## 🔌 Backend API Endpoints

### Analytics Controller

**Dosya:** `backend/app/Http/Controllers/Api/AnalyticsController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    /**
     * Dashboard Overview
     * GET /api/analytics/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'compare_with' => 'nullable|in:yesterday,last_week,last_month,last_year',
        ]);

        $startDate = $data['start_date'] ?? now()->startOfDay();
        $endDate = $data['end_date'] ?? now()->endOfDay();

        return response()->json([
            'metrics' => $this->analyticsService->getMetrics($startDate, $endDate),
            'chart_data' => $this->analyticsService->getChartData($startDate, $endDate),
            'traffic_sources' => $this->analyticsService->getTrafficSources($startDate, $endDate),
            'top_products' => $this->analyticsService->getTopProducts($startDate, $endDate, 10),
            'growth_metrics' => $this->analyticsService->getGrowthMetrics($startDate, $endDate),
        ]);
    }

    /**
     * Top Selling Products
     * GET /api/analytics/top-products
     */
    public function topProducts(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:100',
            'type' => 'nullable|in:revenue,quantity',
        ]);

        $products = $this->analyticsService->getTopProducts(
            $data['start_date'] ?? now()->subDays(30),
            $data['end_date'] ?? now(),
            $data['limit'] ?? 20,
            $data['type'] ?? 'revenue'
        );

        return response()->json(['products' => $products]);
    }

    /**
     * Top Selling Brands
     * GET /api/analytics/top-brands
     */
    public function topBrands(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $brands = $this->analyticsService->getTopBrands(
            $data['start_date'] ?? now()->subDays(30),
            $data['end_date'] ?? now(),
            $data['limit'] ?? 10
        );

        return response()->json(['brands' => $brands]);
    }

    /**
     * Top Selling Categories
     * GET /api/analytics/top-categories
     */
    public function topCategories(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $categories = $this->analyticsService->getTopCategories(
            $data['start_date'] ?? now()->subDays(30),
            $data['end_date'] ?? now(),
            $data['limit'] ?? 10
        );

        return response()->json(['categories' => $categories]);
    }

    /**
     * Most Viewed Products
     * GET /api/analytics/most-viewed-products
     */
    public function mostViewedProducts(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $products = $this->analyticsService->getMostViewedProducts(
            $data['start_date'] ?? now()->subDays(30),
            $data['end_date'] ?? now(),
            $data['limit'] ?? 20
        );

        return response()->json(['products' => $products]);
    }

    /**
     * Top Search Keywords
     * GET /api/analytics/top-searches
     */
    public function topSearches(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $searches = $this->analyticsService->getTopSearches(
            $data['start_date'] ?? now()->subDays(30),
            $data['end_date'] ?? now(),
            $data['limit'] ?? 50
        );

        return response()->json(['searches' => $searches]);
    }

    /**
     * Customer Statistics
     * GET /api/analytics/customers
     */
    public function customers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        return response()->json([
            'new_customers' => $this->analyticsService->getNewCustomers($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now()),
            'returning_customers' => $this->analyticsService->getReturningCustomers($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now()),
            'top_customers' => $this->analyticsService->getTopCustomers($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now(), 20),
            'customer_lifetime_value' => $this->analyticsService->getCustomerLifetimeValue(),
        ]);
    }

    /**
     * Cart Abandonment
     * GET /api/analytics/cart-abandonment
     */
    public function cartAbandonment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        return response()->json([
            'abandonment_rate' => $this->analyticsService->getCartAbandonmentRate($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now()),
            'abandoned_carts' => $this->analyticsService->getAbandonedCarts($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now(), 50),
            'recovery_rate' => $this->analyticsService->getCartRecoveryRate($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now()),
        ]);
    }

    /**
     * Geographic Analysis
     * GET /api/analytics/geography
     */
    public function geography(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        return response()->json([
            'by_country' => $this->analyticsService->getOrdersByCountry($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now()),
            'by_city' => $this->analyticsService->getOrdersByCity($data['start_date'] ?? now()->subDays(30), $data['end_date'] ?? now()),
        ]);
    }

    /**
     * Track Event (For Frontend)
     * POST /api/analytics/track
     */
    public function track(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_type' => 'required|string|max:50',
            'event_data' => 'nullable|array',
            'session_id' => 'required|string|max:100',
        ]);

        $this->analyticsService->trackEvent(
            $data['event_type'],
            $data['session_id'],
            $data['event_data'] ?? [],
            $request
        );

        return response()->json(['ok' => true]);
    }
}
```

---

## 🎨 Frontend Widgetlar

### Önerilen Yeni Widgetlar

#### 1. **Çok Satan Markalar Widget**

```tsx
// components/admin/dashboard/TopBrandsWidget.tsx
export function TopBrandsWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/top-brands', { startDate, endDate });

  return (
    <Card title="Çok Satan Markalar" className="analytics-card">
      <Table
        loading={loading}
        dataSource={data?.brands}
        columns={[
          { title: 'Marka', dataIndex: 'name', render: (name, record) => (
            <Space>
              <Avatar src={record.logo} />
              <Text strong>{name}</Text>
            </Space>
          )},
          { title: 'Satış', dataIndex: 'total_sales', render: (val) => formatCurrency(val) },
          { title: 'Ürün Sayısı', dataIndex: 'product_count' },
          { title: 'Sipariş', dataIndex: 'order_count' },
        ]}
      />
    </Card>
  );
}
```

#### 2. **Çok Satan Kategoriler Widget**

```tsx
// components/admin/dashboard/TopCategoriesWidget.tsx
export function TopCategoriesWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/top-categories', { startDate, endDate });

  return (
    <Card title="Çok Satan Kategoriler" className="analytics-card">
      <div className="category-grid">
        {data?.categories?.map((cat) => (
          <div key={cat.id} className="category-card">
            <div className="category-icon">{cat.icon}</div>
            <Text strong>{cat.name}</Text>
            <Title level={4}>{formatCurrency(cat.total_sales)}</Title>
            <Text type="secondary">{cat.order_count} sipariş</Text>
            <Progress percent={cat.percentage} showInfo={false} />
          </div>
        ))}
      </div>
    </Card>
  );
}
```

#### 3. **En Çok Görüntülenen Ürünler Widget**

```tsx
// components/admin/dashboard/MostViewedProductsWidget.tsx
export function MostViewedProductsWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/most-viewed-products', { startDate, endDate });

  return (
    <Card title="En Çok Görüntülenen Ürünler" className="analytics-card">
      <Table
        loading={loading}
        dataSource={data?.products}
        columns={[
          { title: 'Ürün', dataIndex: 'name', render: (name, record) => (
            <Space>
              <Avatar src={record.image} shape="square" />
              <div>
                <Text strong>{name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{record.sku}</Text>
              </div>
            </Space>
          )},
          { title: 'Görüntülenme', dataIndex: 'view_count', render: (val) => (
            <Space>
              <EyeOutlined />
              <Text strong>{val.toLocaleString()}</Text>
            </Space>
          )},
          { title: 'Dönüşüm', dataIndex: 'conversion_rate', render: (val) => (
            <Tag color={val > 5 ? 'green' : val > 2 ? 'orange' : 'red'}>
              %{val.toFixed(2)}
            </Tag>
          )},
          { title: 'Satış', dataIndex: 'sales_count' },
        ]}
      />
    </Card>
  );
}
```

#### 4. **Aranan Kelimeler Widget**

```tsx
// components/admin/dashboard/TopSearchesWidget.tsx
export function TopSearchesWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/top-searches', { startDate, endDate });

  return (
    <Card title="Popüler Aramalar" className="analytics-card">
      <div className="search-cloud">
        {data?.searches?.map((search, idx) => (
          <Tag
            key={idx}
            className="search-tag"
            style={{
              fontSize: 12 + (search.count / data.searches[0].count) * 12,
              padding: '4px 12px',
              margin: 4,
            }}
          >
            <SearchOutlined /> {search.query} ({search.count})
          </Tag>
        ))}
      </div>
      
      <Divider />
      
      <Table
        size="small"
        dataSource={data?.searches?.slice(0, 10)}
        columns={[
          { title: 'Arama', dataIndex: 'query' },
          { title: 'Arama Sayısı', dataIndex: 'count' },
          { title: 'Sonuç', dataIndex: 'avg_results' },
          { title: 'Tıklama Oranı', dataIndex: 'click_rate', render: (val) => `%${val.toFixed(1)}` },
        ]}
      />
    </Card>
  );
}
```

#### 5. **Müşteri İstatistikleri Widget**

```tsx
// components/admin/dashboard/CustomerStatsWidget.tsx
export function CustomerStatsWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/customers', { startDate, endDate });

  return (
    <Card title="Müşteri İstatistikleri" className="analytics-card">
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Yeni Müşteriler"
            value={data?.new_customers}
            prefix={<UserCheck size={20} />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Geri Dönen Müşteriler"
            value={data?.returning_customers}
            prefix={<Users size={20} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
      </Row>
      
      <Divider />
      
      <div className="customer-ltv">
        <Text type="secondary">Ortalama Müşteri Yaşam Boyu Değeri</Text>
        <Title level={3}>{formatCurrency(data?.customer_lifetime_value)}</Title>
      </div>
      
      <Divider />
      
      <Text strong>En Değerli Müşteriler</Text>
      <Table
        size="small"
        dataSource={data?.top_customers}
        columns={[
          { title: 'Müşteri', dataIndex: 'name' },
          { title: 'Sipariş', dataIndex: 'order_count' },
          { title: 'Toplam', dataIndex: 'total_spent', render: formatCurrency },
        ]}
      />
    </Card>
  );
}
```

#### 6. **Sepet Terk Analizi Widget**

```tsx
// components/admin/dashboard/CartAbandonmentWidget.tsx
export function CartAbandonmentWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/cart-abandonment', { startDate, endDate });

  return (
    <Card title="Sepet Terk Analizi" className="analytics-card">
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Terk Oranı"
            value={data?.abandonment_rate}
            suffix="%"
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Kurtarma Oranı"
            value={data?.recovery_rate}
            suffix="%"
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
      </Row>
      
      <Divider />
      
      <Text strong>Terk Edilen Sepetler</Text>
      <Table
        size="small"
        dataSource={data?.abandoned_carts}
        columns={[
          { title: 'Müşteri', dataIndex: 'customer_email' },
          { title: 'Değer', dataIndex: 'cart_value', render: formatCurrency },
          { title: 'Ürün Sayısı', dataIndex: 'items_count' },
          { title: 'Tarih', dataIndex: 'created_at', render: (date) => formatDate(date) },
          { title: 'Aksiyon', render: (_, record) => (
            <Button size="small" type="link">Hatırlat</Button>
          )},
        ]}
      />
    </Card>
  );
}
```

#### 7. **Coğrafi Analiz Widget**

```tsx
// components/admin/dashboard/GeographyWidget.tsx
export function GeographyWidget({ startDate, endDate }: DateRangeProps) {
  const { data, loading } = useAnalytics('/api/analytics/geography', { startDate, endDate });

  return (
    <Card title="Coğrafi Dağılım" className="analytics-card">
      <Tabs>
        <Tabs.TabPane tab="Ülkeler" key="countries">
          <Table
            dataSource={data?.by_country}
            columns={[
              { title: 'Ülke', dataIndex: 'country_name', render: (name, record) => (
                <Space>
                  <span className={`fi fi-${record.country_code.toLowerCase()}`} />
                  <Text>{name}</Text>
                </Space>
              )},
              { title: 'Sipariş', dataIndex: 'order_count' },
              { title: 'Gelir', dataIndex: 'revenue', render: formatCurrency },
              { title: 'Oran', dataIndex: 'percentage', render: (val) => (
                <Progress percent={val} size="small" />
              )},
            ]}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Şehirler" key="cities">
          <Table
            dataSource={data?.by_city}
            columns={[
              { title: 'Şehir', dataIndex: 'city_name' },
              { title: 'Sipariş', dataIndex: 'order_count' },
              { title: 'Gelir', dataIndex: 'revenue', render: formatCurrency },
            ]}
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
}
```

---

## 📅 Uygulama Planı

### Faz 1: Temel Altyapı (1-2 Hafta)

#### Backend
1. **Database Migrations Oluştur**
   - `analytics_events`
   - `analytics_sessions`
   - `analytics_product_views`
   - `analytics_searches`
   - `analytics_cart_abandonment`
   - `analytics_daily_summary`

2. **Models Oluştur**
   - `AnalyticsEvent.php`
   - `AnalyticsSession.php`
   - `AnalyticsProductView.php`
   - `AnalyticsSearch.php`
   - `AnalyticsCartAbandonment.php`
   - `AnalyticsDailySummary.php`

3. **AnalyticsService Oluştur**
   - Event tracking
   - Data aggregation
   - Caching logic

4. **AnalyticsController Oluştur**
   - Dashboard endpoint
   - Top products endpoint
   - Top brands endpoint
   - Top categories endpoint
   - Most viewed products endpoint
   - Top searches endpoint
   - Customer stats endpoint
   - Cart abandonment endpoint
   - Geography endpoint

#### Frontend
1. **useAnalytics Hook Oluştur**
   ```tsx
   export function useAnalytics(endpoint: string, params: any) {
     const [data, setData] = useState(null);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       fetchAnalytics();
     }, [endpoint, params]);
     
     return { data, loading, refetch: fetchAnalytics };
   }
   ```

2. **Analytics Context Oluştur**
   - Date range state
   - Compare mode state
   - Refresh logic

---

### Faz 2: Event Tracking (1 Hafta)

#### Storefront Event Tracking
1. **Page View Tracking**
   ```tsx
   useEffect(() => {
     trackEvent('page_view', {
       url: window.location.href,
       title: document.title,
     });
   }, [pathname]);
   ```

2. **Product View Tracking**
   ```tsx
   useEffect(() => {
     if (product) {
       trackEvent('product_view', {
         product_id: product.id,
         product_name: product.name,
         price: product.price,
       });
     }
   }, [product]);
   ```

3. **Add to Cart Tracking**
   ```tsx
   const handleAddToCart = () => {
     trackEvent('add_to_cart', {
       product_id: product.id,
       quantity: quantity,
       price: product.price,
     });
   };
   ```

4. **Search Tracking**
   ```tsx
   const handleSearch = (query: string) => {
     trackEvent('search', {
       query: query,
       results_count: results.length,
     });
   };
   ```

5. **Purchase Tracking**
   ```tsx
   useEffect(() => {
     if (order) {
       trackEvent('purchase', {
         order_id: order.id,
         total: order.total,
         items: order.items,
       });
     }
   }, [order]);
   ```

---

### Faz 3: Dashboard Widgetları (2 Hafta)

#### Widgetlar (Öncelik Sırasına Göre)
1. ✅ **Metrics Cards** (Zaten var, backend bağlantısı eklenecek)
2. ✅ **Analytics Chart** (Zaten var, gerçek veri eklenecek)
3. ✅ **Traffic Sources** (Zaten var, gerçek veri eklenecek)
4. ✅ **Top Products** (Zaten var, gerçek veri eklenecek)
5. 🆕 **Top Brands Widget**
6. 🆕 **Top Categories Widget**
7. 🆕 **Most Viewed Products Widget**
8. 🆕 **Top Searches Widget**
9. 🆕 **Customer Stats Widget**
10. 🆕 **Cart Abandonment Widget**
11. 🆕 **Geography Widget**

---

### Faz 4: Gelişmiş Özellikler (2-3 Hafta)

1. **Real-time Dashboard**
   - WebSocket/Pusher entegrasyonu
   - Canlı sipariş bildirimleri
   - Canlı ziyaretçi sayısı

2. **Custom Reports**
   - Rapor oluşturucu
   - Excel/PDF export
   - Scheduled reports (email)

3. **Predictive Analytics**
   - Satış tahminleri
   - Stok tahminleri
   - Trend analizi

4. **A/B Testing**
   - Kampanya performansı
   - Ürün performansı
   - Fiyat optimizasyonu

---

## 🎯 Öncelikli Aksiyonlar

### Hemen Yapılmalı (P0)
1. ✅ Database migrations oluştur
2. ✅ AnalyticsService temel yapısını kur
3. ✅ Dashboard endpoint'ini oluştur
4. ✅ Frontend'de gerçek veri entegrasyonu

### Kısa Vadede (P1)
1. Event tracking sistemi
2. Top products/brands/categories widgetları
3. Search tracking
4. Customer stats

### Orta Vadede (P2)
1. Cart abandonment tracking
2. Geography widget
3. Real-time dashboard
4. Custom reports

---

## 📊 Beklenen Sonuçlar

### İş Değeri
- ✅ Veri odaklı karar verme
- ✅ Satış optimizasyonu
- ✅ Müşteri davranışı anlayışı
- ✅ Pazarlama ROI ölçümü
- ✅ Stok optimizasyonu

### Teknik Değer
- ✅ Scalable analytics altyapısı
- ✅ Real-time data processing
- ✅ Efficient caching
- ✅ API-first architecture

### Kullanıcı Deneyimi
- ✅ Görsel ve anlaşılır raporlar
- ✅ Hızlı veri erişimi
- ✅ Customizable dashboard
- ✅ Export capabilities

---

## 📝 Notlar

- Tüm analytics verileri GDPR/KVKK uyumlu olmalı
- Kişisel veriler anonimleştirilmeli
- Cache stratejisi iyi planlanmalı (Redis kullanımı önerilir)
- Event tracking performansı optimize edilmeli (queue kullanımı)
- Dashboard yükleme süreleri 2 saniyenin altında olmalı

---

**Rapor Sonu**
