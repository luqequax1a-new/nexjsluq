<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        Unit::query()->delete();

        $units = [
            [
                'name' => 'Metre',
                'label' => 'Metre',
                'short_name' => 'm',
                'suffix' => 'm',
                'quantity_prefix' => 'metre',
                'min' => 1,
                'max' => null,
                'step' => 0.5,
                'default_qty' => 1,
                'info_top' => 'Minimum 1 metre sipariş verilir',
                'info_bottom' => '0.5 metre ve katları şeklinde sipariş verebilirsiniz',
                'price_prefix' => '/ m',
                'stock_prefix' => 'm',
                'is_decimal_stock' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Adet',
                'label' => 'Adet',
                'short_name' => 'ad',
                'suffix' => 'Adet',
                'quantity_prefix' => 'adet',
                'min' => 1,
                'max' => null,
                'step' => 1,
                'default_qty' => 1,
                'info_top' => null,
                'info_bottom' => null,
                'price_prefix' => '/ ad',
                'stock_prefix' => 'adet',
                'is_decimal_stock' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Kilogram',
                'label' => 'Kilogram',
                'short_name' => 'kg',
                'suffix' => 'kg',
                'quantity_prefix' => 'kg',
                'min' => 0.5,
                'max' => null,
                'step' => 0.1,
                'default_qty' => 1,
                'info_top' => 'Minimum 0.5 kg sipariş verilir',
                'info_bottom' => '100 gram ve katları şeklinde sipariş verebilirsiniz',
                'price_prefix' => '/ kg',
                'stock_prefix' => 'kg',
                'is_decimal_stock' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Çift',
                'label' => 'Çift',
                'short_name' => 'çft',
                'suffix' => 'Çift',
                'quantity_prefix' => 'çift',
                'min' => 1,
                'max' => null,
                'step' => 1,
                'default_qty' => 1,
                'info_top' => null,
                'info_bottom' => null,
                'price_prefix' => '/ çift',
                'stock_prefix' => 'çift',
                'is_decimal_stock' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Paket',
                'label' => 'Paket',
                'short_name' => 'pkt',
                'suffix' => 'Paket',
                'quantity_prefix' => 'paket',
                'min' => 1,
                'max' => null,
                'step' => 1,
                'default_qty' => 1,
                'info_top' => null,
                'info_bottom' => null,
                'price_prefix' => '/ paket',
                'stock_prefix' => 'paket',
                'is_decimal_stock' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Top',
                'label' => 'Top',
                'short_name' => 'top',
                'suffix' => 'Top',
                'quantity_prefix' => 'top',
                'min' => 1,
                'max' => null,
                'step' => 1,
                'default_qty' => 1,
                'info_top' => '1 top = yaklaşık 10 metre',
                'info_bottom' => null,
                'price_prefix' => '/ top',
                'stock_prefix' => 'top',
                'is_decimal_stock' => false,
                'is_active' => true,
            ],
        ];

        foreach ($units as $unit) {
            Unit::create($unit);
        }
    }
}
