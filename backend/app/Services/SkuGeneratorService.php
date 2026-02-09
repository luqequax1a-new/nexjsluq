<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Support\Str;

class SkuGeneratorService
{
    private const MAX_SKU_LENGTH = 64;

    // ─── Format constants ───
    public const FORMAT_DIGITS        = 'digits';
    public const FORMAT_DIGITS_LETTERS = 'digits_letters';
    public const FORMAT_CUSTOM        = 'custom';

    // ─── Variant format constants ───
    public const VARIANT_FORMAT_DISABLED = '';
    public const VARIANT_FORMAT_REGULAR  = 'regular';
    public const VARIANT_FORMAT_PRODUCT  = 'product';

    // ─── Variant suffix constants ───
    public const VARIANT_SUFFIX_ID       = '';
    public const VARIANT_SUFFIX_NAME     = 'name';
    public const VARIANT_SUFFIX_NAME_NUM = 'name_num';

    // ─── Settings keys ───
    private const KEY_FORMAT             = 'sku_format';
    private const KEY_DIGITS_MIN_LEN     = 'sku_digits_min_length';
    private const KEY_DIGITS_PREFIX      = 'sku_digits_prefix';
    private const KEY_DL_MIN_LEN         = 'sku_digits_letters_min_length';
    private const KEY_DL_PREFIX          = 'sku_digits_letters_prefix';
    private const KEY_DL_UPPERCASE       = 'sku_digits_letters_uppercase';
    private const KEY_CUSTOM_TEMPLATE    = 'sku_custom_template';
    private const KEY_VARIANT_FORMAT     = 'sku_variant_format';
    private const KEY_VARIANT_SUFFIX     = 'sku_variant_suffix';
    private const KEY_PRODUCT_SEPARATOR   = 'sku_product_separator';
    private const KEY_AUTO_GENERATE      = 'sku_auto_generate';
    private const KEY_AUTO_REGEN         = 'sku_auto_regenerate';
    private const KEY_VARIANT_SEPARATOR  = 'sku_variant_separator';

    // ─── Order reference settings keys ───
    private const KEY_ORDER_PREFIX       = 'order_ref_prefix';
    private const KEY_ORDER_YEAR         = 'order_ref_year';
    private const KEY_ORDER_MIN_DIGITS   = 'order_ref_min_digits';
    private const KEY_ORDER_FORMAT       = 'order_ref_format';
    private const KEY_ORDER_SEPARATOR    = 'order_ref_separator';

    /**
     * All settings keys used by the SKU generator with their defaults.
     */
    public static function settingsDefaults(): array
    {
        return [
            self::KEY_FORMAT             => self::FORMAT_DIGITS,
            self::KEY_DIGITS_MIN_LEN     => '5',
            self::KEY_DIGITS_PREFIX      => '',
            self::KEY_DL_MIN_LEN         => '5',
            self::KEY_DL_PREFIX          => '',
            self::KEY_DL_UPPERCASE       => '1',
            self::KEY_CUSTOM_TEMPLATE    => '{prefix}-{name}-{d:4}',
            self::KEY_PRODUCT_SEPARATOR   => '-',
            self::KEY_VARIANT_FORMAT     => self::VARIANT_FORMAT_PRODUCT,
            self::KEY_VARIANT_SUFFIX     => self::VARIANT_SUFFIX_NAME,
            self::KEY_VARIANT_SEPARATOR  => '-',
            self::KEY_AUTO_GENERATE      => '1',
            self::KEY_AUTO_REGEN         => '0',

            // Order reference defaults
            self::KEY_ORDER_PREFIX       => 'SIP',
            self::KEY_ORDER_YEAR         => '1',
            self::KEY_ORDER_MIN_DIGITS   => '5',
            self::KEY_ORDER_FORMAT       => 'sequential',
            self::KEY_ORDER_SEPARATOR    => '-',
        ];
    }

