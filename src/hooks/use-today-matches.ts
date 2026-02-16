import { useQuery } from "@tanstack/react-query";
import type { Match } from "@/data/matches";

export function useTodayMatches() {
  const query = useQuery({
    queryKey: ["today-matches"],
    queryFn: async (): Promise<Match[]> => {
      return [];
    },
    staleTime: 60 * 1000,
    retry: 0,
    enabled: false,
  });

  return {
    matches: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: query.refetch,
    needsApiKey: false,
  };
}
