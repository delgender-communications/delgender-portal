export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}

export function formatDate(
  value: string | Date,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(
    "en-ZA",
    opts ?? { day: "numeric", month: "short", year: "numeric" },
  );
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

export function formatDuration(
  from: string | Date,
  to?: string | Date | null,
): string {
  const start = typeof from === "string" ? new Date(from) : from;
  const end = to ? (typeof to === "string" ? new Date(to) : to) : new Date();

  const totalDays = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (totalDays < 1) return "Today";
  if (totalDays < 31) return `${totalDays} ${totalDays === 1 ? "day" : "days"}`;

  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) -
    (end.getDate() < start.getDate() ? 1 : 0);

  if (totalMonths < 12) {
    return `${totalMonths} ${totalMonths === 1 ? "month" : "months"}`;
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const yearPart = `${years} ${years === 1 ? "year" : "years"}`;

  return months === 0
    ? yearPart
    : `${yearPart} ${months} ${months === 1 ? "month" : "months"}`;
}
