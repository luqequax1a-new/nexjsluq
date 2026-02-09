<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\StockNotifyRequest;
use App\Models\UrlRedirect;
use App\Mail\BackInStockMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ProductObserver
{
    /**
     * Ürün güncellendiğinde slug değiştiyse otomatik 301 redirect oluştur.
     */
    public function updating(Product $product): void
    {
        if ($product->isDirty('slug') && $product->getOriginal('slug')) {
            $oldSlug = $product->getOriginal('slug');
            $newSlug = $product->slug;

            if ($oldSlug !== $newSlug) {
                UrlRedirect::createRedirect(
                    "/urun/{$oldSlug}",
                    "/urun/{$newSlug}",
                    301,
                    true,
                    'product',
                    $product->id
                );
            }
        }
    }

    /**
     * Ürün silindiğinde (soft delete veya hard delete) ana sayfaya 301 redirect oluştur.
     * Veya status draft/inactive yapıldığında da redirect oluşturulabilir.
     */
    public function deleted(Product $product): void
    {
        if ($product->slug) {
            UrlRedirect::createRedirect(
                "/urun/{$product->slug}",
                "/",
                301,
                true,
                'product',
                $product->id
            );
        }
    }

    /**
     * Ürün kaydedildikten sonra stok durumu değiştiyse bildirim gönder.
     */
    public function updated(Product $product): void
    {
        // Stok durumu "yok" → "var" olduğunda bildirim gönder
        if ($product->wasChanged('in_stock') && $product->in_stock) {
            $this->sendBackInStockNotifications($product);
        }

        // qty 0'dan yukarı çıktığında da kontrol et
        if ($product->wasChanged('qty') && (float) $product->qty > 0 && (float) $product->getOriginal('qty') <= 0) {
            $this->sendBackInStockNotifications($product);
        }
    }

    private function sendBackInStockNotifications(Product $product): void
    {
        try {
            $pending = StockNotifyRequest::query()
                ->where('product_id', $product->id)
                ->whereNull('variant_id')
                ->whereNull('sent_at')
                ->get();

            if ($pending->isEmpty()) return;

            foreach ($pending->groupBy('email') as $email => $requests) {
                try {
                    Mail::to($email)->send(new BackInStockMail($product));

                    StockNotifyRequest::whereIn('id', $requests->pluck('id')->all())
                        ->update(['sent_at' => now()]);
                } catch (\Throwable $e) {
                    Log::error('[STOCK_NOTIFY] mail failed', [
                        'product_id' => $product->id,
                        'email' => $email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('[STOCK_NOTIFY] product observer error', ['error' => $e->getMessage()]);
        }
    }
}
