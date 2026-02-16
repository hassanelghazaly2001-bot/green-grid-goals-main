import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEventById, mapTheSportsDBEventToMatch } from "@/api/thesportsdb";
import { MOCK_MATCHES } from "@/data/matches";
import type { Match } from "@/data/matches";

export function useMatchByIdTheSportsDB(matchId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["match", matchId],
    queryFn: async (): Promise<Match | null> => {
      if (!matchId) return null;

      const cached = queryClient.getQueryData<Match[]>(["thesportsdb-today-matches"]);
      const fromCache = cached?.find((m) => m.id === matchId);
      if (fromCache) return fromCache;

      const mockMatch = MOCK_MATCHES.find((m) => m.id === matchId);
      if (mockMatch) return mockMatch;

      const event = await getEventById(matchId);
      return event ? mapTheSportsDBEventToMatch(event) : null;
    },
    enabled: !!matchId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    match: query.data ?? null,
    isLoading: !!matchId && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
