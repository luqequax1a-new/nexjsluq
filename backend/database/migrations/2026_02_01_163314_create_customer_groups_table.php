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
        // Customer Groups table
        Schema::create('customer_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('discount_percentage', 5, 2)->default(0); // Group-wide discount
            $table->json('auto_assignment_rules')->nullable(); // Rules for auto-assigning customers
            $table->boolean('is_active')->default(true);
            $table->integer('customer_count')->default(0); // Cached count
            $table->timestamps();
        });

        // Pivot table: customer_customer_group
        Schema::create('customer_customer_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_group_id')->constrained()->cascadeOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();
            
            $table->unique(['customer_id', 'customer_group_id']);
        });

        // Update coupon_customer_groups pivot (if not exists)
        if (!Schema::hasTable('coupon_customer_groups')) {
            Schema::create('coupon_customer_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
                $table->foreignId('customer_group_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
                
                $table->unique(['coupon_id', 'customer_group_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coupon_customer_groups');
        Schema::dropIfExists('customer_customer_group');
        Schema::dropIfExists('customer_groups');
    }
};
