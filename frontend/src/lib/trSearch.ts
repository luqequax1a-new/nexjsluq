export function normalizeTrSearch(value: unknown): string {
  const raw = String(value ?? "");
  const lowered = raw.toLocaleLowerCase("tr-TR");

  return lowered
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/i\u0307/g, "i")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

function reactNodeToText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") return String(node);

  const n: any = node as any;
  if (Array.isArray(n)) return n.map(reactNodeToText).join(" ");

  const props = n?.props;
  if (props?.children != null) return reactNodeToText(props.children);

  return "";
}

export function antdSelectOptionToText(option: unknown): string {
  const o: any = option as any;
  const label = o?.label ?? o?.children;
  return reactNodeToText(label);
}

export function trIncludes(haystack: unknown, needle: unknown): boolean {
  return normalizeTrSearch(haystack).includes(normalizeTrSearch(needle));
}

export function trSelectFilterOption(input: string, option?: unknown): boolean {
  return trIncludes(antdSelectOptionToText(option), input);
}
