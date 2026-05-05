"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePond } from "@/hooks/usePond";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { User, LogOut, Trash2, ShieldAlert, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { pond, ponds, stocks, switchPond } = usePond();

  const [modalDelete, setModalDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete all pond data (RLS cascades handle child rows)
      if (pond) {
        await supabase.from("alerts").delete().eq("pond_id", pond.id);
        await supabase.from("water_quality_logs").delete().eq("pond_id", pond.id);
        await supabase.from("meals").delete().eq("pond_id", pond.id);
        for (const s of stocks) {
          await supabase.from("feed_logs").delete().eq("fish_stock_id", s.id);
          await supabase.from("mortality_logs").delete().eq("fish_stock_id", s.id);
          await supabase.from("weight_updates").delete().eq("fish_stock_id", s.id);
        }
        await supabase.from("fish_stocks").delete().eq("pond_id", pond.id);
        await supabase.from("ponds").delete().eq("id", pond.id);
      }

      // Delete auth user via Supabase admin (requires service role) or via RPC
      // For client-side: sign out and show instruction
      // If more ponds exist, switch to the next one; otherwise sign out
      const remaining = ponds.filter(p => p.id !== pond?.id);
      if (remaining.length > 0) {
        toast.success(`"${pond?.name}" মুছে ফেলা হয়েছে। ${remaining[0].name}-এ চলে গেছে।`);
        switchPond(remaining[0].id);
        setModalDelete(false);
        setConfirmText("");
      } else {
        await supabase.auth.signOut();
        toast.success("আপনার সব তথ্য মুছে ফেলা হয়েছে।");
        router.push("/login");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Deletion failed");
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto page-enter">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">সেটিংস</h1>
        <p className="text-sm text-gray-500 mt-0.5">আপনার অ্যাকাউন্ট ও তথ্য পরিচালনা করুন</p>
      </div>

      {/* Account */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" /> অ্যাকাউন্ট
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">পুকুর</p>
              <p className="text-xs text-gray-500">{pond?.name ?? "—"} · {stocks.length}টি প্রজাতি · {ponds.length}টি পুকুর</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>

          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition text-left">
            <LogOut className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">সাইন আউট</p>
              <p className="text-xs text-gray-500">যেকোনো সময় আবার লগইন করতে পারবেন</p>
            </div>
            {signingOut && <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />}
          </button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-4 w-4" /> বিপদ অঞ্চল
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-red-800 text-sm">অ্যাকাউন্ট ও সব তথ্য মুছে ফেলুন</p>
                <p className="text-xs text-red-600 mt-1">
                  আপনার পুকুর, সব মাছের স্টক, খাবারের রেকর্ড, মৃত্যুর লগ, পানির মান ও সতর্কতা চিরতরে মুছে যাবে। এটি আর ফেরানো যাবে না।
                </p>
              </div>
              <Button size="sm" variant="danger" className="shrink-0" onClick={() => setModalDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> মুছুন
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      <Modal open={modalDelete} onClose={() => { setModalDelete(false); setConfirmText(""); }} title="অ্যাকাউন্ট স্থায়ীভাবে মুছুন">
        <div className="space-y-5">
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-semibold text-red-800 mb-1">এগুলো চিরতরে মুছে যাবে:</p>
            <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
              <li>আপনার পুকুর — <strong>{pond?.name}</strong></li>
              <li>{stocks.length}টি মাছের স্টক ও সব সংশ্লিষ্ট রেকর্ড</li>
              <li>সব খাবারের ইতিহাস, মৃত্যুর রেকর্ড, পানির মানের তথ্য</li>
              <li>সব সতর্কতা ও কাস্টম খাবারের ধরন</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">
              নিশ্চিত করতে <strong className="font-mono text-red-600">DELETE</strong> লিখুন:
            </p>
            <Input
              id="confirm-delete"
              placeholder="এখানে DELETE লিখুন"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setModalDelete(false); setConfirmText(""); }}>
              বাতিল করুন
            </Button>
            <Button variant="danger" className="flex-1" loading={deleting}
              disabled={confirmText !== "DELETE"}
              onClick={handleDeleteAccount}>
              সব মুছে ফেলুন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
