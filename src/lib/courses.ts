// AquaFarm Course Catalog — Day-to-day Bangla content for Bangladeshi fish farmers.
// Covers carp, catfish, tilapia, feed management, disease control, natural feed,
// water quality, and polyculture. Thumbnails use Unsplash photos (https-only,
// allowed by next.config.mjs remotePatterns).

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface CourseInstructor {
  name: string;
  title: string;
  initials: string; // 2-letter avatar fallback
}

export interface CourseLesson {
  id: string;
  title: string;
  type: "video" | "article";
  videoUrl?: string;       // YouTube embed url for video lessons
  duration: number;        // minutes
  description: string;
  isFreePreview?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseCategory {
  slug: string;             // url slug
  title: string;            // Bengali display name
  emoji: string;            // category icon
  gradient: string;         // tailwind gradient classes for chips/headers
  description: string;
}

export interface Course {
  slug: string;
  categorySlug: string;
  title: string;            // Bengali title
  subtitle: string;         // 1-line tagline (Bengali)
  description: string;      // longer description (Bengali)
  thumbnailUrl: string;     // Unsplash photo url
  accentGradient: string;   // tailwind gradient for thumbnail overlay/fallback
  emoji: string;            // big emoji shown on thumbnail
  difficulty: Difficulty;
  language: "Bengali" | "English" | "Bilingual";
  priceBdt: number;         // 0 = free
  durationMinutes: number;
  studentsCount: number;
  rating: number;           // 0-5
  instructor: CourseInstructor;
  highlights: string[];     // bullet points (Bengali)
  modules: CourseModule[];
  isFeatured?: boolean;
  isNew?: boolean;
}

// ─── Categories ────────────────────────────────────────────────────────────────

export const CATEGORIES: CourseCategory[] = [
  { slug: "carp", title: "কার্প মাছ", emoji: "🐟", gradient: "from-emerald-500 to-teal-600",
    description: "রুই, কাতলা, মৃগেল, সিলভার কার্প চাষের সব কিছু" },
  { slug: "catfish", title: "মাগুর/শিং", emoji: "🐠", gradient: "from-amber-500 to-orange-600",
    description: "মাগুর, শিং, পাঙ্গাস — দ্রুত লাভজনক চাষ" },
  { slug: "tilapia", title: "তেলাপিয়া ও কই", emoji: "🌿", gradient: "from-cyan-500 to-blue-600",
    description: "বাণিজ্যিক তেলাপিয়া ও কই মাছ চাষের কৌশল" },
  { slug: "feed", title: "মাছের খাবার", emoji: "🌾", gradient: "from-yellow-500 to-amber-600",
    description: "ফিড পরিচালনা, FCR, খরচ কমানোর উপায়" },
  { slug: "natural-feed", title: "প্রাকৃতিক খাবার", emoji: "🌱", gradient: "from-green-500 to-emerald-600",
    description: "নিজে বানানো খাবার — কচুরিপানা, খৈল, ভাতের কুঁড়া" },
  { slug: "disease", title: "রোগ ও চিকিৎসা", emoji: "💊", gradient: "from-rose-500 to-red-600",
    description: "রোগ চিনুন, প্রতিরোধ করুন, চিকিৎসা দিন" },
  { slug: "water", title: "পানির গুণাগুণ", emoji: "💧", gradient: "from-sky-500 to-cyan-600",
    description: "pH, অক্সিজেন, অ্যামোনিয়া ব্যবস্থাপনা" },
  { slug: "polyculture", title: "মিশ্র চাষ", emoji: "🔄", gradient: "from-fuchsia-500 to-purple-600",
    description: "একই পুকুরে কয়েক প্রজাতির মাছ চাষ" },
];

const yt = (id: string) => `https://www.youtube.com/embed/${id}`;

// ─── Courses ──────────────────────────────────────────────────────────────────

export const COURSES: Course[] = [
  {
    slug: "carp-master-guide",
    categorySlug: "carp",
    title: "রুই-কাতলা চাষের পূর্ণাঙ্গ গাইড",
    subtitle: "শুরু থেকে বিক্রি পর্যন্ত — কার্প চাষের সব ধাপ",
    description: "এই কোর্সে আপনি শিখবেন কেমনে পুকুর প্রস্তুত করতে হয়, ভালো পোনা চিনতে হয়, কতটা ঘনত্বে ছাড়তে হয়, খাবার দেওয়ার নিয়ম, পানির যত্ন, এবং সবশেষে কেমনে বেশি দামে বিক্রি করবেন। বাংলাদেশের আবহাওয়া আর বাজারের কথা মাথায় রেখে বানানো।",
    thumbnailUrl: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-emerald-600 via-teal-600 to-cyan-700",
    emoji: "🐟",
    difficulty: "beginner",
    language: "Bengali",
    priceBdt: 0,
    durationMinutes: 240,
    studentsCount: 1842,
    rating: 4.8,
    instructor: { name: "মো. রফিকুল ইসলাম", title: "কৃষি সম্প্রসারণ অফিসার, ময়মনসিংহ", initials: "RI" },
    highlights: [
      "পুকুর তৈরি ও পানি দেওয়ার সঠিক পদ্ধতি",
      "ভালো পোনা চেনার ৭টি লক্ষণ",
      "মাসভিত্তিক খাবার দেওয়ার চার্ট",
      "১০০০ মাছে কত খাবার লাগবে — সরাসরি হিসাব",
      "বিক্রির আগে ওজন বাড়ানোর কৌশল",
    ],
    isFeatured: true,
    isNew: true,
    modules: [
      { id: "m1", title: "শুরুর কথা: পুকুর প্রস্তুতি", lessons: [
        { id: "l1", title: "কার্প চাষে কেন বিনিয়োগ করবেন?", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 8, description: "বাজারের চাহিদা, লাভের হিসাব, ঝুঁকি — সব এক ভিডিওতে।", isFreePreview: true },
        { id: "l2", title: "পুকুর শুকানো ও চুন প্রয়োগ", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 12, description: "পুকুর প্রস্তুতির প্রথম ধাপ — কেমনে চুন দিতে হয়, কতটুকু দিতে হয়।" },
        { id: "l3", title: "জৈব সার ও রাসায়নিক সার", type: "article", duration: 10, description: "গোবর, ইউরিয়া, টিএসপি — কোনটা কখন কতটুকু দেবেন।" },
      ]},
      { id: "m2", title: "পোনা ছাড়া ও যত্ন", lessons: [
        { id: "l4", title: "ভালো পোনা চেনার উপায়", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 9, description: "চোখ, পাখনা, সাঁতার দেখে কেমনে বুঝবেন পোনা সুস্থ কিনা।" },
        { id: "l5", title: "পোনা ছাড়ার সঠিক ঘনত্ব", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 11, description: "প্রতি শতকে কতগুলো পোনা ছাড়লে ভালো বৃদ্ধি হয়।" },
        { id: "l6", title: "মৃত্যুহার কমানোর কৌশল", type: "article", duration: 8, description: "প্রথম ৭ দিনের যত্ন — যাতে পোনা না মরে।" },
      ]},
      { id: "m3", title: "খাবার ও বৃদ্ধি ব্যবস্থাপনা", lessons: [
        { id: "l7", title: "মাসিক খাবার ক্যালেন্ডার", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 14, description: "১ম মাস থেকে বিক্রি পর্যন্ত খাবারের ছক।" },
        { id: "l8", title: "FCR কী এবং কেমনে কম রাখবেন", type: "article", duration: 12, description: "১ কেজি মাছ বানাতে কত খাবার লাগে — হিসাব শিখুন।" },
      ]},
      { id: "m4", title: "বিক্রি ও লাভ-ক্ষতির হিসাব", lessons: [
        { id: "l9", title: "বাজারে ভালো দাম পাওয়ার সময়", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 10, description: "কখন বিক্রি করলে দাম বেশি পাবেন — মৌসুমী হিসাব।" },
        { id: "l10", title: "এক বছরের খরচ ও আয়ের পূর্ণ হিসাব", type: "article", duration: 15, description: "১ বিঘা পুকুরে কত খরচ, কত লাভ — হিসাবসহ।" },
      ]},
    ],
  },
  {
    slug: "catfish-profit",
    categorySlug: "catfish",
    title: "মাগুর-শিং চাষে দ্বিগুণ লাভ",
    subtitle: "অল্প জায়গায় বেশি লাভ — মাগুর-শিং চাষের পেশাদার কৌশল",
    description: "কম জায়গায় বেশি মাছ, কম খরচে বেশি লাভ — মাগুর আর শিং চাষের সব গোপন কৌশল। ছোট পুকুর বা চৌবাচ্চাতেও কেমনে শুরু করবেন তা শিখবেন।",
    thumbnailUrl: "https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-amber-600 via-orange-600 to-red-700",
    emoji: "🐠",
    difficulty: "intermediate",
    language: "Bengali",
    priceBdt: 499,
    durationMinutes: 180,
    studentsCount: 924,
    rating: 4.7,
    instructor: { name: "ড. সালমা খাতুন", title: "মৎস্য বিজ্ঞানী, BAU", initials: "SK" },
    highlights: [
      "চৌবাচ্চা/ছোট পুকুরে মাগুর চাষ",
      "শিং এর জন্য আদর্শ পানির গভীরতা",
      "প্রোটিনযুক্ত খাবার বানানোর ফর্মুলা",
      "৩ মাসে ৫০০ গ্রাম ওজন তোলার কৌশল",
    ],
    isFeatured: true,
    modules: [
      { id: "m1", title: "ব্যবস্থাপনা শুরু", lessons: [
        { id: "l1", title: "মাগুর নাকি শিং — কোনটা বেছে নেবেন?", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 9, description: "বাজার, পানি, মাটি অনুযায়ী সিদ্ধান্ত।", isFreePreview: true },
        { id: "l2", title: "পুকুরের প্রস্তুতি ও পানি ব্যবস্থাপনা", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 11, description: "এই দুই মাছের জন্য পানি কেমন হওয়া দরকার।" },
      ]},
      { id: "m2", title: "পোনা ও খাবার", lessons: [
        { id: "l3", title: "পোনা সংগ্রহ ও পরিবহন", type: "article", duration: 8, description: "দূর থেকে পোনা আনলে কেমনে বাঁচাবেন।" },
        { id: "l4", title: "প্রোটিন বেশি — খাবারের কম্পোজিশন", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 13, description: "৩৫% প্রোটিন খাবার নিজে বানানোর রেসিপি।" },
      ]},
      { id: "m3", title: "রোগ ও বিক্রি", lessons: [
        { id: "l5", title: "মাগুরের সাধারণ রোগ ও সমাধান", type: "article", duration: 10, description: "পেট ফোলা, লেজ পচা — কী করবেন।" },
        { id: "l6", title: "জীবন্ত বিক্রির কৌশল", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 8, description: "মাছ জীবিত পরিবহন করে দাম পান বেশি।" },
      ]},
    ],
  },
  {
    slug: "tilapia-commercial",
    categorySlug: "tilapia",
    title: "তেলাপিয়া বাণিজ্যিক চাষ",
    subtitle: "GIFT তেলাপিয়া দিয়ে দ্রুত আয়ের সম্পূর্ণ গাইড",
    description: "বাংলাদেশে সবচেয়ে দ্রুত বর্ধনশীল মাছ — তেলাপিয়া। ৪ মাসে ৩০০ গ্রাম, কম খরচ, বড় লাভ। GIFT জাতের তেলাপিয়া ব্যবহার, কেইজ চাষ, এবং পুকুর চাষ — সব শিখুন।",
    thumbnailUrl: "https://images.unsplash.com/photo-1583212292454-c70d5e1f51d9?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-cyan-600 via-blue-600 to-indigo-700",
    emoji: "🌿",
    difficulty: "beginner",
    language: "Bengali",
    priceBdt: 0,
    durationMinutes: 150,
    studentsCount: 1320,
    rating: 4.6,
    instructor: { name: "আবু তাহের", title: "বাণিজ্যিক মৎস্যচাষী, কুমিল্লা", initials: "AT" },
    highlights: [
      "GIFT তেলাপিয়ার সুবিধা",
      "কেইজ কালচার বনাম পুকুর কালচার",
      "মনো-সেক্স তেলাপিয়া কেন গুরুত্বপূর্ণ",
      "৪ মাসের গ্রোথ চার্ট",
    ],
    isNew: true,
    modules: [
      { id: "m1", title: "তেলাপিয়া পরিচিতি", lessons: [
        { id: "l1", title: "GIFT তেলাপিয়া কী?", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 7, description: "জেনেটিক্যালি ইম্প্রুভড তেলাপিয়ার ইতিহাস ও সুবিধা।", isFreePreview: true },
        { id: "l2", title: "কোন জাত আপনার জন্য?", type: "article", duration: 6, description: "নাইলোটিকা, GIFT, এবং অন্যান্য জাত তুলনা।" },
      ]},
      { id: "m2", title: "চাষ পদ্ধতি", lessons: [
        { id: "l3", title: "পুকুরে তেলাপিয়া চাষ", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 12, description: "পুকুর প্রস্তুতি থেকে বিক্রি।" },
        { id: "l4", title: "কেইজ কালচার সিস্টেম", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 14, description: "নদী/বড় জলাশয়ে কেইজ পদ্ধতি।" },
      ]},
      { id: "m3", title: "খাবার ও মার্কেটিং", lessons: [
        { id: "l5", title: "ভাসমান বনাম ডোবা খাবার", type: "article", duration: 8, description: "কোনটা ব্যবহার করলে FCR ভালো হয়।" },
        { id: "l6", title: "পাইকারি বিক্রির কৌশল", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 10, description: "বাজার নির্বাচন ও দাম নির্ধারণ।" },
      ]},
    ],
  },
  {
    slug: "feed-management-basics",
    categorySlug: "feed",
    title: "মাছের খাবার ব্যবস্থাপনা",
    subtitle: "FCR কমিয়ে লাভ বাড়ান — খাবারে সবচেয়ে বেশি খরচ হয়",
    description: "মাছ চাষের ৭০% খরচ খাবারে যায়। এই খরচ ১০-২০% কমালেই অনেক লাভ। শিখুন কেমনে সঠিক সময়, সঠিক পরিমাণ আর সঠিক ধরনের খাবার দিয়ে FCR কমাতে হয়।",
    thumbnailUrl: "https://images.unsplash.com/photo-1574870111867-089730e5a72b?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-yellow-500 via-amber-600 to-orange-700",
    emoji: "🌾",
    difficulty: "intermediate",
    language: "Bengali",
    priceBdt: 299,
    durationMinutes: 120,
    studentsCount: 756,
    rating: 4.9,
    instructor: { name: "ইঞ্জি. মাহবুব আলম", title: "ফিড কনসালট্যান্ট", initials: "MA" },
    highlights: [
      "FCR ১.৩ এ নামানোর কৌশল",
      "সকাল-বিকালে কতটুকু খাবার",
      "পেলেট সাইজ অনুযায়ী মাছের বয়স",
      "খাবার নষ্ট হওয়া রোধের পদ্ধতি",
    ],
    modules: [
      { id: "m1", title: "মূল ধারণা", lessons: [
        { id: "l1", title: "FCR কী এবং কেন গুরুত্বপূর্ণ", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 8, description: "Feed Conversion Ratio ব্যাখ্যা।", isFreePreview: true },
        { id: "l2", title: "প্রোটিন, চর্বি, কার্বোহাইড্রেট", type: "article", duration: 10, description: "কোন বয়সে কতটা দরকার।" },
      ]},
      { id: "m2", title: "প্রায়োগিক কৌশল", lessons: [
        { id: "l3", title: "ভাসমান বনাম ডোবা পেলেট", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 9, description: "কোনটা ভালো কোন মাছের জন্য।" },
        { id: "l4", title: "খাবার দেওয়ার সঠিক সময়", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 7, description: "সকাল/বিকাল কেন গুরুত্বপূর্ণ।" },
      ]},
    ],
  },
  {
    slug: "homemade-fish-feed",
    categorySlug: "natural-feed",
    title: "বাড়িতে মাছের খাবার বানান",
    subtitle: "কম খরচে নিজে তৈরি করুন উচ্চমানের ফিড",
    description: "কেনা খাবারের ৪০-৫০% খরচ বাঁচান নিজে বানিয়ে। সরিষার খৈল, ভাতের কুঁড়া, কচুরিপানা, ঝিনুকের খোসা — সব দিয়ে কেমনে পুষ্টিকর ফিড বানাবেন। সাথে দেখুন গাঁজানোর (ফার্মেন্টেশন) কৌশল।",
    thumbnailUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-green-600 via-emerald-600 to-teal-700",
    emoji: "🌱",
    difficulty: "intermediate",
    language: "Bengali",
    priceBdt: 199,
    durationMinutes: 95,
    studentsCount: 612,
    rating: 4.8,
    instructor: { name: "নাজমা বেগম", title: "পল্লী মৎস্য উদ্যোক্তা, যশোর", initials: "NB" },
    highlights: [
      "কচুরিপানা থেকে প্রোটিন বের করা",
      "সরিষার খৈল গাঁজানোর সহজ পদ্ধতি",
      "ভাতের কুঁড়া + ঝিনুক ফর্মুলা",
      "৭ দিনের ফার্মেন্টেশন প্ল্যান",
    ],
    isNew: true,
    modules: [
      { id: "m1", title: "কাঁচামাল চেনা", lessons: [
        { id: "l1", title: "স্থানীয় উপাদান যা কাজে লাগে", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 11, description: "বাড়ির আশেপাশে যা পাবেন।", isFreePreview: true },
        { id: "l2", title: "প্রোটিনের উৎস", type: "article", duration: 8, description: "শুটকি, খৈল, কচুরিপানা — পরিমাপ।" },
      ]},
      { id: "m2", title: "ফর্মুলা ও তৈরি", lessons: [
        { id: "l3", title: "৩০% প্রোটিন ফর্মুলা", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 13, description: "ধাপে ধাপে দেখানো হয়েছে।" },
        { id: "l4", title: "ফার্মেন্টেশন: গাঁজানোর বিজ্ঞান", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 12, description: "৭ দিনে প্রস্তুত।" },
        { id: "l5", title: "পেলেট মেশিন বনাম হাতে বানানো", type: "article", duration: 7, description: "কোনটা সাশ্রয়ী।" },
      ]},
    ],
  },
  {
    slug: "disease-control-mastery",
    categorySlug: "disease",
    title: "মাছের রোগ চিনুন ও সারান",
    subtitle: "প্রতিরোধ চিকিৎসার চেয়ে ভালো — রোগের আগেই থামান",
    description: "EUS, ক্ষত রোগ, পেট ফোলা, লেজ পচা, পরজীবী আক্রমণ — মাছের সব সাধারণ রোগ চিনতে শিখুন। দেখেই কেমনে বুঝবেন কী হয়েছে, এবং কেমনে সারাবেন বা প্রতিরোধ করবেন। লোকাল ওষুধ ও প্রাকৃতিক উপায় দুটোই শেখানো হবে।",
    thumbnailUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-rose-600 via-red-600 to-pink-700",
    emoji: "💊",
    difficulty: "advanced",
    language: "Bengali",
    priceBdt: 599,
    durationMinutes: 200,
    studentsCount: 489,
    rating: 4.9,
    instructor: { name: "ড. মাহফুজুর রহমান", title: "মৎস্য রোগ বিশেষজ্ঞ", initials: "MR" },
    highlights: [
      "১৫টি সাধারণ রোগ চেনার চার্ট",
      "প্রাকৃতিক প্রতিরোধক ব্যবহার",
      "কোন ওষুধ কতটা প্রয়োগ করবেন",
      "জৈব নিরাপত্তা ব্যবস্থা",
    ],
    isFeatured: true,
    modules: [
      { id: "m1", title: "রোগ চেনা", lessons: [
        { id: "l1", title: "সুস্থ ও অসুস্থ মাছের পার্থক্য", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 9, description: "চোখে দেখেই চিনুন।", isFreePreview: true },
        { id: "l2", title: "EUS রোগ — লক্ষণ ও চিকিৎসা", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 14, description: "ক্ষত রোগ সম্পূর্ণ গাইড।" },
        { id: "l3", title: "পরজীবী আক্রমণ", type: "article", duration: 10, description: "উকুন, কৃমি — সমাধানসহ।" },
      ]},
      { id: "m2", title: "প্রতিরোধ ও চিকিৎসা", lessons: [
        { id: "l4", title: "প্রোবায়োটিক ব্যবহার", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 11, description: "কেমনে আর কখন।" },
        { id: "l5", title: "কোয়ারেন্টাইন প্রটোকল", type: "article", duration: 8, description: "নতুন মাছ আনলে কী করবেন।" },
        { id: "l6", title: "সাশ্রয়ী চিকিৎসা পদ্ধতি", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 13, description: "লবণ, পটাশ ব্যবহার।" },
      ]},
    ],
  },
  {
    slug: "water-quality-pro",
    categorySlug: "water",
    title: "পানির গুণাগুণ — পেশাদার ব্যবস্থাপনা",
    subtitle: "ভালো পানি = সুস্থ মাছ = বেশি লাভ",
    description: "পুকুরের পানি যদি ঠিক না থাকে, যত ভালো খাবারই দিন — মাছ মরবে। pH, অক্সিজেন, অ্যামোনিয়া, তাপমাত্রা — সব কেমনে মাপবেন আর সমস্যা হলে কেমনে ঠিক করবেন।",
    thumbnailUrl: "https://images.unsplash.com/photo-1545816250-e12bedba42ba?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-sky-600 via-cyan-600 to-blue-700",
    emoji: "💧",
    difficulty: "intermediate",
    language: "Bengali",
    priceBdt: 399,
    durationMinutes: 140,
    studentsCount: 678,
    rating: 4.7,
    instructor: { name: "ড. শাহিদা পারভিন", title: "জলজ পরিবেশবিদ", initials: "SP" },
    highlights: [
      "pH মাপার সহজ কৌশল",
      "অক্সিজেন বাড়ানোর ৫টি উপায়",
      "অ্যামোনিয়া বিষক্রিয়া রোধ",
      "মৌসুমী যত্নের চেকলিস্ট",
    ],
    modules: [
      { id: "m1", title: "মৌলিক পরিমাপ", lessons: [
        { id: "l1", title: "pH কী, কেমনে মাপবেন", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 8, description: "কিট ব্যবহার ও ব্যাখ্যা।", isFreePreview: true },
        { id: "l2", title: "দ্রবীভূত অক্সিজেন (DO)", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 10, description: "কেন এটা সবচেয়ে গুরুত্বপূর্ণ।" },
        { id: "l3", title: "অ্যামোনিয়া পরীক্ষা", type: "article", duration: 7, description: "কখন আর কেমনে।" },
      ]},
      { id: "m2", title: "সমস্যা সমাধান", lessons: [
        { id: "l4", title: "অক্সিজেন কম হলে কী করবেন", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 9, description: "এয়ারেটর, পানি বদলানো।" },
        { id: "l5", title: "শৈবাল বেশি হলে", type: "article", duration: 6, description: "চুন, রেঙ্গা — প্রায়োগিক সমাধান।" },
      ]},
    ],
  },
  {
    slug: "polyculture-mastery",
    categorySlug: "polyculture",
    title: "মিশ্র মাছ চাষ মাস্টারক্লাস",
    subtitle: "এক পুকুরে কয়েক প্রজাতি — সর্বোচ্চ ফলন",
    description: "রুই + কাতলা + মৃগেল + সিলভার কার্প — সঠিক অনুপাতে মিশিয়ে চাষ করলে একই পুকুরে ৩০-৫০% বেশি উৎপাদন। শিখুন কোন মাছ কত পরিমাণে, কোন কোন মাছ একসাথে চলে আর কোনগুলো চলে না।",
    thumbnailUrl: "https://images.unsplash.com/photo-1576073719676-aa95576db207?w=1200&q=80&auto=format&fit=crop",
    accentGradient: "from-fuchsia-600 via-purple-600 to-violet-700",
    emoji: "🔄",
    difficulty: "advanced",
    language: "Bengali",
    priceBdt: 799,
    durationMinutes: 180,
    studentsCount: 342,
    rating: 4.8,
    instructor: { name: "ড. এস.এম. মামুনুর রশিদ", title: "মৎস্য পরামর্শক", initials: "MR" },
    highlights: [
      "৪ স্তরের মাছ ব্যবস্থাপনা",
      "প্রজাতির আদর্শ অনুপাত",
      "খাবার পার্টিশনিং কৌশল",
      "বছরে ২ ফসলের পরিকল্পনা",
    ],
    modules: [
      { id: "m1", title: "মূল ধারণা", lessons: [
        { id: "l1", title: "পলি কালচার কেন লাভজনক", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 10, description: "মনো বনাম পলি কালচার।", isFreePreview: true },
        { id: "l2", title: "পানির স্তর অনুযায়ী মাছ", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 12, description: "উপরের, মাঝের, নিচের মাছ।" },
      ]},
      { id: "m2", title: "প্রায়োগিক চাষ", lessons: [
        { id: "l3", title: "৪ প্রজাতির আদর্শ অনুপাত", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 14, description: "৩০:২৫:২৫:২০ ফর্মুলা।" },
        { id: "l4", title: "পরস্পর সংঘাত এড়ানো", type: "article", duration: 9, description: "কোন প্রজাতি কোনটার সাথে চলে না।" },
        { id: "l5", title: "বছরে দুই ফসল পরিকল্পনা", type: "video", videoUrl: yt("dQw4w9WgXcQ"), duration: 11, description: "মার্চ-অক্টোবর সাইকেল।" },
      ]},
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find(c => c.slug === slug);
}
export function getCategoryBySlug(slug: string): CourseCategory | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}
export function getCoursesByCategory(slug: string): Course[] {
  return COURSES.filter(c => c.categorySlug === slug);
}
export function getLesson(courseSlug: string, lessonId: string): { course: Course; lesson: CourseLesson; module: CourseModule } | null {
  const course = getCourseBySlug(courseSlug);
  if (!course) return null;
  for (const m of course.modules) {
    const l = m.lessons.find(x => x.id === lessonId);
    if (l) return { course, lesson: l, module: m };
  }
  return null;
}
export function getAllLessons(course: Course): CourseLesson[] {
  return course.modules.flatMap(m => m.lessons);
}
export function getCourseTotalLessons(course: Course): number {
  return course.modules.reduce((n, m) => n + m.lessons.length, 0);
}

export function difficultyLabel(d: Difficulty): string {
  return d === "beginner" ? "নতুন শিক্ষার্থী"
    : d === "intermediate" ? "মাঝারি"
    : "অভিজ্ঞ";
}
export function difficultyColor(d: Difficulty): string {
  return d === "beginner" ? "bg-emerald-100 text-emerald-700"
    : d === "intermediate" ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBengaliNumber(n: number | string): string {
  return String(n).replace(/[0-9]/g, d => BN_DIGITS[+d]);
}
export function formatDurationBn(minutes: number): string {
  if (minutes < 60) return `${toBengaliNumber(minutes)} মিনিট`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${toBengaliNumber(h)} ঘণ্টা` : `${toBengaliNumber(h)} ঘ ${toBengaliNumber(m)} মি`;
}
export function formatPriceBn(bdt: number): string {
  return bdt === 0 ? "ফ্রি" : `৳${toBengaliNumber(bdt)}`;
}
