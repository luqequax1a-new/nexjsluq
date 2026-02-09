# Kategori Sistemi — Ikas Benzeri Tasarım (Normal + Dinamik)

Bu doküman, paylaşılan ikas destek yazıları ve ekran görüntülerine göre **Kategori** sisteminin hedef UX ve iş kurallarını spesifikasyon formatında özetler.

Referans içerikler:
- https://support.ikas.com/tr/kategori-olusturma-duzenleme
- https://support.ikas.com/tr/normal-kategori-olusturma
- https://support.ikas.com/tr/dinamik-kategori-olu%C5%9Fturma?hsLang=tr

---

## 1) Genel Amaç

Kategoriler:
- Ürünleri düzenli bir şekilde sınıflandırır.
- Kullanıcıların mağazada aradığını daha hızlı bulmasını sağlar.
- SEO (slug/title/description) yönetimi ile organik görünürlüğü artırır.

Ikas yaklaşımı iki kategori tipi sunar:
- **Normal Kategori**: Ürünler kategoriye manuel atanır.
- **Dinamik Kategori**: Ürünler kurallara göre otomatik kategoriye dahil edilir.

---

## 2) Admin Menü ve Sayfa Konumu

Ikas metnine göre:
- Menü yolu: **Ürünler > Tanımlamalar > Kategoriler**

Ekran görüntüsünde sol menüde “Tanımlamalar” altında “Kategoriler” görünür.

---

## 3) Kategori Listeleme Ekranı

### 3.1 Sekmeler
- **Normal Kategori** sekmesi
- **Dinamik Kategori** sekmesi

### 3.2 Liste özellikleri
- Arama inputu: `Tabloda arama yapın`
- Filtre butonu: `Filtre`
- Üst sağ aksiyonlar:
  - `Dışa Aktar`
  - `İçe Aktar`
  - `Kategori Ekle`

### 3.3 Ağaç (hierarchy)
Normal kategorilerde:
- Kategori satırları parent-child hiyerarşik listelenir.
- Alt kategoriler girintili görünür.

Dinamik kategorilerde:
- Ağaç zorunlu değildir (ikas dokümanında ebeveyn alanı dinamikte geçmiyor).

---

## 4) Ürün Create/Edit İçinden Kategori Seçimi (UX)

Ürün ekleme/düzenleme ekranında kategori atama akışı, ikas’ta ayrıca bir modal üzerinden yönetilir.

### 4.1 Ürün detay ekranında kategori alanı
- Ürün detay sekmesinde `Kategori` bölümü bulunur.
- Ürüne henüz kategori eklenmemişse boş durum (empty state) gösterilir ve `Kategori Ekle` butonu görünür.
- Ürüne kategori eklenmişse kategori yolları (breadcrumb gibi) listelenir.
- Her satırda sağda `...` menüsü ile aksiyonlar vardır:
  - `Ana Kategori Yap`
  - `Kaldır`
- Seçili ana kategori UI’da `Ana Kategori` etiketi ile işaretlenir.

### 4.2 Kategori Ekle modalı (ürün içinden)
Modal başlığı: `Kategori Ekle`

Üst alan:
- Arama inputu (`Ara`)
- `Yeni Ekle` butonu

Liste alanı:
- Kategoriler hiyerarşik ağaç olarak listelenir.
- Her satırda checkbox ile çoklu seçim yapılabilir.
- Parent satırlar expand/collapse ile alt kategorileri açıp kapatabilir.

Alt bar:
- Sol tarafta seçili adet bilgisi (örn: `15 Seçili`).
- Sağda aksiyonlar:
  - `Vazgeç`
  - `Kaydet`

Davranışlar:
- Arama sonucu boşsa `Kategori bulunamadı` mesajı gösterilir.
- Bu durumda açıklama metni: `Yeni Ekle butonuna basarak yeni kategori oluşturabilirsiniz`.
- `Yeni Ekle` ile hızlı kategori oluşturma akışı (modal içinde veya ayrı create ekranına yönlendirme) desteklenmelidir.
- `Kaydet` ile seçili kategoriler ürüne atanır.

Not (tasarımsal):
- Ürün ekranında kategori listesi bir “seçim listesi” gibi değil, kullanıcıya okunabilir şekilde kategori yolunu gösteren satırlar şeklinde görünür.
- `Ana Kategori` seçimi, SEO/URL veya navigasyon için “primary category” konseptine karşılık gelir.

---

## 5) Kategori Ekle Modalı (Tip Seçimi)

`Kategori Ekle` tıklanınca bir seçim modalı açılır:
- **Normal Kategori**
  - Açıklama: Ürünlerin tek tek eklendiği, hiyerarşik sergilenen kategori.
- **Dinamik Kategori**
  - Açıklama: Koşullara uyan ürünlerin otomatik eklendiği kategori.

Seçime göre ayrı form ekranına gidilir.

---

## 6) Normal Kategori Formu

Ikas bloguna göre normal kategori oluşturma ekranı 3 ana bölümden oluşur:

