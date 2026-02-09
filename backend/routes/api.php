<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\VariationController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerGroupController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\GoogleProductCategoryController;
use App\Http\Controllers\Api\TaxClassController;
use App\Http\Controllers\Api\OptionController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ProductTabController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\TranslationController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\SkuGeneratorController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\Storefront\MenuController as StorefrontMenuController;
use App\Http\Controllers\Api\Storefront\PaymentMethodController;
use App\Http\Controllers\Api\Storefront\ShippingMethodController as StorefrontShippingMethodController;
use App\Http\Controllers\Api\Storefront\PageController as StorefrontPageController;
use App\Http\Controllers\Api\Storefront\AuthController as StorefrontAuthController;
use App\Http\Controllers\Api\Storefront\AccountAddressController as StorefrontAccountAddressController;
use App\Http\Controllers\Api\Storefront\AccountCouponController as StorefrontAccountCouponController;
use App\Http\Controllers\Api\Storefront\AccountOrderController as StorefrontAccountOrderController;
use App\Http\Controllers\Api\Storefront\AccountProfileController as StorefrontAccountProfileController;
use App\Http\Controllers\Api\Storefront\OrderController as StorefrontOrderController;
use App\Http\Controllers\Api\MailSettingsController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\AttributeSetController;
use App\Http\Controllers\Api\ProductAttributeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Public Sitemap & Robots
Route::get('sitemap.xml', [App\Http\Controllers\Api\SitemapController::class, 'index']);
Route::get('sitemap-products-{page}.xml', [App\Http\Controllers\Api\SitemapController::class, 'products'])->where('page', '[0-9]+');
Route::get('sitemap-categories.xml', [App\Http\Controllers\Api\SitemapController::class, 'categories']);
Route::get('sitemap-brands.xml', [App\Http\Controllers\Api\SitemapController::class, 'brands']);
Route::get('sitemap-pages.xml', [App\Http\Controllers\Api\SitemapController::class, 'pages']);
Route::get('sitemap-static.xml', [App\Http\Controllers\Api\SitemapController::class, 'static_']);
Route::get('robots.txt', [App\Http\Controllers\Api\SitemapController::class, 'robots']);

// Public routes for data fetching
Route::get('translations/{locale}', [TranslationController::class, 'getByLocale']);
Route::get('brands', [BrandController::class, 'index']);
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories-tree', [CategoryController::class, 'tree']);
Route::get('units', [UnitController::class, 'index']);
Route::get('tax-classes', [TaxClassController::class, 'index']);
Route::get('variations', [VariationController::class, 'index']);

