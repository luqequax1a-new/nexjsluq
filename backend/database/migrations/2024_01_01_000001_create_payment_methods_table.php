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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('enabled')->default(true);
            $table->json('settings')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
            
            $table->index(['enabled', 'position']);
        });

        // Insert default payment methods
        DB::table('payment_methods')->insert([
            [
                'name' => 'Kapıda Ödeme',
                'code' => 'cash_on_delivery',
                'description' => 'Teslimat sırasında nakit ödeme',
                'enabled' => true,
                'position' => 1,
                'settings' => json_encode([
                    'fee_operation' => 'add',
                    'fee_type' => 'fixed',
                    'fee_amount' => 0,
                    'fee_percentage' => 0,
                    'min_amount' => 0,
                    'max_amount' => 0,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Havale / EFT',
                'code' => 'bank_transfer',
                'description' => 'Banka havalesi ile ödeme',
                'enabled' => true,
                'position' => 2,
                'settings' => json_encode([
                    'fee_operation' => 'add',
                    'fee_type' => 'fixed',
                    'fee_amount' => 0,
                    'fee_percentage' => 0,
                    'min_amount' => 0,
                    'max_amount' => 0,
                    'bank_info' => '',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Kredi Kartı',
                'code' => 'credit_card',
                'description' => 'Kredi kartı ile online ödeme',
                'enabled' => false,
                'position' => 3,
                'settings' => json_encode([
                    'fee_operation' => 'add',
                    'fee_type' => 'percentage',
                    'fee_amount' => 0,
                    'fee_percentage' => 2.5,
                    'min_amount' => 0,
                    'max_amount' => 0,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
