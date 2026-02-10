export interface SchemaField {
  key: string;
  type: 'text' | 'textarea' | 'number' | 'toggle' | 'select' | 'segment' | 'color' | 'range' | 'image' | 'repeater' | 'entity_select';
  label: string;
  group?: string;
  default?: any;
  options?: Record<string, string>;
  min?: number;
  max?: number;
  fields?: SchemaField[];
  button_label?: string;
  depends_on?: Record<string, string>;
  entity?: 'category' | 'brand' | 'product' | 'tag';
  multiple?: boolean;
}

export interface SchemaGroup {
  key: string;
  label: string;
}

export interface TemplateSchema {
  groups?: SchemaGroup[];
  fields?: SchemaField[];
}

export interface SectionTemplate {
  id: number;
  key: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
  schema: TemplateSchema | null;
  default_settings: Record<string, any> | null;
  is_active: boolean;
  allow_multiple: boolean;
  sort_order: number;
}

export interface PageSection {
  id: number;
  page_type: string;
  section_template_id: number;
  settings: Record<string, any>;
  is_active: boolean;
  position: number;
  template: SectionTemplate;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedTemplates {
  category: string;
  label: string;
  templates: SectionTemplate[];
}

export type ResponsiveMode = 'mobile' | 'tablet' | 'desktop';

export type SidebarMode = 'list' | 'settings' | 'add' | 'theme';
