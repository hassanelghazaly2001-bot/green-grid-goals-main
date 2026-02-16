import React, { useState, useEffect, useRef, useMemo } from "react";
import Hls from "hls.js";
import { ServerSelector } from "@/components/ServerSelector";

type VideoPlayerProps = {
  streamUrls: string[];
  initialIndex?: number;
  className?: string;
  fetchFromSupabase?: { homeTeam: string; awayTeam: string; matchTime?: string };
};

function toProxy(url: string): string {
  return `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
}

function isM3U8(url: string): boolean {
  return /\.m3u8(\?.*)?$/i.test(url);
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\//i.test(url);
}

function toYouTubeEmbed(url: string): string {
  const embedBase = "https://www.youtube.com/embed/";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      const origin = encodeURIComponent(window.location.origin);
      return `${embedBase}${id}?origin=${origin}&autoplay=1&rel=0`;
    }
    if (u.searchParams.has("v")) {
      const id = u.searchParams.get("v") ?? "";
      const origin = encodeURIComponent(window.location.origin);
      return `${embedBase}${id}?origin=${origin}&autoplay=1&rel=0`;
    }
    if (u.pathname.includes("/embed/")) {
      const origin = window.location.origin;
      const ru = new URL(`${u.origin}${u.pathname}${u.search}`);
      ru.searchParams.set("origin", origin);
      ru.searchParams.set("autoplay", "1");
      ru.searchParams.set("rel", "0");
      return ru.toString();
    }
  } catch {
    const m = url.match(/[?&]v=([^&]+)/);
    if (m?.[1]) {
      const origin = encodeURIComponent(window.location.origin);
      return `${embedBase}${m[1]}?origin=${origin}&autoplay=1&rel=0`;
    }
  }
  return url;
}

const VideoPlayer = ({ streamUrls, initialIndex = 0, className, fetchFromSupabase }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dynamicUrls, setDynamicUrls] = useState<string[]>(streamUrls ?? []);
  const [selectedIndex, setSelectedIndex] = useState<number>(initialIndex);
  const selectedUrl = useMemo(() => dynamicUrls?.[selectedIndex] ?? "", [dynamicUrls, selectedIndex]);
  const [hasError, setHasError] = useState<boolean>(false);

  type SupabaseMatchRow = {
    home_team?: string;
    away_team?: string;
    match_time?: string;
    stream_url?: string;
  };

  useEffect(() => {
    // Removed supabase fetch: external API calls are disabled
  }, [fetchFromSupabase, dynamicUrls.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.playsInline = true;

    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          void 0;
        }
        hlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setDynamicUrls(streamUrls ?? []);
    setSelectedIndex(0);
  }, [streamUrls]);

  useEffect(() => {
    const video = videoRef.current;
    const url = selectedUrl;
    setHasError(false);
    if (!url) return;

    if (!isM3U8(url)) {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const src = isYouTubeUrl(url) ? toYouTubeEmbed(url) : url;
      let timeoutId: number | null = null;
      try {
        iframe.src = src;
        try {
          iframe.setAttribute("allowfullscreen", "true");
          iframe.setAttribute("webkitallowfullscreen", "true");
          iframe.setAttribute("mozallowfullscreen", "true");
        } catch {
          void 0;
        }
        iframe.onload = () => {
          if (timeoutId) {
            window.clearTimeout(timeoutId);
            timeoutId = null;
          }
        };
        timeoutId = window.setTimeout(() => {
          setHasError(true);
        }, 6000);
      } catch {
        setHasError(true);
      }
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          void 0;
        }
        hlsRef.current = null;
      }
      return;
    }

    const canNativeHls = !!video?.canPlayType?.("application/vnd.apple.mpegURL");

    if (canNativeHls && !Hls?.isSupported?.()) {
      video.src = url;
      video.onerror = () => {
        try {
          video.src = toProxy(url);
          const p2 = video.play();
          if (p2) p2.catch(() => setHasError(true));
        } catch {
          setHasError(true);
        }
      };
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          try {
            video.src = toProxy(url);
            const p2 = video.play();
            if (p2) p2.catch(() => setHasError(true));
          } catch {
            setHasError(true);
          }
        });
      }
      return;
    }

    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {
        void 0;
      }
      hlsRef.current = null;
    }

    hlsRef.current = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });
    hlsRef.current.attachMedia(video);

    try {
      hlsRef.current.loadSource(url);
    } catch {
      try {
        hlsRef.current.loadSource(toProxy(url));
      } catch {
        setHasError(true);
      }
    }

    const onManifest = (_event: unknown, _data: unknown) => {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => void 0);
      }
    };
    hlsRef.current.on(Hls.Events.MANIFEST_PARSED, onManifest);

    const onError = (_event: unknown, data: unknown) => {
      const d = data as { fatal?: boolean } | null;
      if (d?.fatal && url) {
        try {
          hlsRef.current?.loadSource(toProxy(url));
          const p = video.play();
          if (p) p.catch(() => setHasError(true));
        } catch {
          setHasError(true);
        }
        setHasError(true);
      }
    };
    hlsRef.current.on(Hls.Events.ERROR, onError);

    return () => {
      hlsRef.current?.off(Hls.Events.MANIFEST_PARSED, onManifest);
      hlsRef.current?.off(Hls.Events.ERROR, onError);
    };
  }, [selectedUrl]);

  return (
    <div className={["video-player-container space-y-3", className ?? ""].join(" ")}>
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-xl backdrop-blur-md">
        {isM3U8(selectedUrl) ? (
          <video
            ref={videoRef}
            controls
            playsInline
            crossOrigin="anonymous"
            className="aspect-video w-full"
            poster="https://via.placeholder.com/800x450.png?text=Loading+Live+Stream..."
          />
        ) : (
          <iframe
            ref={iframeRef}
            src=""
            className="aspect-video w-full"
            width="100%"
            height="100%"
            allow="autoplay; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
          />
        )}
        {hasError && (
          <div className="absolute inset-x-0 bottom-0 z-10 m-2 rounded-md bg-red-600/90 px-3 py-2 text-center text-xs font-semibold text-white">
            الرابط لا يعمل، جرب سيرفر آخر
          </div>
        )}
      </div>

      <ServerSelector
        selectedId={String(selectedIndex + 1)}
        servers={(dynamicUrls.length ? dynamicUrls : streamUrls).slice(0, 4).map((src, idx) => ({
          id: String(idx + 1),
          label: `البث ${idx + 1}`,
          vip: idx === 0,
          src,
        }))}
        onSelect={(src, id) => {
          const i = Number.parseInt(id, 10) - 1;
          setSelectedIndex(i >= 0 ? i : 0);
        }}
      />
      {selectedUrl && (
        <div className="flex justify-end">
          <a
            href={selectedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            فتح البث في صفحة خارجية
          </a>
        </div>
      )}
    </div>
  );
};

export default React.memo(VideoPlayer);
