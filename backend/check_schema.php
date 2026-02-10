<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$t = \App\Models\SectionTemplate::where('key', 'product_carousel')->first();
if (!$t) { echo "Template not found\n"; exit; }

$fields = $t->schema['fields'] ?? [];
foreach ($fields as $i => $f) {
    $key = $f['key'] ?? '?';
    $dep = isset($f['depends_on']) ? json_encode($f['depends_on']) : 'none';
    echo "[$i] key=$key  depends_on=$dep\n";
}
