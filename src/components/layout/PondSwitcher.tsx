"use client";
import { useState, useRef, useEffect } from "react";
import { usePondContext, NewPondData } from "@/contexts/PondContext";
import { WATER_SOURCES } from "@/lib/utils";
import { ChevronDown, Plus, Check, Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PondSwitcher() {
  const { ponds, pond, switchPond, createPond } = usePondContext();

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewPondData>({
    name: "", area_m2: 0, depth_m: 0, water_source: "", location_name: "",
  });

  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowForm(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("পুকুরের নাম দিতে হবে"); return; }
    if (!form.area_m2 || !form.depth_m) { toast.error("আয়তন ও গভীরতা দিতে হবে"); return; }
    setSaving(true);
    try {
      await createPond(form);
      toast.success(`"${form.name}" তৈরি হয়েছে ও নির্বাচিত হয়েছে`);
      setShowForm(false);
      setOpen(false);
      setForm({ name: "", area_m2: 0, depth_m: 0, water_source: "", location_name: "" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "পুকুর তৈরি করা যায়নি");
    } finally {
      setSaving(false);
    }
  }

  if (!pond) return null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setShowForm(false); }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition text-left"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100">
          <Droplets className="h-3.5 w-3.5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{pond.name}</p>
          <p className="text-[10px] text-gray-400">{ponds.length}টি পুকুর</p>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Pond list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {ponds.map(p => (
              <button
                key={p.id}
                onClick={() => { switchPond(p.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Droplets className="h-3.5 w-3.5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  {p.location_name && (
                    <p className="text-xs text-gray-400 truncate">{p.location_name}</p>
                  )}
                </div>
                {p.id === pond.id && <Check className="h-4 w-4 text-brand-600 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100" />

          {/* New pond button / inline form */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left text-brand-600"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                <Plus className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">নতুন পুকুর</span>
            </button>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">নতুন পুকুর</p>

              <input
                autoFocus
                placeholder="পুকুরের নাম *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="আয়তন (m²) *"
                  value={form.area_m2 || ""}
                  onChange={e => setForm(f => ({ ...f, area_m2: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="number"
                  placeholder="গভীরতা (m) *"
                  value={form.depth_m || ""}
                  onChange={e => setForm(f => ({ ...f, depth_m: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <select
                value={form.water_source}
                onChange={e => setForm(f => ({ ...f, water_source: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">পানির উৎস (ঐচ্ছিক)</option>
                {WATER_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <input
                placeholder="অবস্থান (ঐচ্ছিক)"
                value={form.location_name}
                onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  তৈরি করুন
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
