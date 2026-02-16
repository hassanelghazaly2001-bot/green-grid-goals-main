import type { Match } from "@/data/matches";
import { PLACEHOLDER_STREAM_URL } from "@/data/matches";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function sanitizeStr(input: unknown, fallback = ""): string {
  const s = typeof input === "string" ? input : fallback;
  return s.replace(/<[^>]*>/g, "").trim();
}

function crestUrlForTeam(name: string): string | undefined {
  const n = name.toLowerCase().trim();
  const alias: Record<string, string> = {
    "real madrid": "86",
    "ريال مدريد": "86",
    "barcelona": "81",
    "برشلونة": "81",
    "liverpool": "64",
    "ليفربول": "64",
    "manchester city": "65",
    "مانشستر سيتي": "65",
    "manchester united": "66",
    "مانشستر يونايتد": "66",
    "chelsea": "61",
    "تشيلسي": "61",
    "arsenal": "57",
    "ارسنال": "57",
    "tottenham": "73",
    "توتنهام": "73",
    "paris saint-germain": "524",
    "باريس سان جيرمان": "524",
    "bayern munich": "5",
    "بايرن ميونخ": "5",
    "borussia dortmund": "4",
    "بوروسيا دورتموند": "4",
    "inter": "108",
    "انتر": "108",
    "ac milan": "98",
    "ميلان": "98",
    "juventus": "109",
    "يوفنتوس": "109",
    "napoli": "113",
    "نابولي": "113",
  };
  const id = alias[n];
  return id ? `https://crests.football-data.org/${id}.svg` : undefined;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  return `${y}-${m}-${d}`;
}

type TSDBEvent = {
  idEvent?: string | number;
  strHomeTeam?: string;
  strAwayTeam?: string;
  strLeague?: string;
  strTime?: string;
  intHomeScore?: number | null;
  intAwayScore?: number | null;
  strStatus?: string | null;
  strVenue?: string | null;
  strEvent?: string | null;
  dateEvent?: string | null;
};

export async function autoFetchMatches(dateISO: string): Promise<Match[]> {
  const tsdbURL = `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${dateISO}&s=Soccer`;
  const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(tsdbURL)}`;
  const res = await fetch(proxyURL);
  if (!res.ok) throw new Error(`TSDB fetch failed: ${res.status}`);
  const data = (await res.json()) as { events?: TSDBEvent[] };
  const events = data?.events ?? [];
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("TSDB events empty");
  }

  const mapped: Match[] = events.map((ev) => {
    const id = String(ev.idEvent ?? `${ev.strEvent}-${ev.dateEvent}-${ev.strTime}`);
    const homeTeam = sanitizeStr(ev.strHomeTeam, "الفريق 1");
    const awayTeam = sanitizeStr(ev.strAwayTeam, "الفريق 2");
    const league = sanitizeStr(ev.strLeague, "دوري عام");
    const timeRaw = ev.strTime ?? "00:00";
    const time = toLocalHHmm(timeRaw);
    const homeScore = typeof ev.intHomeScore === "number" ? ev.intHomeScore : undefined;
    const awayScore = typeof ev.intAwayScore === "number" ? ev.intAwayScore : undefined;
    const score =
      typeof homeScore === "number" && typeof awayScore === "number"
        ? { home: homeScore, away: awayScore }
        : undefined;
    const status =
      ev.strStatus?.toLowerCase() === "live"
        ? "live"
        : score
        ? "finished"
        : "upcoming";
    return {
      id,
      homeTeam,
      awayTeam,
      league,
      leagueIcon: undefined,
      time,
      status,
      score,
      streamUrl: PLACEHOLDER_STREAM_URL,
      homeLogo: crestUrlForTeam(homeTeam),
      awayLogo: crestUrlForTeam(awayTeam),
      stadium: sanitizeStr(ev.strVenue ?? undefined, ""),
    };
  });

  return mapped;
}

function toLocalHHmm(time: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  if (!m) return time ?? "00:00";
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const dt = new Date();
  dt.setHours(hh, mm, 0, 0);
  return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export async function scrapeArabicSource(): Promise<Match[]> {
  const defaultURL = "https://livescore.cz/matches/";
  const override = window.localStorage.getItem("arabic-source-url");
  const target = override && override.trim().length > 0 ? override.trim() : defaultURL;
  const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
  const res = await fetch(proxyURL);
  if (!res.ok) throw new Error(`Arabic source fetch failed: ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows: Match[] = [];
  const trList = Array.from(doc.querySelectorAll("tr"));
  for (const tr of trList) {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (tds.length < 3) continue;
    const timeCell = tds[0]?.textContent?.trim() ?? "";
    if (!/^\d{1,2}:\d{2}$/.test(timeCell)) continue;
    const teamsCell = tds[1] ?? tr;
    const leagueCell = tds[2] ?? tr;
    const homeImg = teamsCell.querySelector("img");
    const allImgs = Array.from(teamsCell.querySelectorAll("img"));
    const awayImg = allImgs.length > 1 ? allImgs[1] : null;
    const text = teamsCell.textContent?.trim() ?? "";
    const parts = text.split(/vs|VS|-/).map((s) => s.trim()).filter(Boolean);
    const homeTeam = sanitizeStr(parts[0] ?? text, "الفريق 1");
    const awayTeam = sanitizeStr(parts[1] ?? "", "الفريق 2");
    const leagueName = sanitizeStr(leagueCell.textContent?.trim() ?? "", "دوري عام");
    const leagueIconEl = leagueCell.querySelector("img");

    const dtStr = toLocalHHmm(timeCell);
    const status: "live" | "upcoming" | "finished" = "upcoming";

    rows.push({
      id: `${homeTeam}-${awayTeam}-${dtStr}`,
      homeTeam,
      awayTeam,
      league: leagueName,
      leagueIcon: leagueIconEl?.getAttribute("src") ?? undefined,
      time: dtStr,
      status,
      streamUrl: PLACEHOLDER_STREAM_URL,
      homeLogo: homeImg?.getAttribute("src") ?? crestUrlForTeam(homeTeam) ?? undefined,
      awayLogo: awayImg?.getAttribute("src") ?? crestUrlForTeam(awayTeam) ?? undefined,
      stadium: undefined,
    });
  }
  return rows;
}

