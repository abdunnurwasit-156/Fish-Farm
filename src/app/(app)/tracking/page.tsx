"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePond } from "@/hooks/usePond";
import { formatDate, daysAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MortalityLog, WaterQualityLog, WeightUpdate } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Scale, Skull, FlaskConical, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type Tab = "biomass" | "mortality" | "water" | "weights";

export default function TrackingPage() {
  const supabase = createClient();
  const { pond, stock } = usePond();
  const [tab, setTab] = useState<Tab>("biomass");
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterQualityLog[]>([]);
  const [weightUpdates, setWeightUpdates] = useState<WeightUpdate[]>([]);

  useEffect(() => {
    if (pond && stock) { loadAll(); }
  }, [pond, stock]);

  async function loadAll() {
    if (!stock || !pond) return;
    const [m, w, wu] = await Promise.all([
      supabase.from("mortality_logs").select("*").eq("fish_stock_id", stock.id).order("logged_at", { ascending: false }),
      supabase.from("water_quality_logs").select("*").eq("pond_id", pond.id).order("logged_at", { ascending: false }),
      supabase.from("weight_updates").select("*").eq("fish_stock_id", stock.id).order("recorded_at"),
    ]);
    setMortalityLogs(m.data ?? []);
    setWaterLogs(w.data ?? []);
    setWeightUpdates(wu.data ?? []);
  }

  // Build biomass chart data from weight updates
  const biomassData = [
    stock ? { date: formatDate(stock.release_date), weight: stock.avg_weight_kg, biomass: stock.initial_count * stock.avg_weight_kg } : null,
    ...weightUpdates.map(wu => ({
      date: format(new Date(wu.recorded_at), "MMM d"),
      weight: wu.avg_weight_kg,
      biomass: (stock?.current_count ?? 0) * wu.avg_weight_kg,
    })),
  ].filter(Boolean);

  const TABS = [
    { id: "biomass" as Tab, label: "বায়োমাস", icon: TrendingUp },
    { id: "water" as Tab, label: "পানির মান", icon: FlaskConical },
    { id: "weights" as Tab, label: "ওজনের ইতিহাস", icon: Scale },
    { id: "mortality" as Tab, label: "মৃত্যু", icon: Skull },
  ];

  const totalDead = mortalityLogs.reduce((s, l) => s + l.count, 0);
  const survivalRate = stock ? (((stock.initial_count - totalDead) / stock.initial_count) * 100).toFixed(1) : "—";

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">ট্র্যাকিং</h1>
        <p className="text-sm text-gray-500 mt-0.5">আপনার পুকুরের ইতিহাস ও বিশ্লেষণ</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 mb-1">চলছে কত দিন</p>
          <p className="text-2xl font-bold">{stock ? daysAgo(stock.release_date) : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 mb-1">বেঁচে থাকার হার</p>
          <p className="text-2xl font-bold text-brand-600">{survivalRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 mb-1">মোট মৃত্যু</p>
          <p className="text-2xl font-bold text-red-500">{totalDead}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 mb-1">বর্তমান গড় ওজন</p>
          <p className="text-2xl font-bold">{stock?.avg_weight_kg} kg</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              tab === id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Biomass chart */}
      {tab === "biomass" && (
        <Card>
          <CardHeader><CardTitle>সময়ের সাথে বায়োমাসের বৃদ্ধি</CardTitle></CardHeader>
          <CardContent>
            {biomassData.length < 2 ? (
              <p className="text-sm text-gray-400 text-center py-8">বৃদ্ধির ট্রেন্ড দেখতে প্রতি ১৫ দিনে ওজন আপডেট করুন।</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={biomassData}>
                  <defs>
                    <linearGradient id="biomassGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)} kg`, "বায়োমাস"]} />
                  <Area type="monotone" dataKey="biomass" stroke="#16a34a" strokeWidth={2} fill="url(#biomassGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Water quality */}
      {tab === "water" && (
        <div className="space-y-4">
          {waterLogs.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-gray-400">এখনো পানির মান রেকর্ড নেই। ড্যাশবোর্ড থেকে রেকর্ড করুন।</CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>সময়ের সাথে pH পরিবর্তন</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[...waterLogs].reverse().map(l => ({ date: format(new Date(l.logged_at), "MMM d"), ph: l.ph }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[5, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="ph" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>সাম্প্রতিক রিডিং</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {waterLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-start justify-between rounded-xl border border-gray-100 p-3">
                        <div>
                          <p className="text-xs text-gray-500">{formatDate(log.logged_at)}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {log.ph && <Badge variant="blue">pH {log.ph}</Badge>}
                            {log.dissolved_oxygen_mg && <Badge variant={log.dissolved_oxygen_mg < 4 ? "red" : log.dissolved_oxygen_mg < 5 ? "amber" : "green"}>DO {log.dissolved_oxygen_mg}</Badge>}
                            {log.ammonia_mg && <Badge variant={log.ammonia_mg > 0.5 ? "red" : "green"}>NH₃ {log.ammonia_mg}</Badge>}
                            {log.temperature_c && <Badge variant="gray">{log.temperature_c}°C</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Weight history */}
      {tab === "weights" && (
        <Card>
          <CardHeader><CardTitle>ওজন আপডেটের ইতিহাস</CardTitle></CardHeader>
          <CardContent>
            {weightUpdates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">এখনো কোনো ওজন আপডেট হয়নি।</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weightUpdates.map(wu => ({ date: format(new Date(wu.recorded_at), "MMM d"), weight: wu.avg_weight_kg }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`${v} kg`, "গড় ওজন"]} />
                    <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {[...weightUpdates].reverse().map((wu) => (
                    <div key={wu.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{formatDate(wu.recorded_at)}</span>
                      <span className="font-semibold text-sm">{wu.avg_weight_kg} kg</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mortality log */}
      {tab === "mortality" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">
            <Skull className="h-4 w-4 text-red-400" /> মৃত্যুর রেকর্ড
          </CardTitle></CardHeader>
          <CardContent>
            {mortalityLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">এখনো কোনো মৃত্যুর ঘটনা রেকর্ড হয়নি।</p>
            ) : (
              <div className="space-y-2">
                {mortalityLogs.map(log => (
                  <div key={log.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-red-800">{log.count}টি মাছ মারা গেছে</p>
                        {log.cause && <p className="text-xs text-red-700 mt-0.5">কারণ: {log.cause}</p>}
                        {log.notes && <p className="text-xs text-red-600 mt-0.5">{log.notes}</p>}
                      </div>
                      <span className="text-xs text-red-400">{formatDate(log.logged_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