    /**
     * Return all current SKU settings (merged with defaults).
     */
    public function getSettings(): array
    {
        $defaults = self::settingsDefaults();
        $keys = array_keys($defaults);

        $stored = Setting::query()
            ->whereIn('key', $keys)
            ->pluck('value', 'key')
            ->toArray();

        $result = [];
        foreach ($defaults as $key => $default) {
            $result[$key] = array_key_exists($key, $stored) ? (string) $stored[$key] : $default;
        }

        return $result;
    }

    // ─── Product SKU generation ───

    public function generateProductSku(
        ?string $name = null,
        ?int $excludeProductId = null,
        ?int $excludeVariantId = null
    ): string {
        $settings = $this->getSettings();
        $format = $settings[self::KEY_FORMAT];

        $base = match ($format) {
            self::FORMAT_DIGITS        => $this->buildDigits($settings, $name),
            self::FORMAT_DIGITS_LETTERS => $this->buildDigitsLetters($settings, $name),
            self::FORMAT_CUSTOM        => $this->buildCustom($settings, $name),
            default                    => $this->buildDigits($settings, $name),
        };

        if ($base === '') {
            $base = 'SKU';
        }

        return $this->makeUnique($base, $excludeProductId, $excludeVariantId);
    }

    /**
     * @param array<int, string> $valueLabels
     * @return array{sku: string, product_sku: string}
     */
    public function generateVariantSku(
        ?string $productSku = null,
        ?string $productName = null,
        ?string $variantName = null,
        array $valueLabels = [],
        ?int $excludeProductId = null,
        ?int $excludeVariantId = null
    ): array {
        $settings = $this->getSettings();
        $variantFormat = $settings[self::KEY_VARIANT_FORMAT];

        // Resolve product SKU
        $resolvedProductSku = $this->normalizeSegment((string) $productSku);
        if ($resolvedProductSku === '') {
            $resolvedProductSku = $this->generateProductSku($productName, $excludeProductId, $excludeVariantId);
        }

        // If variant generation is disabled
        if ($variantFormat === self::VARIANT_FORMAT_DISABLED) {
            return [
                'sku' => '',
                'product_sku' => $resolvedProductSku,
            ];
        }

        if ($variantFormat === self::VARIANT_FORMAT_PRODUCT) {
            // Product reference with suffix
            $variantSep = $settings[self::KEY_VARIANT_SEPARATOR] ?? '-';
            $suffix = $this->buildVariantSuffix($settings, $variantName, $valueLabels);
            $base = $resolvedProductSku . ($suffix !== '' ? $variantSep . $suffix : '');
        } else {
            // Regular: generate independently using the same format as product
            $variantLabel = $this->resolveVariantLabel($variantName, $valueLabels);
            $base = $this->generateProductSku($variantLabel, $excludeProductId, $excludeVariantId);

            return [
                'sku' => $base,
                'product_sku' => $resolvedProductSku,
            ];
        }

        $sku = $this->makeUnique($base, $excludeProductId, $excludeVariantId);

        return [
            'sku' => $sku,
            'product_sku' => $resolvedProductSku,
        ];
    }

    /**
     * Generate a preview (no uniqueness check).
     */
    public function preview(?string $name = null, ?array $settingsOverride = null): array
    {
        $settings = $settingsOverride ? array_merge($this->getSettings(), $settingsOverride) : $this->getSettings();
        $format = $settings[self::KEY_FORMAT];

        $productRef = match ($format) {
            self::FORMAT_DIGITS        => $this->buildDigits($settings, $name),
            self::FORMAT_DIGITS_LETTERS => $this->buildDigitsLetters($settings, $name),
            self::FORMAT_CUSTOM        => $this->buildCustom($settings, $name),
            default                    => $this->buildDigits($settings, $name),
        };

        if ($productRef === '') {
            $productRef = 'SKU';
        }

        $variantFormat = $settings[self::KEY_VARIANT_FORMAT];
        $variantRef = '';

        if ($variantFormat === self::VARIANT_FORMAT_PRODUCT) {
            $variantSep = $settings[self::KEY_VARIANT_SEPARATOR] ?? '-';
            $suffix = $this->buildVariantSuffix($settings, 'Kırmızı / XL', ['Kırmızı', 'XL']);
            $variantRef = $productRef . ($suffix !== '' ? $variantSep . $suffix : '');
        } elseif ($variantFormat === self::VARIANT_FORMAT_REGULAR) {
            $variantRef = match ($format) {
                self::FORMAT_DIGITS        => $this->buildDigits($settings, 'Kırmızı XL'),
                self::FORMAT_DIGITS_LETTERS => $this->buildDigitsLetters($settings, 'Kırmızı XL'),
                self::FORMAT_CUSTOM        => $this->buildCustom($settings, 'Kırmızı XL'),
                default                    => $this->buildDigits($settings, 'Kırmızı XL'),
            };
        }

        return [
            'product_sku' => $productRef,
            'variant_sku' => $variantRef,
        ];
    }

