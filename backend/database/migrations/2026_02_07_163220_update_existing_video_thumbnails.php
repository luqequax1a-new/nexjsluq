<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing videos to use themselves as thumbnails
        DB::table('media')
            ->where('type', 'video')
            ->whereNull('thumb_path')
            ->update([
                'thumb_path' => DB::raw('path')
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally revert
        DB::table('media')
            ->where('type', 'video')
            ->where('thumb_path', DB::raw('path'))
            ->update([
                'thumb_path' => null
            ]);
    }
};
