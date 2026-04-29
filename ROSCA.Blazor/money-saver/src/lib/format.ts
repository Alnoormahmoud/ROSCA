export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode || ""} ${amount.toFixed(2)}`.trim();
  }
}

export function periodLabel(p: string): string {
  if (p === "weekly") return "أسبوعي";
  if (p === "biweekly") return "كل أسبوعين";
  if (p === "monthly") return "شهري";
  return p;
}

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function formatDateAr(input: Date | string, withYear = true): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const day = d.getDate();
  const month = AR_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return withYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

export function formatDateTimeAr(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const time = d.toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatDateAr(d)} • ${time}`;
}
