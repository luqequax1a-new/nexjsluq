<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;
use Illuminate\Support\Str;

class HtmlSanitizer
{
    /**
     * Minimal allowlist sanitizer for user-provided HTML rendered on the storefront.
     * This strips scripts/iframes and dangerous attributes like on* handlers and javascript: URLs.
     */
    public function sanitize(?string $html): ?string
    {
        if ($html === null) return null;

        $html = trim($html);
        if ($html === '') return '';

        $allowedTags = [
            'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'hr', 'i', 'li', 'ol', 'p', 'pre', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'ul',
            // Allow images but strictly sanitize src
            'img',
        ];

        $globalAllowedAttrs = ['class', 'id', 'title', 'aria-label', 'aria-hidden', 'role'];

        $allowedAttrsByTag = [
            'a' => ['href', 'target', 'rel'],
            'img' => ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
        ];

        $blockedTags = [
            'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'input', 'button',
            'textarea', 'select', 'option', 'svg', 'math',
        ];

        $dom = new DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $dom->loadHTML('<div>' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        /** @var DOMElement|null $root */
        $root = $dom->getElementsByTagName('div')->item(0);
        if (!$root) return '';

        $this->sanitizeNode($root, $allowedTags, $blockedTags, $globalAllowedAttrs, $allowedAttrsByTag);

        $out = '';
        foreach (iterator_to_array($root->childNodes) as $child) {
            $out .= $dom->saveHTML($child);
        }

        return $out;
    }

    private function sanitizeNode(
        DOMNode $node,
        array $allowedTags,
        array $blockedTags,
        array $globalAllowedAttrs,
        array $allowedAttrsByTag
    ): void {
        if ($node instanceof DOMElement) {
            $tag = strtolower($node->tagName);

            if (in_array($tag, $blockedTags, true)) {
                $this->removeNode($node);
                return;
            }

            if (!in_array($tag, $allowedTags, true)) {
                $this->unwrapElement($node);
                return;
            }

            $allowedAttrs = array_merge($globalAllowedAttrs, $allowedAttrsByTag[$tag] ?? []);
            $this->sanitizeAttributes($node, $allowedAttrs);
            $this->sanitizeSpecialAttrs($node, $tag);
        }

        // Iterate over a snapshot because we may remove nodes during traversal
        foreach (iterator_to_array($node->childNodes) as $child) {
            $this->sanitizeNode($child, $allowedTags, $blockedTags, $globalAllowedAttrs, $allowedAttrsByTag);
        }
    }

    private function sanitizeAttributes(DOMElement $el, array $allowedAttrs): void
    {
        $toRemove = [];
        foreach (iterator_to_array($el->attributes) as $attr) {
            $name = strtolower($attr->name);

            // Drop all inline event handlers and style (style can contain url(javascript:...))
            if (str_starts_with($name, 'on') || $name === 'style') {
                $toRemove[] = $attr->name;
                continue;
            }

            if (!in_array($name, $allowedAttrs, true)) {
                $toRemove[] = $attr->name;
                continue;
            }
        }

        foreach ($toRemove as $name) {
            $el->removeAttribute($name);
        }
    }

    private function sanitizeSpecialAttrs(DOMElement $el, string $tag): void
    {
        if ($tag === 'a') {
            $href = $el->getAttribute('href');
            if ($href !== '' && !$this->isSafeUrl($href, ['http', 'https', 'mailto', 'tel'])) {
                $el->removeAttribute('href');
            }

            $target = strtolower(trim($el->getAttribute('target')));
            if ($target !== '' && !in_array($target, ['_blank', '_self', '_top', '_parent'], true)) {
                $el->removeAttribute('target');
            }

            if ($target === '_blank') {
                $rel = trim($el->getAttribute('rel'));
                $tokens = preg_split('/\s+/', $rel !== '' ? $rel : '', -1, PREG_SPLIT_NO_EMPTY) ?: [];
                $set = array_fill_keys(array_map('strtolower', $tokens), true);
                $set['noopener'] = true;
                $set['noreferrer'] = true;
                $el->setAttribute('rel', implode(' ', array_keys($set)));
            } else {
                // If target isn't blank, keep rel only if present; otherwise ignore
                if (trim($el->getAttribute('rel')) === '') {
                    $el->removeAttribute('rel');
                }
            }
        }

        if ($tag === 'img') {
            $src = $el->getAttribute('src');
            if ($src !== '' && !$this->isSafeUrl($src, ['http', 'https'])) {
                // Allow relative paths (/...) for local assets
                $trim = ltrim($src);
                if (!str_starts_with($trim, '/')) {
                    $el->removeAttribute('src');
                }
            }

            $loading = strtolower(trim($el->getAttribute('loading')));
            if ($loading !== '' && !in_array($loading, ['lazy', 'eager'], true)) {
                $el->removeAttribute('loading');
            }

            $decoding = strtolower(trim($el->getAttribute('decoding')));
            if ($decoding !== '' && !in_array($decoding, ['async', 'sync', 'auto'], true)) {
                $el->removeAttribute('decoding');
            }
        }
    }

    private function isSafeUrl(string $url, array $allowedSchemes): bool
    {
        $u = trim($url);
        if ($u === '') return false;

        // Allow hash links and relative links
        if (str_starts_with($u, '#') || str_starts_with($u, '/')) return true;

        $normalized = Str::of($u)->lower()->trim()->value();
        if (str_starts_with($normalized, 'javascript:')) return false;
        if (str_starts_with($normalized, 'data:')) return false;
        if (str_starts_with($normalized, 'vbscript:')) return false;

        $parts = @parse_url($u);
        if ($parts === false) return false;

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        if ($scheme === '') {
            // e.g. "example.com/path" – treat as unsafe to avoid implicit scheme tricks
            return false;
        }

        return in_array($scheme, $allowedSchemes, true);
    }

    private function unwrapElement(DOMElement $el): void
    {
        $parent = $el->parentNode;
        if (!$parent) return;

        while ($el->firstChild) {
            $parent->insertBefore($el->firstChild, $el);
        }
        $parent->removeChild($el);
    }

    private function removeNode(DOMNode $node): void
    {
        $parent = $node->parentNode;
        if ($parent) {
            $parent->removeChild($node);
        }
    }
}

