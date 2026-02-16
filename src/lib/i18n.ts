/** Arabic UI translations */
export const t = {
  // Header & Navigation
  appName: "كرة قدم",
  live: "مباشر",
  back: "رجوع",
  backToMatches: "العودة للمباريات",
  close: "إغلاق",

  // Today's Matches
  todaysMatches: "مباريات اليوم",
  loadingMatches: "جاري تحميل المباريات…",
  noMatchesToday: "لا توجد مباريات مجدولة لليوم.",
  noMatchesCurrently: "لا توجد مباريات حالياً",
  couldntLoadMatches: "تعذر تحميل المباريات",
  somethingWentWrong: "حدث خطأ ما.",
  refresh: "تحديث",

  // API Key
  apiKeyRequired: "مفتاح API مطلوب",
  apiKeyInstructions:
    "أضف مفتاح Football-Data.org المجاني لتحميل مباريات اليوم. راجع .env.example و README لمعرفة كيفية الحصول عليه.",
  apiKeyEnvHint: "أنشئ ملف .env بالمتغير:",
  apiKeyViewMatchInstructions: "أضف مفتاح Football-Data.org المجاني لعرض تفاصيل المباراة.",

  // Match Card
  watchNow: "شاهد الآن",
  vs: "ضد",

  // Match Page
  loadingMatch: "جاري تحميل المباراة…",
  couldntLoadMatch: "تعذر تحميل المباراة",
  matchNotFound: "المباراة غير موجودة",
  matchDetails: "تفاصيل المباراة",
  league: "الدوري",
  kickOff: "وقت البداية",
  status: "الحالة",

  // Status labels
  statusLive: "مباشر",
  statusUpcoming: "قادمة",
  statusFinished: "منتهية",

  // 404
  pageNotFound: "الصفحة غير موجودة",
  returnToHome: "العودة للرئيسية",

  // Search (for command/combobox if used)
  search: "بحث...",
} as const;

export function getStatusLabel(status: string): string {
  switch (status) {
    case "live":
      return t.statusLive;
    case "upcoming":
      return t.statusUpcoming;
    case "finished":
      return t.statusFinished;
    default:
      return status;
  }
}
