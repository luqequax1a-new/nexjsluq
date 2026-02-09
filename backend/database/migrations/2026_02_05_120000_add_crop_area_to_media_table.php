<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table): void {
            $table->float('crop_x')->nullable()->after('focal_y');
            $table->float('crop_y')->nullable()->after('crop_x');
            $table->float('crop_w')->nullable()->after('crop_y');
            $table->float('crop_h')->nullable()->after('crop_w');

            $table->index(['crop_x', 'crop_y']);
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table): void {
            $table->dropIndex(['crop_x', 'crop_y']);
            $table->dropColumn(['crop_x', 'crop_y', 'crop_w', 'crop_h']);
        });
    }
};

