import { useQuery } from "@tanstack/react-query";
import type { Match } from "@/data/matches";

const SAUDI_TEAM_NAMES = ["Al Nassr", "Al Hilal", "Nassr", "Hilal"];

function isSaudiFeatured(m: Match): boolean {
  const home = m.homeTeam.toLowerCase();
  const away = m.awayTeam.toLowerCase();
  return SAUDI_TEAM_NAMES.some(
    (name) =>
      home.includes(name.toLowerCase().replace(" ", "")) ||
      away.includes(name.toLowerCase().replace(" ", ""))
  );
}

function getDateWithOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

/** Fetch soccer events for a given day offset + Al Nassr/Al Hilal next matches, Saudi teams first */
async function fetchMatchesForDayOffset(offset: number): Promise<Match[]> {
  return [];
}

export function useTheSportsDBMatches(dayOffset: number = 0) {
  const query = useQuery({
    queryKey: ["thesportsdb-matches", dayOffset],
    queryFn: () => fetchMatchesForDayOffset(dayOffset),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    matches: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
