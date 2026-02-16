import { useQuery } from "@tanstack/react-query";
import { fetchMatchById, getFootballDataApiKey, mapApiMatchToMatch } from "@/api/football-data";
import type { Match } from "@/data/matches";

export function useMatchById(matchId: string | undefined) {
  const hasApiKey = !!getFootballDataApiKey();

  const query = useQuery({
    queryKey: ["match", matchId],
    queryFn: async (): Promise<Match | null> => {
      if (!matchId) return null;
      const apiMatch = await fetchMatchById(matchId);
      return apiMatch ? mapApiMatchToMatch(apiMatch) : null;
    },
    enabled: hasApiKey && !!matchId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  return {
    match: query.data ?? null,
    isLoading: hasApiKey && !!matchId && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    needsApiKey: !hasApiKey,
  };
}
