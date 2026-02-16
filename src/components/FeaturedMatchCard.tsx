import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTeamInitials } from "@/data/matches";
import { Flame } from "lucide-react";

type FeaturedMatchCardProps = {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  league?: string;
  matchId?: string;
  countdownTarget: Date | null;
  watchHref?: string;
};

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!target) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!target) {
    return { hasTarget: false, diffMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hasTarget: true, diffMs: diff, days, hours, minutes, seconds };
}

export function FeaturedMatchCard({
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  league,
  time,
  stadium,
  matchId,
  countdownTarget,
  watchHref,
}: FeaturedMatchCardProps) {
  const countdown = useCountdown(countdownTarget);

  const segments = useMemo(
    () => [
      { label: "يوم", value: countdown.days },
      { label: "ساعة", value: countdown.hours },
      { label: "دقيقة", value: countdown.minutes },
      { label: "ثانية", value: countdown.seconds },
    ],
    [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]
  );

  const isReadyToWatch = countdown.hasTarget && countdown.diffMs === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4 shadow-xl shadow-black/50 ring-1 ring-white/15 backdrop-blur-xl sm:p-5" dir="rtl">
      <div className="absolute top-2 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/20 px-2.5 py-1 text-[0.7rem] font-extrabold text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.35)]">
          <Flame className="h-3 w-3 text-red-400" />
          قمة اليوم
        </span>
      </div>
      <div className="flex flex-col items-center gap-6 pt-6">
        <div className="w-full pt-1">
          <span className="mx-auto block max-w-[80%] truncate text-center text-[0.85rem] font-semibold text-foreground/80">
            {league}
          </span>
        </div>

        <div className="flex w-full items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border bg-muted">
              <AvatarImage src={homeLogo} alt={homeTeam} />
              <AvatarFallback className="rounded-xl bg-primary/15 text-[0.7rem] font-bold text-primary">
                {getTeamInitials(homeTeam)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[8rem] truncate text-[0.65rem] font-semibold text-muted-foreground">
              {homeTeam}
            </span>
          </div>

        <div className="flex w-14 shrink-0 items-center justify-center">
          <span className="text-base font-extrabold text-emerald-300">vs</span>
        </div>

          <div className="flex flex-col items-center gap-1">
            <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border bg-muted">
              <AvatarImage src={awayLogo} alt={awayTeam} />
              <AvatarFallback className="rounded-xl bg-primary/15 text-[0.7rem] font-bold text-primary">
                {getTeamInitials(awayTeam)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[8rem] truncate text-[0.65rem] font-semibold text-muted-foreground">
              {awayTeam}
            </span>
          </div>
        </div>

        <div className="mb-2 mt-2 w-full">
          {!isReadyToWatch ? (
            (() => {
              const totalSeconds = Math.floor((countdown.diffMs ?? 0) / 1000);
              const hoursAll = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              const seconds = totalSeconds % 60;
              return (
                <div className="mr-2 flex items-stretch justify-center gap-2 text-center sm:mr-3">
                  {[
                    { label: "ساعة", value: hoursAll },
                    { label: "دقيقة", value: minutes },
                    { label: "ثانية", value: seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex min-w-[3.25rem] flex-col items-center justify-center rounded-xl bg-black/30 px-3 py-2 text-indigo-50 ring-1 ring-white/15"
                    >
                      <span className="tabular-nums text-xl font-extrabold">
                        {String(item.value).padStart(2, "0")}
                      </span>
                      <span className="text-[0.65rem] font-semibold text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="flex justify-center">
              <Link
                to={watchHref ?? (matchId ? `/match/${matchId}` : "#")}
                className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_0_12px_rgba(248,113,113,0.9),0_0_24px_rgba(248,113,113,0.7)] animate-pulse-neon"
              >
                شاهد الآن
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
