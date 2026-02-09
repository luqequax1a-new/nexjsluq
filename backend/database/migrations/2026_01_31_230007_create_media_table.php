<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk')->default('public');
            $table->string('type');
            $table->string('path');
            $table->string('thumb_path')->nullable();
            $table->string('mime')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('sha1', 40)->nullable();
            $table->string('original_name')->nullable();
            $table->string('alt')->nullable();
            $table->string('scope');

            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();

            $table->integer('position')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['scope', 'type']);
            $table->index(['product_id', 'position']);
            $table->index(['product_variant_id', 'position']);
            $table->index(['created_by']);
            $table->index(['sha1']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
