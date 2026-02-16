import { useQuery } from "@tanstack/react-query";
import type { Match } from "@/data/matches";
import { fetchFixturesForLeagues } from "@/services/footballService";

async function fetchStaticMatches(): Promise<Match[]> {
  return fetchFixturesForLeagues();
}
export function useSupabaseMatches() {
  return useQuery({
    queryKey: ["supabase-matches"],
    queryFn: fetchStaticMatches,
    staleTime: 60 * 60 * 1000,
  });
}
