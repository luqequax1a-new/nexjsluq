import React from "react";
import {
  Image,
  Video,
  Megaphone,
  ShoppingBag,
  Layers,
  LayoutGrid,
  ImageIcon,
  Grid3X3,
  Palette,
  Timer,
  Shield,
  Store,
  MessageSquare,
  Mail,
  HelpCircle,
  FileText,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  hero_slider: Image,
  video_hero: Video,
  marquee_banner: Megaphone,
  product_carousel: ShoppingBag,
  product_tabs: Layers,
  category_grid: LayoutGrid,
  full_banner: ImageIcon,
  banner_grid: Grid3X3,
  collection_grid: Palette,
  countdown_banner: Timer,
  info_cards: Shield,
  brand_logos: Store,
  testimonials: MessageSquare,
  newsletter: Mail,
  faq_accordion: HelpCircle,
  rich_text: FileText,
};

export function SectionIcon({ templateKey, size = 16 }: { templateKey: string; size?: number }) {
  const Icon = ICON_MAP[templateKey] || Layers;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function getSectionIcon(templateKey: string): LucideIcon {
  return ICON_MAP[templateKey] || Layers;
}
