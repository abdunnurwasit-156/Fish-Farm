"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePond } from "@/hooks/usePond";
import { ALERT_COLORS, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/types";
import { createAlert } from "@/lib/alerts";
import {
  AlertTriangle, CloudRain, Thermometer, Droplets, Bell,
  CheckCheck, RefreshCw, FlaskConical, Wind
} from "lucide-react";
import { toast } from "sonner";

const ALERT_ICONS: Record<string, React.ElementType> = {
  weather: CloudRain,
  ammonia: FlaskConical,
  mortality: AlertTriangle,
  weight_update: RefreshCw,
  fasting: Droplets,
  water_quality: Thermometer,
  general: Bell,
};

export default function AlertsPage() {
  const supabase = createClient();
  const { pond, stock, refresh: refreshPond } = usePond();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weather, setWeather] = useState<{ temp: number; condition: string; rain: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (pond) { loadAlerts(); fetchWeather(); }
  }, [pond]);

  async function loadAlerts() {
    if (!pond) return;
    const { data } = await supabase.from("alerts").select("*")
      .eq("pond_id", pond.id).order("created_at", { ascending: false });
    setAlerts(data ?? []);
  }

  async function markAllRead() {
    if (!pond) return;
    await supabase.from("alerts").update({ is_read: true }).eq("pond_id", pond.id).eq("is_read", false);
    loadAlerts();
    refreshPond();
  }

  async function markRead(id: string) {
    await supabase.from("alerts").update({ is_read: true }).eq("id", id);
    loadAlerts();
    refreshPond();
  }

  async function deleteAlert(id: string) {
    await supabase.from("alerts").delete().eq("id", id);
    loadAlerts();
  }

  async function fetchWeather() {
    if (!pond?.location_lat || !pond?.location_lng) return;
    try {
      const res = await fetch(`/api/weather?lat=${pond.location_lat}&lng=${pond.location_lng}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
        if (data.rain && pond) {
          await createAlert(pond.id, {
            type: "weather", severity: "warning",
            title: "বৃষ্টি হচ্ছে — খাবার কমান",
            message: "বৃষ্টির কারণে মাছের ক্ষুধা কমে ও অক্সিজেন কমে যায়। আজ খাবার ৩০–৫০% কমিয়ে দিন।",
          });
          loadAlerts();
        }
      }
    } catch { /* weather optional */ }
  }

  async function addManualAlert(type: string, severity: "info" | "warning" | "danger", title: string, message: string) {
    if (!pond) return;
    setLoading(true);
    await createAlert(pond.id, { type, severity, title, message });
    loadAlerts();
    setLoading(false);
    toast.success("Alert created");
  }

  const displayed = filter === "unread" ? alerts.filter(a => !a.is_read) : alerts;
  const unread = alerts.filter(a => !a.is_read).length;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto page-enter">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" /> সতর্কতা
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread}টি পড়া হয়নি · মোট {alerts.length}টি</p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" /> সব পড়া চিহ্নিত করুন
          </Button>
        )}
      </div>

      {/* Weather card */}
      {weather && (
        <Card className={`mb-6 ${weather.rain ? "border-blue-300 bg-blue-50" : "border-gray-100"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {weather.rain ? <CloudRain className="h-6 w-6 text-blue-500" /> : <Wind className="h-6 w-6 text-gray-400" />}
              <div>
                <p className="font-medium text-gray-900">{pond?.location_name ?? "বর্তমান আবহাওয়া"}</p>
                <p className="text-sm text-gray-600">{weather.condition} · {weather.temp}°C</p>
                {weather.rain && <p className="text-sm text-blue-700 font-medium mt-0.5">বৃষ্টি হচ্ছে — খাবার ৩০–৫০% কমিয়ে দিন</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual alert triggers */}
      <Card className="mb-6">
        <CardHeader><CardTitle>সতর্কতা তৈরি করুন</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" loading={loading}
              onClick={() => addManualAlert("ammonia", "warning", "অ্যামোনিয়া পরীক্ষার সময়",
                "অ্যামোনিয়ার মাত্রা পরীক্ষা করুন। বেশি অ্যামোনিয়া (>০.৫ mg/L) মাছের জন্য ক্ষতিকর। প্রয়োজনে পানি বদলান।")}>
              <FlaskConical className="h-3.5 w-3.5" /> অ্যামোনিয়া রিমাইন্ডার
            </Button>
            <Button size="sm" variant="outline" loading={loading}
              onClick={() => addManualAlert("weather", "warning", "বৃষ্টির সতর্কতা — খাবার কমান",
                "বৃষ্টির কারণে মাছের ক্ষুধা কমে ও অক্সিজেন কমে যায়। আজ খাবার ৩০–৫০% কমিয়ে দিন।")}>
              <CloudRain className="h-3.5 w-3.5" /> বৃষ্টির সতর্কতা
            </Button>
            <Button size="sm" variant="outline" loading={loading}
              onClick={() => addManualAlert("water_quality", "info", "পানি বদলানোর সময়",
                "পানির মান ভালো রাখতে ও অ্যামোনিয়া কমাতে ২০–৩০% পানি বদলে দিন।")}>
              <Droplets className="h-3.5 w-3.5" /> পানি বদলান
            </Button>
            <Button size="sm" variant="outline" loading={loading}
              onClick={() => addManualAlert("general", "info", "পুকুর পরিদর্শনের সময়",
                "নিয়মিত পুকুর পরিদর্শন করুন: জাল, এয়ারেটর, মাছের আচরণ ও পানির রঙ চেক করুন।")}>
              <Bell className="h-3.5 w-3.5" /> পরিদর্শন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f === "all" ? "সব" : `পড়া হয়নি (${unread})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {displayed.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">কোনো সতর্কতা নেই</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {displayed.map(alert => {
            const colors = ALERT_COLORS[alert.severity];
            const Icon = ALERT_ICONS[alert.type] ?? Bell;
            return (
              <div key={alert.id}
                className={`rounded-xl border p-4 ${colors.bg} ${colors.border} ${!alert.is_read ? "shadow-sm" : "opacity-70"}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg bg-white/60`}>
                    <Icon className={`h-4 w-4 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${colors.text}`}>{alert.title}</p>
                      {!alert.is_read && (
                        <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${colors.text} opacity-80`}>{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{formatDate(alert.created_at)}</span>
                      <div className="flex gap-2">
                        {!alert.is_read && (
                          <button onClick={() => markRead(alert.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline">পড়া হয়েছে</button>
                        )}
                        <button onClick={() => deleteAlert(alert.id)}
                          className="text-xs text-red-400 hover:text-red-600 underline">মুছুন</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
