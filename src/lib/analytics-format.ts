export function formatContentTypeLabel(contentType: string): string {
  return contentType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatAnalyticsDate(isoDate: string): string {
  const date = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
