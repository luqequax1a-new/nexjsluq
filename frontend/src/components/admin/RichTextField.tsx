'use client';

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { createTinyMCEInit, TinyMCEInitOptions } from '@/lib/richtext/tinymce';
import { useI18n } from '@/context/I18nContext';

type Directionality = 'ltr' | 'rtl';

export interface RichTextFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: number;
  directionality?: Directionality;
  disabled?: boolean;
  placeholder?: string;
}

declare global {
  interface Window {
    tinymce?: any;
  }
}

function ensureTinyMCEScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.tinymce) return Promise.resolve();

  const existing = document.querySelector('script[data-tinymce]') as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load TinyMCE script')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/tinymce/tinymce.min.js';
    script.async = true;
    script.defer = true;
    script.dataset.tinymce = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TinyMCE script'));
    document.head.appendChild(script);
  });
}

export function RichTextField({
  value,
  onChange,
  height = 400,
  directionality,
  disabled,
  placeholder,
}: RichTextFieldProps) {
  const { locale } = useI18n();
  const effectiveDirectionality = directionality ?? (locale === 'ar' ? 'rtl' : 'ltr');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useRef<any>(null);
  const editorId = useMemo(() => `rtf-${Math.random().toString(36).slice(2)}-${Date.now()}`, []);
  const lastValueRef = useRef<string | undefined>(undefined);
  const latestValueRef = useRef<string | undefined>(undefined);
  const isInitializingRef = useRef(false);

  // Update latest value ref
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Debounced value sync to prevent excessive updates
  const debouncedValueSync = useCallback(
    debounce((newValue: string) => {
      if (editorRef.current && !isInitializingRef.current) {
        const currentContent = editorRef.current.getContent();
        if (currentContent !== newValue) {
          editorRef.current.setContent(newValue);
          lastValueRef.current = newValue;
        }
      }
    }, 100),
    []
  );

  // Simple debounce function
  function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }

  // Simple throttle function
  function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    }) as T;
  }

  useEffect(() => {
    let cancelled = false;
    isInitializingRef.current = true;

    async function init() {
      await ensureTinyMCEScript();
      if (cancelled) return;

      const tinymce = window.tinymce;
      if (!tinymce || !textareaRef.current) return;

      // Ensure plugins/skins resolve from our local public assets
      try {
        tinymce.baseURL = `${window.location.origin}/tinymce`;
      } catch (_) {}

      try {
        const existing = tinymce.get(editorId);
        if (existing) {
          existing.remove();
        }
      } catch (_) {}

      const initOptions: TinyMCEInitOptions = { height, directionality: effectiveDirectionality };
      tinymce.init({
        ...createTinyMCEInit(initOptions),
        selector: `#${editorId}`,
        ...(disabled ? { readonly: true } : {}),
        placeholder,
        setup: (editor: any) => {
          editorRef.current = editor;
          
          editor.on('init', () => {
            if (cancelled) return;
            
            // Set initial content - prioritize latestValueRef to catch form updates
            const initial = latestValueRef.current ?? value ?? '';
            lastValueRef.current = initial;
            editor.setContent(initial);
            
            // Mark initialization as complete
            setTimeout(() => {
              isInitializingRef.current = false;
            }, 50);
          });

          // Simple change handler without throttling for reliability
          const handleChange = () => {
            if (cancelled) return;
            const next = editor.getContent();
            if (lastValueRef.current !== next) {
              lastValueRef.current = next;
              onChange?.(next);
            }
          };

          editor.on('change keyup setcontent', handleChange);
        },
      });
    }

    void init();

    return () => {
      cancelled = true;
      isInitializingRef.current = false;
      try {
        const tinymce = window.tinymce;
        const existing = tinymce?.get?.(editorId);
        if (existing) {
          existing.remove();
        }
        editorRef.current = null;
      } catch (_) {}
    };
  }, [editorId, height, effectiveDirectionality, disabled, placeholder]);

  // Simple and reliable value sync
  useEffect(() => {
    const next = value ?? '';
    
    // Only update if editor exists, not initializing, and content is different
    if (editorRef.current && !isInitializingRef.current) {
      const currentContent = editorRef.current.getContent();
      if (currentContent !== next) {
        // Direct update without debounce for reliability
        editorRef.current.setContent(next);
        lastValueRef.current = next;
      }
    }
  }, [value]);

  return <textarea id={editorId} ref={textareaRef} style={{ width: '100%', minHeight: height }} />;
}
