<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            'Pamuk',
            'Polyester',
            'Keten',
            'İpek',
            'Kadife',
            'Viskon',
            'Saten',
            'Şifon',
            'Jakarlı',
            'Desenli',
            'Düz Renk',
            'Çizgili',
            'Çiçekli',
            'Geometrik',
            'Modern',
            'Klasik',
            'Vintage',
            'Minimalist',
            'Lüks',
            'Ekonomik',
            'Yıkanabilir',
            'Antibakteriyel',
            'Su Geçirmez',
            'Güneş Geçirmez',
            'Ateş Geciktirici',
            'Anti-Statik',
            'Kolay Temizlenir',
            'Döşemelik',
            'Perdelik',
            'Yatak Örtüsü',
            'Koltuk Kılıfı',
            'Yastık',
            'Runner',
            'Masa Örtüsü',
            'Havlu',
        ];

        foreach ($tags as $tag) {
            DB::table('tags')->insert([
                'name' => $tag,
                'normalized_name' => strtolower(str_replace(' ', '-', $tag)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
