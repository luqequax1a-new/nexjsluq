# Ürün Formu Refactor Planı (Modüler Mimari)

Bu plan, 1000+ satırlık `Product Edit` ve `New` sayfalarını parçalara ayırarak bakımı kolay, hatasız ve performanslı bir yapıya dönüştürmeyi hedefler.

## 1. Faz: Ortak Bileşenlerin Ayrıştırılması
Mevcut formdaki "SectionCard" yapıları bağımsız bileşenlere dönüştürülecektir. Bu bileşenler `Form.useFormInstance()` kullanarak ana form ile iletişim kuracaktır.

- [ ] **`ProductGeneralSection.tsx`**: Ürün adı, SKU, Marka ve Etiket seçimleri.
- [ ] **`ProductPricingSection.tsx`**: Satış fiyatı, İndirimli fiyat, İndirim tarihleri, Vergi sınıfı ve Birim Fiyatlandırma toggle'ı.
- [ ] **`ProductInventorySection.tsx`**: Stok yönetim anahtarı, Stok durumu ve Birim bazlı miktar (Qty) alanı.
- [ ] **`ProductDescriptionSection.tsx`**: Kısa açıklama ve TinyMCE (Geniş açıklama) yönetimi.

## 2. Faz: Mantık (Logic) ve Veri Çekme İşlemlerinin Ortaklaştırılması
- [ ] **`useProductStaticData.ts`**: Vergi sınıfları (Tax Classes) ve Birimler (Units) gibi her iki sayfada da ihtiyaç duyulan statik verileri çeken merkezi hook.
- [ ] **`useProductFormEffects.ts`**: Form üzerindeki otomatik yan etkileri (örn: birim değişince stoğu yuvarla, indirim silinince tarihleri temizle) yöneten ortak mantık.

## 3. Faz: Sayfaların Güncellenmesi
- [ ] **`[id]/edit/page.tsx` (Düzenleme Sayfası)**: Yeni bileşenleri içerecek şekilde sadeleştirilecek.
- [ ] **`new/edit/page.tsx` (Yeni Sayfası)**: Düzenleme sayfası ile aynı bileşenleri kullanması sağlanacak. Kod farkı %90 oranında azalacak.

## Risk Yönetimi ve Güvenlik Önlemleri
1. **Veri Kaybı Önleme**: Form alanlarının `name` değerleri kesinlikle değişmeyecektir (örn: `price`, `discount_price` vb.).
2. **Dairesel Referans Koruması**: `onValuesChange` mantığı merkezi tutularak Ant Design render döngüsü korunacaktır.
3. **Uyum Kontrolü**: `effectiveUnit` ve `isDecimalAllowed` gibi `useUnit` hook'undan gelen değerlerin alt bileşenlere doğru aktarıldığından emin olunacaktır.

## Başarı Kriterleri
- Sayfa dosyalarının her birinin 200 satırın altına düşmesi.
- `New` ve `Edit` sayfalarındaki bir değişikliğin tek bir yerden (bileşenden) yönetilebilir olması.
- Mevcut fonksiyonelliğin (birim fiyatlandırma, stok takibi vb.) bozulmadan çalışması.
