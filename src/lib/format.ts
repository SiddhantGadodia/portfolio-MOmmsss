export function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function formatXirr(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "N/A";
  return formatPercent(n * 100);
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatNumber(n: number | null | undefined, decimals = 3): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}