    // ─── Format builders ───

    private function buildDigits(array $settings, ?string $name, ?string $separatorOverride = null): string
    {
        $minLen = max(1, (int) ($settings[self::KEY_DIGITS_MIN_LEN] ?? 5));
        $prefix = $this->normalizeSegment($settings[self::KEY_DIGITS_PREFIX] ?? '');
        $sep = $separatorOverride ?? ($settings[self::KEY_PRODUCT_SEPARATOR] ?? '-');

        $random = $this->genRandomString('0123456789', $minLen);

        if ($prefix === '') {
            return $random;
        }

        return $prefix . $sep . $random;
    }

    private function buildDigitsLetters(array $settings, ?string $name, ?string $separatorOverride = null): string
    {
        $minLen = max(1, (int) ($settings[self::KEY_DL_MIN_LEN] ?? 5));
        $prefix = $this->normalizeSegment($settings[self::KEY_DL_PREFIX] ?? '');
        $uppercase = (bool) ($settings[self::KEY_DL_UPPERCASE] ?? true);
        $sep = $separatorOverride ?? ($settings[self::KEY_PRODUCT_SEPARATOR] ?? '-');

        $chars = '0123456789abcdefghijklmnopqrstuvwxyz';
        if ($uppercase) {
            $chars = strtoupper($chars);
        }

        $random = $this->genRandomString($chars, $minLen);

        if ($prefix === '') {
            return $random;
        }

        return $prefix . $sep . $random;
    }

    private function buildCustom(array $settings, ?string $name): string
    {
        $template = $settings[self::KEY_CUSTOM_TEMPLATE] ?? '{prefix}-{name}-{d:4}';
        $prefix = $this->normalizeSegment($settings[self::KEY_DIGITS_PREFIX] ?? '');

        $nameToken = $this->normalizeSegment((string) $name);
        if ($nameToken === '') {
            $nameToken = 'ITEM';
        }

        // Replace static placeholders
        $replacements = [
            '{prefix}' => $prefix !== '' ? $prefix : 'PRD',
            '{name}'   => $nameToken,
            '{NAME}'   => strtoupper($nameToken),
            '{year}'   => date('Y'),
            '{ye}'     => date('y'),
            '{month}'  => date('m'),
            '{day}'    => date('d'),
        ];

        $result = str_replace(array_keys($replacements), array_values($replacements), $template);

        // Replace dynamic codes: {d:N} = N random digits, {L:N} = N uppercase letters, {l:N} = N lowercase letters
        $result = preg_replace_callback('/\{([dDlL]):(\d+)\}/', function ($m) {
            $type = $m[1];
            $len = max(1, (int) $m[2]);
            return match ($type) {
                'd', 'D' => $this->genRandomString('0123456789', $len),
                'L'      => $this->genRandomString('ABCDEFGHIJKLMNOPQRSTUVWXYZ', $len),
                'l'      => $this->genRandomString('abcdefghijklmnopqrstuvwxyz', $len),
                default  => $m[0],
            };
        }, $result);

        // Clean up
        $result = $this->normalizeSegment($result);

        return $result;
    }

