import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchFixturesForLeagues } from "@/services/footballService";
import { MatchCard } from "@/components/MatchCard";
import { t } from "@/lib/i18n";
import type { Match } from "@/data/matches";
import { CalendarDays, AlertCircle, Loader2 } from "lucide-react";
import { FeaturedMatchCard } from "@/components/FeaturedMatchCard";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

type DateTab = "yesterday" | "today" | "tomorrow";

const DATE_TABS: { id: Exclude<DateTab, "yesterday">; label: string; offset: number }[] = [
  { id: "today", label: "اليوم", offset: 0 },
  { id: "tomorrow", label: "الغد", offset: 1 },
];

const TOP_LEAGUES = [
  { id: "all", label: "الكل", emoji: "🌍" },
  { id: "saudi", label: "دوري روشن السعودي", emoji: "🇸🇦" },
  { id: "ucl", label: "دوري الأبطال", emoji: "⭐" },
  { id: "epl", label: "الدوري الإنجليزي", emoji: "🏴" },
  { id: "laliga", label: "الدوري الإسباني", emoji: "🇪🇸" },
  { id: "seriea", label: "الدوري الإيطالي", emoji: "🇮🇹" },
  { id: "bundesliga", label: "الدوري الألماني", emoji: "🇩🇪" },
];

const SAUDI_STANDINGS = [
  { team: "Al Hilal", played: 20, points: 56 },
  { team: "Al Nassr", played: 20, points: 50 },
  { team: "Al Ahli", played: 20, points: 43 },
  { team: "Al Ittihad", played: 20, points: 40 },
  { team: "Al Taawon", played: 20, points: 37 },
];

function filterByLeague(match: Match, leagueFilterId: string): boolean {
  if (leagueFilterId === "all") return true;
  const league = match.league.toLowerCase();
  switch (leagueFilterId) {
    case "saudi":
      return league.includes("saudi") || league.includes("روشن");
    case "ucl":
      return league.includes("champions") || league.includes("uefa");
    case "epl":
      return league.includes("premier");
    case "laliga":
      return league.includes("laliga") || league.includes("la liga");
    case "seriea":
      return league.includes("serie a");
    case "bundesliga":
      return league.includes("bundesliga");
    default:
      return true;
  }
}

function getLeaguePriority(league: string): number {
  const l = league.toLowerCase();
  if (l.includes("champions") || l.includes("uefa")) return 100;
  if (l.includes("laliga") || l.includes("la liga")) return 90;
  if (l.includes("premier")) return 88;
  if (l.includes("serie a")) return 84;
  if (l.includes("bundesliga")) return 82;
  if (l.includes("saudi") || l.includes("روشن")) return 80;
  return 60;
}

function isFeaturedAtletiBarca(m: Match): boolean {
  const h = m.homeTeam.toLowerCase();
  const a = m.awayTeam.toLowerCase();
  const atleti = h.includes("atletico") || a.includes("atletico");
  const barca = h.includes("barcelona") || a.includes("barcelona");
  return atleti && barca;
}

function computeMatchPriority(m: Match): number {
  let p = getLeaguePriority(m.league);
  const home = m.homeTeam.toLowerCase();
  const away = m.awayTeam.toLowerCase();
  if (home.includes("barcelona") || away.includes("barcelona")) p += 8;
  if (home.includes("real madrid") || away.includes("real madrid")) p += 8;
  if (home.includes("atletico") || away.includes("atletico")) p += 6;
  if (home.includes("manchester city") || away.includes("manchester city")) p += 6;
  if (home.includes("al hilal") || away.includes("al hilal")) p += 4;
  if (home.includes("al nassr") || away.includes("al nassr")) p += 4;
  if (m.status === "live") p += 12;
  if (isFeaturedAtletiBarca(m)) p += 25;
  return p;
}

function sortMatchesByPriority(matches: Match[], dayOffset: number): Match[] {
  return [...matches].sort((a, b) => {
    const liveA = a.status === "live";
    const liveB = b.status === "live";
    if (liveA && !liveB) return -1;
    if (!liveA && liveB) return 1;
    const pa = computeMatchPriority(a);
    const pb = computeMatchPriority(b);
    if (pb !== pa) return pb - pa;
    const da = getMatchDate(a, dayOffset)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const db = getMatchDate(b, dayOffset)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });
}

