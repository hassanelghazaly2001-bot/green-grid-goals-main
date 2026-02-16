/**
 * Football-Data.org API v4
 * https://www.football-data.org/documentation/quickstart
 */

import type { Match } from "@/data/matches";
import { PLACEHOLDER_STREAM_URL } from "@/data/matches";

const BASE_URL = "https://api.football-data.org/v4";

function mapApiStatus(status: ApiMatchStatus): Match["status"] {
  if (status === "IN_PLAY" || status === "PAUSED") return "live";
  if (status === "FINISHED" || status === "AWARDED") return "finished";
  return "upcoming";
}

function formatMatchTime(utcDate: string): string {
  try {
    const d = new Date(utcDate);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "–";
  }
}

export function mapApiMatchToMatch(api: ApiMatch): Match {
  const score = api.score?.fullTime;
  return {
    id: String(api.id),
    homeTeam: api.homeTeam.name,
    awayTeam: api.awayTeam.name,
    league: api.competition.name,
    time: formatMatchTime(api.utcDate),
    status: mapApiStatus(api.status),
    score:
      score != null && score.home != null && score.away != null
        ? { home: score.home, away: score.away }
        : undefined,
    streamUrl: PLACEHOLDER_STREAM_URL,
    homeLogo: api.homeTeam.crest ?? undefined,
    awayLogo: api.awayTeam.crest ?? undefined,
  };
}

export type ApiMatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export interface ApiMatchTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface ApiMatchScore {
  winner?: string;
  duration?: string;
  fullTime?: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
}

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: ApiMatchStatus;
  matchday?: number;
  stage?: string;
  group?: string | null;
  lastUpdated: string;
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem?: string;
  };
  homeTeam: ApiMatchTeam;
  awayTeam: ApiMatchTeam;
  score?: ApiMatchScore;
}

export interface ApiMatchesResponse {
  count: number;
  filters: Record<string, unknown>;
  matches: ApiMatch[];
}

export function getFootballDataApiKey(): string | undefined {
  return undefined;
}

function getApiKey(): string {
  return "";
}

export async function fetchTodaysMatches(): Promise<ApiMatchesResponse> {
  return { count: 0, filters: {}, matches: [] };
}

export async function fetchMatchById(_matchId: string): Promise<ApiMatch | null> {
  return null;
}
