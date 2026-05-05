import { FishStock, FeedRecommendation } from "@/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function calcFeedRecommendation(stock: FishStock, date: Date = new Date()): FeedRecommendation {
  const biomass_kg = stock.current_count * stock.avg_weight_kg;
  const dayOfWeek = date.getDay();
  const is_fasting_day = dayOfWeek === stock.fasting_day;

  const feedRate = is_fasting_day ? stock.feed_rate_pct / 100 / 2 : stock.feed_rate_pct / 100;
  const daily_feed_kg = parseFloat((biomass_kg * feedRate).toFixed(2));
  const morning_kg = parseFloat((daily_feed_kg * 0.6).toFixed(2));
  const afternoon_kg = parseFloat((daily_feed_kg * 0.4).toFixed(2));

  return {
    biomass_kg: parseFloat(biomass_kg.toFixed(2)),
    daily_feed_kg,
    morning_kg,
    afternoon_kg,
    is_fasting_day,
    fasting_reason: is_fasting_day
      ? `Weekly fasting day (${DAY_NAMES[stock.fasting_day]}) — 50% feed to maintain water quality`
      : undefined,
  };
}

export function daysSinceLastWeightUpdate(lastUpdateDate: string | null): number {
  if (!lastUpdateDate) return Infinity;
  const diff = Date.now() - new Date(lastUpdateDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns true only on the 15th and 30th of the month — AND the fish hasn't
 * been weighed in the last 14 days (so we don't nag if they just did it).
 */
export function needsWeightUpdate(lastUpdateDate: string | null): boolean {
  const today = new Date();
  const dom = today.getDate(); // day-of-month
  if (dom !== 15 && dom !== 30) return false;
  return daysSinceLastWeightUpdate(lastUpdateDate) >= 14;
}

export function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t`;
  return `${kg.toFixed(2)} kg`;
}
