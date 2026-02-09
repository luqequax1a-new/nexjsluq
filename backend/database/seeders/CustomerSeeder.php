<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'first_name' => 'Ahmet',
                'last_name' => 'Yılmaz',
                'email' => 'ahmet@example.com',
                'phone' => '05321112233',
                'group' => 'normal',
                'addresses' => [
                    [
                        'title' => 'Ev Adresim',
                        'first_name' => 'Ahmet',
                        'last_name' => 'Yılmaz',
                        'phone' => '05321112233',
                        'address_line_1' => 'Atatürk Mah. Karanfil Sok. No:5 D:2',
                        'city' => 'İstanbul',
                        'state' => 'Ümraniye',
                        'postal_code' => '34764',
                        'country' => 'TR',
                        'is_default_shipping' => true,
                        'is_default_billing' => true,
                    ]
                ]
            ],
            [
                'first_name' => 'Mehmet',
                'last_name' => 'Demir',
                'email' => 'mehmet@corp.com',
                'phone' => '02123334455',
                'company' => 'Demir Tekstil Ltd. Şti.',
                'tax_number' => '1234567890',
                'tax_office' => 'Marmara Kurumlar',
                'group' => 'wholesale',
                'is_active' => true,
                'addresses' => [
                    [
                        'title' => 'Ofis',
                        'first_name' => 'Mehmet',
                        'last_name' => 'Demir',
                        'phone' => '02123334455',
                        'company' => 'Demir Tekstil Ltd. Şti.',
                        'address_line_1' => 'Tekstilkent A3 Blok No:45',
                        'city' => 'İstanbul',
                        'state' => 'Esenler',
                        'postal_code' => '34235',
                        'country' => 'TR',
                        'is_default_shipping' => true,
                        'is_default_billing' => true,
                    ]
                ]
            ],
            [
                'first_name' => 'Ayşe',
                'last_name' => 'Kaya',
                'email' => 'ayse@gmail.com',
                'phone' => '05445556677',
                'group' => 'vip',
                'is_active' => true,
                'addresses' => [
                    [
                        'title' => 'Yazlık',
                        'first_name' => 'Ayşe',
                        'last_name' => 'Kaya',
                        'phone' => '05445556677',
                        'address_line_1' => 'Alaçatı Mah. 1200. Sok. No:12',
                        'city' => 'İzmir',
                        'state' => 'Çeşme',
                        'postal_code' => '35930',
                        'country' => 'TR',
                        'is_default_shipping' => true,
                        'is_default_billing' => true,
                    ]
                ]
            ]
        ];

        foreach ($customers as $customerData) {
            $addresses = $customerData['addresses'] ?? [];
            unset($customerData['addresses']);
            
            $customer = Customer::create($customerData);
            
            foreach ($addresses as $addressData) {
                $customer->addresses()->create($addressData);
            }
        }
    }
}
