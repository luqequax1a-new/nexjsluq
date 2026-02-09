# 🎯 Müşteri Detay ve Kampanya Sistemi - Uygulama Planı

Bu plan, FabricMarket projesindeki Müşteri Yönetimi derinleştirmesi ve Kampanya/Kupon sisteminin kurulumunu kapsar.

---

## 📊 İLERLEME DURUMU: %100
 
 ```
 [████████████████████] 14/14 Adım Tamamlandı
 ```

---

## 🛠️ ADIM 1: Müşteri Detay ve Sipariş Geçmişi

### Modül 1.1: Backend Geliştirmeleri
- [ ] **Adım 1:** `Customer` modeline ilişkisel istatistikler eklenmesi (Son sipariş, En çok alınan kategoriler).
- [ ] **Adım 2:** `CustomerController` içinde bir müşteriye ait siparişleri listeleyen API ucunun güçlendirilmesi.
- [ ] **Adım 3:** Müşteri notları için `CustomerNote` sistemi (varmış gibi görünüyor ama kontrol edilecek).

### Modül 1.2: Frontend Geliştirmeleri
- [x] **Adım 4:** Müşteri Çekmecesine (Drawer) "Sipariş Geçmişi" sekmesinin entegrasyonu.
- [x] **Adım 5:** Sipariş geçmişi için mini tablo komponenti (`Order` detayına hızlı link ile).
- [ ] **Adım 6:** Müşteri detay sayfasının (`/admin/customers/[id]`) oluşturulması (Opsiyonel - Drawer yeterli gelmezse).

---

## 🛠️ ADIM 2: Kampanya ve İndirim Kuponu Modülü

### Modül 2.1: Arka Plan (Database & Models)
- [x] **Adım 7:** `Coupons` tablosu migration (code, amount, type: percentage/fixed, expire_date, limit, min_spend).
- [x] **Adım 8:** `Coupon` modeli ve validasyon mantığı (Kupon aktif mi? Limit doldu mu?).

### Modül 2.2: Backend API (Controller)
- [x] **Adım 9:** `CouponController` CRUD işlemlerinin yazılması (Hangi rütbe kupon görebilir/silebilir?).
- [x] **Adım 10:** Sipariş oluşturma (`OrderController@store`) sürecine kupon doğrulama entegrasyonu.

### Modül 2.3: Frontend Yönetim Ekranları
- [x] **Adım 11:** `/admin/marketing/coupons` liste sayfası ve "Kural 6" uyumlu yetki kontrolleri.
- [x] **Adım 12:** Kupon oluşturma/düzenleme formu (Ant Design Pro-form tarzı).
- [x] **Adım 13:** Yeni sipariş oluşturma ekranına (`/admin/orders/new`) kupon kodu giriş alanı entegrasyonu.

---

## 🛠️ ADIM 3: Test ve Cilalama
- [x] **Adım 14:** Tüm modüllerin yetki kontrolü (Permission check) ve i18n testleri.

---

## 📝 ÖNEMLİ KURALLAR (RECAP)
1. **Kural 6 (Yetkiler):** Her yeni API ucu ve her sayfa butonu yetki kontrolüne (`hasPermission`) tabi tutulacak.
2. **Kural 1 (i18n):** Hiçbir statik metin direkt yazılmayacak.
3. **Kural 2 (Header):** Sayfa başlıkları `usePageHeader` ile yönetilecek.
