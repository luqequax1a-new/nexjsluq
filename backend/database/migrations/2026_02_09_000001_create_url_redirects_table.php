<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('url_redirects', function (Blueprint $table) {
            $table->id();
            $table->string('source_path')->unique();
            $table->string('target_url');
            $table->string('target_type')->default('custom'); // custom, product, category, page
            $table->unsignedBigInteger('target_id')->nullable();
            $table->unsignedSmallInteger('status_code')->default(301); // 301 or 302
            $table->boolean('is_active')->default(true);
            $table->boolean('is_auto')->default(false); // otomatik oluşturulan (slug değişimi, silme)
            $table->timestamps();

            $table->index(['source_path', 'is_active']);
            $table->index('target_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('url_redirects');
    }
};
