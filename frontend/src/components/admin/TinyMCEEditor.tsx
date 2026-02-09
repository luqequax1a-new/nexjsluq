'use client';

import { Input } from 'antd';

const { TextArea } = Input;

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: number;
  placeholder?: string;
}

export function TinyMCEEditor({ 
  value = '', 
  onChange, 
  height = 400,
  placeholder = 'İçerik yazın...'
}: RichTextEditorProps) {
  return (
    <TextArea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={Math.floor(height / 24)}
      style={{ minHeight: height }}
    />
  );
}
