import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchFixturesForLeagues } from "@/services/footballService";
import type { Match } from "@/data/matches";
import VideoPlayer from "@/components/VideoPlayer";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const MatchPage = () => {
  const params = useParams();
  const id = params.id ?? "";
  const [match, setMatch] = React.useState<Match | null>(null);
  const [streams, setStreams] = React.useState<string[]>([]);
  const pandaBase = "https://p4.pandalive.live/albaplayer/";
  const starzBase = "https://a.yallashoot2026.com/albaplayer/";
  const iframeSrc = useMemo(() => {
    if (match?.backupIframe && match.backupIframe.trim().length > 0) return match.backupIframe.trim();
    if (match?.channelSlug && match.channelSlug.trim().length > 0) {
      const base = match.playerServer === "starz" ? starzBase : pandaBase;
      return `${base}${match.channelSlug.trim()}/`;
    }
    return null;
  }, [match, pandaBase, starzBase]);

  React.useEffect(() => {
    const ref = doc(db, "matches", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Omit<Match, "id">;
        setMatch({ id, ...data });
      } else {
        setMatch(null);
      }
    });
    return () => unsub();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">الرجوع</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{match?.league ?? "المباراة"}</span>
        </div>
      </header>
      <main className="container py-6">
        <div className="mx-auto max-w-3xl">
          {match?.cpaLink && (
            <a
              href={match.cpaLink}
              target="_blank"
              rel="noreferrer"
              className="mb-3 block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-bold text-white"
            >
              اضغط هنا للمشاهدة بجودة عالية بدون تقطيع
            </a>
          )}
          {iframeSrc ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-xl backdrop-blur-md">
              <div className="pointer-events-none absolute right-2 top-2 z-[9999] rounded-md bg-black/70 px-3 py-1 text-xs font-bold text-white">
                دورينا
              </div>
              <iframe
                src={iframeSrc}
                className="aspect-video w-full h-full"
                width="100%"
                height="100%"
                allow="autoplay; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-forms allow-same-origin allow-scripts"
              />
              <div className="pointer-events-none absolute left-3 right-24 bottom-3 z-[9999]">
                <div className="w-full rounded-md bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  LIVE ON DOURINA.COM
                </div>
              </div>
            </div>
          ) : (
            <VideoPlayer streamUrls={streams.length ? streams : (match?.streamUrl ? [match.streamUrl] : [])} initialIndex={0} />
          )}
          {streams.length > 1 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {streams.map((s, idx) => (
                <a key={idx} href={s} target="_blank" rel="noreferrer" className="rounded-md border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                  رابط {idx + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MatchPage;
