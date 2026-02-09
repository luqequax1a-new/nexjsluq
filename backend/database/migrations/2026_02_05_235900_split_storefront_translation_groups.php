<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('translations')
            ->where('group', 'storefront')
            ->where('key', 'like', 'storefront.auth.%')
            ->update(['group' => 'storefront_auth']);

        DB::table('translations')
            ->where('group', 'storefront')
            ->where('key', 'like', 'storefront.account.%')
            ->update(['group' => 'storefront_account']);
    }

    public function down(): void
    {
        DB::table('translations')
            ->where('group', 'storefront_auth')
            ->update(['group' => 'storefront']);

        DB::table('translations')
            ->where('group', 'storefront_account')
            ->update(['group' => 'storefront']);
    }
};
