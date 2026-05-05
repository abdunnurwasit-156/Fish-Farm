"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calcFeedRecommendation, formatKg, needsWeightUpdate, daysSinceLastWeightUpdate } from "@/lib/feed";
import { formatDate, daysAgo, ALERT_COLORS, FISH_SPECIES, FASTING_DAYS } from "@/lib/utils";
import { usePond } from "@/hooks/usePond";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert as AlertType, FishStock, WaterQualityLog } from "@/types";
import { checkMortalityAlert, checkWaterQualityAlert, checkWeightUpdateAlert } from "@/lib/alerts";
import {
  Fish, Sun, Sunset, AlertTriangle, Plus, Scale,
  Skull, FlaskConical, Bell, ChevronRight, RefreshCw, TrendingUp,
  Pencil, ChevronDown, ChevronUp, Trash2, Clock,
} from "lucide-react";
import { DateNav } from "@/components/ui/DateNav";
import { isToday as _isToday, format as _format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { pond, stocks, lastWeights, unreadAlerts, loading, refresh } = usePond();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isViewingToday = _isToday(selectedDate);

  const [recentAlerts, setRecentAlerts] = useState<AlertType[]>([]);
  const [expandedStocks, setExpandedStocks] = useState(false);

  // Per-stock modals — track which stock is targeted
  const [targetStock, setTargetStock] = useState<FishStock | null>(null);
  const [modalDeath, setModalDeath] = useState(false);
  const [modalWeight, setModalWeight] = useState(false);
  const [modalEditFish, setModalEditFish] = useState(false);
  const [modalAddFish, setModalAddFish] = useState(false);
  const [modalWater, setModalWater] = useState(false);

  const [deathForm, setDeathForm] = useState({ count: "", cause: "", notes: "" });
  const [weightForm, setWeightForm] = useState({ avg_weight_kg: "" });
  const [waterForm, setWaterForm] = useState({ ph: "", do: "", ammonia: "", temp: "" });
  const [editForm, setEditForm] = useState({ species: "", count: "", avg_weight_kg: "", feed_rate_pct: "", fasting_day: "" });
  const [addForm, setAddForm] = useState({ species: "", count: "", avg_weight_kg: "", release_date: "", feed_rate_pct: "3", fasting_day: "3" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (pond) loadAlerts(); }, [pond]);
  useEffect(() => { if (!loading && !pond) router.push("/onboarding"); }, [loading, pond]);

  // Auto-check weight update alerts for all stocks
  useEffect(() => {
    if (pond && stocks.length > 0) {
      stocks.forEach(s => {
        const lw = lastWeights[s.id];
        const days = daysSinceLastWeightUpdate(lw?.recorded_at ?? null);
        if (needsWeightUpdate(lw?.recorded_at ?? null)) {
          checkWeightUpdateAlert(pond.id, days).then(loadAlerts);
        }
      });
    }
  }, [pond, stocks, lastWeights]);

  async function loadAlerts() {
    if (!pond) return;
    const { data } = await supabase.from("alerts").select("*")
      .eq("pond_id", pond.id).order("created_at", { ascending: false }).limit(4);
    setRecentAlerts(data ?? []);
  }

  function openDeath(s: FishStock) { setTargetStock(s); setDeathForm({ count: "", cause: "", notes: "" }); setModalDeath(true); }
  function openWeight(s: FishStock) { setTargetStock(s); setWeightForm({ avg_weight_kg: "" }); setModalWeight(true); }
  function openEdit(s: FishStock) {
    setTargetStock(s);
    setEditForm({ species: s.species, count: String(s.current_count), avg_weight_kg: String(s.avg_weight_kg), feed_rate_pct: String(s.feed_rate_pct), fasting_day: String(s.fasting_day) });
    setModalEditFish(true);
  }

  async function submitDeath() {
    if (!targetStock || !pond) return;
    setSubmitting(true);
    try {
      const count = parseInt(deathForm.count);
      await supabase.from("mortality_logs").insert({ fish_stock_id: targetStock.id, count, cause: deathForm.cause || null, notes: deathForm.notes || null });
      await supabase.from("fish_stocks").update({ current_count: targetStock.current_count - count }).eq("id", targetStock.id);
      await checkMortalityAlert(pond.id, targetStock, count);
      toast.success(`${count}টি ${targetStock.species} মৃত্যু রেকর্ড হয়েছে`);
      setModalDeath(false); refresh(); loadAlerts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function submitWeight() {
    if (!targetStock) return;
    setSubmitting(true);
    try {
      const avg = parseFloat(weightForm.avg_weight_kg);
      await supabase.from("weight_updates").insert({ fish_stock_id: targetStock.id, avg_weight_kg: avg });
      await supabase.from("fish_stocks").update({ avg_weight_kg: avg }).eq("id", targetStock.id);
      toast.success(`${targetStock.species}-এর ওজন আপডেট হয়েছে`);
      setModalWeight(false); refresh();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function submitEditFish() {
    if (!targetStock) return;
    setSubmitting(true);
    try {
      await supabase.from("fish_stocks").update({
        species: editForm.species,
        current_count: parseInt(editForm.count),
        avg_weight_kg: parseFloat(editForm.avg_weight_kg),
        feed_rate_pct: parseFloat(editForm.feed_rate_pct),
        fasting_day: parseInt(editForm.fasting_day),
      }).eq("id", targetStock.id);
      toast.success("মাছের তথ্য আপডেট হয়েছে");
      setModalEditFish(false); refresh();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function submitDeleteFish() {
    if (!targetStock) return;
    if (!confirm(`${targetStock.species} পুকুর থেকে মুছে ফেলবেন? এটি আর ফেরানো যাবে না।`)) return;
    setSubmitting(true);
    try {
      await supabase.from("fish_stocks").delete().eq("id", targetStock.id);
      toast.success(`${targetStock.species} সরানো হয়েছে`);
      setModalEditFish(false); refresh();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function submitAddFish() {
    if (!pond) return;
    setSubmitting(true);
    try {
      await supabase.from("fish_stocks").insert({
        pond_id: pond.id,
        species: addForm.species,
        initial_count: parseInt(addForm.count),
        current_count: parseInt(addForm.count),
        avg_weight_kg: parseFloat(addForm.avg_weight_kg),
        release_date: addForm.release_date,
        feed_rate_pct: parseFloat(addForm.feed_rate_pct),
        fasting_day: parseInt(addForm.fasting_day),
      });
      toast.success(`${addForm.species} পুকুরে যোগ করা হয়েছে`);
      setModalAddFish(false);
      setAddForm({ species: "", count: "", avg_weight_kg: "", release_date: "", feed_rate_pct: "3", fasting_day: "3" });
      refresh();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  async function submitWater() {
    if (!pond) return;
    setSubmitting(true);
    try {
      const log: Partial<WaterQualityLog> = {
        pond_id: pond.id,
        ph: waterForm.ph ? parseFloat(waterForm.ph) : undefined,
        dissolved_oxygen_mg: waterForm.do ? parseFloat(waterForm.do) : undefined,
        ammonia_mg: waterForm.ammonia ? parseFloat(waterForm.ammonia) : undefined,
        temperature_c: waterForm.temp ? parseFloat(waterForm.temp) : undefined,
      };
      await supabase.from("water_quality_logs").insert(log);
      await checkWaterQualityAlert(pond.id, log as WaterQualityLog);
      toast.success("পানির মান রেকর্ড হয়েছে");
      setModalWater(false); setWaterForm({ ph: "", do: "", ammonia: "", temp: "" }); loadAlerts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setSubmitting(false); }
  }

  // Totals across all stocks
  const totalFish = stocks.reduce((s, st) => s + st.current_count, 0);
  const totalBiomass = stocks.reduce((s, st) => s + st.current_count * st.avg_weight_kg, 0);
  const totalMorningFeed = stocks.reduce((s, st) => s + calcFeedRecommendation(st, selectedDate).morning_kg, 0);
  const totalAfternoonFeed = stocks.reduce((s, st) => s + calcFeedRecommendation(st, selectedDate).afternoon_kg, 0);
  const isFastingDay = stocks.some(st => calcFeedRecommendation(st, selectedDate).is_fasting_day);
  const daysSinceRelease = stocks[0] ? daysAgo(stocks[0].release_date) : 0;

  const overdueFishCount = stocks.filter(s => needsWeightUpdate(lastWeights[s.id]?.recorded_at ?? null)).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto page-enter">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{pond?.name ?? "My Pond"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pond?.area_m2} m² · গভীরতা {pond?.depth_m}m · {daysSinceRelease} দিন
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateNav date={selectedDate} onChange={setSelectedDate} />
          <Badge variant={isFastingDay ? "blue" : "green"}>
            {isFastingDay ? "উপবাসের দিন" : `${stocks.length}টি প্রজাতি`}
          </Badge>
        </div>
      </div>

      {/* Past-date banner */}
      {!isViewingToday && (
        <div className="mb-4 rounded-xl bg-gray-100 border border-gray-200 p-3 flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-gray-500 shrink-0" />
          <p className="text-sm text-gray-600">
            <strong>{_format(selectedDate, "EEEE, MMM d yyyy")}</strong>-এর খাবারের সময়সূচি দেখাচ্ছে।
            উপবাসের দিন হলে সুপারিশ ঠিক হয়ে যাবে।
            <button onClick={() => setSelectedDate(new Date())} className="ml-2 text-brand-600 font-medium hover:underline">
              আজকে ফিরুন
            </button>
          </p>
        </div>
      )}

      {/* Weight update banner */}
      {overdueFishCount > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <Scale className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 text-sm">ওজন আপডেট করতে হবে</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {overdueFishCount}টি প্রজাতির ওজন মাপা বাকি। সঠিক খাবার হিসাবের জন্য আপডেট করুন।
            </p>
          </div>
        </div>
      )}

      {/* Fasting day banner */}
      {isFastingDay && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 font-medium">সাপ্তাহিক উপবাসের দিন — পানির মান ভালো রাখতে ৫০% খাবার দিন</p>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-brand-50"><Fish className="h-4 w-4 text-brand-600" /></div>
              <span className="text-xs text-gray-500">জীবিত মাছ</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalFish.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{stocks.length}টি প্রজাতি</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-water-50"><TrendingUp className="h-4 w-4 text-water-600" /></div>
              <span className="text-xs text-gray-500">মোট বায়োমাস</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatKg(totalBiomass)}</p>
            <p className="text-xs text-gray-400 mt-1">সব প্রজাতি মিলিয়ে</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-50"><Sun className="h-4 w-4 text-amber-500" /></div>
              <span className="text-xs text-gray-500">সকালের খাবার</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatKg(totalMorningFeed)}</p>
            <p className="text-xs text-gray-400 mt-1">সব প্রজাতি মিলিয়ে</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50"><Sunset className="h-4 w-4 text-orange-500" /></div>
              <span className="text-xs text-gray-500">বিকেলের খাবার</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatKg(totalAfternoonFeed)}</p>
            <p className="text-xs text-gray-400 mt-1">সব প্রজাতি মিলিয়ে</p>
          </CardContent>
        </Card>
      </div>

      {/* Fish Stocks section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>মাছের স্টক</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setModalAddFish(true)}>
            <Plus className="h-3.5 w-3.5" /> প্রজাতি যোগ করুন
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {(expandedStocks ? stocks : stocks.slice(0, 4)).map(s => {
              const rec = calcFeedRecommendation(s);
              const lw = lastWeights[s.id];
              const overdue = needsWeightUpdate(lw?.recorded_at ?? null);
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition group">
                  {/* Species icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                    <Fish className="h-4 w-4 text-brand-500" />
                  </div>

                  {/* Name + date */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{s.species}</p>
                    <p className="text-[11px] text-gray-400">{s.current_count.toLocaleString()} টি · {formatDate(s.release_date)}</p>
                  </div>

                  {/* Stats inline */}
                  <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none mb-0.5">গড় ওজন</p>
                      <p className={`text-sm font-bold leading-none ${overdue ? "text-amber-500" : "text-gray-800"}`}>
                        {s.avg_weight_kg} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 leading-none mb-0.5">দৈনিক খাবার</p>
                      <p className="text-sm font-bold leading-none text-gray-800">{formatKg(rec.daily_feed_kg)}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openWeight(s)}
                      title="ওজন আপডেট"
                      className={`flex items-center justify-center h-8 w-8 rounded-lg transition ${
                        overdue
                          ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                          : "text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                      }`}>
                      <Scale className="h-4 w-4" />
                    </button>
                    <button onClick={() => openDeath(s)}
                      title="মৃত্যু রেকর্ড"
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <Skull className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(s)}
                      title="সম্পাদনা"
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show more / less */}
          {stocks.length > 4 && (
            <button onClick={() => setExpandedStocks(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition border-t border-gray-50">
              {expandedStocks
                ? <><ChevronUp className="h-3.5 w-3.5" /> কম দেখুন</>
                : <><ChevronDown className="h-3.5 w-3.5" /> আরও {stocks.length - 4}টি প্রজাতি দেখুন</>
              }
            </button>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card className="mb-6">
        <CardHeader><CardTitle>দ্রুত কাজ</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={() => setModalWater(true)}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition group">
              <FlaskConical className="h-6 w-6 text-gray-400 group-hover:text-blue-600" />
              <span className="text-xs font-medium text-gray-600">পানির মান রেকর্ড</span>
            </button>
            <Link href="/feed"
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:bg-brand-50 transition group">
              <Plus className="h-6 w-6 text-gray-400 group-hover:text-brand-600" />
              <span className="text-xs font-medium text-gray-600">খাবার রেকর্ড</span>
            </Link>
            <Link href="/alerts"
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-amber-300 hover:bg-amber-50 transition group col-span-2 sm:col-span-1">
              <Bell className="h-6 w-6 text-gray-400 group-hover:text-amber-600" />
              <span className="text-xs font-medium text-gray-600">
                সতর্কতা দেখুন {unreadAlerts > 0 && `(${unreadAlerts})`}
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> সাম্প্রতিক সতর্কতা
              {unreadAlerts > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </CardTitle>
            <Link href="/alerts" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              সব দেখুন <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAlerts.map(alert => {
                const colors = ALERT_COLORS[alert.severity];
                return (
                  <div key={alert.id} className={`rounded-xl border p-3 flex items-start gap-3 ${colors.bg} ${colors.border}`}>
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${colors.icon}`} />
                    <div>
                      <p className={`text-sm font-medium ${colors.text}`}>{alert.title}</p>
                      <p className={`text-xs mt-0.5 ${colors.text} opacity-80`}>{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modals ── */}

      {/* Log Death */}
      <Modal open={modalDeath} onClose={() => setModalDeath(false)}
        title={`মৃত্যু রেকর্ড — ${targetStock?.species}`}>
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">বর্তমান জীবিত সংখ্যা</p>
            <p className="text-2xl font-bold text-gray-900">{targetStock?.current_count.toLocaleString()}</p>
          </div>
          <Input label="কতটি মাছ মারা গেছে" id="death-count" type="number" min="1"
            max={String(targetStock?.current_count ?? 9999)}
            value={deathForm.count} onChange={e => setDeathForm(f => ({ ...f, count: e.target.value }))} />
          <Input label="কারণ (ঐচ্ছিক)" id="death-cause" placeholder="যেমন: রোগ, অক্সিজেন কম"
            value={deathForm.cause} onChange={e => setDeathForm(f => ({ ...f, cause: e.target.value }))} />
          <Input label="নোট (ঐচ্ছিক)" id="death-notes"
            value={deathForm.notes} onChange={e => setDeathForm(f => ({ ...f, notes: e.target.value }))} />
          <Button onClick={submitDeath} loading={submitting} className="w-full" variant="danger"
            disabled={!deathForm.count}>মৃত্যু রেকর্ড করুন</Button>
        </div>
      </Modal>

      {/* Update Weight */}
      <Modal open={modalWeight} onClose={() => setModalWeight(false)}
        title={`ওজন আপডেট — ${targetStock?.species}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">১০–২০টি মাছ ওজন করে গড় বের করুন। খাবারের হিসাব এখনই ঠিক হয়ে যাবে।</p>
          <Input label="নতুন গড় ওজন (কেজি)" id="new-weight" type="number" step="0.01"
            placeholder={`বর্তমান: ${targetStock?.avg_weight_kg} kg`}
            value={weightForm.avg_weight_kg}
            onChange={e => setWeightForm({ avg_weight_kg: e.target.value })} />
          <Button onClick={submitWeight} loading={submitting} className="w-full"
            disabled={!weightForm.avg_weight_kg}>আপডেট ও পুনরায় হিসাব করুন</Button>
        </div>
      </Modal>

      {/* Edit Fish Stock */}
      <Modal open={modalEditFish} onClose={() => setModalEditFish(false)}
        title={`সম্পাদনা — ${targetStock?.species}`}>
        <div className="space-y-4">
          <Select label="প্রজাতি" id="edit-species"
            options={FISH_SPECIES.map(s => ({ value: s, label: s }))}
            value={editForm.species}
            onChange={e => setEditForm(f => ({ ...f, species: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="বর্তমান সংখ্যা" id="edit-count" type="number"
              value={editForm.count} onChange={e => setEditForm(f => ({ ...f, count: e.target.value }))} />
            <Input label="গড় ওজন (কেজি)" id="edit-weight" type="number" step="0.01"
              value={editForm.avg_weight_kg} onChange={e => setEditForm(f => ({ ...f, avg_weight_kg: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="খাবারের হার (%/দিন)" id="edit-rate" type="number" step="0.5"
              value={editForm.feed_rate_pct} onChange={e => setEditForm(f => ({ ...f, feed_rate_pct: e.target.value }))} />
            <Select label="উপবাসের দিন" id="edit-fasting"
              options={FASTING_DAYS.map(d => ({ value: d.value, label: d.label }))}
              value={editForm.fasting_day}
              onChange={e => setEditForm(f => ({ ...f, fasting_day: e.target.value }))} />
          </div>
          <Button onClick={submitEditFish} loading={submitting} className="w-full">পরিবর্তন সংরক্ষণ করুন</Button>
          <button onClick={submitDeleteFish}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-red-500 hover:bg-red-50 transition">
            <Trash2 className="h-4 w-4" /> পুকুর থেকে এই প্রজাতি সরান
          </button>
        </div>
      </Modal>

      {/* Add Fish Species */}
      <Modal open={modalAddFish} onClose={() => setModalAddFish(false)} title="পুকুরে নতুন প্রজাতি যোগ করুন">
        <div className="space-y-4">
          <Select label="প্রজাতি" id="add-species"
            options={FISH_SPECIES.map(s => ({ value: s, label: s }))}
            placeholder="প্রজাতি বেছে নিন"
            value={addForm.species}
            onChange={e => setAddForm(f => ({ ...f, species: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="সংখ্যা" id="add-count" type="number"
              value={addForm.count} onChange={e => setAddForm(f => ({ ...f, count: e.target.value }))} />
            <Input label="গড় ওজন (কেজি)" id="add-weight" type="number" step="0.01"
              value={addForm.avg_weight_kg} onChange={e => setAddForm(f => ({ ...f, avg_weight_kg: e.target.value }))} />
          </div>
          <Input label="পোনা ছাড়ার তারিখ" id="add-date" type="date"
            value={addForm.release_date} onChange={e => setAddForm(f => ({ ...f, release_date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="খাবারের হার (%/দিন)" id="add-rate" type="number" step="0.5" hint="সাধারণত: ৩–৫%"
              value={addForm.feed_rate_pct} onChange={e => setAddForm(f => ({ ...f, feed_rate_pct: e.target.value }))} />
            <Select label="উপবাসের দিন" id="add-fasting"
              options={FASTING_DAYS.map(d => ({ value: d.value, label: d.label }))}
              value={addForm.fasting_day}
              onChange={e => setAddForm(f => ({ ...f, fasting_day: e.target.value }))} />
          </div>
          <Button onClick={submitAddFish} loading={submitting} className="w-full"
            disabled={!addForm.species || !addForm.count || !addForm.avg_weight_kg || !addForm.release_date}>
            পুকুরে যোগ করুন
          </Button>
        </div>
      </Modal>

      {/* Log Water Quality */}
      <Modal open={modalWater} onClose={() => setModalWater(false)} title="পানির মান রেকর্ড করুন">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="পিএইচ (pH)" id="ph" type="number" step="0.1" placeholder="৬.৫–৮.৫"
              value={waterForm.ph} onChange={e => setWaterForm(f => ({ ...f, ph: e.target.value }))} />
            <Input label="দ্রবীভূত অক্সিজেন (mg/L)" id="do" type="number" step="0.1" placeholder=">৫"
              value={waterForm.do} onChange={e => setWaterForm(f => ({ ...f, do: e.target.value }))} />
            <Input label="অ্যামোনিয়া (mg/L)" id="ammonia" type="number" step="0.01" placeholder="<০.৫"
              value={waterForm.ammonia} onChange={e => setWaterForm(f => ({ ...f, ammonia: e.target.value }))} />
            <Input label="তাপমাত্রা (°C)" id="temp" type="number" step="0.5"
              value={waterForm.temp} onChange={e => setWaterForm(f => ({ ...f, temp: e.target.value }))} />
          </div>
          <Button onClick={submitWater} loading={submitting} className="w-full">রেকর্ড করুন ও সতর্কতা চেক করুন</Button>
        </div>
      </Modal>
    </div>
  );
}
