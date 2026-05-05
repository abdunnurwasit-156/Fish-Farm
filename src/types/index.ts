export interface Pond {
  id: string;
  user_id: string;
  name: string;
  area_m2: number;
  depth_m: number;
  water_source?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  created_at: string;
}

export interface FishStock {
  id: string;
  pond_id: string;
  species: string;
  initial_count: number;
  current_count: number;
  avg_weight_kg: number;
  release_date: string;
  feed_rate_pct: number;
  fasting_day: number; // 0=Sun ... 6=Sat
  created_at: string;
}

export interface WeightUpdate {
  id: string;
  fish_stock_id: string;
  avg_weight_kg: number;
  recorded_at: string;
}

export interface Meal {
  id: string;
  pond_id: string;
  name: string;
  pellet_size?: string;
  brand?: string;
  protein_pct?: number;
  notes?: string;
  created_at: string;
}

export interface FeedLog {
  id: string;
  fish_stock_id: string;
  meal_id?: string;
  session: "morning" | "afternoon";
  recommended_kg: number;
  actual_kg?: number;
  is_fasting_day: boolean;
  logged_at: string;
}

export interface MortalityLog {
  id: string;
  fish_stock_id: string;
  count: number;
  cause?: string;
  notes?: string;
  logged_at: string;
}

export interface WaterQualityLog {
  id: string;
  pond_id: string;
  ph?: number;
  dissolved_oxygen_mg?: number;
  ammonia_mg?: number;
  temperature_c?: number;
  turbidity?: string;
  notes?: string;
  logged_at: string;
}

export interface Alert {
  id: string;
  pond_id: string;
  type: "weather" | "ammonia" | "mortality" | "weight_update" | "fasting" | "water_quality" | "general";
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 preview for display only
  created_at?: string;
}

export interface AiChat {
  id: string;
  user_id: string;
  pond_id?: string;
  title: string;
  mode: "chat" | "disease";
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface FeedRecommendation {
  biomass_kg: number;
  daily_feed_kg: number;
  morning_kg: number;
  afternoon_kg: number;
  is_fasting_day: boolean;
  fasting_reason?: string;
}
