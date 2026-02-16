export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  /** Optional league icon URL for enriched UI */
  leagueIcon?: string;
  date?: string;
  isTopMatch?: boolean;
  time: string;
  status: "live" | "upcoming" | "finished";
  score?: { home: number; away: number };
  streamUrl: string;
  /** Slug for channel-based iframe player (e.g., "bein-3") */
  channelSlug?: string;
  /** Optional direct iframe src that overrides Panda link when present */
  backupIframe?: string;
  playerServer?: "panda" | "starz";
  homeLogo?: string;
  awayLogo?: string;
  /** Optional TV channel information for enriched UI */
  tvChannel?: string;
  /** Optional commentator name for enriched UI */
  commentator?: string;
  /** Optional stadium/venue name for enriched UI */
  stadium?: string;
  /** Optional CPA banner link to show above player */
  cpaLink?: string;
}

function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export { getTeamInitials };

/** Placeholder stream URL for matches from the API (no real stream provided by Football-Data.org) */
export const PLACEHOLDER_STREAM_URL = "https://live-hls-web-aje.akamaized.net/hls/live/2036571/aje/index.m3u8";

/** Mock match for UI testing when API is slow or returns empty */
export const MOCK_MATCHES: Match[] = [
  {
    id: "mock-nassr-hilal",
    homeTeam: "Al Nassr",
    awayTeam: "Al Hilal",
    league: "دوري روشن السعودي",
    time: "21:00",
    status: "upcoming",
    streamUrl: PLACEHOLDER_STREAM_URL,
    channelSlug: "bein-3",
    backupIframe: "",
    playerServer: "panda",
    homeLogo: "https://www.thesportsdb.com/images/media/team/badge/aihlo51654142932.png",
    awayLogo: "https://www.thesportsdb.com/images/media/team/badge/rwpuye1451199846.png",
    tvChannel: "SSC Sports 1 HD",
    commentator: "TBD",
    stadium: "KSU Stadium, Riyadh",
  },
];
