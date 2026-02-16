import { Crown } from "lucide-react";

const SERVERS = [
  { id: "1", label: "البث 1", vip: true, src: "https://stream.mmsiptv.com/droid/rtnc/playlist.m3u8" },
  { id: "2", label: "البث 2", vip: false, src: "https://live-hls-web-aje.akamaized.net/hls/live/2036571/aje/index.m3u8" },
  { id: "3", label: "البث 3", vip: false, src: "https://live-hls-web-aje.akamaized.net/hls/live/2036571/aje/index.m3u8" },
  { id: "4", label: "البث 4", vip: false, src: "https://live-hls-web-aje.akamaized.net/hls/live/2036571/aje/index.m3u8" },
] as const;

interface ServerSelectorProps {
  selectedId: string;
  onSelect: (src: string, id: string) => void;
  servers?: typeof SERVERS;
}

export function ServerSelector({ selectedId, onSelect, servers }: ServerSelectorProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-2" dir="rtl">
      {(servers ?? SERVERS).map((server) => {
        const isActive = selectedId === server.id;
        return (
          <button
            key={server.id}
            type="button"
            onClick={() => onSelect(server.src, server.id)}
            className={`
              relative flex items-center gap-2 rounded-lg border px-4 pt-3 pb-2.5 text-sm font-semibold
              transition-all duration-200
              ${server.vip ? "pt-5" : ""}
              ${isActive
                ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                : "border-border bg-card/80 text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-foreground"
              }
            `}
          >
            {server.vip && (
              <span
                className={`
                  absolute -top-1.5 start-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
                  ${isActive ? "bg-[#FFD700] text-black" : "bg-amber-500/90 text-black"}
                `}
              >
                <Crown className="h-2.5 w-2.5" />
                VIP
              </span>
            )}
            {server.label}
          </button>
        );
      })}
    </div>
  );
}

export { SERVERS };
