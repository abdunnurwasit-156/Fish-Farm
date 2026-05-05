import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function daysAgo(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export const FISH_SPECIES = [
  "Rui (Rohu)",
  "Katla",
  "Mrigel (Mrigal)",
  "Silver Carp",
  "Grass Carp",
  "Common Carp",
  "Bighead Carp",
  "Shing (Stinging Catfish)",
  "Magur (Walking Catfish)",
  "Pangas (Pangasius)",
  "Tilapia",
  "Koi (Climbing Perch)",
  "Taki (Spotted Snakehead)",
  "Shol (Snakehead)",
  "Bata",
  "Baim (Spiny Eel)",
  "Chingri (Freshwater Shrimp)",
  "Golsha (Yellow Catfish)",
  "Other",
];

export const WATER_SOURCES = ["Freshwater River", "Groundwater / Borehole", "Rainwater", "Canal", "Municipal", "Other"];

export const FASTING_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const ALERT_COLORS = {
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "text-blue-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-500" },
  danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-500" },
};
