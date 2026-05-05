"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Droplets } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল চেক করুন নিশ্চিত করতে।");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-water-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-200">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AquaFarm</h1>
          <p className="mt-1 text-gray-500 text-sm">স্মার্ট মাছ চাষ ব্যবস্থাপনা</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
                }`}>{m === "login" ? "সাইন ইন" : "নতুন অ্যাকাউন্ট"}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="ইমেইল" id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <Input label="পাসওয়ার্ড" id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              hint={mode === "signup" ? "কমপক্ষে ৬ অক্ষর" : undefined} />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === "login" ? "সাইন ইন" : "অ্যাকাউন্ট তৈরি করুন"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
