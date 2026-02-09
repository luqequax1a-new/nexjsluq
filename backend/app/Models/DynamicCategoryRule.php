<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DynamicCategoryRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'match_type',
        'rules',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'rules' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function matchesProduct(Product $product): bool
    {
        if (empty($this->rules)) {
            return false;
        }

        $results = [];

        foreach ($this->rules as $rule) {
            $condition = $rule['condition'] ?? null;
            $method = $rule['method'] ?? 'contains';
            $values = $rule['values'] ?? [];

            $matches = $this->evaluateRule($product, $condition, $method, $values);
            $results[] = $matches;
        }

        if ($this->match_type === 'all') {
            return !in_array(false, $results, true);
        }

        return in_array(true, $results, true);
    }

    private function evaluateRule(Product $product, ?string $condition, string $method, array $values): bool
    {
        $result = false;

        switch ($condition) {
            case 'brand':
                $result = in_array($product->brand_id, $values);
                break;

            case 'price':
                $min = $values['min'] ?? null;
                $max = $values['max'] ?? null;
                $price = $product->discount_price ?? $product->price;

                if ($min !== null && $max !== null) {
                    $result = $price >= $min && $price <= $max;
                } elseif ($min !== null) {
                    $result = $price >= $min;
                } elseif ($max !== null) {
                    $result = $price <= $max;
                }
                break;

            case 'tag':
                $productTagIds = $product->tags->pluck('id')->toArray();
                $result = !empty(array_intersect($productTagIds, $values));
                break;

            case 'discount':
                $result = $product->discount_price !== null && $product->discount_price < $product->price;
                break;

            case 'created_date':
                $start = $values['start'] ?? null;
                $end = $values['end'] ?? null;

                if ($start && $end) {
                    $result = $product->created_at >= $start && $product->created_at <= $end;
                } elseif ($start) {
                    $result = $product->created_at >= $start;
                } elseif ($end) {
                    $result = $product->created_at <= $end;
                }
                break;

            case 'category':
                $productCategoryIds = $product->categories->pluck('id')->toArray();
                $result = !empty(array_intersect($productCategoryIds, $values));
                break;

            case 'stock':
                if (isset($values['in_stock'])) {
                    $result = $product->in_stock === $values['in_stock'];
                }
                break;
        }

        if ($method === 'not_contains') {
            $result = !$result;
        }

        return $result;
    }
}
