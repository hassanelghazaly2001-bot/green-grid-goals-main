/**
 * TheSportsDB API v1 (Free tier)
 * https://www.thesportsdb.com/documentation
 * Base URL: https://www.thesportsdb.com/api/v1/json/1 (or /123 for free key)
 */

import type { Match } from "@/data/matches";
import { PLACEHOLDER_STREAM_URL } from "@/data/matches";

// External API integration removed
function buildUrl(_path: string): string {
  return "";
}
async function fetchWithCorsFallback(_url: string): Promise<Response> {
  return new Response(JSON.stringify({ events: null }), { status: 200 });
}

export interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strAlternate?: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strStadium?: string;
  strStadiumThumb?: string;
  strTeamBadge?: string;
  strTeamLogo?: string;
  strCountry?: string;
  strDescriptionEN?: string;
  intFormedYear?: string;
}

export interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  strEventAlternate?: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strLeagueBadge?: string;
  strSeason?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  dateEvent: string;
  strTime?: string;
  strTimestamp?: string;
  strStatus?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strVenue?: string;
  strCountry?: string;
}

export interface SearchTeamsResponse {
  teams: TheSportsDBTeam[] | null;
}

export interface EventsResponse {
  events: TheSportsDBEvent[] | null;
}

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetchWithCorsFallback(url);
  if (!res.ok) {
    throw new Error(`TheSportsDB API error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as T;
  console.log("[TheSportsDB] API response:", url.slice(0, 80) + "...", data);
  return data;
}

/** Search for a team by name (e.g. "Al Nassr", "Al_Hilal") */
export async function searchTeam(teamName: string): Promise<TheSportsDBTeam[]> {
  return [];
}

/** Get today's events. Optionally filter by sport (e.g. "Soccer") */
export async function getTodaysEvents(
  date?: string,
  sport?: string
): Promise<TheSportsDBEvent[]> {
  return [];
}

/** Get next upcoming events for a team by ID */
export async function getTeamNextEvents(teamId: string): Promise<TheSportsDBEvent[]> {
  return [];
}

/** Get last/previous events for a team by ID */
export async function getTeamLastEvents(teamId: string): Promise<TheSportsDBEvent[]> {
  return [];
}

/** Lookup a single event by ID */
export async function getEventById(eventId: string): Promise<TheSportsDBEvent | null> {
  return null;
}

function mapStatus(strStatus?: string): Match["status"] {
  if (!strStatus) return "upcoming";
  const s = strStatus.toUpperCase();
  if (s === "NS" || s === "TBD" || s === "Scheduled") return "upcoming";
  if (s === "1H" || s === "2H" || s === "HT" || s === "LIVE" || s === "IN PLAY") return "live";
  return "finished";
}

function formatTime(strTime?: string): string {
  if (!strTime) return "–";
  const parts = strTime.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return strTime;
}

export function mapTheSportsDBEventToMatch(event: TheSportsDBEvent): Match {
  const homeScore = event.intHomeScore != null ? parseInt(event.intHomeScore, 10) : undefined;
  const awayScore = event.intAwayScore != null ? parseInt(event.intAwayScore, 10) : undefined;
  const status = mapStatus(event.strStatus);
  return {
    id: event.idEvent,
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    league: event.strLeague,
    time: formatTime(event.strTime),
    status,
    score:
      homeScore != null && awayScore != null && !Number.isNaN(homeScore) && !Number.isNaN(awayScore)
        ? { home: homeScore, away: awayScore }
        : undefined,
    streamUrl: PLACEHOLDER_STREAM_URL,
    homeLogo: event.strHomeTeamBadge ?? undefined,
    awayLogo: event.strAwayTeamBadge ?? undefined,
  };
}
