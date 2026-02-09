<?php

namespace Tests\Unit;

use App\Services\HtmlSanitizer;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public function test_strips_script_and_event_handlers(): void
    {
        $s = new HtmlSanitizer();
        $out = $s->sanitize('<p onclick="alert(1)">Hi<script>alert(2)</script></p>');

        $this->assertStringContainsString('<p>Hi</p>', $out);
        $this->assertStringNotContainsString('onclick', $out);
        $this->assertStringNotContainsString('<script', $out);
    }

    public function test_removes_javascript_urls(): void
    {
        $s = new HtmlSanitizer();
        $out = $s->sanitize('<a href="javascript:alert(1)">x</a> <img src="javascript:alert(2)" />');

        $this->assertStringContainsString('<a>x</a>', $out);
        $this->assertStringNotContainsString('javascript:', $out);
        $this->assertStringNotContainsString('src=', $out);
    }

    public function test_allows_http_links_and_sets_rel_for_blank_target(): void
    {
        $s = new HtmlSanitizer();
        $out = $s->sanitize('<a href="https://example.com" target="_blank">x</a>');

        $this->assertStringContainsString('href="https://example.com"', $out);
        $this->assertStringContainsString('target="_blank"', $out);
        $this->assertStringContainsString('rel="noopener noreferrer"', $out);
    }

    public function test_unwraps_disallowed_tags_but_keeps_text(): void
    {
        $s = new HtmlSanitizer();
        $out = $s->sanitize('<custom>hello <b>bold</b></custom>');

        $this->assertStringContainsString('hello', $out);
        $this->assertStringContainsString('<b>bold</b>', $out);
        $this->assertStringNotContainsString('<custom', $out);
    }
}

