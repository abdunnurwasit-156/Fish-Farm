"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { getCourseBySlug, getCourseTotalLessons, formatDurationBn, formatPriceBn, toBengaliNumber, difficultyLabel, difficultyColor } from "@/lib/courses";
import {
  ArrowLeft, Star, Users, Clock, BookOpen, PlayCircle, FileText, ChevronDown, Lock, Check,
  CheckCircle2, Crown, Zap, Sparkles, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ENROLL_KEY = "aquafarm_enrolled_courses";

function isEnrolled(slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = JSON.parse(localStorage.getItem(ENROLL_KEY) ?? "[]");
    return Array.isArray(list) && list.includes(slug);
  } catch { return false; }
}

function setEnrolled(slug: string) {
  try {
    const list = JSON.parse(localStorage.getItem(ENROLL_KEY) ?? "[]");
    const next = Array.isArray(list) ? Array.from(new Set([...list, slug])) : [slug];
    localStorage.setItem(ENROLL_KEY, JSON.stringify(next));
  } catch {}
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const [enrolled, setEnrolledState] = useState<boolean>(() => isEnrolled(slug));
  const [openModule, setOpenModule] = useState<string | null>(course!.modules[0]?.id ?? null);

  const totalLessons = getCourseTotalLessons(course!);
  const firstLesson = course!.modules[0]?.lessons[0];

  function handleEnroll() {
    setEnrolled(slug);
    setEnrolledState(true);
    toast.success(course!.priceBdt === 0
      ? "ভর্তি সম্পন্ন! এখনই শেখা শুরু করুন।"
      : "ভর্তি সম্পন্ন! পেমেন্ট মডিউল শীঘ্রই আসছে।");
  }

  function handleStart() {
    if (firstLesson) router.push(`/courses/${slug}/${firstLesson.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* ─── HERO ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={course!.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          <div className={cn("absolute inset-0 bg-gradient-to-r opacity-95", course!.accentGradient)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>

        <div className="relative px-4 lg:px-8 pt-6 lg:pt-8 pb-10 lg:pb-14 max-w-7xl mx-auto text-white">
          <Link href="/courses"
            className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white mb-6 transition">
            <ArrowLeft className="h-4 w-4" />
            সব কোর্সে ফিরে যান
          </Link>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {course!.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                    <Zap className="h-3 w-3" /> নতুন
                  </span>
                )}
                {course!.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold">
                    <Crown className="h-3 w-3" /> ফিচারড
                  </span>
                )}
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", difficultyColor(course!.difficulty))}>
                  {difficultyLabel(course!.difficulty)}
                </span>
              </div>

              <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                {course!.title}
              </h1>
              <p className="mt-3 text-base lg:text-lg text-white/90 leading-relaxed max-w-2xl">
                {course!.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                  <strong>{course!.rating}</strong> রেটিং
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {toBengaliNumber(course!.studentsCount.toLocaleString())} শিক্ষার্থী
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDurationBn(course!.durationMinutes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {toBengaliNumber(totalLessons)} টি লেসন
                </span>
              </div>

              {/* Instructor card */}
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-4 py-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-900 text-sm font-bold shadow-md">
                  {course!.instructor.initials}
                </div>
                <div>
                  <p className="text-xs text-white/70 mb-0.5">ইনস্ট্রাক্টর</p>
                  <p className="text-sm font-semibold">{course!.instructor.name}</p>
                  <p className="text-xs text-white/80">{course!.instructor.title}</p>
                </div>
              </div>
            </div>

            {/* ─── ENROLLMENT CARD (sticky on desktop) ─── */}
            <div className="lg:sticky lg:top-6">
              <div className="bg-white text-gray-900 rounded-3xl shadow-2xl overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img src={course!.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", course!.accentGradient)} />
                  <button onClick={handleStart}
                    className="absolute inset-0 flex items-center justify-center group">
                    <div className="h-16 w-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
                      <PlayCircle className="h-8 w-8 text-gray-900" fill="currentColor" />
                    </div>
                  </button>
                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/90 bg-black/40 backdrop-blur rounded-full px-3 py-1">
                    ফ্রি প্রিভিউ দেখুন
                  </p>
                </div>

                <div className="p-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-gray-900">{formatPriceBn(course!.priceBdt)}</span>
                    {course!.priceBdt > 0 && (
                      <span className="text-sm text-gray-400 line-through">৳{toBengaliNumber(course!.priceBdt + 200)}</span>
                    )}
                  </div>
                  {course!.priceBdt > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold mb-4">সীমিত সময়ের অফার!</p>
                  )}

                  {enrolled ? (
                    <button onClick={handleStart}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-white font-bold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
                      <PlayCircle className="h-5 w-5" />
                      শেখা শুরু করুন
                    </button>
                  ) : (
                    <button onClick={handleEnroll}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-white font-bold shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      {course!.priceBdt === 0 ? "ফ্রি ভর্তি হন" : "এখনই কিনুন"}
                    </button>
                  )}

                  <div className="mt-5 space-y-2.5 text-sm">
                    {[
                      `${toBengaliNumber(totalLessons)} টি ভিডিও/আর্টিকেল লেসন`,
                      `${formatDurationBn(course!.durationMinutes)} এর কনটেন্ট`,
                      "মোবাইল ও ডেস্কটপে দেখা যায়",
                      "সারা জীবনের অ্যাক্সেস",
                      "সমাপ্তির সার্টিফিকেট",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-gray-700">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="px-4 lg:px-8 max-w-7xl mx-auto mt-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">

          {/* About */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">এই কোর্সে আপনি কী পাবেন</h2>
            <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-3xl p-6 border border-emerald-100">
              <div className="grid sm:grid-cols-2 gap-3">
                {course!.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm mt-0.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-gray-800 leading-relaxed">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">কোর্সের বিবরণ</h2>
            <p className="text-base text-gray-700 leading-relaxed">{course!.description}</p>
          </section>

          {/* Curriculum */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">কোর্স কারিকুলাম</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {toBengaliNumber(course!.modules.length)} টি মডিউল · {toBengaliNumber(totalLessons)} টি লেসন · {formatDurationBn(course!.durationMinutes)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {course!.modules.map((m, mIdx) => {
                const isOpen = openModule === m.id;
                const moduleDuration = m.lessons.reduce((n, l) => n + l.duration, 0);
                return (
                  <div key={m.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenModule(isOpen ? null : m.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-sm font-bold shadow-sm", course!.accentGradient)}>
                          {toBengaliNumber(mIdx + 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{m.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {toBengaliNumber(m.lessons.length)} টি লেসন · {formatDurationBn(moduleDuration)}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={cn("h-5 w-5 text-gray-400 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/40">
                        {m.lessons.map((l, lIdx) => {
                          const canAccess = enrolled || l.isFreePreview;
                          const Icon = l.type === "video" ? PlayCircle : FileText;
                          const inner = (
                            <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white transition group">
                              <Icon className={cn("h-5 w-5 shrink-0", canAccess ? "text-emerald-600" : "text-gray-400")} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700">{l.title}</p>
                                <p className="text-xs text-gray-500 truncate">{l.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {l.isFreePreview && (
                                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                                    প্রিভিউ
                                  </span>
                                )}
                                {!canAccess && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {toBengaliNumber(l.duration)} মি
                                </span>
                              </div>
                            </div>
                          );
                          return canAccess ? (
                            <Link key={l.id} href={`/courses/${slug}/${l.id}`} className="block border-t border-gray-100">
                              {inner}
                            </Link>
                          ) : (
                            <div key={l.id} className="block border-t border-gray-100 cursor-not-allowed">
                              {inner}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ─── SIDEBAR ─── */}
        <aside className="space-y-6">
          {/* Why this course */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              এই কোর্সের বৈশিষ্ট্য
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> বাংলাদেশী চাষীদের জন্য বানানো</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> ব্যবহারিক উদাহরণ ও কেস স্টাডি</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> বাংলায় কথোপকথন</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> মোবাইল ফ্রেন্ডলি</li>
            </ul>
          </div>

          {/* Refund */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 p-6">
            <p className="text-sm font-semibold text-gray-900 mb-1">৩০ দিনের মানি-ব্যাক গ্যারান্টি</p>
            <p className="text-xs text-gray-600 leading-relaxed">পছন্দ না হলে ৩০ দিনের মধ্যে পুরো টাকা ফেরত। কোনো প্রশ্ন ছাড়াই।</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
