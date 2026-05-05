"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { getCourseBySlug, getLesson, getAllLessons, toBengaliNumber, formatDurationBn } from "@/lib/courses";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, PlayCircle, FileText, BookOpen, Clock, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PROGRESS_KEY = "aquafarm_lesson_progress"; // { [courseSlug]: string[] of completed lesson ids }

function getProgress(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
    return Array.isArray(all[slug]) ? all[slug] : [];
  } catch { return []; }
}

function markComplete(slug: string, lessonId: string) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
    const list: string[] = Array.isArray(all[slug]) ? all[slug] : [];
    if (!list.includes(lessonId)) list.push(lessonId);
    all[slug] = list;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ slug: string; lessonId: string }>();
  const { slug, lessonId } = params;

  const course = getCourseBySlug(slug);
  const data = getLesson(slug, lessonId);
  if (!course || !data) notFound();

  const { lesson, module: mod } = data!;
  const allLessons = useMemo(() => getAllLessons(course!), [course]);
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const [completed, setCompleted] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setCompleted(getProgress(slug)); }, [slug]);

  const isCompleted = completed.includes(lessonId);
  const progressPct = (completed.length / allLessons.length) * 100;

  function handleComplete() {
    markComplete(slug, lessonId);
    setCompleted(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);
    toast.success("লেসন সম্পূর্ণ! ✨");
    if (next) setTimeout(() => router.push(`/courses/${slug}/${next.id}`), 600);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* ─── TOP BAR ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <Link href={`/courses/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition min-w-0">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate hidden sm:inline">{course!.title}</span>
            <span className="truncate sm:hidden">কোর্সে ফিরুন</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-900">{toBengaliNumber(completed.length)}/{toBengaliNumber(allLessons.length)}</span>
              <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                  style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(s => !s)}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {toBengaliNumber(completed.length)}/{toBengaliNumber(allLessons.length)}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* ─── MAIN CONTENT ─── */}
        <div className="min-w-0">
          {/* Player */}
          {lesson.type === "video" && lesson.videoUrl ? (
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
              <iframe
                src={lesson.videoUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <div className={cn("relative aspect-video rounded-3xl overflow-hidden bg-gradient-to-br shadow-2xl flex items-center justify-center text-white", course!.accentGradient)}>
              <div className="text-center p-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-90" />
                <p className="text-lg font-semibold">আর্টিকেল লেসন</p>
                <p className="text-sm text-white/80 mt-1">নিচে স্ক্রল করে পড়ুন</p>
              </div>
            </div>
          )}

          {/* Lesson info */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">
              মডিউল: {mod.title}
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {lesson.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                {lesson.type === "video" ? <PlayCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {lesson.type === "video" ? "ভিডিও লেসন" : "আর্টিকেল"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDurationBn(lesson.duration)}
              </span>
              <span>লেসন {toBengaliNumber(currentIndex + 1)} / {toBengaliNumber(allLessons.length)}</span>
            </div>

            <div className="mt-5 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <p className="text-base text-gray-700 leading-relaxed">{lesson.description}</p>

              {/* Article content placeholder for article lessons */}
              {lesson.type === "article" && (
                <div className="mt-5 pt-5 border-t border-gray-100 prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                  <p>এই লেসনের সম্পূর্ণ লেখা শীঘ্রই যোগ করা হবে। এখানে বিস্তারিত আলোচনা, ছবি, এবং ব্যবহারিক উদাহরণ থাকবে।</p>
                  <p>আপাতত নিচের পরবর্তী লেসনে গিয়ে পড়াশোনা চালিয়ে যান। কোর্স সম্পূর্ণ করার পরে সার্টিফিকেট পাবেন।</p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {prev ? (
                <Link href={`/courses/${slug}/${prev.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-400 transition">
                  <ArrowLeft className="h-4 w-4" />
                  আগের লেসন
                </Link>
              ) : <div />}

              <button
                onClick={handleComplete}
                disabled={isCompleted && !next}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg transition",
                  isCompleted
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl"
                )}
              >
                {isCompleted ? (<><CheckCircle2 className="h-4 w-4" /> সম্পূর্ণ হয়েছে</>) : (<><Check className="h-4 w-4" /> সম্পূর্ণ চিহ্নিত করুন</>)}
                {next && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Course completion celebration */}
            {!next && completed.length === allLessons.length && (
              <div className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white text-center shadow-2xl">
                <Sparkles className="h-12 w-12 mx-auto mb-3" />
                <h3 className="text-2xl font-bold">অভিনন্দন! 🎉</h3>
                <p className="mt-2 text-white/90">আপনি কোর্সটি সম্পূর্ণ করেছেন। আপনার সার্টিফিকেট প্রস্তুত হচ্ছে।</p>
                <Link href="/courses" className="mt-5 inline-block rounded-full bg-white text-emerald-700 px-6 py-2.5 text-sm font-bold">
                  আরও কোর্স দেখুন
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── SIDEBAR (curriculum) ─── */}
        <aside className={cn(
          "lg:block",
          sidebarOpen
            ? "fixed inset-0 z-40 bg-black/40 lg:bg-transparent lg:static lg:inset-auto"
            : "hidden lg:block"
        )} onClick={() => setSidebarOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white lg:rounded-3xl border-l lg:border border-gray-100 shadow-xl lg:shadow-sm overflow-hidden h-full lg:h-auto max-h-screen lg:max-h-[calc(100vh-6rem)] lg:sticky lg:top-20 ml-auto w-[85%] sm:w-96 lg:w-auto flex flex-col"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">কোর্স কারিকুলাম</p>
                <p className="text-xs text-gray-500 mt-0.5">{toBengaliNumber(completed.length)}/{toBengaliNumber(allLessons.length)} সম্পূর্ণ</p>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {course!.modules.map((m, mi) => (
                <div key={m.id} className="border-b border-gray-100 last:border-b-0">
                  <p className="px-5 pt-4 pb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    মডিউল {toBengaliNumber(mi + 1)} · {m.title}
                  </p>
                  {m.lessons.map(l => {
                    const isCurrent = l.id === lessonId;
                    const isDone = completed.includes(l.id);
                    const Icon = l.type === "video" ? PlayCircle : FileText;
                    return (
                      <Link key={l.id} href={`/courses/${slug}/${l.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition border-l-4",
                          isCurrent ? "bg-emerald-50/60 border-emerald-500" : "border-transparent"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Icon className={cn("h-5 w-5 shrink-0", isCurrent ? "text-emerald-600" : "text-gray-400")} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isCurrent ? "text-emerald-900" : "text-gray-800")}>
                            {l.title}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {toBengaliNumber(l.duration)} মিনিট
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