// Storefront Public Routes
Route::prefix('storefront')->group(function () {
    Route::get('/menus/{code}', [StorefrontMenuController::class, 'show']);
    Route::get('/home', [App\Http\Controllers\Api\Storefront\HomeController::class, 'index']);
    Route::get('/settings', [App\Http\Controllers\Api\Storefront\SettingsController::class, 'index']);
    Route::get('/products', [App\Http\Controllers\Api\Storefront\ProductListController::class, 'index']);
    Route::get('/categories/{slug}', [App\Http\Controllers\Api\Storefront\CategoryController::class, 'show']);
    Route::get('/products/{slug}', [App\Http\Controllers\Api\Storefront\ProductController::class, 'show']);
    Route::get('/pages/{slug}', [StorefrontPageController::class, 'show']);
    Route::get('/resolve-redirect', [App\Http\Controllers\Api\Storefront\RedirectResolveController::class, 'resolve']);
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
    Route::get('/payment-methods/{code}', [PaymentMethodController::class, 'show']);
    Route::get('/shipping-methods', [StorefrontShippingMethodController::class, 'index']);
    
    // Stock notify (back in stock)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/stock-notify', [App\Http\Controllers\Api\Storefront\StockNotifyController::class, 'store']);
        Route::post('/orders/track', [StorefrontOrderController::class, 'track']);
    });
    
    Route::post('/orders', [StorefrontOrderController::class, 'store']);

    Route::prefix('auth')->group(function () {
        Route::post('/register', [StorefrontAuthController::class, 'register']);
        Route::post('/login', [StorefrontAuthController::class, 'login']);
        Route::post('/forgot-password', [StorefrontAuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [StorefrontAuthController::class, 'resetPassword']);

        Route::middleware(['auth:sanctum', 'auth.customer'])->group(function () {
            Route::get('/me', [StorefrontAuthController::class, 'me']);
            Route::post('/logout', [StorefrontAuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'auth.customer'])
        ->prefix('account')
        ->group(function () {
            Route::get('/addresses', [StorefrontAccountAddressController::class, 'index']);
            Route::post('/addresses', [StorefrontAccountAddressController::class, 'store']);
            Route::put('/addresses/{address}', [StorefrontAccountAddressController::class, 'update']);
            Route::delete('/addresses/{address}', [StorefrontAccountAddressController::class, 'destroy']);

            Route::get('/coupons', [StorefrontAccountCouponController::class, 'index']);

            Route::get('/orders', [StorefrontAccountOrderController::class, 'index']);
            Route::get('/orders/{order}', [StorefrontAccountOrderController::class, 'show']);

            Route::get('/profile', [StorefrontAccountProfileController::class, 'show']);
            Route::put('/profile', [StorefrontAccountProfileController::class, 'update']);
        });

    // Cart Offers Storefront
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'auth.admin'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'auth.admin'])->group(function () {
    // Sitemap & Robots Settings (Admin)
    Route::get('sitemap/config', [App\Http\Controllers\Api\SitemapSettingsController::class, 'getConfig']);
    Route::post('sitemap/config', [App\Http\Controllers\Api\SitemapSettingsController::class, 'saveConfig']);
    Route::get('sitemap/robots', [App\Http\Controllers\Api\SitemapSettingsController::class, 'getRobots']);
    Route::post('sitemap/robots', [App\Http\Controllers\Api\SitemapSettingsController::class, 'saveRobots']);
    Route::post('sitemap/robots/reset', [App\Http\Controllers\Api\SitemapSettingsController::class, 'resetRobots']);

    // Storefront Settings Update (Admin)
    Route::post('storefront/settings', [SettingController::class, 'update']);

    // Menus (Admin Menu Builder)
    Route::get('menus/default', [MenuController::class, 'default']);
    Route::get('menus/by-code/{code}', [MenuController::class, 'byCode']);
    Route::get('menus', [MenuController::class, 'index']);
    Route::post('menus', [MenuController::class, 'store']);
    Route::get('menus/{menu}', [MenuController::class, 'show']);
    Route::put('menus/{menu}', [MenuController::class, 'update']);
    Route::delete('menus/{menu}', [MenuController::class, 'destroy']);
    Route::get('menus/{menu}/tree', [MenuController::class, 'tree']);
    Route::put('menus/{menu}/reorder', [MenuController::class, 'reorder']);
    Route::post('menus/{menu}/import-categories', [MenuController::class, 'importCategories']);
    Route::post('menus/{menu}/items', [MenuItemController::class, 'store']);
    Route::put('menu-items/{menuItem}', [MenuItemController::class, 'update']);
    Route::delete('menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

    Route::post('products/generate-sku', [SkuGeneratorController::class, 'generate']);
    Route::get('products/sku-settings', [SkuGeneratorController::class, 'settings']);
    Route::post('products/sku-settings', [SkuGeneratorController::class, 'updateSettings']);
    Route::post('products/sku-preview', [SkuGeneratorController::class, 'preview']);
    Route::post('products/bulk-update', [ProductController::class, 'bulkUpdate']);
    Route::apiResource('products', ProductController::class);
    Route::post('products/{product}/duplicate', [ProductController::class, 'duplicate']);
    Route::get('products/{product}/inventory', [ProductController::class, 'getInventory']);
    Route::patch('products/{product}/inventory', [ProductController::class, 'updateInventory']);
    Route::get('products/{product}/pricing', [ProductController::class, 'getPricing']);
    Route::patch('products/{product}/pricing', [ProductController::class, 'updatePricing']);
    
    Route::get('media', [MediaController::class, 'index']);
    Route::get('media/library', [MediaController::class, 'library']);
    Route::get('media/{media}', [MediaController::class, 'show']);
    Route::post('media/upload', [MediaController::class, 'upload']);
    Route::put('media/{media}', [MediaController::class, 'update']);
    Route::put('media/{media}/crop', [MediaController::class, 'updateCrop']);
    Route::post('media/{media}/regenerate', [MediaController::class, 'regenerate']);
    Route::post('media/import-legacy', [MediaController::class, 'importLegacy']);
    Route::post('media/attach-from-library', [MediaController::class, 'attachFromLibrary']);
    Route::post('media/cleanup-draft', [MediaController::class, 'cleanupDraft']);
    Route::put('media/{media}/focal-point', [MediaController::class, 'updateFocalPoint']);
    Route::delete('media/{media}', [MediaController::class, 'destroy']);

    Route::put('products/{product}/media/reorder', [MediaController::class, 'reorderProduct']);
    Route::put('variants/{variant}/media/reorder', [MediaController::class, 'reorderVariant']);
    
    // Route::apiResource('variations', VariationController::class);
    
    // Units CRUD (index is public)
    Route::post('units', [UnitController::class, 'store']);
    Route::get('units/{unit}', [UnitController::class, 'show']);
    Route::put('units/{unit}', [UnitController::class, 'update']);
    Route::delete('units/{unit}', [UnitController::class, 'destroy']);
    
    // Tax Classes CRUD (index is public)
    Route::get('tax-classes/{taxClass}', [TaxClassController::class, 'show']);
    
    Route::get('tags', [TagController::class, 'index']);
    Route::post('tags', [TagController::class, 'store']);
    Route::get('google-categories', [GoogleProductCategoryController::class, 'index']);

    // Brands CRUD
    Route::post('brands', [BrandController::class, 'store']);
    Route::get('brands/{brand}', [BrandController::class, 'show']);
    Route::put('brands/{brand}', [BrandController::class, 'update']);
    Route::delete('brands/{brand}', [BrandController::class, 'destroy']);
    Route::put('brands/reorder', [BrandController::class, 'reorder']);

    // Categories CRUD
    Route::post('categories', [CategoryController::class, 'store']);
    Route::get('categories/{category}', [CategoryController::class, 'show']);
    Route::put('categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);
    Route::put('categories/reorder', [CategoryController::class, 'reorder']);
    Route::post('categories/{category}/attach-products', [CategoryController::class, 'attachProducts']);
    Route::post('categories/{category}/detach-products', [CategoryController::class, 'detachProducts']);
    Route::post('categories/{category}/sync-dynamic', [CategoryController::class, 'syncDynamic']);

    Route::apiResource('options', OptionController::class);
    Route::post('products/{productId}/options/import', [OptionController::class, 'importTemplateToProduct']);
    Route::post('products/{productId}/options', [OptionController::class, 'saveProductOptions']);

    Route::apiResource('attribute-sets', AttributeSetController::class);
    Route::post('products/{product}/attributes', [ProductAttributeController::class, 'sync']);

    // ========== ORDER MANAGEMENT ==========
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/statistics', [OrderController::class, 'statistics']);
        Route::get('/options', [OrderController::class, 'options']);
        Route::get('/{order}', [OrderController::class, 'show']);
        Route::put('/{order}', [OrderController::class, 'update']);
        Route::delete('/{order}', [OrderController::class, 'destroy']);
        Route::post('/{order}/note', [OrderController::class, 'addNote']);
        Route::post('/{order}/messages', [OrderController::class, 'sendMessage']);
    });

    // ========== CUSTOMER MANAGEMENT ==========
    Route::prefix('customers')->group(function () {
        // Customer Groups
        Route::get('groups', [CustomerGroupController::class, 'index']);
        Route::post('groups', [CustomerGroupController::class, 'store']);
        Route::get('groups/{customerGroup}', [CustomerGroupController::class, 'show']);
        Route::put('groups/{customerGroup}', [CustomerGroupController::class, 'update']);
        Route::delete('groups/{customerGroup}', [CustomerGroupController::class, 'destroy']);
        
        Route::post('groups/{customerGroup}/run-assignment', [CustomerGroupController::class, 'runAutoAssignment']);
        Route::post('groups/{customerGroup}/add-customers', [CustomerGroupController::class, 'addCustomers']);

        Route::get('/', [CustomerController::class, 'index']);
        Route::post('/', [CustomerController::class, 'store']);
        Route::get('/search', [CustomerController::class, 'search']);
        Route::get('/statistics', [CustomerController::class, 'statistics']);
        Route::get('/{customer}', [CustomerController::class, 'show']);
        Route::put('/{customer}', [CustomerController::class, 'update']);
        Route::delete('/{customer}', [CustomerController::class, 'destroy']);
        Route::get('/{customer}/orders', [CustomerController::class, 'orders']);
        Route::get('/{customer}/stats', [CustomerController::class, 'customerStats']);
        
        // Customer addresses
        Route::post('/{customer}/addresses', [CustomerController::class, 'addAddress']);
        Route::put('/{customer}/addresses/{address}', [CustomerController::class, 'updateAddress']);
        Route::delete('/{customer}/addresses/{address}', [CustomerController::class, 'deleteAddress']);
    });

    Route::prefix('marketing')->group(function () {
        Route::get('coupons/all-statistics', [CouponController::class, 'allStatistics']);
        Route::get('coupons/{coupon}/statistics', [CouponController::class, 'statistics']);
        Route::get('coupons/{coupon}/usage-logs', [CouponController::class, 'usageLogs']);
        Route::apiResource('coupons', CouponController::class);
        Route::post('coupons/validate', [CouponController::class, 'validateCode']);
        
        // Cart Offers
        Route::get('cart-offers/{cartOffer}/stats', [\App\Http\Controllers\Api\CartOfferController::class, 'stats']);
        Route::post('cart-offers/{cartOffer}/toggle-status', [\App\Http\Controllers\Api\CartOfferController::class, 'toggleStatus']);
        Route::apiResource('cart-offers', \App\Http\Controllers\Api\CartOfferController::class);
    });

    Route::prefix('settings')->group(function () {
        Route::get('mail-settings', [MailSettingsController::class, 'show']);
        Route::post('mail-settings', [MailSettingsController::class, 'update']);
        Route::post('mail-settings/test', [MailSettingsController::class, 'test']);

        // General Settings (Admin)
        Route::get('general', [SettingController::class, 'index']);
        Route::post('general', [SettingController::class, 'update']);

        // Currencies (Admin)
        Route::get('currencies', [CurrencyController::class, 'index']);
        
        // Payment Methods (Admin)
        Route::get('payment-methods', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'index']);
        Route::post('payment-methods', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'store']);
        Route::get('payment-methods/{paymentMethod}', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'show']);
        Route::put('payment-methods/{paymentMethod}', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'update']);
        Route::delete('payment-methods/{paymentMethod}', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'destroy']);
        Route::put('payment-methods/{paymentMethod}/toggle', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'toggle']);
        Route::post('payment-methods/reorder', [App\Http\Controllers\Api\Admin\PaymentMethodController::class, 'reorder']);

        // Product detail custom tabs
        Route::get('/product-tabs', [ProductTabController::class, 'index']);
        Route::get('/product-tabs/{productTab}', [ProductTabController::class, 'show']);
        Route::post('/product-tabs', [ProductTabController::class, 'store']);
        Route::put('/product-tabs/{productTab}', [ProductTabController::class, 'update']);
        Route::delete('/product-tabs/{productTab}', [ProductTabController::class, 'destroy']);

        // Custom Pages (CMS)
        Route::get('/pages', [PageController::class, 'index']);
        Route::post('/pages', [PageController::class, 'store']);
        Route::get('/pages/{page}', [PageController::class, 'show']);
        Route::put('/pages/{page}', [PageController::class, 'update']);
        Route::delete('/pages/{page}', [PageController::class, 'destroy']);
        Route::put('/pages/{page}/toggle', [PageController::class, 'toggle']);
        
        Route::get('/roles', [RolePermissionController::class, 'getRoles']);
        Route::post('roles', [RolePermissionController::class, 'createRole']);
        Route::put('/roles/{role}', [RolePermissionController::class, 'updateRole']);
        Route::delete('/roles/{role}', [RolePermissionController::class, 'deleteRole']);
        Route::get('/permissions', [RolePermissionController::class, 'getPermissions']);
        
        Route::get('/users', [UserController::class, 'index']);
        
        Route::get('/translations', [TranslationController::class, 'index']);
        Route::post('/translations/batch', [TranslationController::class, 'batchUpdate']);

        Route::apiResource('taxes', TaxController::class);
    });


    // ========== WHATSAPP SETTINGS ==========
    Route::group(['prefix' => 'settings/whatsapp'], function () {
        Route::get('/', [\App\Http\Controllers\Api\WhatsAppSettingsController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\WhatsAppSettingsController::class, 'update']);
        Route::post('/test', [\App\Http\Controllers\Api\WhatsAppSettingsController::class, 'test']);
    });

    // ========== URL REDIRECTS ==========
    Route::prefix('redirects')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\Admin\UrlRedirectController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\Admin\UrlRedirectController::class, 'store']);
        Route::get('/{redirect}', [App\Http\Controllers\Api\Admin\UrlRedirectController::class, 'show']);
        Route::put('/{redirect}', [App\Http\Controllers\Api\Admin\UrlRedirectController::class, 'update']);
        Route::delete('/{redirect}', [App\Http\Controllers\Api\Admin\UrlRedirectController::class, 'destroy']);
        Route::post('/{redirect}/toggle', [App\Http\Controllers\Api\Admin\UrlRedirectController::class, 'toggleStatus']);
    });

    // ========== ANALYTICS ==========
    Route::prefix('analytics')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/top-products', [AnalyticsController::class, 'topProducts']);
        Route::get('/top-brands', [AnalyticsController::class, 'topBrands']);
        Route::get('/top-categories', [AnalyticsController::class, 'topCategories']);
    });
});

// Mail Settings (Public for testing - should be protected in production)
Route::get('/settings/mail-settings', [MailSettingsController::class, 'index']);
Route::put('/settings/mail-settings', [MailSettingsController::class, 'update']);
Route::post('/settings/mail-settings/test', [MailSettingsController::class, 'sendTestEmail']);

// Cart Routes (Public for guest users, with stateful API middleware)
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'addItem']);
Route::put('/cart/items/{cartItem}', [CartController::class, 'updateItem']);
Route::delete('/cart/items/{cartItem}', [CartController::class, 'removeItem']);
Route::delete('/cart', [CartController::class, 'clear']);
Route::post('/cart/coupon', [CartController::class, 'applyCoupon']);
Route::delete('/cart/coupon', [CartController::class, 'removeCoupon']);
Route::get('/cart/validate-coupon', [CartController::class, 'validateCoupon']);

// Cart Offers Storefront
Route::get('/cart/offers/resolve', [\App\Http\Controllers\Api\Storefront\CartOfferController::class, 'resolve']);
Route::post('/cart/offers/accept', [\App\Http\Controllers\Api\Storefront\CartOfferController::class, 'accept']);
