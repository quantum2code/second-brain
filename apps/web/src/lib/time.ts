const IST_TIME_ZONE = "Asia/Kolkata";

export function formatDateInIST(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatTimeInIST(date: string | Date = new Date()): string {
  return `${new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(typeof date === "string" ? new Date(date) : date)} IST`;
}
