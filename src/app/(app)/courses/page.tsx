"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { CATEGORIES, COURSES, difficultyLabel, difficultyColor, formatDurationBn, formatPriceBn, toBengaliNumber, getCourseTotalLessons } from "@/lib/courses";
import { BookOpen, Search, Star, Clock, Users, Sparkles, GraduationCap, Zap, ArrowRight, PlayCircle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "premium">("all");

  const filteredCourses = useMemo(() => {
    return COURSES.filter(c => {
      if (activeCategory !== "all" && c.categorySlug !== activeCategory) return false;
      if (priceFilter === "free" && c.priceBdt > 0) return false;
      if (priceFilter === "premium" && c.priceBdt === 0) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activeCategory, search, priceFilter]);

  const featuredCourse = COURSES.find(c => c.isFeatured);
  const totalStudents = COURSES.reduce((n, c) => n + c.studentsCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12">
      {/* ─── HERO SECTION ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative px-4 lg:px-8 pt-8 lg:pt-14 pb-10 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm border border-emerald-200/50 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-4 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            শিখুন · বাড়ান · লাভ করুন
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight max-w-3xl leading-tight">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              পেশাদার মৎস্য চাষ
            </span>
            <br />
            শিখুন বিশেষজ্ঞদের কাছে
          </h1>

          <p className="mt-4 text-base lg:text-lg text-gray-600 max-w-2xl leading-relaxed">
            বাংলাদেশের প্রেক্ষাপটে তৈরি কোর্সগুলো — কার্প থেকে মাগুর, ফিড থেকে রোগ ব্যবস্থাপনা।
            শুরু থেকে এক্সপার্ট লেভেল পর্যন্ত।
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <span><strong className="text-gray-900">{toBengaliNumber(COURSES.length)}+</strong> কোর্স</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <span><strong className="text-gray-900">{toBengaliNumber(totalStudents.toLocaleString())}+</strong> শিক্ষার্থী</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100">
                <GraduationCap className="h-4 w-4 text-cyan-600" />
              </div>
              <span>বিশেষজ্ঞ ইনস্ট্রাক্টর</span>
            </div>
          </div>

          <div className="mt-8 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="কোর্স খুঁজুন — যেমন 'রুই' বা 'ফিড'"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base
                placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 max-w-7xl mx-auto -mt-2">

        {/* ─── FEATURED COURSE BANNER ─── */}
        {featuredCourse && activeCategory === "all" && !search && priceFilter === "all" && (
          <Link href={`/courses/${featuredCourse.slug}`}
            className="group relative block mb-10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-72 lg:h-80">
              <img
                src={featuredCourse.thumbnailUrl}
                alt={featuredCourse.title}
                className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
              />
              <div className={cn("absolute inset-0 bg-gradient-to-r opacity-90", featuredCourse.accentGradient)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="relative h-full flex flex-col justify-end p-6 lg:p-10 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold">
                    <Crown className="h-3 w-3" />
                    ফিচারড কোর্স
                  </span>
                  {featuredCourse.priceBdt === 0 && (
                    <span className="rounded-full bg-emerald-400/90 backdrop-blur-md px-3 py-1 text-xs font-bold">
                      ফ্রি
                    </span>
                  )}
                </div>
                <h2 className="text-2xl lg:text-4xl font-bold leading-tight max-w-3xl">
                  {featuredCourse.title}
                </h2>
                <p className="mt-2 text-sm lg:text-base text-white/90 max-w-2xl line-clamp-2">
                  {featuredCourse.subtitle}
                </p>

                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatDurationBn(featuredCourse.durationMinutes)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {toBengaliNumber(getCourseTotalLessons(featuredCourse))} টি লেসন
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {featuredCourse.rating}
                  </span>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-white text-gray-900 px-5 py-2.5 text-sm font-bold group-hover:gap-3 transition-all">
                  এখনই শুরু করুন
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ─── CATEGORY PILLS ─── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">বিষয় অনুযায়ী দেখুন</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border-2",
                activeCategory === "all"
                  ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              )}
            >
              সব কোর্স
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border-2",
                  activeCategory === cat.slug
                    ? `bg-gradient-to-r ${cat.gradient} text-white border-transparent shadow-lg`
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                )}
              >
                <span>{cat.emoji}</span>
                {cat.title}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {(["all", "free", "premium"] as const).map(p => (
              <button key={p}
                onClick={() => setPriceFilter(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                  priceFilter === p
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {p === "all" ? "সব দাম" : p === "free" ? "ফ্রি" : "প্রিমিয়াম"}
              </button>
            ))}
          </div>
        </div>

        {/* ─── COURSE GRID ─── */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-500">এই ফিল্টারে কোনো কোর্স পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {filteredCourses.map(course => (
              <Link key={course.slug} href={`/courses/${course.slug}`}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1">
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", course.accentGradient)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <div className="flex flex-col gap-1.5 items-start">
                      {course.isNew && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-amber-950 shadow-md">
                          <Zap className="h-2.5 w-2.5" /> নতুন
                        </span>
                      )}
                      {course.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-gray-900 shadow-md">
                          <Crown className="h-2.5 w-2.5" /> ফিচারড
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md shadow-md",
                      course.priceBdt === 0
                        ? "bg-emerald-400/95 text-emerald-950"
                        : "bg-white/95 text-gray-900"
                    )}>
                      {formatPriceBn(course.priceBdt)}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 text-4xl drop-shadow-lg">{course.emoji}</div>
                  <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <PlayCircle className="h-5 w-5 text-gray-900" fill="currentColor" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", difficultyColor(course.difficulty))}>
                      {difficultyLabel(course.difficulty)}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{course.language === "Bengali" ? "বাংলা" : course.language}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                    {course.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                    {course.subtitle}
                  </p>

                  <div className="mt-4 flex items-center gap-2.5 pb-4 border-b border-gray-100">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-white text-xs font-bold shadow-sm", course.accentGradient)}>
                      {course.instructor.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{course.instructor.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{course.instructor.title}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <strong className="text-gray-900">{course.rating}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {toBengaliNumber(course.studentsCount.toLocaleString())}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDurationBn(course.durationMinutes)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
