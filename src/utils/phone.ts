export function normalizePhone(
  value: string | null | undefined,
): string | null {
  const digits = (value ?? "").replace(/\D/g, "");

  if (digits.startsWith("0027") && digits.length === 13)
    return "0" + digits.slice(4);
  if (digits.startsWith("27") && digits.length === 11)
    return "0" + digits.slice(2);
  if (digits.length === 9 && digits[0] !== "0") return "0" + digits;
  if (digits.length === 10 && digits[0] === "0") return digits;

  return null;
}

export function formatPhone(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  let national = digits;
  if (national.startsWith("0027")) national = national.slice(4);
  else if (national.startsWith("27") && national.length === 11)
    national = national.slice(2);
  else if (national.startsWith("0")) national = national.slice(1);

  return ["+27", national.slice(0, 2), national.slice(2, 5), national.slice(5)]
    .filter(Boolean)
    .join(" ");
}

export function phoneHref(value: string | null | undefined): string {
  const stored = normalizePhone(value);
  if (stored) return "+27" + stored.slice(1);
  return (value ?? "").replace(/[^\d+]/g, "");
}