    // ─── Variant suffix ───

    private function buildVariantSuffix(array $settings, ?string $variantName, array $valueLabels): string
    {
        $suffixType = $settings[self::KEY_VARIANT_SUFFIX] ?? self::VARIANT_SUFFIX_NAME;

        if ($suffixType === self::VARIANT_SUFFIX_NAME) {
            // Use full variant name / value labels
            $label = $this->resolveVariantLabel($variantName, $valueLabels);
            return $this->normalizeSegment($label);
        }

        if ($suffixType === self::VARIANT_SUFFIX_NAME_NUM) {
            // Extract digits/abbreviation from variant name
            $label = $this->resolveVariantLabel($variantName, $valueLabels);
            return $this->makeNumeric($label);
        }

        // Default: use a sequential counter (simulated with random digits)
        return $this->genRandomString('0123456789', 3);
    }

    private function resolveVariantLabel(?string $variantName, array $valueLabels): string
    {
        $segments = [];
        foreach ($valueLabels as $label) {
            $normalized = $this->normalizeSegment((string) $label);
            if ($normalized !== '') {
                $segments[] = $normalized;
            }
        }

        if (!empty($segments)) {
            return implode('-', array_slice($segments, 0, 3));
        }

        $fromName = $this->normalizeSegment((string) $variantName);
        if ($fromName !== '') {
            return $fromName;
        }

        return 'VAR';
    }

    private function makeNumeric(string $label): string
    {
        $normalized = $this->normalizeSegment($label);
        if ($normalized === '') {
            return '0';
        }

        // If contains digits, extract them
        if (preg_match('/[0-9]/', $normalized)) {
            $parts = explode('-', $normalized);
            $result = [];
            foreach ($parts as $part) {
                if (preg_match('/[0-9]/', $part)) {
                    $result[] = preg_replace('/[^0-9]/', '', $part);
                } else {
                    $result[] = substr($part, 0, 2);
                }
            }
            return implode('-', array_filter($result));
        }

        // Otherwise abbreviate: first 2 chars of each segment
        $parts = explode('-', $normalized);
        $result = [];
        foreach ($parts as $part) {
            $result[] = substr($part, 0, 2);
        }
        return implode('-', $result);
    }

    // ─── Order reference generation ───

    /**
     * Generate a unique order number based on saved settings.
     */
    public function generateOrderNumber(?int $lastSequence = null, ?array $settingsOverride = null): string
    {
        $settings = $settingsOverride ? array_merge($this->getSettings(), $settingsOverride) : $this->getSettings();

        $prefix    = trim($settings[self::KEY_ORDER_PREFIX] ?? 'SIP');
        $useYear   = (bool) ($settings[self::KEY_ORDER_YEAR] ?? true);
        $minDigits = max(1, (int) ($settings[self::KEY_ORDER_MIN_DIGITS] ?? 5));
        $format    = $settings[self::KEY_ORDER_FORMAT] ?? 'sequential';
        $separator = $settings[self::KEY_ORDER_SEPARATOR] ?? '-';

        $parts = [];

        if ($prefix !== '') {
            $parts[] = $prefix;
        }

        if ($useYear) {
            $parts[] = date('Y');
        }

        if ($format === 'sequential') {
            $seq = ($lastSequence ?? 0) + 1;
            $parts[] = str_pad((string) $seq, $minDigits, '0', STR_PAD_LEFT);
        } elseif ($format === 'random_digits') {
            $parts[] = $this->genRandomString('0123456789', $minDigits);
        } elseif ($format === 'random_alphanumeric') {
            $parts[] = $this->genRandomString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', $minDigits);
        } else {
            $seq = ($lastSequence ?? 0) + 1;
            $parts[] = str_pad((string) $seq, $minDigits, '0', STR_PAD_LEFT);
        }

        return implode($separator, $parts);
    }