### 5.1 Temel Bilgi
Alanlar:
- `Kategori Adı` (required)
- `Ebeveyn Kategori` (optional)
- `Açıklama` (rich text olabilir)
- `Görsel` (image upload)

Davranış:
- Ebeveyn seçilirse kategori o parent altında oluşturulur.

### 5.2 Ürünler
Amaç: kategori sayfasındaki ürün sıralamasını belirlemek.

Alanlar:
- `Sıralama Ölçütü`
  - örnek: indirim oranı azalan, fiyat azalan/artana göre vb.
- `Manuel Sıralama` (opsiyon)
  - ürünleri sürükle-bırak ile istenen sırada gösterme

Ikas notu:
- Normal kategoride manuel sıralama kullanılabilir.

### 5.3 Arama Motoru Optimizasyonu (SEO)
Alanlar:
- `Slug`
- `Sayfa Başlığı`
- `Açıklama`

Davranış:
- ilk oluşturulurken slug otomatik türetilebilir.
- sayfa başlığı varsayılan kategori adı olabilir.
- açıklama varsayılan kategori açıklaması olabilir.

Kaydet:
- Sağ üstte `Kaydet` butonu.

---

## 7) Dinamik Kategori Formu

Ikas bloguna göre dinamik kategoride:

### 6.1 Temel Bilgi
Alanlar:
- `Kategori Adı` (required)
- `Açıklama` (optional)
- `Görsel` (optional)

Not:
- ikas dokümanında dinamik kategoride ebeveyn kategori alanı anlatılmıyor.

### 6.2 Koşullar (Rules)
Dinamik kategoride ürünler otomatik dahil edilir.

#### 6.2.1 Koşul grubu mantığı (AND/OR)
İki seçenek:
- `Tüm Koşulları Sağlamalı` (AND)
- `En Az Bir Koşulu Sağlamalı` (OR)

#### 6.2.2 Koşul oluşturma bileşenleri
Koşul satırı 3 parçadan oluşur:
- `Koşul` (hangi alanda filtre)
- `Metot` (içeren / içermeyen)
- `Tanımlanmış Değerler` (koşulun hedeflediği değer seti)

#### 6.2.3 Koşul türleri (ikas listesine göre)
- Ürün Markası
- Ürün Fiyatı
- Ürün Etiketi
- Varyant Değeri (örn beden/renk)
- İndirimli Ürünler
- Oluşturulma Tarihi
- Kampanya
- Kategori
- Özel Alan

Not:
- Bu koşulların hepsi aynı projede şart değil; MVP’de subset seçilebilir.

#### 6.2.4 Metot
- `İçeren`
- `İçermeyen`

### 6.3 Ürünler (Sıralama)
- `Sıralama Ölçütü` vardır.
- **Manuel Sıralama yoktur**.
  - ikas notu: "Dinamik kategorilerde Manuel Sıralama özelliği kullanılamaz".

### 6.4 SEO
Normal kategoriyle aynı mantık:
- `Slug`
- `Sayfa Başlığı`
- `Açıklama`

Kaydet:
- Sağ üst `Kaydet`.

---

## 8) Import / Export

Ekran görüntüsünde:
- `Dışa Aktar`
- `İçe Aktar`

Spesifikasyon (öneri):
- Dışa aktar: kategori listesini CSV/Excel
- İçe aktar: CSV/Excel ile kategori oluşturma/güncelleme
- Normal kategori için import sırasında parent ilişkisi kurulabilir.
- Dinamik kategori için import: rules JSON veya kolon bazlı map ile yapılabilir (ileri seviye).

---

## 9) Validasyon ve Kurallar

- `Kategori Adı` zorunlu.
- Normal kategoride `Ebeveyn Kategori` seçimi döngü oluşturamaz.
- Slug unique olmalı (case-insensitive önerilir).
- Dinamik kategori:
  - en az 1 koşul opsiyonel (ikas bunu zorunlu demiyor; ama pratikte en az 1 önerilir)
  - manuel sıralama kapalı.

---

## 10) FleetCart ile Kavramsal Eşleştirme (Yüksek seviye)

FleetCart’ta tipik olarak:
- `Category` modülü: normal kategori ağacı
- `DynamicCategory` modülü: kurallı kategori
- Storefront ürün listeleme:
  - normal kategori: product-category pivot
  - dinamik kategori: koşullara göre ürün seçimi (query builder)

Bu doküman ikas UX’ini hedefler; FleetCart implementasyonu birebir aynı olmak zorunda değildir.

---

## 11) Kabul Kriterleri (Acceptance)

- Kategori listesinde Normal/Dinamik sekmeleri vardır.
- `Kategori Ekle` tıklayınca tip seçim modalı açılır.
- Normal kategori formunda: Temel Bilgi + Ürünler + SEO bölümleri vardır.
- Dinamik kategori formunda: Temel Bilgi + Koşullar + Ürünler(sıralama) + SEO bölümleri vardır.
- Dinamik kategoride manuel sıralama görünmez/aktif olmaz.
- Üst sağda `İçe Aktar / Dışa Aktar` butonları vardır.
