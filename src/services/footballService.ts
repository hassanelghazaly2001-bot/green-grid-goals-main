import type { Match } from "@/data/matches";

export async function fetchFixturesForLeagues(): Promise<Match[]> {
  let manual: Match[] = [];
  try {
    const rawList = window.localStorage.getItem("custom-matches");
    if (rawList) {
      const list = JSON.parse(rawList) as Match[];
      if (Array.isArray(list) && list.length > 0) {
        manual = list;
      }
    }
  } catch {
    void 0;
  }
  const base: Match[] = [...manual];
  const merged: Match[] = base.map((m) => {
    const raw = window.localStorage.getItem(`match-streams:${m.id}`);
    let arr: string[] = [];
    if (raw) {
      try {
        arr = JSON.parse(raw) as string[];
      } catch {
        arr = [];
      }
    }
    const statusRaw = window.localStorage.getItem(`match-status:${m.id}`);
    const statusOverride =
      statusRaw === "live" || statusRaw === "upcoming" || statusRaw === "finished"
        ? statusRaw
        : undefined;
    let tvChannel = m.tvChannel;
    let commentator = m.commentator;
    let stadium = m.stadium;
    try {
      const metaRaw = window.localStorage.getItem(`match-meta:${m.id}`);
      if (metaRaw) {
        const obj = JSON.parse(metaRaw) as { tvChannel?: string; commentator?: string; stadium?: string };
        tvChannel = obj.tvChannel ?? tvChannel;
        commentator = obj.commentator ?? commentator;
        stadium = obj.stadium ?? stadium;
      }
    } catch {
      // ignore
    }
    return {
      ...m,
      streamUrl: arr[0] ?? m.streamUrl,
      status: statusOverride ?? m.status,
      tvChannel,
      commentator,
      stadium,
    };
  });
  return merged;
}