    /**
     * Build the order number prefix pattern for sequential lookup.
     */
    public function getOrderPrefixPattern(): string
    {
        $settings = $this->getSettings();

        $prefix    = trim($settings[self::KEY_ORDER_PREFIX] ?? 'SIP');
        $useYear   = (bool) ($settings[self::KEY_ORDER_YEAR] ?? true);
        $separator = $settings[self::KEY_ORDER_SEPARATOR] ?? '-';

        $parts = [];
        if ($prefix !== '') {
            $parts[] = $prefix;
        }
        if ($useYear) {
            $parts[] = date('Y');
        }

        return implode($separator, $parts) . $separator;
    }

    /**
     * Generate an order number preview (no DB lookup).
     */
    public function previewOrderNumber(?array $settingsOverride = null): string
    {
        return $this->generateOrderNumber(42, $settingsOverride);
    }

    // ─── Helpers ───

    private function genRandomString(string $characters, int $length): string
    {
        $string = '';
        $charLen = strlen($characters);
        for ($i = 0; $i < $length; $i++) {
            $string .= $characters[mt_rand(0, $charLen - 1)];
        }
        return $string;
    }

    private function getSetting(string $key, string $fallback): string
    {
        $value = Setting::query()->where('key', $key)->value('value');
        if (!is_string($value)) {
            return $fallback;
        }

        $trimmed = trim($value);

        return $trimmed !== '' ? $trimmed : $fallback;
    }

    private function normalizeSegment(string $value): string
    {
        $ascii = Str::of($value)
            ->ascii()
            ->upper()
            ->replaceMatches('/[^A-Z0-9]+/', '-')
            ->trim('-')
            ->toString();

        return preg_replace('/-+/', '-', $ascii) ?: '';
    }

    private function makeUnique(
        string $base,
        ?int $excludeProductId = null,
        ?int $excludeVariantId = null
    ): string {
        $normalizedBase = $this->normalizeSegment($base);
        if ($normalizedBase === '') {
            $normalizedBase = 'SKU';
        }

        $normalizedBase = $this->truncate($normalizedBase, self::MAX_SKU_LENGTH);

        $candidate = $normalizedBase;
        $counter = 2;

        while ($this->skuExists($candidate, $excludeProductId, $excludeVariantId)) {
            $suffix = '-' . $counter;
            $prefixMaxLen = max(1, self::MAX_SKU_LENGTH - strlen($suffix));
            $candidate = $this->truncate($normalizedBase, $prefixMaxLen) . $suffix;
            $counter++;

            // Fail-safe fallback for edge cases with very dense SKU space.
            if ($counter > 10000) {
                $randomSuffix = '-' . Str::upper(Str::random(4));
                $randomPrefixMaxLen = max(1, self::MAX_SKU_LENGTH - strlen($randomSuffix));
                $randomCandidate = $this->truncate($normalizedBase, $randomPrefixMaxLen) . $randomSuffix;

                if (!$this->skuExists($randomCandidate, $excludeProductId, $excludeVariantId)) {
                    return $randomCandidate;
                }
            }
        }

        return $candidate;
    }

    private function truncate(string $value, int $maxLength): string
    {
        if ($maxLength <= 0) {
            return '';
        }

        return strlen($value) > $maxLength
            ? substr($value, 0, $maxLength)
            : $value;
    }

    private function skuExists(
        string $sku,
        ?int $excludeProductId = null,
        ?int $excludeVariantId = null
    ): bool {
        $needle = Str::lower($sku);

        $productExists = Product::query()
            ->when(
                $excludeProductId !== null,
                fn ($q) => $q->where('id', '!=', $excludeProductId)
            )
            ->whereRaw('LOWER(sku) = ?', [$needle])
            ->exists();

        if ($productExists) {
            return true;
        }

        return ProductVariant::withTrashed()
            ->when(
                $excludeVariantId !== null,
                fn ($q) => $q->where('id', '!=', $excludeVariantId)
            )
            ->whereRaw('LOWER(sku) = ?', [$needle])
            ->exists();
    }
}