type FeedItem = {
  id?: string;
  homeTeam?: string;
  awayTeam?: string;
  league?: string;
  leagueIcon?: string;
  time?: string;
  status?: string;
  homeLogo?: string;
  awayLogo?: string;
};

export async function fetchJsonFeedMatches(dateISO: string): Promise<Match[]> {
  const url = (window.localStorage.getItem("json-feed-url") ?? "").trim();
  if (!url) return [];
  const cacheRaw = window.localStorage.getItem("json-feed-cache");
  try {
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw) as { ts: number; date: string; items: Match[] };
      const fresh = Date.now() - cache.ts < 10 * 60 * 1000 && cache.date === dateISO;
      if (fresh && Array.isArray(cache.items)) {
        return cache.items;
      }
    }
  } catch {
    // ignore cache parsing
  }
  const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyURL);
  if (!res.ok) throw new Error(`JSON feed fetch failed: ${res.status}`);
  const dataUnknown: unknown = await res.json();
  let arr: FeedItem[] = [];
  if (Array.isArray(dataUnknown)) {
    arr = dataUnknown as FeedItem[];
  } else if (typeof dataUnknown === "object" && dataUnknown !== null) {
    const maybe = (dataUnknown as { matches?: unknown }).matches;
    if (Array.isArray(maybe)) {
      arr = maybe as FeedItem[];
    }
  }
  const out: Match[] = arr.map((it) => {
    const homeTeam = sanitizeStr(it.homeTeam, "الفريق 1");
    const awayTeam = sanitizeStr(it.awayTeam, "الفريق 2");
    const league = sanitizeStr(it.league, "دوري عام");
    const leagueIcon = sanitizeStr(it.leagueIcon ?? "", "");
    const time = toLocalHHmm(sanitizeStr(it.time, "00:00"));
    const rawStatus = sanitizeStr(it.status ?? "", "");
    const status: "live" | "upcoming" | "finished" =
      rawStatus.toLowerCase() === "live"
        ? "live"
        : rawStatus.toLowerCase() === "finished"
        ? "finished"
        : "upcoming";
    const id = sanitizeStr(it.id ?? `${homeTeam}-${awayTeam}-${time}`, `${homeTeam}-${awayTeam}-${time}`);
    return {
      id,
      homeTeam,
      awayTeam,
      league,
      leagueIcon: leagueIcon || undefined,
      time,
      status,
      streamUrl: PLACEHOLDER_STREAM_URL,
      homeLogo:
        sanitizeStr(it.homeLogo ?? "", "") || crestUrlForTeam(homeTeam) || undefined,
      awayLogo:
        sanitizeStr(it.awayLogo ?? "", "") || crestUrlForTeam(awayTeam) || undefined,
    };
  });
  const unique: Record<string, Match> = {};
  for (const m of out) {
    const key = m.id || `${m.homeTeam}-${m.awayTeam}-${m.time}`;
    unique[key] = m;
  }
  const final = Object.values(unique);
  try {
    window.localStorage.setItem("json-feed-cache", JSON.stringify({ ts: Date.now(), date: dateISO, items: final }));
  } catch {
    // ignore cache write
  }
  return final;
}
