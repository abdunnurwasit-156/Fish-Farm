"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pond, FishStock, WeightUpdate } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NewPondData = {
  name: string;
  area_m2: number;
  depth_m: number;
  water_source?: string;
  location_name?: string;
};

interface PondContextValue {
  // All ponds for this user
  ponds: Pond[];
  // Currently selected pond
  pond: Pond | null;
  // Stocks + weight data for the active pond
  stocks: FishStock[];
  lastWeights: Record<string, WeightUpdate>;
  unreadAlerts: number;
  loading: boolean;
  // Actions
  switchPond: (id: string) => void;
  createPond: (data: NewPondData) => Promise<Pond>;
  refresh: () => void;
  // Backwards-compat aliases (first stock)
  stock: FishStock | null;
  lastWeight: WeightUpdate | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PondContext = createContext<PondContextValue | null>(null);

const STORAGE_KEY = "aquafarm_active_pond";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PondProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [activePondId, setActivePondId] = useState<string | null>(null);
  const [stocks, setStocks] = useState<FishStock[]>([]);
  const [lastWeights, setLastWeights] = useState<Record<string, WeightUpdate>>({});
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Load everything ──────────────────────────────────────────────────────
  const load = useCallback(async (overridePondId?: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Fetch all ponds for this user
    const { data: allPonds } = await supabase
      .from("ponds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const pondList = allPonds ?? [];
    setPonds(pondList);
    if (!pondList.length) { setLoading(false); return; }

    // Resolve which pond to show: override → localStorage → most recent
    const stored = overridePondId ?? localStorage.getItem(STORAGE_KEY) ?? null;
    const active = pondList.find(p => p.id === stored) ?? pondList[0];
    setActivePondId(active.id);
    localStorage.setItem(STORAGE_KEY, active.id);

    // Load stocks for the active pond
    const { data: allStocks } = await supabase
      .from("fish_stocks")
      .select("*")
      .eq("pond_id", active.id)
      .order("created_at");
    const stockList = allStocks ?? [];
    setStocks(stockList);

    // Latest weight per stock
    const weightMap: Record<string, WeightUpdate> = {};
    for (const s of stockList) {
      const { data: wu } = await supabase
        .from("weight_updates")
        .select("*")
        .eq("fish_stock_id", s.id)
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (wu?.[0]) weightMap[s.id] = wu[0];
    }
    setLastWeights(weightMap);

    // Unread alert count
    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("pond_id", active.id)
      .eq("is_read", false);
    setUnreadAlerts(count ?? 0);

    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Switch active pond ───────────────────────────────────────────────────
  function switchPond(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    load(id);
  }

  // ── Create new pond ──────────────────────────────────────────────────────
  async function createPond(data: NewPondData): Promise<Pond> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: inserted, error } = await supabase
      .from("ponds")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    // Switch to the new pond immediately
    switchPond(inserted.id);
    return inserted as Pond;
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const pond = ponds.find(p => p.id === activePondId) ?? null;
  const stock = stocks[0] ?? null;
  const lastWeight = stocks[0] ? (lastWeights[stocks[0].id] ?? null) : null;

  return (
    <PondContext.Provider value={{
      ponds, pond, stocks, lastWeights, unreadAlerts, loading,
      switchPond, createPond, refresh: load,
      stock, lastWeight,
    }}>
      {children}
    </PondContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePondContext() {
  const ctx = useContext(PondContext);
  if (!ctx) throw new Error("usePondContext must be used inside <PondProvider>");
  return ctx;
}
