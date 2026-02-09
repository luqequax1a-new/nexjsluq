<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Customers table - müşteri bilgileri
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->string('tax_number')->nullable(); // Vergi numarası
            $table->string('tax_office')->nullable(); // Vergi dairesi
            $table->enum('group', ['normal', 'vip', 'wholesale'])->default('normal'); // Müşteri grubu
            $table->decimal('total_spent', 12, 2)->default(0); // Toplam harcama
            $table->integer('total_orders')->default(0); // Toplam sipariş sayısı
            $table->timestamp('last_order_at')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('accepts_marketing')->default(false); // Pazarlama izni
            $table->timestamps();
            $table->softDeletes();

            $table->index(['email', 'phone']);
            $table->index('group');
        });

        // Customer addresses - müşteri adresleri
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable(); // "Ev", "İş" gibi
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->text('address_line_1');
            $table->text('address_line_2')->nullable();
            $table->string('city');
            $table->string('state')->nullable(); // İlçe
            $table->string('postal_code')->nullable();
            $table->string('country')->default('TR');
            $table->boolean('is_default_billing')->default(false);
            $table->boolean('is_default_shipping')->default(false);
            $table->timestamps();

            $table->index('customer_id');
        });

        // Orders table - ana sipariş tablosu
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // SIP-2026-00001
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Siparişi oluşturan admin
            
            // Durum
            $table->enum('status', [
                'pending',      // Beklemede
                'confirmed',    // Onaylandı
                'processing',   // Hazırlanıyor
                'shipped',      // Kargoya verildi
                'delivered',    // Teslim edildi
                'cancelled',    // İptal edildi
                'refunded',     // İade edildi
            ])->default('pending');
            
            // Ödeme durumu
            $table->enum('payment_status', [
                'pending',      // Ödeme bekleniyor
                'paid',         // Ödendi
                'failed',       // Başarısız
                'refunded',     // İade edildi
                'partial_refund', // Kısmi iade
            ])->default('pending');
            
            $table->string('payment_method')->nullable(); // Havale, Kredi Kartı, Kapıda Ödeme
            $table->string('payment_reference')->nullable(); // Ödeme referansı
            
            // Fiyatlar
            $table->decimal('subtotal', 12, 2)->default(0); // Ara toplam
            $table->decimal('tax_total', 12, 2)->default(0); // KDV toplamı
            $table->decimal('shipping_total', 12, 2)->default(0); // Kargo ücreti
            $table->decimal('discount_total', 12, 2)->default(0); // İndirim toplamı
            $table->decimal('grand_total', 12, 2)->default(0); // Genel toplam
            
            $table->string('currency_code', 3)->default('TRY');
            $table->decimal('currency_rate', 10, 4)->default(1); // Döviz kuru
            
            // Kupon
            $table->string('coupon_code')->nullable();
            $table->decimal('coupon_discount', 12, 2)->default(0);
            
            // Kargo bilgileri
            $table->string('shipping_method')->nullable();
            $table->string('shipping_tracking_number')->nullable();
            $table->string('shipping_carrier')->nullable(); // Aras, Yurtiçi, MNG vb.
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            
            // Notlar
            $table->text('customer_note')->nullable(); // Müşteri notu
            $table->text('admin_note')->nullable(); // Admin notu
            
            // Fatura bilgileri
            $table->string('invoice_number')->nullable();
            $table->timestamp('invoiced_at')->nullable();
            
            // Kaynak
            $table->string('source')->default('admin'); // admin, web, mobile, api
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['status', 'payment_status']);
            $table->index('customer_id');
            $table->index('order_number');
            $table->index('created_at');
        });

        // Order items - sipariş kalemleri
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            
            // Ürün bilgileri (sipariş anındaki snapshot)
            $table->string('name');
            $table->string('sku')->nullable();
            $table->json('options')->nullable(); // Varyant seçenekleri {"Renk": "Kırmızı", "Beden": "M"}
            $table->json('offer_data')->nullable(); // {offer_id, offer_name, original_price, discount_amount, discount_type}
            $table->string('image')->nullable(); // Ürün görseli
            
            // Fiyat ve miktar
            $table->decimal('unit_price', 12, 2); // Birim fiyat
            $table->decimal('quantity', 10, 3); // Miktar
            $table->string('unit_label')->default('Adet'); // Birim etiketi
            
            // Vergi
            $table->decimal('tax_rate', 5, 2)->default(0); // KDV oranı %
            $table->decimal('tax_amount', 12, 2)->default(0); // KDV tutarı
            
            // İndirim
            $table->decimal('discount_amount', 12, 2)->default(0);
            
            // Toplam
            $table->decimal('line_total', 12, 2); // Satır toplamı (qty * unit_price - discount + tax)
            
            // İade durumu
            $table->decimal('refunded_quantity', 10, 3)->default(0);
            $table->decimal('refunded_amount', 12, 2)->default(0);
            
            $table->timestamps();
            
            $table->index('order_id');
            $table->index('product_id');
        });

        // Order addresses - sipariş adresleri (snapshot)
        Schema::create('order_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['billing', 'shipping']);
            
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('company')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('tax_office')->nullable();
            $table->text('address_line_1');
            $table->text('address_line_2')->nullable();
            $table->string('city');
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->default('TR');
            
            $table->timestamps();
            
            $table->index(['order_id', 'type']);
        });

        // Order history - sipariş geçmişi (durum değişiklikleri)
        Schema::create('order_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('status')->nullable(); // Yeni durum
            $table->string('payment_status')->nullable();
            $table->string('action'); // status_change, note_added, payment_received, shipped, etc.
            $table->text('note')->nullable();
            $table->json('meta')->nullable(); // Ek bilgiler
            
            $table->boolean('is_customer_notified')->default(false);
            
            $table->timestamps();
            
            $table->index('order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_histories');
        Schema::dropIfExists('order_addresses');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('customer_addresses');
        Schema::dropIfExists('customers');
    }
};
