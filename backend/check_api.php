<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$section = \App\Models\PageSection::where('page_type', 'home')
    ->whereHas('template', fn($q) => $q->where('key', 'product_carousel'))
    ->with('template')
    ->first();

if (!$section) { echo "No product_carousel section found\n"; exit; }

echo "--- Section settings ---\n";
echo json_encode($section->settings, JSON_PRETTY_PRINT) . "\n";

echo "\n--- Template default_settings ---\n";
echo json_encode($section->template->default_settings, JSON_PRETTY_PRINT) . "\n";
