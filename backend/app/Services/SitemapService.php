<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Page;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Carbon;

class SitemapService
{
    private string $siteUrl;
    private array $config;

    public function __construct()
    {
        $this->siteUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $this->config = $this->loadConfig();
    }

    private function loadConfig(): array
    {
        $defaults = [
            'include_products' => true,
            'include_categories' => true,
            'include_brands' => true,
            'include_pages' => true,
            'include_static' => true,
            'products_per_sitemap' => 1000,
            'products_changefreq' => 'weekly',
            'products_priority' => '0.8',
            'categories_changefreq' => 'weekly',
            'categories_priority' => '0.7',
            'brands_changefreq' => 'monthly',
            'brands_priority' => '0.6',
            'pages_changefreq' => 'monthly',
            'pages_priority' => '0.5',
            'include_images' => true,
        ];

        try {
            $setting = Setting::where('key', 'sitemap_config')->first();
            if ($setting && $setting->value) {
                $stored = is_string($setting->value) ? json_decode($setting->value, true) : (array) $setting->value;
                return array_merge($defaults, $stored ?: []);
            }
        } catch (\Throwable $e) {
            // fallback
        }

        return $defaults;
    }

    public function getConfig(): array
    {
        return $this->config;
    }

    public function saveConfig(array $data): void
    {
        Setting::updateOrCreate(
            ['key' => 'sitemap_config'],
            ['value' => json_encode($data)]
        );
        $this->config = array_merge($this->config, $data);
    }

    // ─── Sitemap Index ───

    public function generateIndex(): string
    {
        $sitemaps = [];

        if ($this->config['include_products']) {
            $count = Product::where('status', 'published')->whereNotNull('slug')->count();
            $chunks = max(1, (int) ceil($count / $this->config['products_per_sitemap']));
            for ($i = 1; $i <= $chunks; $i++) {
                $sitemaps[] = [
                    'loc' => "{$this->siteUrl}/api/sitemap-products-{$i}.xml",
                    'lastmod' => $this->toW3cDate(Product::where('status', 'published')->max('updated_at')),
                ];
            }
        }

        if ($this->config['include_categories']) {
            $sitemaps[] = [
                'loc' => "{$this->siteUrl}/api/sitemap-categories.xml",
                'lastmod' => $this->toW3cDate(Category::max('updated_at')),
            ];
        }

        if ($this->config['include_brands']) {
            $sitemaps[] = [
                'loc' => "{$this->siteUrl}/api/sitemap-brands.xml",
                'lastmod' => $this->toW3cDate(Brand::max('updated_at')),
            ];
        }

        if ($this->config['include_pages']) {
            $sitemaps[] = [
                'loc' => "{$this->siteUrl}/api/sitemap-pages.xml",
                'lastmod' => $this->toW3cDate(Page::where('is_published', true)->max('updated_at')),
            ];
        }

        if ($this->config['include_static']) {
            $sitemaps[] = [
                'loc' => "{$this->siteUrl}/api/sitemap-static.xml",
                'lastmod' => now()->toW3cString(),
            ];
        }

        return $this->buildSitemapIndex($sitemaps);
    }

    // ─── Sub-sitemaps ───

    public function generateProducts(int $page = 1): string
    {
        $perPage = (int) $this->config['products_per_sitemap'];
        $products = Product::where('status', 'published')
            ->whereNotNull('slug')
            ->orderBy('id')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get(['id', 'slug', 'name', 'updated_at']);

        $urls = [];
        foreach ($products as $product) {
            $entry = [
                'loc' => "{$this->siteUrl}/urun/{$product->slug}",
                'lastmod' => $this->toW3cDate($product->updated_at),
                'changefreq' => $this->config['products_changefreq'],
                'priority' => $this->config['products_priority'],
            ];

            if ($this->config['include_images']) {
                $media = $product->media()->orderBy('position')->limit(5)->get();
                $images = [];
                foreach ($media as $m) {
                    $url = $m->url ?? $m->path ?? null;
                    if ($url) {
                        if (!str_starts_with($url, 'http')) {
                            $url = \Illuminate\Support\Facades\Storage::url($url);
                        }
                        $images[] = ['loc' => $url, 'title' => $product->name];
                    }
                }
                if (!empty($images)) {
                    $entry['images'] = $images;
                }
            }

            $urls[] = $entry;
        }

        return $this->buildUrlSet($urls);
    }

    public function generateCategories(): string
    {
        $categories = Category::whereNotNull('slug')
            ->orderBy('id')
            ->get(['id', 'slug', 'updated_at']);

        $urls = [];
        foreach ($categories as $cat) {
            $urls[] = [
                'loc' => "{$this->siteUrl}/kategoriler/{$cat->slug}",
                'lastmod' => $this->toW3cDate($cat->updated_at),
                'changefreq' => $this->config['categories_changefreq'],
                'priority' => $this->config['categories_priority'],
            ];
        }

        return $this->buildUrlSet($urls);
    }

