export function formatCzk(value: number): string {
  return (
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(value) + " Kč"
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
