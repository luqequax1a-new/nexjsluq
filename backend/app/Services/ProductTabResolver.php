<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductTab;
use Illuminate\Support\Str;

class ProductTabResolver
{
    /**
     * Returns active tabs applicable to the given product.
     *
     * Conditions schema (stored in product_tabs.conditions):
     * - match: "any" | "all"  (default: "any")
     * - product_ids: int[]
     * - category_ids: int[]
     * - tag_names: string[]
     * - category_mode: "any" | "all" (default: "any")
     * - tag_mode: "any" | "all" (default: "any")
     */
    public function resolveForProduct(Product $product): array
    {
        $sanitizer = app(HtmlSanitizer::class);

        $productId = (int) $product->id;
        $categoryIds = $product->categories?->pluck('id')->map(fn ($x) => (int) $x)->all() ?? [];

        $productTagNormalizedNames = [];
        if ($product->relationLoaded('tags')) {
            $productTagNormalizedNames = $product->tags
                ->map(function ($t) {
                    $n = $t->normalized_name ?? null;
                    if (filled($n)) return (string) $n;
                    return (string) Str::of((string) ($t->name ?? ''))->lower()->squish()->value();
                })
                ->filter()
                ->values()
                ->all();
        }

        $tabs = ProductTab::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $out = [];
        foreach ($tabs as $tab) {
            if ($this->matches($tab->conditions ?? null, $productId, $categoryIds, $productTagNormalizedNames)) {
                $out[] = [
                    'id' => $tab->id,
                    'title' => $tab->title,
                    'content_html' => $sanitizer->sanitize($tab->content_html),
                    'position' => $tab->position,
                ];
            }
        }

        return $out;
    }

    private function matches($conditions, int $productId, array $categoryIds, array $productTagNormalizedNames): bool
    {
        if (!is_array($conditions) || empty($conditions)) {
            return true; // no conditions => applies to all
        }

        $match = ($conditions['match'] ?? 'any') === 'all' ? 'all' : 'any';

        $productIds = array_values(array_filter(array_map('intval', (array) ($conditions['product_ids'] ?? [])), fn ($x) => $x > 0));
        $categoryIdsRule = array_values(array_filter(array_map('intval', (array) ($conditions['category_ids'] ?? [])), fn ($x) => $x > 0));
        $tagNamesRule = array_values(array_filter(array_map('strval', (array) ($conditions['tag_names'] ?? [])), fn ($x) => trim($x) !== ''));

        $categoryMode = ($conditions['category_mode'] ?? 'any') === 'all' ? 'all' : 'any';
        $tagMode = ($conditions['tag_mode'] ?? 'any') === 'all' ? 'all' : 'any';

        $checks = [];

        if (count($productIds) > 0) {
            $checks[] = in_array($productId, $productIds, true);
        }

        if (count($categoryIdsRule) > 0) {
            $checks[] = $this->listMatches($categoryMode, $categoryIdsRule, $categoryIds);
        }

        if (count($tagNamesRule) > 0) {
            $normalizedRule = array_values(array_unique(array_map(function ($n) {
                return (string) Str::of((string) $n)->lower()->squish()->value();
            }, $tagNamesRule)));

            $checks[] = $this->listMatches($tagMode, $normalizedRule, $productTagNormalizedNames);
        }

        if (count($checks) === 0) {
            return true; // empty rules => applies to all
        }

        if ($match === 'all') {
            foreach ($checks as $ok) {
                if (!$ok) return false;
            }
            return true;
        }

        // any
        foreach ($checks as $ok) {
            if ($ok) return true;
        }
        return false;
    }

    private function listMatches(string $mode, array $ruleList, array $productList): bool
    {
        if (count($ruleList) === 0) return true;
        if (count($productList) === 0) return false;

        $productSet = array_flip($productList);

        if ($mode === 'all') {
            foreach ($ruleList as $item) {
                if (!isset($productSet[$item])) return false;
            }
            return true;
        }

        foreach ($ruleList as $item) {
            if (isset($productSet[$item])) return true;
        }
        return false;
    }
}
