"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FISH_SPECIES, WATER_SOURCES, FASTING_DAYS } from "@/lib/utils";
import { Droplets, Fish, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["পুকুরের তথ্য", "মাছ ছাড়া", "অবস্থান", "সম্পূর্ণ"];

interface FishEntry {
  id: number;
  species: string;
  count: string;
  avg_weight_kg: string;
  release_date: string;
  feed_rate_pct: string;
  fasting_day: string;
}

function emptyFish(id: number): FishEntry {
  return { id, species: "", count: "", avg_weight_kg: "", release_date: "", feed_rate_pct: "3", fasting_day: "3" };
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [pond, setPond] = useState({ name: "", area_m2: "", depth_m: "", water_source: "" });
  const [fishList, setFishList] = useState<FishEntry[]>([emptyFish(1)]);
  const [location, setLocation] = useState({ name: "", lat: "", lng: "" });

  function updateFish(id: number, field: keyof FishEntry, value: string) {
    setFishList(list => list.map(f => f.id === id ? { ...f, [field]: value } : f));
  }

  function addFish() {
    setFishList(list => [...list, emptyFish(Date.now())]);
  }

  function removeFish(id: number) {
    if (fishList.length === 1) return;
    setFishList(list => list.filter(f => f.id !== id));
  }

  const fishStepValid = fishList.every(f => f.species && f.count && f.avg_weight_kg && f.release_date);

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: pondData, error: pondError } = await supabase.from("ponds").insert({
        user_id: user.id,
        name: pond.name,
        area_m2: parseFloat(pond.area_m2),
        depth_m: parseFloat(pond.depth_m),
        water_source: pond.water_source || null,
        location_name: location.name || null,
        location_lat: location.lat ? parseFloat(location.lat) : null,
        location_lng: location.lng ? parseFloat(location.lng) : null,
      }).select().single();

      if (pondError) throw pondError;

      const { error: fishError } = await supabase.from("fish_stocks").insert(
        fishList.map(f => ({
          pond_id: pondData.id,
          species: f.species,
          initial_count: parseInt(f.count),
          current_count: parseInt(f.count),
          avg_weight_kg: parseFloat(f.avg_weight_kg),
          release_date: f.release_date,
          feed_rate_pct: parseFloat(f.feed_rate_pct),
          fasting_day: parseInt(f.fasting_day),
        }))
      );

      if (fishError) throw fishError;

      toast.success("পুকুর সেটআপ সম্পূর্ণ হয়েছে!");
      router.push("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-water-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-200">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AquaFarm সেটআপ করুন</h1>
          <p className="mt-1 text-gray-500 text-sm">কয়েকটি ধাপে আপনার পুকুর সাজিয়ে নিন</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i < step ? "bg-brand-600 text-white" :
                i === step ? "bg-brand-600 text-white ring-4 ring-brand-100" :
                "bg-gray-200 text-gray-500"
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 rounded ${i < step ? "bg-brand-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">{STEPS[step]}</h2>

          {/* Step 0: Pond details */}
          {step === 0 && (
            <div className="space-y-4">
              <Input label="পুকুরের নাম" id="pond-name" placeholder="যেমন: মূল পুকুর" value={pond.name}
                onChange={e => setPond(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="আয়তন (m²)" id="area" type="number" placeholder="যেমন: ৫০০" value={pond.area_m2}
                  onChange={e => setPond(p => ({ ...p, area_m2: e.target.value }))} />
                <Input label="গভীরতা (m)" id="depth" type="number" placeholder="যেমন: ১.৫" value={pond.depth_m}
                  onChange={e => setPond(p => ({ ...p, depth_m: e.target.value }))} />
              </div>
              <Select label="পানির উৎস" id="water-source"
                options={WATER_SOURCES.map(w => ({ value: w, label: w }))}
                placeholder="পানির উৎস বেছে নিন"
                value={pond.water_source}
                onChange={e => setPond(p => ({ ...p, water_source: e.target.value }))} />
            </div>
          )}

          {/* Step 1: Fish stocking — multiple species */}
          {step === 1 && (
            <div className="space-y-5">
              {fishList.map((f, idx) => (
                <div key={f.id} className="rounded-xl border border-gray-200 p-4 space-y-3 relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      প্রজাতি {idx + 1}
                    </span>
                    {fishList.length > 1 && (
                      <button onClick={() => removeFish(f.id)}
                        className="p-1 rounded-lg hover:bg-red-50 transition">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                  <Select label="মাছের প্রজাতি" id={`species-${f.id}`}
                    options={FISH_SPECIES.map(s => ({ value: s, label: s }))}
                    placeholder="প্রজাতি বেছে নিন"
                    value={f.species}
                    onChange={e => updateFish(f.id, "species", e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="মাছের সংখ্যা" id={`count-${f.id}`} type="number" placeholder="যেমন: ১০০০"
                      value={f.count} onChange={e => updateFish(f.id, "count", e.target.value)} />
                    <Input label="গড় ওজন (কেজি)" id={`weight-${f.id}`} type="number" placeholder="যেমন: ০.০৫"
                      value={f.avg_weight_kg} onChange={e => updateFish(f.id, "avg_weight_kg", e.target.value)} />
                  </div>
                  <Input label="পোনা ছাড়ার তারিখ" id={`date-${f.id}`} type="date"
                    value={f.release_date} onChange={e => updateFish(f.id, "release_date", e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="খাবারের হার (%/দিন)" id={`rate-${f.id}`} type="number" step="0.5"
                      hint="সাধারণত: ৩–৫%"
                      value={f.feed_rate_pct} onChange={e => updateFish(f.id, "feed_rate_pct", e.target.value)} />
                    <Select label="উপবাসের দিন" id={`fasting-${f.id}`}
                      options={FASTING_DAYS.map(d => ({ value: d.value, label: d.label }))}
                      value={f.fasting_day}
                      onChange={e => updateFish(f.id, "fasting_day", e.target.value)} />
                  </div>
                </div>
              ))}

              <button onClick={addFish}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 py-3 text-sm font-medium text-brand-600 hover:bg-brand-50 transition">
                <Plus className="h-4 w-4" /> আরেকটি প্রজাতি যোগ করুন
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <Input label="অবস্থানের নাম" id="loc-name" placeholder="যেমন: আমার খামার, ময়মনসিংহ"
                value={location.name} onChange={e => setLocation(l => ({ ...l, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="অক্ষাংশ (ঐচ্ছিক)" id="lat" type="number" placeholder="যেমন: 24.3636"
                  value={location.lat} onChange={e => setLocation(l => ({ ...l, lat: e.target.value }))} />
                <Input label="দ্রাঘিমাংশ (ঐচ্ছিক)" id="lng" type="number" placeholder="যেমন: 88.6241"
                  value={location.lng} onChange={e => setLocation(l => ({ ...l, lng: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="py-2 space-y-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">পুকুর</p>
                <p className="font-semibold text-gray-900">{pond.name}</p>
                <p className="text-sm text-gray-500">{pond.area_m2} m² · গভীরতা {pond.depth_m}m · {pond.water_source}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">মাছের স্টক</p>
                <div className="space-y-2">
                  {fishList.map((f, i) => (
                    <div key={f.id} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100">
                        <Fish className="h-3.5 w-3.5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.count} {f.species}</p>
                        <p className="text-xs text-gray-500">গড় {f.avg_weight_kg} kg · {f.feed_rate_pct}% খাবারের হার</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {location.name && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">অবস্থান</p>
                  <p className="text-sm text-gray-900">{location.name}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              পেছনে
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={
                (step === 0 && (!pond.name || !pond.area_m2 || !pond.depth_m)) ||
                (step === 1 && !fishStepValid)
              }>
                পরবর্তী
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={loading}>
                ড্যাশবোর্ড শুরু করুন
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
