import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, fmt = "dd MMM yyyy") {
  if (!date) return "—";
  return format(new Date(date), fmt);
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function nightsBetween(checkIn: Date | string, checkOut: Date | string) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export const GROUP_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
];
