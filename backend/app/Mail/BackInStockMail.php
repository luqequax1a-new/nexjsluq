<?php

namespace App\Mail;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BackInStockMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Product $product;
    public ?ProductVariant $variant;

    public function __construct(Product $product, ?ProductVariant $variant = null)
    {
        $this->product = $product;
        $this->variant = $variant;
    }

    public function envelope(): Envelope
    {
        $storeName = config('app.name', 'Mağaza');

        return new Envelope(
            subject: "Müjde! Beklediğiniz Ürün Tekrar Stokta! - {$storeName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.back_in_stock',
        );
    }
}