    public function generateBrands(): string
    {
        $brands = Brand::whereNotNull('slug')
            ->orderBy('id')
            ->get(['id', 'slug', 'updated_at']);

        $urls = [];
        foreach ($brands as $brand) {
            $urls[] = [
                'loc' => "{$this->siteUrl}/markalar/{$brand->slug}",
                'lastmod' => $this->toW3cDate($brand->updated_at),
                'changefreq' => $this->config['brands_changefreq'],
                'priority' => $this->config['brands_priority'],
            ];
        }

        return $this->buildUrlSet($urls);
    }

    public function generatePages(): string
    {
        $pages = Page::where('is_published', true)
            ->whereNotNull('slug')
            ->orderBy('id')
            ->get(['id', 'slug', 'updated_at']);

        $urls = [];
        foreach ($pages as $page) {
            $urls[] = [
                'loc' => "{$this->siteUrl}/sayfa/{$page->slug}",
                'lastmod' => $this->toW3cDate($page->updated_at),
                'changefreq' => $this->config['pages_changefreq'],
                'priority' => $this->config['pages_priority'],
            ];
        }

        return $this->buildUrlSet($urls);
    }

    public function generateStatic(): string
    {
        $urls = [
            ['loc' => $this->siteUrl, 'changefreq' => 'daily', 'priority' => '1.0'],
        ];

        return $this->buildUrlSet($urls);
    }

    // ─── Robots.txt ───

    public function getRobotsTxt(): string
    {
        try {
            $setting = Setting::where('key', 'robots_txt')->first();
            if ($setting && $setting->value) {
                return (string) $setting->value;
            }
        } catch (\Throwable $e) {
            // fallback
        }

        return $this->getDefaultRobotsTxt();
    }

    public function saveRobotsTxt(string $content): void
    {
        Setting::updateOrCreate(
            ['key' => 'robots_txt'],
            ['value' => $content]
        );
    }

    public function resetRobotsTxt(): string
    {
        $default = $this->getDefaultRobotsTxt();
        $this->saveRobotsTxt($default);
        return $default;
    }

    private function getDefaultRobotsTxt(): string
    {
        $sitemapUrl = "{$this->siteUrl}/sitemap.xml";

        return <<<TXT
User-agent: *
Allow: /

Disallow: /admin
Disallow: /api
Disallow: /sepet
Disallow: /odeme

Sitemap: {$sitemapUrl}
TXT;
    }

    // ─── XML Builders ───

    private function buildSitemapIndex(array $sitemaps): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($sitemaps as $s) {
            $xml .= "  <sitemap>\n";
            $xml .= "    <loc>" . htmlspecialchars($s['loc']) . "</loc>\n";
            if (!empty($s['lastmod'])) {
                $xml .= "    <lastmod>{$s['lastmod']}</lastmod>\n";
            }
            $xml .= "  </sitemap>\n";
        }

        $xml .= '</sitemapindex>';
        return $xml;
    }

    private function buildUrlSet(array $urls): string
    {
        $hasImages = false;
        foreach ($urls as $u) {
            if (!empty($u['images'])) {
                $hasImages = true;
                break;
            }
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
        if ($hasImages) {
            $xml .= ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
        }
        $xml .= '>' . "\n";

        foreach ($urls as $u) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars($u['loc']) . "</loc>\n";
            if (!empty($u['lastmod'])) {
                $xml .= "    <lastmod>{$u['lastmod']}</lastmod>\n";
            }
            if (!empty($u['changefreq'])) {
                $xml .= "    <changefreq>{$u['changefreq']}</changefreq>\n";
            }
            if (!empty($u['priority'])) {
                $xml .= "    <priority>{$u['priority']}</priority>\n";
            }
            if (!empty($u['images'])) {
                foreach ($u['images'] as $img) {
                    $xml .= "    <image:image>\n";
                    $xml .= "      <image:loc>" . htmlspecialchars($img['loc']) . "</image:loc>\n";
                    if (!empty($img['title'])) {
                        $xml .= "      <image:title>" . htmlspecialchars($img['title']) . "</image:title>\n";
                    }
                    $xml .= "    </image:image>\n";
                }
            }
            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';
        return $xml;
    }

    private function toW3cDate($raw): string
    {
        if (empty($raw)) {
            return now()->toW3cString();
        }

        try {
            return Carbon::parse($raw)->toW3cString();
        } catch (\Throwable $e) {
            return now()->toW3cString();
        }
    }
}
