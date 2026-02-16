import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Match } from "@/data/matches";
import { getTeamInitials } from "@/data/matches";
import { t } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Bell, Flame, ThumbsUp, MapPin } from "lucide-react";

interface MatchCardProps {
  match: Match;
}

type ReactionType = "fire" | "clap" | "wow";
type VoteOption = "home" | "draw" | "away";

const REACTION_CONFIG: { id: ReactionType; label: string; emoji: string }[] = [
  { id: "fire", label: "حماس", emoji: "🔥" },
  { id: "clap", label: "تصفيق", emoji: "👏" },
  { id: "wow", label: "مفاجأة", emoji: "😮" },
];

export function MatchCard({ match }: MatchCardProps) {
  function adjustedTimeStr(raw: string): string {
    const parts = raw?.split(":") ?? [];
    const h = Number.parseInt(parts[0] ?? "", 10);
    const m = Number.parseInt(parts[1] ?? "", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return raw;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setHours(d.getHours() - 3);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const isLive = match.status === "live";
  const hasScore = match.score !== undefined;
  const isUpcoming = match.status === "upcoming";
  const sourceBadge = useMemo(() => {
    const slug = (match.channelSlug ?? "").toLowerCase();
    if (slug.startsWith("ssc-")) return "SSC";
    if (slug.startsWith("bein-")) return "beIN";
    return null;
  }, [match.channelSlug]);

  const [isExpanded, setIsExpanded] = useState(false);

  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(null);
  const [selectedVote, setSelectedVote] = useState<VoteOption | null>(null);

  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    fire: 0,
    clap: 0,
    wow: 0,
  });

  const [voteCounts, setVoteCounts] = useState<Record<VoteOption, number>>({
    home: 0,
    draw: 0,
    away: 0,
  });

  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  const totalVotes = voteCounts.home + voteCounts.draw + voteCounts.away;

  const votePercentages = useMemo(() => {
    if (!totalVotes) {
      return { home: 0, draw: 0, away: 0 };
    }
    return {
      home: Math.round((voteCounts.home / totalVotes) * 100),
      draw: Math.round((voteCounts.draw / totalVotes) * 100),
      away: Math.round((voteCounts.away / totalVotes) * 100),
    };
  }, [voteCounts, totalVotes]);

  function handleCardClick() {
    if (clickAudioRef.current) {
      // Fire and forget; ignore play errors from autoplay restrictions
      void clickAudioRef.current.play().catch(() => {});
    }
    setIsExpanded((prev) => !prev);
  }

  function handleReactionClick(
    event: React.MouseEvent<HTMLButtonElement>,
    reactionId: ReactionType
  ) {
    event.preventDefault();
    event.stopPropagation();
    setReactionCounts((prev) => ({
      ...prev,
      [reactionId]: prev[reactionId] + 1,
    }));
    setSelectedReaction(reactionId);
  }

  function handleVoteClick(
    event: React.MouseEvent<HTMLButtonElement>,
    option: VoteOption
  ) {
    event.preventDefault();
    event.stopPropagation();
    setVoteCounts((prev) => ({
      ...prev,
      [option]: prev[option] + 1,
    }));
    setSelectedVote(option);
  }

  async function handleRemindMeClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!("Notification" in window)) {
      // eslint-disable-next-line no-alert
      alert("المتصفح لا يدعم إشعارات المتصفح في هذه اللحظة.");
      return;
    }

    if (Notification.permission === "granted") {
      // eslint-disable-next-line no-new
      new Notification("تم تفعيل التذكير بالمباراة", {
        body: `${match.homeTeam} vs ${match.awayTeam} - ${match.time}`,
      });
      return;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // eslint-disable-next-line no-new
        new Notification("تم تفعيل التذكير بالمباراة", {
          body: `${match.homeTeam} vs ${match.awayTeam} - ${match.time}`,
        });
      }
    }
  }

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      className="group cursor-pointer select-none"
    >
      <audio
        ref={clickAudioRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
        preload="auto"
      />
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-md transition-[transform,border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:border-white/30 group-hover:bg-white/[0.09] group-hover:shadow-2xl group-hover:shadow-black/40 sm:p-4">
        {/* Status badge */}
        <div className="absolute end-4 top-4">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_12px_rgba(248,113,113,0.9),0_0_24px_rgba(248,113,113,0.7)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
              {t.live}
            </span>
          ) : isUpcoming ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600/90 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-50 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              قريباً
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              انتهت
            </span>
          )}
        </div>
        {sourceBadge && (
          <div className="absolute start-4 top-4">
            <span className="inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white">
              {sourceBadge}
            </span>
          </div>
        )}

        {/* Compact header: 3-column symmetric layout (home - center - away) */}
        <div className="flex items-center justify-between gap-3" dir="ltr">
          {/* Home team (left column, right-aligned) */}
          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-border bg-muted">
              <AvatarImage src={match.homeLogo} alt={match.homeTeam} />
              <AvatarFallback className="rounded-xl bg-primary/15 text-[0.65rem] font-bold text-primary">
                {getTeamInitials(match.homeTeam)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-end text-right">
              <span className="max-w-[8rem] truncate text-[0.8rem] font-semibold text-foreground sm:max-w-[10rem]">
                {match.homeTeam}
              </span>
            </div>
          </div>

          {/* Center time/score box with fixed width for symmetry */}
          <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-black/25 px-2 py-1.5 sm:w-32">
            <div className="tabular-nums text-sm font-semibold text-foreground">{adjustedTimeStr(match.time)}</div>
            <span className="text-[0.6rem] text-muted-foreground">GMT</span>
          </div>

          {/* Away team (right column, left-aligned) */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-border bg-muted">
              <AvatarImage src={match.awayLogo} alt={match.awayTeam} />
              <AvatarFallback className="rounded-xl bg-primary/15 text-[0.65rem] font-bold text-primary">
                {getTeamInitials(match.awayTeam)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start text-left">
              <span className="max-w-[8rem] truncate text-[0.8rem] font-semibold text-foreground sm:max-w-[10rem]">
                {match.awayTeam}
              </span>
            </div>
          </div>

          {/* Small remind-me bell floating over top-right to keep symmetry */}
          {isUpcoming && (
            <motion.button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleRemindMeClick(event);
              }}
              className="absolute start-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-400/70 bg-amber-500/20 text-amber-100 shadow-sm"
              animate={{ rotate: [0, -12, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <Bell className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>

        {isLive && (
          <div className="mt-2 flex items-center justify-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_0_12px_rgba(248,113,113,0.9),0_0_24px_rgba(248,113,113,0.7)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_10px_rgba(248,113,113,0.9)]" />
              Live
            </span>
          </div>
        )}

        {/* Expanded details: commentator, stadium, interactions */}
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 space-y-3 border-t border-white/10 pt-3 text-[0.7rem]"
          >
            {/* Meta info row */}
            <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-foreground/80">القناة:</span>
                <span className="truncate">
                  {match.tvChannel && match.tvChannel.trim().length > 0 ? match.tvChannel : "غير محدد"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold text-foreground/80">المعلق:</span>
                <span className="truncate">
                  {match.commentator && match.commentator.trim().length > 0 ? match.commentator : "غير محدد"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-semibold text-foreground/80">الملعب:</span>
                <span className="truncate">
                  {match.stadium && match.stadium.trim().length > 0 ? match.stadium : "غير محدد"}
                </span>
              </div>
            </div>

            {/* Emoji reactions */}
            <div className="flex items-center justify-between gap-2 text-[0.7rem]">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                  التفاعل
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {REACTION_CONFIG.map((reaction) => (
                  <button
                    key={reaction.id}
                    type="button"
                    onClick={(event) => handleReactionClick(event, reaction.id)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium transition",
                      selectedReaction === reaction.id
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                        : "border-border bg-card/40 text-muted-foreground hover:border-emerald-500/60 hover:text-emerald-100",
                    ].join(" ")}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="tabular-nums">{reactionCounts[reaction.id]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Match voting */}
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between gap-2 text-[0.7rem]">
                <span className="font-semibold text-primary">
                  من سيفوز في المباراة؟
                </span>
                <span className="text-[0.65rem] text-muted-foreground">
                  {totalVotes ? `${totalVotes} صوت` : "كن أول من يصوت"}
                </span>
              </div>

              <div className="space-y-1.5 text-[0.7rem]">
                <button
                  type="button"
                  onClick={(event) => handleVoteClick(event, "home")}
                  className="flex w-full items-center gap-2 rounded-md bg-black/15 p-1.5 text-start transition hover:bg-primary/10"
                >
                  <span className="w-16 truncate font-semibold text-foreground">
                    {match.homeTeam}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <div
                      className={[
                        "absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-[width]",
                        "duration-300",
                      ].join(" ")}
                      style={{ width: `${votePercentages.home}%` }}
                    />
                  </div>
                  <span
                    className={[
                      "w-10 text-end tabular-nums",
                      selectedVote === "home" ? "text-emerald-300" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {votePercentages.home}%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(event) => handleVoteClick(event, "draw")}
                  className="flex w-full items-center gap-2 rounded-md bg-black/15 p-1.5 text-start transition hover:bg-primary/10"
                >
                  <span className="w-16 truncate font-semibold text-foreground">
                    تعادل
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-sky-500 transition-[width] duration-300"
                      style={{ width: `${votePercentages.draw}%` }}
                    />
                  </div>
                  <span
                    className={[
                      "w-10 text-end tabular-nums",
                      selectedVote === "draw" ? "text-sky-300" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {votePercentages.draw}%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(event) => handleVoteClick(event, "away")}
                  className="flex w-full items-center gap-2 rounded-md bg-black/15 p-1.5 text-start transition hover:bg-primary/10"
                >
                  <span className="w-16 truncate font-semibold text-foreground">
                    {match.awayTeam}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-amber-500 transition-[width] duration-300"
                      style={{ width: `${votePercentages.away}%` }}
                    />
                  </div>
                  <span
                    className={[
                      "w-10 text-end tabular-nums",
                      selectedVote === "away" ? "text-amber-300" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {votePercentages.away}%
                  </span>
                </button>
              </div>
            </div>

            {/* Deep link to full match page */}
            <div className="flex justify-end">
              <Link
                to={`/match/${match.id}`}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-primary hover:underline"
              >
                <Play className="h-3.5 w-3.5" />
                الذهاب إلى صفحة المباراة
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
