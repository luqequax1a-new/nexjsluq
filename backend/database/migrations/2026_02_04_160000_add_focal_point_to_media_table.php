<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->float('focal_x')->nullable()->after('height');
            $table->float('focal_y')->nullable()->after('focal_x');
            $table->index(['focal_x', 'focal_y']);
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex(['focal_x', 'focal_y']);
            $table->dropColumn(['focal_x', 'focal_y']);
        });
    }
};

