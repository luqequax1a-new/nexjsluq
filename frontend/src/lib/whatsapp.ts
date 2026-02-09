export const DEFAULT_WHATSAPP_PRODUCT_TEMPLATE =
  "Merhaba 👋\n" +
  "{product_name} ürünü hakkında bilgi almak istiyorum.\n" +
  "Varyant: {variant_name}\n" +
  "Miktar: {quantity} {quantity_prefix}\n" +
  "Birim Fiyat: {price}{price_prefix}\n" +
  "Ürün linki: {product_url}";

export const DEFAULT_WHATSAPP_CART_TEMPLATE =
  "Merhaba 👋\n" +
  "Aşağıdaki sepet için bilgi almak istiyorum:\n\n" +
  "{cart_lines}\n\n" +
  "Toplam: {cart_total}\n" +
  "Sepet: {cart_restore_url}";

export function normalizePhone(input?: string | null): string {
  return String(input ?? "").replace(/\D/g, "");
}

export function fillTemplate(template: string, data: Record<string, unknown>): string {
  if (!template) return "";
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = (data as Record<string, unknown>)[key];
      return value === null || value === undefined ? "" : String(value);
    }
    return match;
  });
}

export function buildWhatsAppUrl(phone?: string | null, message?: string | null): string | null {
  const clean = normalizePhone(phone);
  if (!clean || !message) return null;
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`;
}
