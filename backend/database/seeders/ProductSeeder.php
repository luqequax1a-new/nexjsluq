<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Variation;
use App\Models\Option;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::all();
        $brands = Brand::all();
        $tags = DB::table('tags')->get();

        // Seed görselleri yükle (storage/app/public/media/seed/ klasöründen)
        $seedImages = collect(Storage::disk('public')->files('media/seed'))
            ->filter(fn($f) => preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $f))
            ->sort()
            ->values()
            ->toArray();
        $seedImageCount = count($seedImages);
        $seedImageIndex = 0;

        // Varyasyonlar
        $colorVar = Variation::where('name', 'Renk')->with('values')->first();
        $sizeVar = Variation::where('name', 'Beden')->with('values')->first();
        $shoeNumVar = Variation::where('name', 'Numara (Ayakkabı)')->with('values')->first();
        $fabricVar = Variation::where('name', 'Kumaş Tipi')->with('values')->first();
        $widthVar = Variation::where('name', 'En (cm)')->with('values')->first();
        $curtainWidthVar = Variation::where('name', 'Perde Eni')->with('values')->first();
        $towelSizeVar = Variation::where('name', 'Havlu Boyutu')->with('values')->first();

        // Seçenekler
        $warrantyOpt = Option::where('name', 'Garanti Süresi')->first();
        $giftOpt = Option::where('name', 'Hediye Paketi')->first();
        $nameOpt = Option::where('name', 'Kişiye Özel İsim')->first();
        $installOpt = Option::where('name', 'Kurulum Hizmeti')->first();

        // Birimler
        $unitMeter = Unit::where('name', 'Metre')->first();
        $unitPcs = Unit::where('name', 'Adet')->first();
        $unitKg = Unit::where('name', 'Kilogram')->first();
        $unitPair = Unit::where('name', 'Çift')->first();
        $unitPack = Unit::where('name', 'Paket')->first();
        $unitTop = Unit::where('name', 'Top')->first();

        // Özellikler (Attributes)
        $attrKumasTipi = DB::table('attributes')->where('name', 'Kumaş Tipi')->first();
        $attrKumasKarisimi = DB::table('attributes')->where('name', 'Kumaş Karışımı')->first();
        $attrKumasEni = DB::table('attributes')->where('name', 'Kumaş Eni')->first();
        $attrGramaj = DB::table('attributes')->where('name', 'Gramaj')->first();
        $attrDesen = DB::table('attributes')->where('name', 'Desen')->first();
        $attrMensei = DB::table('attributes')->where('name', 'Menşei')->first();
        $attrYikama = DB::table('attributes')->where('name', 'Yıkama Talimatı')->first();
        $attrUtuleme = DB::table('attributes')->where('name', 'Ütüleme')->first();
        $attrKullanim = DB::table('attributes')->where('name', 'Kullanım Alanı')->first();
        $attrCinsiyet = DB::table('attributes')->where('name', 'Cinsiyet')->first();
        $attrMevsim = DB::table('attributes')->where('name', 'Mevsim')->first();
        $attrStil = DB::table('attributes')->where('name', 'Stil')->first();

        // Tüm attribute_values'ları cache'le
        $allAttrValues = DB::table('attribute_values')->get();

        $products = [
            [
                'name' => 'Kadife Döşemelik Kumaş - Bordo',
                'sku' => 'KDF-BRD-001',
                'price' => 450.00,
                'selling_price' => 450.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 100,
                'unit_id' => $unitMeter?->id,
                'unit_type' => 'length',
                'show_unit_pricing' => true,
                'categories' => ['DÖŞEMELİK', 'Ev Tekstili'],
                'brand' => 'Kayalar Kumaş',
                'tags' => ['Kadife', 'Döşemelik', 'Lüks', 'Kolay Temizlenir'],
                'variations' => [], // Basit ürün
                'options' => ['gift', 'warranty'],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Kadife'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Polyester'],
                    ['attr' => $attrKumasEni, 'value' => '150 cm'],
                    ['attr' => $attrGramaj, 'value' => '350 gr/m²'],
                    ['attr' => $attrDesen, 'value' => 'Düz'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrKullanim, 'value' => 'Döşemelik'],
                    ['attr' => $attrYikama, 'value' => '30°C Yıkama'],
                ],
                'description' => 'Yüksek kaliteli kadife kumaş, özellikle koltuk döşemesi ve dekoratif uygulamalar için ideal. Yumuşak dokusu, derin rengi ve dayanıklı yapısı ile yaşam alanlarınıza şıklık katıyor. Kolay temizlenebilir yüzeyi ile pratik kullanım sunar. %100 polyester, 150 cm eninde, 350 gr/m² gramaj.',
                'short_description' => 'Premium kalite kadife döşemelik kumaş. Koltuk, sandalye ve başlık döşemesi için mükemmel seçim.',
            ],
            [
                'name' => 'İtalyan İpek Kumaş - Bej',
                'sku' => 'IPK-BEJ-002',
                'price' => 1200.00,
                'selling_price' => 1100.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 50,
                'unit_id' => $unitMeter?->id,
                'unit_type' => 'length',
                'show_unit_pricing' => true,
                'categories' => ['Ev Tekstili'],
                'brand' => 'Royal Fabric',
                'tags' => ['İpek', 'Lüks', 'Düz Renk', 'Modern'],
                'variations' => [],
                'options' => ['gift', 'warranty'],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'İpek'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 İpek'],
                    ['attr' => $attrKumasEni, 'value' => '140 cm'],
                    ['attr' => $attrGramaj, 'value' => '80 gr/m²'],
                    ['attr' => $attrDesen, 'value' => 'Düz'],
                    ['attr' => $attrMensei, 'value' => 'İtalya'],
                    ['attr' => $attrKullanim, 'value' => 'Giyimlik'],
                    ['attr' => $attrYikama, 'value' => 'Kuru Temizleme'],
                ],
                'description' => 'İtalya\'dan ithal %100 ipek kumaş, zarif dokusu ve doğal parlaklığı ile lüks tasarımlar için vazgeçilmez.',
                'short_description' => 'İthal İtalyan ipek kumaş. Özel tasarım ve lüks giyim için ideal.',
            ],
            [
                'name' => 'Basic T-Shirt',
                'sku' => 'TSH-BSC-001',
                'price' => 250.00,
                'selling_price' => 250.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 500,
                'unit_id' => $unitPcs?->id,
                'unit_type' => 'pieces',
                'show_unit_pricing' => false,
                'categories' => ['Giyim', 'Erkek Giyim'],
                'brand' => 'Modern Tekstil',
                'tags' => ['Pamuk', 'Modern', 'Yıkanabilir'],
                'variations' => [
                    // Renk: sadece 5 renk, Beden: S-XL (4 beden) = 20 varyant
                    ['var' => $colorVar, 'pick' => ['Siyah', 'Beyaz', 'Lacivert', 'Gri', 'Bordo']],
                    ['var' => $sizeVar, 'pick' => ['S', 'M', 'L', 'XL']],
                ],
                'options' => [],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Pamuk'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Pamuk'],
                    ['attr' => $attrGramaj, 'value' => '200 gr/m²'],
                    ['attr' => $attrCinsiyet, 'value' => 'Erkek'],
                    ['attr' => $attrMevsim, 'value' => '4 Mevsim'],
                    ['attr' => $attrStil, 'value' => 'Günlük'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrYikama, 'value' => '40°C Yıkama'],
                ],
                'description' => 'Günlük kullanım için tasarlanmış basic T-shirt. %100 pamuk kumaşı ile konforlu ve nefes alan yapı.',
                'short_description' => 'Yüksek kaliteli pamuk basic T-shirt. Her gün kullanım için ideal.',
            ],
            [
                'name' => 'Yazlık Desenli Elbise',
                'sku' => 'ELB-YZL-005',
                'price' => 899.90,
                'selling_price' => 899.90,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 50,
                'unit_id' => $unitPcs?->id,
                'unit_type' => 'pieces',
                'show_unit_pricing' => false,
                'categories' => ['Kadın Giyim', 'Elbise'],
                'brand' => 'Evim Home',
                'tags' => ['Viskon', 'Çiçekli', 'Modern', 'Yıkanabilir'],
                'variations' => [
                    ['var' => $sizeVar, 'pick' => ['S', 'M', 'L', 'XL', 'XXL']],
                ],
                'options' => ['gift'],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Viskon'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Viskon'],
                    ['attr' => $attrDesen, 'value' => 'Çiçekli'],
                    ['attr' => $attrCinsiyet, 'value' => 'Kadın'],
                    ['attr' => $attrMevsim, 'value' => 'İlkbahar/Yaz'],
                    ['attr' => $attrStil, 'value' => 'Günlük'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrYikama, 'value' => '30°C Yıkama'],
                    ['attr' => $attrUtuleme, 'value' => 'Orta Isı'],
                ],
                'description' => 'Yaz ayları için tasarlanmış hafif ve ferah elbise. Viskon karışım kumaş ile terletmez.',
                'short_description' => 'Yazlık desenli viskon elbise. Konforlu ve şık görünüm.',
            ],
            [
                'name' => 'Fon Perde - Gri',
                'sku' => 'PRD-FON-GR',
                'price' => 600.00,
                'selling_price' => 550.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 200,
                'unit_id' => $unitMeter?->id,
                'unit_type' => 'length',
                'show_unit_pricing' => true,
                'categories' => ['PERDE', 'Fon Perde'],
                'brand' => 'Lüks Perde',
                'tags' => ['Perdelik', 'Polyester', 'Düz Renk', 'Güneş Geçirmez'],
                'variations' => [
                    ['var' => $curtainWidthVar, 'pick' => ['150 cm', '200 cm', '250 cm', '280 cm', '300 cm']],
                ],
                'options' => ['install', 'warranty'],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Polyester'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Polyester'],
                    ['attr' => $attrKumasEni, 'value' => '280 cm'],
                    ['attr' => $attrGramaj, 'value' => '250 gr/m²'],
                    ['attr' => $attrDesen, 'value' => 'Düz'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrKullanim, 'value' => 'Perdelik'],
                    ['attr' => $attrYikama, 'value' => '30°C Yıkama'],
                ],
                'description' => 'Modern tasarımlı gri fon perde kumaşı. Işığı filtre ederek mahremiyet sağlar.',
                'short_description' => 'Premium kalite gri fon perde. Işık filtreleme ve mahremiyet için ideal.',
            ],
            [
                'name' => 'Deri Kemer',
                'sku' => 'KMR-DR-01',
                'price' => 350.00,
                'selling_price' => 350.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 150,
                'unit_id' => $unitPcs?->id,
                'unit_type' => 'pieces',
                'show_unit_pricing' => false,
                'categories' => ['Aksesuar', 'Kemer'],
                'brand' => 'Tekstil Dünyası',
                'tags' => ['Klasik', 'Ekonomik'],
                'variations' => [
                    ['var' => $sizeVar, 'pick' => ['S', 'M', 'L', 'XL', 'XXL']],
                ],
                'options' => ['gift'],
                'attributes' => [
                    ['attr' => $attrCinsiyet, 'value' => 'Erkek'],
                    ['attr' => $attrMevsim, 'value' => '4 Mevsim'],
                    ['attr' => $attrStil, 'value' => 'Klasik'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                ],
                'description' => 'Gerçek deriden üretilmiş kaliteli kemer. Dayanıklı tokma ve sağlam yapısı ile uzun ömürlü.',
                'short_description' => 'Gerçek deri kaliteli kemer. Her tarza uyumlu klasik tasarım.',
            ],
            [
                'name' => 'Taytüyü Koltuk Kumaşı',
                'sku' => 'TYT-KLT-09',
                'price' => 320.00,
                'selling_price' => 300.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 80,
                'unit_id' => $unitMeter?->id,
                'unit_type' => 'length',
                'show_unit_pricing' => true,
                'categories' => ['DÖŞEMELİK', 'TAYTÜYÜ'],
                'brand' => 'Soft Touch',
                'tags' => ['Kadife', 'Döşemelik', 'Kolay Temizlenir', 'Koltuk Kılıfı'],
                'variations' => [
                    ['var' => $colorVar, 'pick' => ['Siyah', 'Beyaz', 'Gri', 'Bej', 'Kahverengi', 'Bordo', 'Lacivert', 'Krem']],
                ],
                'options' => [],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Kadife'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Polyester'],
                    ['attr' => $attrKumasEni, 'value' => '150 cm'],
                    ['attr' => $attrGramaj, 'value' => '400 gr/m²'],
                    ['attr' => $attrDesen, 'value' => 'Düz'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrKullanim, 'value' => 'Döşemelik'],
                    ['attr' => $attrYikama, 'value' => '30°C Yıkama'],
                ],
                'description' => 'Ekstra yumuşak taytüyü kumaş, özellikle koltuk ve sandalye döşemesi için ideal.',
                'short_description' => 'Ultra yumuşak taytüyü döşemelik kumaş. Konforlu ve şık koltuk kaplaması.',
            ],
            [
                'name' => 'Çiçekli Viskon Kumaş',
                'sku' => 'VSK-CCK-02',
                'price' => 180.00,
                'selling_price' => 180.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 1000,
                'unit_id' => $unitMeter?->id,
                'unit_type' => 'length',
                'show_unit_pricing' => true,
                'categories' => ['Giyim'],
                'brand' => 'Klasik Kumaş',
                'tags' => ['Viskon', 'Çiçekli', 'Ekonomik', 'Yıkanabilir'],
                'variations' => [],
                'options' => [],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Viskon'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Viskon'],
                    ['attr' => $attrKumasEni, 'value' => '140 cm'],
                    ['attr' => $attrGramaj, 'value' => '120 gr/m²'],
                    ['attr' => $attrDesen, 'value' => 'Çiçekli'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrKullanim, 'value' => 'Giyimlik'],
                    ['attr' => $attrYikama, 'value' => '30°C Yıkama'],
                    ['attr' => $attrUtuleme, 'value' => 'Düşük Isı'],
                ],
                'description' => 'Modern çiçek desenli viskon kumaş, elbise ve bluz dikimleri için mükemmel.',
                'short_description' => 'Çiçek desenli viskon kumaş. Elbise ve bluz dikimleri için ideal.',
            ],
            [
                'name' => 'Spor Ayakkabı',
                'sku' => 'AYK-SPR-01',
                'price' => 1500.00,
                'selling_price' => 1299.90,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 45,
                'unit_id' => $unitPair?->id,
                'unit_type' => 'pairs',
                'show_unit_pricing' => false,
                'categories' => ['Giyim'],
                'brand' => 'Modern Tekstil',
                'tags' => ['Modern', 'Spor'],
                'variations' => [
                    ['var' => $shoeNumVar, 'pick' => ['38', '39', '40', '41', '42', '43', '44']],
                ],
                'options' => [],
                'attributes' => [
                    ['attr' => $attrCinsiyet, 'value' => 'Unisex'],
                    ['attr' => $attrMevsim, 'value' => '4 Mevsim'],
                    ['attr' => $attrStil, 'value' => 'Spor'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                ],
                'description' => 'Modern tasarım spor ayakkabı, günlük kullanım ve hafif spor aktiviteleri için uygun.',
                'short_description' => 'Konforlu spor ayakkabı. Günlük kullanım ve hafif spor için ideal.',
            ],
            [
                'name' => 'İsme Özel Havlu Seti',
                'sku' => 'HVL-OZL-01',
                'price' => 400.00,
                'selling_price' => 400.00,
                'image_count' => 3,
                'status' => 'published',
                'qty' => 200,
                'unit_id' => $unitPack?->id,
                'unit_type' => 'sets',
                'show_unit_pricing' => false,
                'categories' => ['Ev Tekstili', 'YATAK ÖRTÜSÜ'],
                'brand' => 'Evim Home',
                'tags' => ['Pamuk', 'Havlu', 'Yıkanabilir', 'Antibakteriyel'],
                'variations' => [
                    ['var' => $colorVar, 'pick' => ['Beyaz', 'Bej', 'Gri', 'Pembe', 'Mavi', 'Yeşil']],
                ],
                'options' => ['gift', 'name'],
                'attributes' => [
                    ['attr' => $attrKumasTipi, 'value' => 'Pamuk'],
                    ['attr' => $attrKumasKarisimi, 'value' => '%100 Pamuk'],
                    ['attr' => $attrGramaj, 'value' => '500 gr/m²'],
                    ['attr' => $attrMensei, 'value' => 'Türkiye'],
                    ['attr' => $attrKullanim, 'value' => 'Havlu'],
                    ['attr' => $attrYikama, 'value' => '60°C Yıkama'],
                ],
                'description' => 'Kişiye özel havlu seti, isim baskısı seçeneği ile anlamlı hediye.',
                'short_description' => 'İsme özel havlu seti. Anlamlı hediye seçeneği, kişiye özel isim baskısı.',
            ],
        ];

        $optionMap = [
            'gift' => $giftOpt,
            'warranty' => $warrantyOpt,
            'name' => $nameOpt,
            'install' => $installOpt,
        ];

        foreach ($products as $pData) {
            $brandId = $brands->where('name', $pData['brand'])->first()?->id;

            $catIds = [];
            foreach ($pData['categories'] ?? [] as $catName) {
                $cat = $categories->where('name', $catName)->first();
                if ($cat) $catIds[] = $cat->id;
            }

            $product = Product::create([
                'name' => $pData['name'],
                'slug' => Str::slug($pData['name']) . '-' . Str::random(6),
                'sku' => $pData['sku'],
                'price' => $pData['price'],
                'selling_price' => $pData['selling_price'],
                'status' => $pData['status'],
                'qty' => $pData['qty'] ?? 0,
                'unit_type' => $pData['unit_type'] ?? null,
                'show_unit_pricing' => $pData['show_unit_pricing'] ?? false,
                'sale_unit_id' => $pData['unit_id'] ?? null,
                'brand_id' => $brandId,
                'description' => $pData['description'],
                'short_description' => $pData['short_description'],
                'is_active' => $pData['status'] === 'published',
                'in_stock' => ($pData['qty'] ?? 0) > 0,
            ]);

            // Kategoriler
            if (!empty($catIds)) {
                $catSync = [];
                foreach ($catIds as $i => $cid) {
                    $catSync[$cid] = ['is_primary' => $i === 0, 'position' => $i];
                }
                $product->categories()->sync($catSync);
            }

            // Etiketler (Tags)
            $tagIds = [];
            foreach ($pData['tags'] ?? [] as $tagName) {
                $tag = $tags->where('name', $tagName)->first();
                if ($tag) $tagIds[] = $tag->id;
            }
            if (!empty($tagIds)) {
                $product->tags()->sync($tagIds);
            }

            // Özellikler (Attributes)
            foreach ($pData['attributes'] ?? [] as $attrDef) {
                $attr = $attrDef['attr'];
                if (!$attr) continue;
                $attrValue = $allAttrValues->where('attribute_id', $attr->id)->where('value', $attrDef['value'])->first();
                if (!$attrValue) continue;

                $paId = DB::table('product_attributes')->insertGetId([
                    'product_id' => $product->id,
                    'attribute_id' => $attr->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('product_attribute_values')->insert([
                    'product_attribute_id' => $paId,
                    'attribute_value_id' => $attrValue->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Ürün Görselleri
            $imgCount = $pData['image_count'] ?? 3;
            for ($i = 0; $i < $imgCount && $seedImageCount > 0; $i++) {
                $imgPath = $seedImages[$seedImageIndex % $seedImageCount];
                $seedImageIndex++;
                $this->attachSeedImage($product->id, null, 'product', $imgPath, $i);
            }

            // Varyantlar
            if (!empty($pData['variations'])) {
                $this->attachVariants($product, $pData['variations'], $seedImages, $seedImageCount);
            }

            // Seçenekler (Options)
            foreach ($pData['options'] ?? [] as $optKey) {
                $opt = $optionMap[$optKey] ?? null;
                if ($opt) $this->cloneOptionToProduct($product, $opt);
            }
        }
    }

    private function attachVariants(Product $product, array $variationDefs, array $seedImages = [], int $seedImageCount = 0): void
    {
        $variationsData = [];
        foreach ($variationDefs as $index => $def) {
            $variation = $def['var'];
            if (!$variation) continue;

            $product->variations()->attach($variation->id, ['position' => $index]);

            $pickedLabels = $def['pick'] ?? [];
            if (empty($pickedLabels)) {
                $values = $variation->values->toArray();
            } else {
                $values = $variation->values->filter(function ($v) use ($pickedLabels) {
                    return in_array($v->label, $pickedLabels);
                })->values()->toArray();
            }

            if (!empty($values)) {
                $variationsData[] = $values;
            }
        }

        if (empty($variationsData)) return;

        $combinations = $this->cartesian($variationsData);
        $basePrice = (float) $product->price;
        $baseSellingPrice = (float) ($product->selling_price ?? $product->price);
        $totalCombinations = count($combinations);

        foreach ($combinations as $index => $combo) {
            if (!is_array($combo)) $combo = [$combo];

            // UIDS: numeric value IDs sorted and joined with dots
            $valueIds = array_map(fn($item) => (int) $item['id'], $combo);
            sort($valueIds);
            $uids = implode('.', $valueIds);

            $names = array_map(fn($item) => $item['label'], $combo);
            $variantName = implode(' / ', $names);

            $valuesArray = array_map(fn($item) => [
                'id' => (int) $item['id'],
                'label' => $item['label'],
                'variationId' => (int) $item['variation_id'],
                'valueId' => (int) $item['id'],
                'color' => $item['color'] ?? null,
                'image' => $item['image'] ?? null,
                'position' => $item['position'] ?? 0,
            ], $combo);

            // Gerçekçi fiyat varyasyonu: beden/boyut büyüdükçe fiyat artar
            $priceMultiplier = 1.0 + ($index * 0.02); // her varyant %2 artış
            $variantPrice = round($basePrice * $priceMultiplier, 2);
            $variantSellingPrice = round($baseSellingPrice * $priceMultiplier, 2);

            // Bazı varyantlara indirim uygula
            $hasDiscount = rand(1, 5) === 1; // %20 ihtimalle indirimli
            $specialPrice = $hasDiscount ? round($variantSellingPrice * 0.85, 2) : null;

            // Gerçekçi stok: bazıları düşük, bazıları yüksek, bazıları 0
            $stockRoll = rand(1, 100);
            if ($stockRoll <= 5) {
                $qty = 0; // %5 stokta yok
            } elseif ($stockRoll <= 20) {
                $qty = rand(1, 5); // %15 düşük stok
            } elseif ($stockRoll <= 60) {
                $qty = rand(10, 50); // %40 normal stok
            } else {
                $qty = rand(50, 200); // %40 yüksek stok
            }

            // SKU: ürün SKU + varyant kısa kodu
            $skuSuffix = strtoupper(Str::slug(implode('-', array_map(fn($n) => mb_substr($n, 0, 3), $names)), '-'));
            $variantSku = $product->sku . '-' . $skuSuffix;

            $variant = \App\Models\ProductVariant::create([
                'product_id' => $product->id,
                'name' => $variantName,
                'uids' => $uids,
                'values' => $valuesArray,
                'sku' => $variantSku,
                'price' => $variantPrice,
                'selling_price' => $variantSellingPrice,
                'special_price' => $specialPrice,
                'special_price_type' => $specialPrice ? 'fixed' : null,
                'qty' => $qty,
                'in_stock' => $qty > 0,
                'is_active' => true,
                'is_default' => $index === 0,
                'position' => $index,
            ]);

            // Varyant görseli: seed-images'dan döngüsel olarak ata
            if ($seedImageCount > 0) {
                $imgPath = $seedImages[$index % $seedImageCount];
                $this->attachSeedImage($product->id, $variant->id, 'variant', $imgPath, 0);
            }
        }
    }

    private function cartesian(array $input): array
    {
        $result = [[]];
        foreach ($input as $key => $values) {
            $append = [];
            foreach ($result as $product) {
                foreach ($values as $item) {
                    $product[$key] = $item;
                    $append[] = $product;
                }
            }
            $result = $append;
        }
        return $result;
    }

    private function attachSeedImage(int $productId, ?int $variantId, string $scope, string $path, int $position): void
    {
        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $mime = match (strtolower($ext)) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/jpeg',
        };
        $size = 0;
        try { $size = Storage::disk('public')->size($path); } catch (\Throwable) {}

        \App\Models\Media::create([
            'disk' => 'public',
            'type' => 'image',
            'path' => $path,
            'thumb_path' => $path,
            'mime' => $mime,
            'size' => $size,
            'original_name' => basename($path),
            'alt' => null,
            'scope' => $scope,
            'product_id' => $productId,
            'product_variant_id' => $variantId,
            'position' => $position,
        ]);
    }

    private function cloneOptionToProduct(Product $product, $templateOption): void
    {
        $newOpt = $templateOption->replicate(['is_global', 'product_id', 'created_at', 'updated_at']);
        $newOpt->product_id = $product->id;
        $newOpt->is_global = false;
        $newOpt->save();

        foreach ($templateOption->values as $val) {
            $newVal = $val->replicate(['option_id', 'created_at', 'updated_at']);
            $newVal->option_id = $newOpt->id;
            $newVal->save();
        }
    }
}
