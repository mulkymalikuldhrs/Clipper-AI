import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUsd(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatCampaignMoney(
  value: number | undefined | null,
  marketplace: string | undefined
): string {
  return marketplace === "content-rewards" ? formatUsd(value) : formatRupiah(value);
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(ts: number | undefined | null): string {
  if (!ts) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ts));
}

export function timeAgo(ts: number | undefined | null): string {
  if (!ts) return "-";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
