import { createClient } from "@/lib/supabase/client";
import { WaterQualityLog, FishStock } from "@/types";

export async function createAlert(pondId: string, data: {
  type: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
}) {
  const supabase = createClient();
  await supabase.from("alerts").insert({ pond_id: pondId, ...data });
}

export async function checkWaterQualityAlert(pondId: string, log: Partial<WaterQualityLog>) {
  const alerts: Array<{ type: string; severity: "info" | "warning" | "danger"; title: string; message: string }> = [];

  if (log.ph !== undefined && log.ph !== null) {
    if (log.ph < 6.5 || log.ph > 8.5) {
      alerts.push({
        type: "water_quality", severity: "danger",
        title: "pH নিরাপদ সীমার বাইরে",
        message: `pH এখন ${log.ph}। নিরাপদ সীমা ৬.৫–৮.৫। pH বাড়াতে চুন দিন বা কমাতে pH Down ব্যবহার করুন।`,
      });
    }
  }
  if (log.ammonia_mg !== undefined && log.ammonia_mg !== null) {
    if (log.ammonia_mg > 0.5) {
      alerts.push({
        type: "ammonia", severity: log.ammonia_mg > 1 ? "danger" : "warning",
        title: "অ্যামোনিয়া বেশি পাওয়া গেছে",
        message: `অ্যামোনিয়া ${log.ammonia_mg} mg/L। এখনই ২০–৩০% পানি বদলান ও খাবার কমিয়ে দিন।`,
      });
    }
  }
  if (log.dissolved_oxygen_mg !== undefined && log.dissolved_oxygen_mg !== null) {
    if (log.dissolved_oxygen_mg < 4) {
      alerts.push({
        type: "water_quality", severity: "danger",
        title: "জরুরি: অক্সিজেন বিপজ্জনকভাবে কম",
        message: `অক্সিজেন ${log.dissolved_oxygen_mg} mg/L (৪-এর নিচে বিপজ্জনক)। এখনই এয়ারেটর চালু করুন।`,
      });
    } else if (log.dissolved_oxygen_mg < 5) {
      alerts.push({
        type: "water_quality", severity: "warning",
        title: "অক্সিজেন কম হওয়ার সতর্কতা",
        message: `অক্সিজেন ${log.dissolved_oxygen_mg} mg/L। বায়ু সরবরাহ বাড়ানোর কথা ভাবুন।`,
      });
    }
  }

  for (const a of alerts) await createAlert(pondId, a);
  return alerts;
}

export async function checkMortalityAlert(pondId: string, stock: FishStock, deadCount: number) {
  const pct = (deadCount / stock.initial_count) * 100;
  if (pct >= 2) {
    await createAlert(pondId, {
      type: "mortality", severity: pct >= 5 ? "danger" : "warning",
      title: `মাছ মৃত্যু — ${deadCount}টি মাছ মারা গেছে`,
      message: `${deadCount}টি মাছ মারা গেছে (স্টকের ${pct.toFixed(1)}%)। রোগ বা অক্সিজেন কমে যাওয়া পরীক্ষা করুন।`,
    });
  }
}

export async function checkWeightUpdateAlert(pondId: string, daysSince: number) {
  if (daysSince >= 14) {
    await createAlert(pondId, {
      type: "weight_update", severity: "info",
      title: "ওজন আপডেট করার সময় হয়েছে",
      message: `${daysSince === Infinity ? "এখনো কোনো ওজন রেকর্ড করা হয়নি" : `সর্বশেষ আপডেটের ${daysSince} দিন হয়ে গেছে`}। সঠিক খাবারের হিসাবের জন্য মাছের ওজন আপডেট করুন।`,
    });
  }
}
