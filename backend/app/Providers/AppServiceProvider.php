<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Order;
use App\Models\Product;
use App\Observers\OrderObserver;
use App\Observers\ProductObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Order::observe(OrderObserver::class);
        Product::observe(ProductObserver::class);

        \Illuminate\Support\Facades\Gate::policy(\App\Models\Product::class, \App\Policies\ProductPolicy::class);
        
        // Force session domain for cross-origin requests in development
        if (app()->environment('local')) {
            config(['session.domain' => 'localhost']);
            config(['session.samesite' => 'lax']);
            config(['session.secure' => false]);
        }
    }
}
