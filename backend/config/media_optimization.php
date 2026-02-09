<?php

return [
    // Variants we generate on upload (kept intentionally small and practical).
    'variants' => [
        'widths' => [
            'thumb' => 80,
            'card' => 260,
            'grid' => 400,
            'grid_2x' => 800,
            'detail' => 1000,
        ],
        'jpeg_quality' => 88,
        'webp_quality' => 88,
        // AVIF support depends on server GD build; we will auto-detect too.
        'avif_quality' => 90,
        'enable_avif' => true,
    ],
];