function selectHighlightMatch(matches: Match[], dayOffset: number): Match | null {
  const explicitTop = matches.find((m) => m.isTopMatch === true);
  if (explicitTop) return explicitTop;
  const featured = matches.find((m) => isFeaturedAtletiBarca(m));
  if (featured) return featured;
  const prioritizedUpcoming = sortMatchesByPriority(matches, dayOffset).find((m) => {
    const d = getMatchDate(m, dayOffset);
    return d ? d.getTime() - new Date().getTime() > 0 || m.status === "live" : false;
  });
  if (prioritizedUpcoming) return prioritizedUpcoming;
  return getNextBigMatch(matches, dayOffset);
}

function getOffsetForTab(tab: DateTab): number {
  return DATE_TABS.find((t) => t.id === (tab === "yesterday" ? "today" : tab))?.offset ?? 0;
}

function formatDateLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("ar", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getMatchDate(match: Match, dayOffset: number): Date | null {
  if (!match.time || match.time === "–") return null;
  const [hours, minutes] = match.time.split(":");
  const h = Number.parseInt(hours ?? "", 10);
  const m = Number.parseInt(minutes ?? "", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setSeconds(0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  d.setHours(d.getHours() - 3);
  return d;
}

// Smart countdown: pick the nearest upcoming match (smallest positive time difference)
function getNextBigMatch(matches: Match[], dayOffset: number): Match | null {
  if (!matches.length) return null;
  const upcoming = matches
    .map((m) => {
      const date = getMatchDate(m, dayOffset);
      if (!date) return null;
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      return { match: m, date, diff };
    })
    .filter(
      (entry): entry is { match: Match; date: Date; diff: number } =>
        Boolean(entry) && entry.diff > 0
    );

  if (!upcoming.length) return null;

  upcoming.sort((a, b) => a.diff - b.diff);

  return upcoming[0]?.match ?? null;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!target) return;
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!target) {
    return { hasTarget: false, diffMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hasTarget: true, diffMs: diff, days, hours, minutes, seconds };
}

function deriveAutoStatus(match: Match, dayOffset: number): Match["status"] {
  const start = getMatchDate(match, dayOffset);
  if (!start) return match.status;
  const now = new Date();
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  if (now.getTime() >= start.getTime() && now.getTime() <= end.getTime()) return "live";
  if (now.getTime() > end.getTime()) return "finished";
  return match.status;
}

export function TodaysMatchesSection() {
  const [activeTab, setActiveTab] = useState<DateTab>("today");
  const [activeLeague, setActiveLeague] = useState<string>("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dayOffset = useMemo(() => getOffsetForTab(activeTab), [activeTab]);
  const todayISO = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  const tomorrowISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);
    const q = query(collection(db, "matches"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: Match[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Match, "id">),
        }));
        setMatches(arr);
        setIsLoading(false);
      },
      (err) => {
        setIsError(true);
        setErrorMsg(err.message);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => void 0;
  }, []);

  const todayRaw = useMemo(
    () => matches.filter((m) => (m.date ? m.date === todayISO : true)),
    [matches, todayISO]
  );
  const tomorrowRaw = useMemo(
    () => matches.filter((m) => m.date === tomorrowISO),
    [matches, tomorrowISO]
  );
  const adjustedToday = useMemo(() => todayRaw.map((m) => ({ ...m, status: deriveAutoStatus(m, 0) })), [todayRaw]);
  const adjustedTomorrow = useMemo(() => tomorrowRaw.map((m) => ({ ...m, status: deriveAutoStatus(m, 1) })), [tomorrowRaw]);
  const sortedToday = useMemo(() => sortMatchesByPriority(adjustedToday, 0), [adjustedToday]);
  const sortedTomorrow = useMemo(() => sortMatchesByPriority(adjustedTomorrow, 1), [adjustedTomorrow]);
  const sectionTitle = useMemo(() => {
    switch (activeTab) {
      case "tomorrow":
        return "مباريات الغد";
      case "today":
      default:
        return "مباريات اليوم";
    }
  }, [activeTab]);

  const filteredToday = useMemo(
    () =>
      sortedToday.filter((m) => {
        const inLeague = filterByLeague(m, activeLeague);
        const hasValidTimeForDay =
          Boolean(getMatchDate(m, 0)) ||
          m.status === "live" ||
          (typeof m.time === "string" && m.time.trim().length > 0);
        return inLeague && hasValidTimeForDay;
      }),
    [sortedToday, activeLeague]
  );
  const filteredTomorrow = useMemo(
    () =>
      sortedTomorrow.filter((m) => {
        const inLeague = filterByLeague(m, activeLeague);
        const hasValidTimeForDay =
          Boolean(getMatchDate(m, 1)) ||
          m.status === "live" ||
          (typeof m.time === "string" && m.time.trim().length > 0);
        return inLeague && hasValidTimeForDay;
      }),
    [sortedTomorrow, activeLeague]
  );

  const listForTab = activeTab === "tomorrow" ? filteredTomorrow : filteredToday;
  const bigMatch = useMemo(
    () => selectHighlightMatch(listForTab, activeTab === "tomorrow" ? 1 : 0),
    [listForTab, activeTab]
  );

  const bigMatchDate = useMemo(
    () => (bigMatch ? getMatchDate(bigMatch, activeTab === "tomorrow" ? 1 : 0) : null),
    [bigMatch, activeTab]
  );

  const countdown = useCountdown(bigMatchDate);

  return (
    <section className="space-y-8" dir="rtl">

      

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card/50 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري جلب الماتشات...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
          <h3 className="mb-1 font-semibold text-foreground">{t.noMatchesCurrently}</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {errorMsg ?? t.somethingWentWrong}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setIsError(false);
              setErrorMsg(null);
              void fetchFixturesForLeagues()
                .then((arr) => {
                  setMatches(arr);
                  // eslint-disable-next-line no-console
                  console.log("MATCHES_LOADED:", arr);
                })
                .catch((err) => {
                  setIsError(true);
                  setErrorMsg(err instanceof Error ? err.message : "unknown");
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.refresh}
          </button>
        </div>
      )}

      {!isLoading && !isError && matches.length === 0 && (
        <div className="rounded-xl border border-border bg-card/50 py-16 text-center">
          <p className="text-muted-foreground">لا توجد مباريات حالياً، تابعونا لاحقاً</p>
        </div>
      )}

      {!isLoading && !isError && matches.length > 0 && (
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar: Big match + standings (left on desktop, top on mobile) */}
          <aside className="w-full shrink-0 space-y-4 lg:w-80">
            {bigMatch && (
              <FeaturedMatchCard
                homeTeam={bigMatch.homeTeam}
                awayTeam={bigMatch.awayTeam}
                homeLogo={bigMatch.homeLogo}
                awayLogo={bigMatch.awayLogo}
                league={bigMatch.league}
                matchId={bigMatch.id}
                countdownTarget={bigMatchDate}
                watchHref={`/match/${bigMatch.id}`}
              />
            )}
          </aside>

          {/* Main center column: vertical matches list */}
          <div className="flex-1">
            {/* Navigation bar with emoji and day tabs */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-400/40 bg-black/40 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur-md sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl drop-shadow-[0_0_10px_rgba(34,197,94,0.45)]" aria-hidden>
                  ⚽
                </span>
              </div>
              <div className="inline-flex items-center justify-center rounded-full border border-amber-400/40 bg-black/30 p-0.5 text-xs sm:text-sm">
                {DATE_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all sm:px-3",
                        isActive
                          ? "bg-amber-500 text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                          : "text-muted-foreground hover:bg-amber-500/10",
                      ].join(" ")}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic title above matches list */}
            <h2 className="mb-3 bg-gradient-to-l from-amber-400 via-amber-200 to-amber-100 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-2xl">
              {sectionTitle}
            </h2>
            <p className="mb-6 bg-gradient-to-l from-amber-400 via-amber-200 to-amber-100 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl">
              {formatDateLabel(dayOffset)}
            </p>

            <motion.div
              id="match-container"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {(listForTab ?? []).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
              {(listForTab ?? []).length === 0 && (
                <div className="rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                  لا توجد مباريات لهذا الدوري في هذا اليوم. جرّب دوريًا أو تاريخًا آخر.
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
}
