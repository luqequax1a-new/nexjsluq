<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SitemapService;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    private function xmlResponse(string $xml): Response
    {
        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600, s-maxage=3600',
        ]);
    }

    public function index(SitemapService $service): Response
    {
        return $this->xmlResponse($service->generateIndex());
    }

    public function products(SitemapService $service, int $page = 1): Response
    {
        return $this->xmlResponse($service->generateProducts($page));
    }

    public function categories(SitemapService $service): Response
    {
        return $this->xmlResponse($service->generateCategories());
    }

    public function brands(SitemapService $service): Response
    {
        return $this->xmlResponse($service->generateBrands());
    }

    public function pages(SitemapService $service): Response
    {
        return $this->xmlResponse($service->generatePages());
    }

    public function static_(SitemapService $service): Response
    {
        return $this->xmlResponse($service->generateStatic());
    }

    public function robots(SitemapService $service): Response
    {
        return response($service->getRobotsTxt(), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
