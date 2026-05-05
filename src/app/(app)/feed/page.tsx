"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePond } from "@/hooks/usePond";
import { calcFeedRecommendation, formatKg } from "@/lib/feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { DateNav } from "@/components/ui/DateNav";
import { Meal, FeedLog } from "@/types";
import { Sun, Sunset, Plus, Check, Utensils, RefreshCw, Trash2, History, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, startOfDay, endOfDay } from "date-fns";

type ActiveFilter = "all" | string;

export default function FeedPage() {
  const supabase = createClient();
  const { pond, stocks } = usePond();

  // ── Date navigator — defaults to today ────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isViewingToday = isToday(selectedDate);

  // ── Species filter ─────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const activeStock = activeFilter === "all" ? null : (stocks.find(s => s.id === activeFilter) ?? null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [meals, setMeals] = useState<Meal[]>([]);
  // Logs for the selected date (schedule card)
  const [dateLogs, setDateLogs] = useState<FeedLog[]>([]);
  // Full history logs (history table — all species, all dates)
  const [allFeedLogs, setAllFeedLogs] = useState<FeedLog[]>([]);

  const [modalMeal, setModalMeal] = useState(false);
  const [modalLog, setModalLog] = useState<"morning" | "afternoon" | null>(null);
  const [mealForm, setMealForm] = useState({ name: "", pellet_size: "", brand: "", protein_pct: "", notes: "" });
  const [logForm, setLogForm] = useState({ actual_kg: "", meal_id: "", stock_id: "" });
  const [submitting, setSubmitting] = useState(false);

  // ── Aggregated recommendations ─────────────────────────────────────────────
  const allRecs = stocks.map(s => calcFeedRecommendation(s, selectedDate));
  const aggregatedRec = allRecs.length > 0 ? {
    biomass_kg:    allRecs.reduce((n, r) => n + r.biomass_kg, 0),
    daily_feed_kg: allRecs.reduce((n, r) => n + r.daily_feed_kg, 0),
    morning_kg:    allRecs.reduce((n, r) => n + r.morning_kg, 0),
    afternoon_kg:  allRecs.reduce((n, r) => n + r.afternoon_kg, 0),
    is_fasting_day: allRecs.some(r => r.is_fasting_day),
    fasting_reason: allRecs.find(r => r.is_fasting_day)?.fasting_reason ?? null,
  } : null;

  const rec = activeFilter === "all"
    ? aggregatedRec
    : (activeStock ? calcFeedRecommendation(activeStock, selectedDate) : null);

  // ── Loaders ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pond && stocks.length > 0) {
      loadMeals();
      loadDateLogs();
      loadAllLogs();
    }
  }, [pond, stocks.length, activeFilter, selectedDate]);

  async function loadMeals() {
    if (!pond) return;
    const { data } = await supabase.from("meals").select("*").eq("pond_id", pond.id).order("created_at");
    setMeals(data ?? []);
  }

  async function loadDateLogs() {
    if (!pond || stocks.length === 0) return;
    const stockIds = activeFilter === "all" ? stocks.map(s => s.id) : [activeFilter];
    const { data } = await supabase
      .from("feed_logs")
      .select("*")
      .in("fish_stock_id", stockIds)
      .gte("logged_at", startOfDay(selectedDate).toISOString())
      .lte("logged_at", endOfDay(selectedDate).toISOString())
      .order("logged_at", { ascending: false });
    setDateLogs(data ?? []);
  }

  async function loadAllLogs() {
    if (!pond || stocks.length === 0) return;
    // History table always shows all species
    const { data } = await supabase
      .from("feed_logs")
      .select("*")
      .in("fish_stock_id", stocks.map(s => s.id))
      .order("logged_at", { ascending: false });
    setAllFeedLogs(data ?? []);
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function saveMeal() {
    if (!pond) return;
    setSubmitting(true);
    try {
      await supabase.from("meals").insert({
        pond_id: pond.id,
        name: mealForm.name,
        pellet_size: mealForm.pellet_size || null,
        brand: mealForm.brand || null,
        protein_pct: mealForm.protein_pct ? parseFloat(mealForm.protein_pct) : null,
        notes: mealForm.notes || null,
      });
      toast.success("খাবারের ধরন সংরক্ষিত হয়েছে");
      setModalMeal(false);
      setMealForm({ name: "", pellet_size: "", brand: "", protein_pct: "", notes: "" });
      loadMeals();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSubmitting(false); }
  }

  async function logFeed() {
    const targetStock = stocks.find(s => s.id === logForm.stock_id) ?? activeStock;
    if (!targetStock || !modalLog) return;
    const targetRec = calcFeedRecommendation(targetStock, selectedDate);
    setSubmitting(true);
    try {
      await supabase.from("feed_logs").insert({
        fish_stock_id: targetStock.id,
        session: modalLog,
        recommended_kg: modalLog === "morning" ? targetRec.morning_kg : targetRec.afternoon_kg,
        actual_kg: logForm.actual_kg ? parseFloat(logForm.actual_kg) : null,
        meal_id: logForm.meal_id || null,
        is_fasting_day: targetRec.is_fasting_day,
      });
      toast.success(`${modalLog === "morning" ? "সকালের" : "বিকেলের"} খাবার রেকর্ড হয়েছে`);
      setModalLog(null);
      setLogForm({ actual_kg: "", meal_id: "", stock_id: activeFilter === "all" ? "" : activeFilter });
      loadDateLogs();
      loadAllLogs();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSubmitting(false); }
  }

  function openLogModal(session: "morning" | "afternoon") {
    setLogForm({ actual_kg: "", meal_id: "", stock_id: activeFilter === "all" ? "" : activeFilter });
    setModalLog(session);
  }

  async function deleteMeal(id: string) {
    await supabase.from("meals").delete().eq("id", id);
    loadMeals();
  }

  // ── Derived display ────────────────────────────────────────────────────────
  const dayMorningLogs   = dateLogs.filter(l => l.session === "morning");
  const dayAfternoonLogs = dateLogs.filter(l => l.session === "afternoon");
  const hasMorning   = dayMorningLogs.length > 0;
  const hasAfternoon = dayAfternoonLogs.length > 0;

  const totalGivenMorning   = dayMorningLogs.reduce((n, l) => n + (l.actual_kg ?? l.recommended_kg), 0);
  const totalGivenAfternoon = dayAfternoonLogs.reduce((n, l) => n + (l.actual_kg ?? l.recommended_kg), 0);

  const stockMap = Object.fromEntries(stocks.map(s => [s.id, s.species]));
  const mealMap  = Object.fromEntries(meals.map(m => [m.id, m.name]));

  // Group history by date — always full all-species history
  const logsByDate = allFeedLogs.reduce<Record<string, FeedLog[]>>((acc, log) => {
    const day = format(new Date(log.logged_at), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});
  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

  const feedRateLabel = activeFilter === "all"
    ? `${stocks.map(s => s.feed_rate_pct).filter((v, i, a) => a.indexOf(v) === i).join(" / ")}%`
    : `${activeStock?.feed_rate_pct ?? "—"}%`;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto page-enter">

      {/* ── Header with date navigator ── */}
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">খাবার ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isViewingToday ? "আজকের সময়সূচি" : "পুরনো তথ্য"}
          </p>
        </div>
        <DateNav date={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Past-date banner */}
      {!isViewingToday && (
        <div className="mb-4 rounded-xl bg-gray-100 border border-gray-200 p-3 flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-gray-500 shrink-0" />
          <p className="text-sm text-gray-600">
            <strong>{format(selectedDate, "EEEE, MMM d yyyy")}</strong>-এর পুরনো তথ্য দেখছেন — শুধু পড়া যাবে।
            <button onClick={() => setSelectedDate(new Date())} className="ml-2 text-brand-600 font-medium hover:underline">
              আজকে ফিরুন
            </button>
          </p>
        </div>
      )}

      {/* ── Species filter tabs ── */}
      {stocks.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeFilter === "all"
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            }`}
          >
            সব প্রজাতি
          </button>
          {stocks.map(s => (
            <button key={s.id} onClick={() => setActiveFilter(s.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeFilter === s.id
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              {s.species}
            </button>
          ))}
        </div>
      )}

      {/* ── Fasting day banner ── */}
      {rec?.is_fasting_day && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-800 font-medium">
            উপবাসের দিন — পানির মান ভালো রাখতে ৫০% খাবার দিন
          </p>
        </div>
      )}

      {/* ── Schedule card ── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isViewingToday ? "আজকের" : format(selectedDate, "MMM d")} খাবারের সময়সূচি
            {activeFilter !== "all" && activeStock && (
              <span className="ml-2 text-sm font-normal text-brand-600">— {activeStock.species}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Morning */}
            <div className={`rounded-xl border-2 p-4 ${hasMorning ? "border-brand-300 bg-brand-50" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-gray-900">সকাল</span>
                </div>
                {hasMorning
                  ? <Badge variant="green">রেকর্ড হয়েছে</Badge>
                  : isViewingToday
                    ? <Badge variant="gray">বাকি আছে</Badge>
                    : <Badge variant="gray">রেকর্ড হয়নি</Badge>
                }
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {rec ? formatKg(rec.morning_kg) : "—"}
              </p>
              <p className="text-xs text-gray-500 mb-3">সুপারিশকৃত (দৈনিকের ৬০%)</p>

              {hasMorning ? (
                <div className="space-y-1">
                  <p className="text-xs text-brand-700">
                    <Check className="inline h-3 w-3 mr-1" />
                    দেওয়া হয়েছে: {formatKg(totalGivenMorning)}
                    {activeFilter === "all" && dayMorningLogs.length > 1 && (
                      <span className="ml-1 text-gray-400">({dayMorningLogs.length}টি প্রজাতি)</span>
                    )}
                  </p>
                </div>
              ) : isViewingToday ? (
                <Button size="sm" onClick={() => openLogModal("morning")} className="w-full">
                  সকালের খাবার রেকর্ড করুন
                </Button>
              ) : (
                <p className="text-xs text-gray-400 italic">এই দিনের খাবার রেকর্ড হয়নি</p>
              )}
            </div>

            {/* Afternoon */}
            <div className={`rounded-xl border-2 p-4 ${hasAfternoon ? "border-brand-300 bg-brand-50" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sunset className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-gray-900">বিকেল</span>
                </div>
                {hasAfternoon
                  ? <Badge variant="green">রেকর্ড হয়েছে</Badge>
                  : isViewingToday
                    ? <Badge variant="gray">বাকি আছে</Badge>
                    : <Badge variant="gray">রেকর্ড হয়নি</Badge>
                }
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {rec ? formatKg(rec.afternoon_kg) : "—"}
              </p>
              <p className="text-xs text-gray-500 mb-3">সুপারিশকৃত (দৈনিকের ৪০%)</p>

              {hasAfternoon ? (
                <p className="text-xs text-brand-700">
                  <Check className="inline h-3 w-3 mr-1" />
                  দেওয়া হয়েছে: {formatKg(totalGivenAfternoon)}
                  {activeFilter === "all" && dayAfternoonLogs.length > 1 && (
                    <span className="ml-1 text-gray-400">({dayAfternoonLogs.length}টি প্রজাতি)</span>
                  )}
                </p>
              ) : isViewingToday ? (
                <Button size="sm" onClick={() => openLogModal("afternoon")} className="w-full">
                  বিকেলের খাবার রেকর্ড করুন
                </Button>
              ) : (
                <p className="text-xs text-gray-400 italic">এই দিনের খাবার রেকর্ড হয়নি</p>
              )}
            </div>
          </div>

          {rec && (
            <div className="mt-4 rounded-xl bg-gray-50 p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">বায়োমাস</p>
                <p className="font-semibold text-sm">{formatKg(rec.biomass_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">দৈনিক মোট</p>
                <p className="font-semibold text-sm">{formatKg(rec.daily_feed_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">খাবারের হার</p>
                <p className="font-semibold text-sm">{feedRateLabel}{rec.is_fasting_day ? " (50%)" : ""}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Custom meal types ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Utensils className="h-4 w-4" /> খাবারের ধরন</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setModalMeal(true)}>
            <Plus className="h-3 w-3" /> যোগ করুন
          </Button>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">এখনো কোনো খাবারের ধরন নেই। আপনার পেলেট বা খাবারের ব্র্যান্ড যোগ করুন।</p>
          ) : (
            <div className="space-y-2">
              {meals.map(meal => (
                <div key={meal.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{meal.name}</p>
                    <p className="text-xs text-gray-500">
                      {[meal.brand, meal.pellet_size && `Size: ${meal.pellet_size}`, meal.protein_pct && `${meal.protein_pct}% protein`]
                        .filter(Boolean).join(" · ")}
                    </p>

                  </div>
                  <button onClick={() => deleteMeal(meal.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Feed history — only in "All Species" view ── */}
      {activeFilter === "all" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" /> খাবারের ইতিহাস
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedDates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">এখনো কোনো খাবারের রেকর্ড নেই। উপরে প্রথম খাবার রেকর্ড করুন।</p>
            ) : (
              <div className="space-y-4">
                {sortedDates.map(day => {
                  const logs = logsByDate[day];
                  const morningLogs   = logs.filter(l => l.session === "morning");
                  const afternoonLogs = logs.filter(l => l.session === "afternoon");
                  const totalGiven = logs.reduce((n, l) => n + (l.actual_kg ?? l.recommended_kg), 0);
                  const totalRec   = logs.reduce((n, l) => n + l.recommended_kg, 0);
                  const isFasting  = logs.some(l => l.is_fasting_day);
                  const isDayToday = day === format(new Date(), "yyyy-MM-dd");
                  // Highlight the selected date
                  const isSelected = day === format(selectedDate, "yyyy-MM-dd");
                  const showSpecies = stocks.length > 1;

                  return (
                    <div key={day} id={`day-${day}`}
                      className={isSelected && !isDayToday ? "ring-2 ring-brand-400 ring-offset-2 rounded-xl" : ""}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {isDayToday ? "আজকে" : format(new Date(day + "T00:00:00"), "EEEE, MMM d yyyy")}
                        </span>
                        {isFasting && <Badge variant="blue">উপবাসের দিন</Badge>}
                        {isSelected && !isDayToday && (
                          <Badge variant="green">নির্বাচিত</Badge>
                        )}
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500">
                              <th className="text-left px-4 py-2.5 font-medium">সেশন</th>
                              {showSpecies && <th className="text-left px-4 py-2.5 font-medium">প্রজাতি</th>}
                              <th className="text-right px-4 py-2.5 font-medium">সুপারিশ</th>
                              <th className="text-right px-4 py-2.5 font-medium">দেওয়া হয়েছে</th>
                              <th className="text-right px-4 py-2.5 font-medium">খাবারের ধরন</th>
                              <th className="text-right px-4 py-2.5 font-medium">পার্থক্য</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {morningLogs.map(log => (
                              <tr key={log.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                                    <span className="font-medium text-gray-800">সকাল</span>
                                  </div>
                                </td>
                                {showSpecies && (
                                  <td className="px-4 py-3 text-xs text-gray-500">{stockMap[log.fish_stock_id] ?? "—"}</td>
                                )}
                                <td className="px-4 py-3 text-right text-gray-600">{formatKg(log.recommended_kg)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                  {formatKg(log.actual_kg ?? log.recommended_kg)}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                  {log.meal_id && mealMap[log.meal_id] ? mealMap[log.meal_id] : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {log.actual_kg != null ? (
                                    <span className={log.actual_kg >= log.recommended_kg ? "text-brand-600" : "text-amber-600"}>
                                      {log.actual_kg >= log.recommended_kg ? "+" : ""}
                                      {formatKg(log.actual_kg - log.recommended_kg)}
                                    </span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>
                              </tr>
                            ))}
                            {afternoonLogs.map(log => (
                              <tr key={log.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Sunset className="h-3.5 w-3.5 text-orange-400" />
                                    <span className="font-medium text-gray-800">বিকেল</span>
                                  </div>
                                </td>
                                {showSpecies && (
                                  <td className="px-4 py-3 text-xs text-gray-500">{stockMap[log.fish_stock_id] ?? "—"}</td>
                                )}
                                <td className="px-4 py-3 text-right text-gray-600">{formatKg(log.recommended_kg)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                  {formatKg(log.actual_kg ?? log.recommended_kg)}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                  {log.meal_id && mealMap[log.meal_id] ? mealMap[log.meal_id] : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {log.actual_kg != null ? (
                                    <span className={log.actual_kg >= log.recommended_kg ? "text-brand-600" : "text-amber-600"}>
                                      {log.actual_kg >= log.recommended_kg ? "+" : ""}
                                      {formatKg(log.actual_kg - log.recommended_kg)}
                                    </span>
                                  ) : <span className="text-gray-300">—</span>}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50/60">
                              <td className="px-4 py-2.5 text-xs font-semibold text-gray-500">দৈনিক মোট</td>
                              {showSpecies && <td />}
                              <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">{formatKg(totalRec)}</td>
                              <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-900">{formatKg(totalGiven)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Modal: Add meal type ── */}
      <Modal open={modalMeal} onClose={() => setModalMeal(false)} title="খাবারের ধরন যোগ করুন">
        <div className="space-y-4">
          <Input label="নাম" id="meal-name" placeholder="যেমন: স্টার্টার পেলেট" value={mealForm.name}
            onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="ব্র্যান্ড" id="meal-brand" placeholder="যেমন: BioFeed" value={mealForm.brand}
              onChange={e => setMealForm(f => ({ ...f, brand: e.target.value }))} />
            <Input label="পেলেটের সাইজ" id="meal-size" placeholder="যেমন: ২মিমি" value={mealForm.pellet_size}
              onChange={e => setMealForm(f => ({ ...f, pellet_size: e.target.value }))} />
          </div>
          <Input label="প্রোটিন %" id="meal-protein" type="number" placeholder="যেমন: ৩২" value={mealForm.protein_pct}
            onChange={e => setMealForm(f => ({ ...f, protein_pct: e.target.value }))} />
          <Input label="নোট" id="meal-notes" value={mealForm.notes}
            onChange={e => setMealForm(f => ({ ...f, notes: e.target.value }))} />
          <Button onClick={saveMeal} loading={submitting} className="w-full" disabled={!mealForm.name}>সংরক্ষণ করুন</Button>
        </div>
      </Modal>

      {/* ── Modal: Log feed ── */}
      <Modal open={!!modalLog} onClose={() => setModalLog(null)}
        title={`${modalLog === "morning" ? "সকালের" : "বিকেলের"} খাবার রেকর্ড করুন`}>
        <div className="space-y-4">
          {(activeFilter === "all" || stocks.length > 1) && (
            <Select label="প্রজাতি" id="log-stock"
              options={stocks.map(s => ({ value: s.id, label: s.species }))}
              placeholder="প্রজাতি বেছে নিন"
              value={logForm.stock_id}
              onChange={e => setLogForm(f => ({ ...f, stock_id: e.target.value }))} />
          )}
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            {(() => {
              const s = stocks.find(st => st.id === logForm.stock_id) ?? activeStock;
              if (!s) return <p className="text-sm text-gray-400">প্রজাতি বেছে নিলে সুপারিশ দেখতে পাবেন</p>;
              const r = calcFeedRecommendation(s, selectedDate);
              return (
                <>
                  <p className="text-xs text-gray-500 mb-1">{s.species}-এর জন্য সুপারিশকৃত</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {modalLog ? formatKg(modalLog === "morning" ? r.morning_kg : r.afternoon_kg) : "—"}
                  </p>
                  {r.is_fasting_day && <p className="text-xs text-blue-600 mt-1">উপবাসের দিন — ৫০% হারে দেওয়া হচ্ছে</p>}
                </>
              );
            })()}
          </div>
          <Input label="আসলে কতটুকু দিয়েছেন (কেজি)" id="actual-kg" type="number" step="0.01"
            placeholder="খালি রাখলে সুপারিশকৃত পরিমাণ ব্যবহার হবে"
            value={logForm.actual_kg} onChange={e => setLogForm(f => ({ ...f, actual_kg: e.target.value }))} />
          {meals.length > 0 && (
            <Select label="কোন খাবার দিয়েছেন" id="meal-select"
              options={meals.map(m => ({ value: m.id, label: m.name }))}
              placeholder="খাবারের ধরন বেছে নিন (ঐচ্ছিক)"
              value={logForm.meal_id} onChange={e => setLogForm(f => ({ ...f, meal_id: e.target.value }))} />
          )}
          <Button onClick={logFeed} loading={submitting} className="w-full"
            disabled={!logForm.stock_id && !activeStock}>
            রেকর্ড নিশ্চিত করুন
          </Button>
        </div>
      </Modal>
    </div>
  );
}
