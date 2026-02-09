<?php

namespace App\Services;

class PostalCodeResolver
{
    /**
     * Turkish province plate codes (01-81).
     *
     * @var array<string,int>
     */
    private const CITY_PLATE_CODES = [
        'adana' => 1,
        'adiyaman' => 2,
        'afyonkarahisar' => 3,
        'agri' => 4,
        'amasya' => 5,
        'ankara' => 6,
        'antalya' => 7,
        'artvin' => 8,
        'aydin' => 9,
        'balikesir' => 10,
        'bilecik' => 11,
        'bingol' => 12,
        'bitlis' => 13,
        'bolu' => 14,
        'burdur' => 15,
        'bursa' => 16,
        'canakkale' => 17,
        'cankiri' => 18,
        'corum' => 19,
        'denizli' => 20,
        'diyarbakir' => 21,
        'edirne' => 22,
        'elazig' => 23,
        'erzincan' => 24,
        'erzurum' => 25,
        'eskisehir' => 26,
        'gaziantep' => 27,
        'giresun' => 28,
        'gumushane' => 29,
        'hakkari' => 30,
        'hatay' => 31,
        'isparta' => 32,
        'mersin' => 33,
        'istanbul' => 34,
        'izmir' => 35,
        'kars' => 36,
        'kastamonu' => 37,
        'kayseri' => 38,
        'kirklareli' => 39,
        'kirsehir' => 40,
        'kocaeli' => 41,
        'konya' => 42,
        'kutahya' => 43,
        'malatya' => 44,
        'manisa' => 45,
        'kahramanmaras' => 46,
        'mardin' => 47,
        'mugla' => 48,
        'mus' => 49,
        'nevsehir' => 50,
        'nigde' => 51,
        'ordu' => 52,
        'rize' => 53,
        'sakarya' => 54,
        'samsun' => 55,
        'siirt' => 56,
        'sinop' => 57,
        'sivas' => 58,
        'tekirdag' => 59,
        'tokat' => 60,
        'trabzon' => 61,
        'tunceli' => 62,
        'sanliurfa' => 63,
        'usak' => 64,
        'van' => 65,
        'yozgat' => 66,
        'zonguldak' => 67,
        'aksaray' => 68,
        'bayburt' => 69,
        'karaman' => 70,
        'kirikkale' => 71,
        'batman' => 72,
        'sirnak' => 73,
        'bartin' => 74,
        'ardahan' => 75,
        'igdir' => 76,
        'yalova' => 77,
        'karabuk' => 78,
        'kilis' => 79,
        'osmaniye' => 80,
        'duzce' => 81,
    ];

    public static function resolve(?string $city, ?string $district = null): ?string
    {
        $normalizedCity = self::normalize($city);
        if ($normalizedCity === '') {
            return null;
        }

        $plateCode = self::CITY_PLATE_CODES[$normalizedCity] ?? ((abs(crc32($normalizedCity)) % 81) + 1);
        $normalizedDistrict = self::normalize($district);
        $districtSeed = $normalizedCity . '|' . ($normalizedDistrict !== '' ? $normalizedDistrict : 'merkez');
        $districtCode = (abs(crc32($districtSeed)) % 900) + 100;

        return sprintf('%02d%03d', $plateCode, $districtCode);
    }

    private static function normalize(?string $value): string
    {
        $input = trim((string) ($value ?? ''));
        if ($input === '') {
            return '';
        }

        $map = [
            'ç' => 'c', 'Ç' => 'c',
            'ğ' => 'g', 'Ğ' => 'g',
            'ı' => 'i', 'İ' => 'i',
            'ö' => 'o', 'Ö' => 'o',
            'ş' => 's', 'Ş' => 's',
            'ü' => 'u', 'Ü' => 'u',
        ];

        $normalized = strtr($input, $map);
        $normalized = mb_strtolower($normalized, 'UTF-8');
        $normalized = preg_replace('/[^a-z0-9]+/u', ' ', $normalized) ?? '';
        $normalized = trim(preg_replace('/\s+/', ' ', $normalized) ?? '');

        return str_replace(' ', '', $normalized);
    }
}
