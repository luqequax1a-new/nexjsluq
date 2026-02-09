<?php

use App\Http\Controllers\Api\MailSettingsController;

// API Mail Settings Routes
Route::prefix('mail-settings')->name('mail-settings.')->group(function () {
    Route::get('/', [MailSettingsController::class, 'index'])->name('index');
    Route::put('/', [MailSettingsController::class, 'update'])->name('update');
    Route::post('/test', [MailSettingsController::class, 'sendTestEmail'])->name('test');
});
