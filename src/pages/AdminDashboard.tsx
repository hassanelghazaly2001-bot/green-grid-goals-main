import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";
import type { Match } from "@/data/matches";
import { Star } from "lucide-react";
 

const AdminDashboard = () => {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [autoStatus, setAutoStatus] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [entries, setEntries] = useState<Record<string, string[]>>({});
  const [statuses, setStatuses] = useState<Record<string, "live" | "upcoming" | "finished">>({});
  const [metas, setMetas] = useState<Record<string, { tvChannel: string; commentator: string; stadium: string }>>({});
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [adminTab, setAdminTab] = useState<"today" | "tomorrow">("today");
  const [adminChannelFilter, setAdminChannelFilter] = useState<"all" | "bein" | "ssc" | "others">("all");
  const [selectedServer, setSelectedServer] = useState<"panda" | "starz">("panda");
  const PANDA_SLUGS = [
    ...Array.from({ length: 10 }, (_, i) => `bein-${i + 1}`),
    ...Array.from({ length: 8 }, (_, i) => `ssc-${i + 1}`),
    "on-time",
    "mbc-action",
  ];
  const STARZ_SLUGS = ["sports-d1", "sports-d2", "sports-d3", "sports-d4"];
  const PANDA_CURATED = ["bein-9", "bein-10", "ssc-2", "ssc-3", "ssc-4", "ssc-5", "ssc-8"];
  const STARZ_CURATED = ["sports-d1", "sports-d2", "sports-d3", "sports-d4"];
  const [quickDateFilter, setQuickDateFilter] = useState<"none" | "fixedToday" | "fixedTomorrow">("none");
  const todayISO = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();
  const tomorrowISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();
  const [formData, setFormData] = useState({
    homeTeam: "",
    awayTeam: "",
    homeLogo: "",
    awayLogo: "",
    league: "",
    date: "",
    time: "",
    stream1: "",
    stream2: "",
    channelSlug: "",
    backupIframe: "",
    tvChannel: "",
    commentator: "",
    stadium: "",
  });
  const [newMatch, setNewMatch] = useState({
    homeTeam: "",
    awayTeam: "",
    homeLogo: "",
    awayLogo: "",
    league: "",
    date: "",
    time: "",
    stream1: "",
    stream2: "",
    channelSlug: "",
    backupIframe: "",
  });

 

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("admin-auth");
      if (raw) {
        const obj = JSON.parse(raw) as { valid: boolean; expiresAt: number };
        if (obj.valid && obj.expiresAt > Date.now()) {
          setAuthed(true);
        }
      }
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    function loadFromLocal() {
      try {
        const rawList = window.localStorage.getItem("custom-matches");
        const arr = rawList ? ((JSON.parse(rawList) as Match[]) ?? []) : [];
        setMatches(Array.isArray(arr) ? arr : []);
        setAutoStatus(`تم تحميل ${Array.isArray(arr) ? arr.length : 0} مباراة من التخزين المحلي`);
        const initialEntries: Record<string, string[]> = {};
        const initialStatuses: Record<string, "live" | "upcoming" | "finished"> = {};
        const initialMetas: Record<string, { tvChannel: string; commentator: string; stadium: string }> = {};
        for (const m of arr) {
          try {
            const raw = window.localStorage.getItem(`match-streams:${m.id}`);
            initialEntries[m.id] = raw ? (JSON.parse(raw) as string[]) : ["", "", "", ""];
          } catch {
            initialEntries[m.id] = ["", "", "", ""];
          }
          const st = window.localStorage.getItem(`match-status:${m.id}`);
          initialStatuses[m.id] =
            st === "live" || st === "upcoming" || st === "finished" ? (st as "live" | "upcoming" | "finished") : m.status;
          try {
            const metaRaw = window.localStorage.getItem(`match-meta:${m.id}`);
            if (metaRaw) {
              const obj = JSON.parse(metaRaw) as { tvChannel?: string; commentator?: string; stadium?: string };
              initialMetas[m.id] = {
                tvChannel: obj.tvChannel ?? "",
                commentator: obj.commentator ?? "",
                stadium: obj.stadium ?? "",
              };
            } else {
              initialMetas[m.id] = { tvChannel: "", commentator: "", stadium: "" };
            }
          } catch {
            initialMetas[m.id] = { tvChannel: "", commentator: "", stadium: "" };
          }
        }
        setEntries(initialEntries);
        setStatuses(initialStatuses);
        setMetas(initialMetas);
      } catch {
        setMatches([]);
        setEntries({});
        setStatuses({});
        setMetas({});
        setAutoStatus("تعذر قراءة المباريات من التخزين المحلي");
      }
    }
    loadFromLocal();
    function onStorage(e: StorageEvent) {
      if (e.key === "custom-matches" || (e.key?.startsWith("match-") ?? false)) {
        loadFromLocal();
      }
    }
    function onCustomUpdated() {
      loadFromLocal();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("custom-matches-updated", onCustomUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("custom-matches-updated", onCustomUpdated as EventListener);
    };
  }, [authed]);
  useEffect(() => {
    function onScannerPaste(e: Event) {
      const detail = (e as CustomEvent<string>).detail as string | undefined;
      const slug = detail ?? window.localStorage.getItem("scanner-last-slug") ?? "";
      if (!slug) return;
      if (!showNew) return;
      const f = formRef.current;
      if (!f) return;
      const elSlug = f.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
      const elServer = f.querySelector<HTMLSelectElement>('select[name="playerServer"]');
      if (elSlug) elSlug.value = slug;
      const isStarz = slug.startsWith("sports-d");
      if (elServer) elServer.value = isStarz ? "starz" : "panda";
      setSelectedServer(isStarz ? "starz" : "panda");
      setStatus(`تم إدراج القناة تلقائيًا: ${slug}`);
    }
    window.addEventListener("scanner-last-slug-set", onScannerPaste as EventListener);
    return () => {
      window.removeEventListener("scanner-last-slug-set", onScannerPaste as EventListener);
    };
  }, [showNew]);

  function handleInputChange(name: keyof typeof formData, value: string) {
    console.log("Typing:", value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function updateMatchField(id: string, key: keyof Match, value: string) {
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  }

  function handleLogin() {
    setErr(null);
    if (pwd === "admin2001") {
      setAuthed(true);
      const expiresAt = Date.now() + 1000 * 60 * 60 * 6;
      window.localStorage.setItem("admin-auth", JSON.stringify({ valid: true, expiresAt }));
      return;
    }
    setErr("Access Denied");
  }

  function updateEntry(id: string, idx: number, value: string) {
    setEntries((prev) => {
      const arr = prev[id] ? [...prev[id]] : ["", "", "", ""];
      arr[idx] = value;
      return { ...prev, [id]: arr };
    });
  }

  function save(id: string) {
    setStatus(null);
    const getVal = (name: string) =>
      (document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"][data-id="${id}"]`)?.value ?? "").trim();
    const homeTeam = getVal("homeTeam");
    const awayTeam = getVal("awayTeam");
    const league = getVal("league");
    const time = getVal("time");
    const date = getVal("date");
    const homeLogo = getVal("homeLogo");
    const awayLogo = getVal("awayLogo");
    const stream1 = getVal("stream1");
    const stream2 = getVal("stream2");
    const otherSlug = getVal("otherSlug");
    const channelSlug = otherSlug || getVal("channelSlug");
    const backupIframe = getVal("backupIframe");
    const smartSource = (document.querySelector<HTMLSelectElement>(`select[name="smartSource"][data-id="${id}"]`)?.value ?? "").trim();
    const cpaLink = getVal("cpaLink");
    const playerServer = getVal("playerServer") as "panda" | "starz";
    if (channelSlug && !otherSlug) {
      const valid =
        (playerServer === "panda" && PANDA_SLUGS.includes(channelSlug)) ||
        (playerServer === "starz" && STARZ_SLUGS.includes(channelSlug));
      if (!valid) {
        setStatus("الرجاء اختيار slug مطابق للسيرفر المختار");
        return;
      }
    }
    const tvChannel = getVal("tvChannel");
    const commentator = getVal("commentator");
    const stadium = getVal("stadium");
    const statusVal = getVal("status") as "live" | "upcoming" | "finished";
    const streams = [stream1, stream2].filter((s) => s.length > 0);
    window.localStorage.setItem(`match-streams:${id}`, JSON.stringify(streams));
    window.localStorage.setItem(`match-status:${id}`, statusVal || "upcoming");
    window.localStorage.setItem(
      `match-meta:${id}`,
      JSON.stringify({ tvChannel, commentator, stadium })
    );
    try {
      const listRaw = window.localStorage.getItem("custom-matches");
      const list = listRaw ? ((JSON.parse(listRaw) as Match[]) ?? []) : [];
      const merged = [
        ...list.filter((m) => m.id !== id),
        {
          ...(matches.find((m) => m.id === id) ?? { id, status: "upcoming" }),
          id,
          homeTeam: homeTeam || (matches.find((m) => m.id === id)?.homeTeam ?? ""),
          awayTeam: awayTeam || (matches.find((m) => m.id === id)?.awayTeam ?? ""),
          league: league || (matches.find((m) => m.id === id)?.league ?? ""),
          date: date || (matches.find((m) => m.id === id)?.date ?? ""),
          time: time || (matches.find((m) => m.id === id)?.time ?? ""),
          channelSlug: channelSlug || (matches.find((m) => m.id === id)?.channelSlug ?? undefined),
          backupIframe: (() => {
            const chId = channelSlug?.startsWith("bein-") ? channelSlug.split("-")[1] : "";
            if (smartSource === "yalla" && chId) return `https://yalla-live.io/ch/bein-sports-${chId}/`;
            if (smartSource === "panda" && chId) return `https://pandastream.net/live/bein-${chId}/`;
            return backupIframe || (matches.find((m) => m.id === id)?.backupIframe ?? undefined);
          })(),
          playerServer: playerServer || (matches.find((m) => m.id === id)?.playerServer ?? undefined),
          homeLogo: homeLogo || undefined,
          awayLogo: awayLogo || undefined,
          cpaLink: cpaLink || (matches.find((m) => m.id === id)?.cpaLink ?? undefined),
        } as Match,
      ];
      window.localStorage.setItem("custom-matches", JSON.stringify(merged));
      setMatches(merged);
      window.dispatchEvent(new Event("custom-matches-updated"));
      try {
        const { db } = await import("@/lib/firebase");
        const { doc, setDoc } = await import("firebase/firestore");
        const ref = doc(db, "matches", id);
        const chId = channelSlug?.startsWith("bein-") ? channelSlug.split("-")[1] : "";
        const smartBackup =
          smartSource === "yalla" && chId
            ? `https://yalla-live.io/ch/bein-sports-${chId}/`
            : smartSource === "panda" && chId
            ? `https://pandastream.net/live/bein-${chId}/`
            : backupIframe || undefined;
        await setDoc(
          ref,
          {
            homeTeam: homeTeam || undefined,
            awayTeam: awayTeam || undefined,
            league: league || undefined,
            date: date || undefined,
            time: time || undefined,
            status: statusVal || "upcoming",
            streamUrl: streams[0] || "",
            channelSlug: channelSlug || undefined,
            backupIframe: smartBackup,
            playerServer,
            homeLogo: homeLogo || undefined,
            awayLogo: awayLogo || undefined,
            tvChannel,
            commentator,
            stadium,
            cpaLink: cpaLink || undefined,
          },
          { merge: true }
        );
      } catch {
        // ignore Firestore error for now
      }
    } catch {
      void 0;
    }
    setStatus("Saved");
  }

  function updateMeta(id: string, key: "tvChannel" | "commentator" | "stadium", value: string) {
    setMetas((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { tvChannel: "", commentator: "", stadium: "" }), [key]: value } }));
  }

  function addNewMatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const homeTeam = String(fd.get("homeTeam") ?? "").trim();
    const awayTeam = String(fd.get("awayTeam") ?? "").trim();
    const league = String(fd.get("league") ?? "").trim();
    const time = String(fd.get("time") ?? "").trim();
    if (!homeTeam || !awayTeam || !league || !time) {
      setStatus("يرجى إدخال بيانات المباراة الأساسية");
      return;
    }
    const dateOpt = String(fd.get("dateRadio") ?? "today");
    const now = new Date();
    const d = new Date(now);
    if (dateOpt === "tomorrow") d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateVal = `${y}-${m}-${day}`;
    const newId = `${homeTeam}-${awayTeam}-${dateVal}-${time}`;
    const edited = editingId;
    const otherSlug = String(fd.get("otherSlug") ?? "").trim();
    const channelSlug = (otherSlug || String(fd.get("channelSlug") ?? "").trim()) || undefined;
    const backupIframe = String(fd.get("backupIframe") ?? "").trim() || undefined;
    let playerServer = (String(fd.get("playerServer") ?? "").trim() as "panda" | "starz") || undefined;
    const smartSource = String(fd.get("smartSource") ?? "").trim();
    const cpaLink = String(fd.get("cpaLink") ?? "").trim() || undefined;
    if (otherSlug) {
      playerServer = otherSlug.startsWith("sports-d") ? "starz" : "panda";
    }
    if (channelSlug && playerServer && !otherSlug) {
      const valid =
        (playerServer === "panda" && PANDA_SLUGS.includes(channelSlug)) ||
        (playerServer === "starz" && STARZ_SLUGS.includes(channelSlug));
      if (!valid) {
        setStatus("الرجاء اختيار slug مطابق للسيرفر المختار");
        return;
      }
    }
    const chId = channelSlug?.startsWith("bein-") ? channelSlug.split("-")[1] : "";
    const smartBackup =
      smartSource === "yalla" && chId
        ? `https://yalla-live.io/ch/bein-sports-${chId}/`
        : smartSource === "panda" && chId
        ? `https://pandastream.net/live/bein-${chId}/`
        : backupIframe || undefined;
    const match: Match = {
      id: newId,
      homeTeam,
      awayTeam,
      league,
      date: dateVal,
      time,
      status: (String(fd.get("statusNew") ?? "upcoming") as "live" | "upcoming" | "finished"),
      streamUrl: "",
      channelSlug,
      backupIframe: smartBackup,
      playerServer,
      homeLogo: (String(fd.get("homeLogo") ?? "").trim() || undefined),
      awayLogo: (String(fd.get("awayLogo") ?? "").trim() || undefined),
      cpaLink,
    };
    const listRaw = window.localStorage.getItem("custom-matches");
    const list = listRaw ? ((JSON.parse(listRaw) as Match[]) ?? []) : [];
    const baseList = edited ? list.filter((m) => m.id !== edited) : list.filter((m) => m.id !== newId);
    const merged = [...baseList, match];
    window.localStorage.setItem("custom-matches", JSON.stringify(merged));
    const streams = [String(fd.get("stream1") ?? "").trim(), String(fd.get("stream2") ?? "").trim()].filter((s) => s.length > 0);
    window.localStorage.setItem(`match-streams:${newId}`, JSON.stringify(streams));
    const statusVal = String(fd.get("statusNew") ?? "upcoming");
    window.localStorage.setItem(`match-status:${newId}`, statusVal);
    const tvChannel = String(fd.get("tvChannel") ?? "").trim();
    const commentator = String(fd.get("commentator") ?? "").trim();
    const stadium = String(fd.get("stadium") ?? "").trim();
    window.localStorage.setItem(`match-meta:${newId}`, JSON.stringify({ tvChannel, commentator, stadium }));
    if (edited && edited !== newId) {
      window.localStorage.removeItem(`match-streams:${edited}`);
      window.localStorage.removeItem(`match-status:${edited}`);
      window.localStorage.removeItem(`match-meta:${edited}`);
    }
    setMatches(merged);
    setEntries((prev) => ({ ...prev, [newId]: [String(fd.get("stream1") ?? ""), String(fd.get("stream2") ?? ""), "", ""] }));
    setStatuses((prev) => ({ ...prev, [newId]: "upcoming" }));
    setMetas((prev) => ({ ...prev, [newId]: { tvChannel, commentator, stadium } }));
    setShowNew(false);
    setEditingId(null);
    setFormData({
      homeTeam: "",
      awayTeam: "",
      homeLogo: "",
      awayLogo: "",
      league: "",
      date: "",
      time: "",
      stream1: "",
      stream2: "",
      tvChannel: "",
      commentator: "",
      stadium: "",
    });
    setStatus(edited ? "تم تحديث المباراة" : "تمت إضافة المباراة");
    window.dispatchEvent(new Event("custom-matches-updated"));
    try {
      (async () => {
        const { db } = await import("@/lib/firebase");
        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "matches"), {
          homeTeam,
          awayTeam,
          league,
          date: dateVal,
          time,
          status: String(fd.get("statusNew") ?? "upcoming"),
          streamUrl: "",
          channelSlug,
          backupIframe: smartBackup,
          playerServer,
          homeLogo: (String(fd.get("homeLogo") ?? "").trim() || undefined),
          awayLogo: (String(fd.get("awayLogo") ?? "").trim() || undefined),
          cpaLink,
        });
      })().catch(() => void 0);
    } catch {
      void 0;
    }
  }

  function deleteMatch(id: string) {
    const listRaw = window.localStorage.getItem("custom-matches");
    const list = listRaw ? ((JSON.parse(listRaw) as Match[]) ?? []) : [];
    const remaining = list.filter((m) => m.id !== id);
    window.localStorage.setItem("custom-matches", JSON.stringify(remaining));
    window.localStorage.removeItem(`match-streams:${id}`);
    window.localStorage.removeItem(`match-status:${id}`);
    window.localStorage.removeItem(`match-meta:${id}`);
    setMatches(remaining);
    setEntries((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setStatuses((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setMetas((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setStatus("تم حذف المباراة");
    window.dispatchEvent(new Event("custom-matches-updated"));
  }

  function setTopMatch(id: string) {
    try {
      const listRaw = window.localStorage.getItem("custom-matches");
      const list = listRaw ? ((JSON.parse(listRaw) as Match[]) ?? []) : [];
      const target = list.find((mm) => mm.id === id) || null;
      const targetDate = target?.date ?? todayISO;
      const updated = list.map((m) =>
        m.date === targetDate ? { ...m, isTopMatch: m.id === id } : m
      );
      window.localStorage.setItem("custom-matches", JSON.stringify(updated));
      setMatches(updated);
      setStatus("تم تعيين المباراة كقمة اليوم");
      window.dispatchEvent(new Event("custom-matches-updated"));
    } catch {
      setStatus("تعذر تعيين قمة اليوم");
    }
  }

  function beginEdit(id: string) {
    const m = matches.find((mm) => mm.id === id);
    if (!m) return;
    const arr = entries[id] ?? ["", "", "", ""];
    const meta = metas[id] ?? { tvChannel: "", commentator: "", stadium: "" };
    setEditingId(id);
    setShowNew(true);
    setStatus("تحرير مباراة موجودة");
    setTimeout(() => {
      const f = formRef.current;
      if (!f) return;
      const set = (name: string, val: string) => {
        const elI = f.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (elI) elI.value = val;
        const elS = f.querySelector<HTMLSelectElement>(`select[name="${name}"]`);
        if (elS) elS.value = val;
      };
      set("homeTeam", m.homeTeam ?? "");
      set("awayTeam", m.awayTeam ?? "");
      set("homeLogo", m.homeLogo ?? "");
      set("awayLogo", m.awayLogo ?? "");
      set("league", m.league ?? "");
      set("time", m.time ?? "");
      set("channelSlug", m.channelSlug ?? "");
      set("backupIframe", m.backupIframe ?? "");
      set("playerServer", m.playerServer ?? "panda");
      setSelectedServer((m.playerServer as "panda" | "starz") ?? "panda");
      set("stream1", arr[0] ?? "");
      set("stream2", arr[1] ?? "");
      set("tvChannel", meta.tvChannel ?? "");
      set("commentator", meta.commentator ?? "");
      set("stadium", meta.stadium ?? "");
      const today = new Date();
      const ty = today.getFullYear();
      const tm = String(today.getMonth() + 1).padStart(2, "0");
      const td = String(today.getDate()).padStart(2, "0");
      const todayISO = `${ty}-${tm}-${td}`;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const oy = tomorrow.getFullYear();
      const om = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const od = String(tomorrow.getDate()).padStart(2, "0");
      const tomorrowISO = `${oy}-${om}-${od}`;
      const rToday = f.querySelector<HTMLInputElement>('input[name="dateRadio"][value="today"]');
      const rTomorrow = f.querySelector<HTMLInputElement>('input[name="dateRadio"][value="tomorrow"]');
      if (m.date === tomorrowISO) {
        if (rTomorrow) rTomorrow.checked = true;
      } else {
        if (rToday) rToday.checked = true;
      }
      f.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container flex items-center gap-4 py-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t.back}</Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Admin Login</span>
          </div>
        </header>
        <main className="container py-10">
          <div className="mx-auto max-w-sm rounded-xl border border-border bg-card/40 p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Enter Password</h2>
            <input
              type="password"
              className="mb-2 w-full rounded-md border bg-card p-2 text-sm"
              placeholder="Password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Login
            </button>
            {err && <p className="mt-2 text-center text-sm text-red-500">{err}</p>}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t.back}</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Admin Dashboard</span>
        </div>
      </header>
      <main className="container py-6">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">لوحة الإدارة</h2>
            <span className="text-xs text-muted-foreground">Feb 14, 2026</span>
          </div>
          {autoStatus && <p className="mb-3 text-xs text-muted-foreground">{autoStatus}</p>}
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              إضافة مباراة جديدة
            </button>
          </div>
          {showNew && (
            <form ref={formRef} onSubmit={(e) => { addNewMatch(e); }} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <input name="homeTeam" className="rounded-md border bg-card p-2 text-sm" placeholder="اسم الفريق (الصفحة الرئيسية)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.homeTeam ?? "") : ""} />
              <input name="homeLogo" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط شعار الفريق (الصفحة الرئيسية)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.homeLogo ?? "") : ""} />
              <input name="awayTeam" className="rounded-md border bg-card p-2 text-sm" placeholder="اسم الفريق (الضيف)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.awayTeam ?? "") : ""} />
              <input name="awayLogo" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط شعار الفريق (الضيف)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.awayLogo ?? "") : ""} />
              <input name="league" className="rounded-md border bg-card p-2 text-sm" placeholder="الدوري" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.league ?? "") : ""} />
              <div className="col-span-full flex items-center gap-3 rounded-md border bg-card p-2 text-xs">
                <span className="text-muted-foreground">التاريخ:</span>
                <label className="inline-flex items-center gap-1">
                  <input type="radio" name="dateRadio" value="today" defaultChecked />
                  اليوم
                </label>
                <label className="inline-flex items-center gap-1">
                  <input type="radio" name="dateRadio" value="tomorrow" />
                  الغد
                </label>
              </div>
              <input name="time" className="rounded-md border bg-card p-2 text-sm" placeholder="الوقت (HH:MM)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.time ?? "") : ""} />
              <input name="stream1" className="rounded-md border bg-card p-2 text-sm" placeholder="Stream Server 1" defaultValue={editingId ? ((entries[editingId] ?? ["", "", "", ""])[0] ?? "") : ""} />
              <input name="stream2" className="rounded-md border bg-card p-2 text-sm" placeholder="Stream Server 2" defaultValue={editingId ? ((entries[editingId] ?? ["", "", "", ""])[1] ?? "") : ""} />
              <select
                name="playerServer"
                className="rounded-md border bg-card p-2 text-sm"
                defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.playerServer ?? "panda") : "panda"}
                onChange={(e) => setSelectedServer((e.target.value as "panda" | "starz") ?? "panda")}
              >
                <option value="panda">Panda Server</option>
                <option value="starz">Starz/Yalla Server</option>
              </select>
              <select
                name="channelSlug"
                className="rounded-md border bg-card p-2 text-sm"
                defaultValue={
                  editingId
                    ? (matches.find((m) => m.id === editingId)?.channelSlug ?? (selectedServer === "panda" ? PANDA_SLUGS[0] : STARZ_SLUGS[0]))
                    : (selectedServer === "panda" ? PANDA_SLUGS[0] : STARZ_SLUGS[0])
                }
              >
                {(selectedServer === "panda" ? PANDA_SLUGS : STARZ_SLUGS).map((slug) => (
                  <option key={slug} value={slug}>{slug}</option>
                ))}
              </select>
            <div className="col-span-full rounded-md border bg-card p-2 text-xs">
              <div className="mb-1 font-semibold text-foreground">اختيار سريع حسب السيرفر</div>
              {selectedServer === "panda" ? (
                <>
                  <div className="mb-1 text-[11px] text-muted-foreground">beIN Sports</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {Array.from({ length: 10 }, (_, i) => `bein-${i + 1}`).map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "panda";
                          setSelectedServer("panda");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                  <div className="mb-1 text-[11px] text-muted-foreground">SSC Saudi</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {Array.from({ length: 8 }, (_, i) => `ssc-${i + 1}`).map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "panda";
                          setSelectedServer("panda");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                  <div className="mb-1 text-[11px] text-muted-foreground">Others</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {["on-time", "mbc-action"].map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "panda";
                          setSelectedServer("panda");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-1 text-[11px] text-muted-foreground">Starz/Yalla</div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {["sports-d1", "sports-d2", "sports-d3", "sports-d4"].map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        className="rounded-md bg-sky-600 px-2 py-1 text-white hover:bg-sky-700"
                        onClick={() => {
                          const f = formRef.current;
                          const el = f?.querySelector<HTMLSelectElement>('select[name="playerServer"]');
                          const elSlug = f?.querySelector<HTMLSelectElement>('select[name="channelSlug"]');
                          if (el) el.value = "starz";
                          setSelectedServer("starz");
                          if (elSlug) elSlug.value = slug;
                        }}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-1">
                <input name="otherSlug" className="w-full rounded-md border bg-card p-2 text-sm" placeholder="Other Slugs (Manual override)" />
              </div>
            </div>
              <input name="backupIframe" className="rounded-md border bg-card p-2 text-sm" placeholder="رابط iframe خارجي (اتركه فارغًا كمبدّل احتياطي)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.backupIframe ?? "") : ""} data-id={editingId ?? undefined} />
              <select name="smartSource" className="rounded-md border bg-card p-2 text-sm" defaultValue="" data-id={editingId ?? undefined}>
                <option value="">Smart Source (اختياري)</option>
                <option value="yalla">Yalla</option>
                <option value="panda">Panda</option>
              </select>
              <input name="cpaLink" className="rounded-md border bg-card p-2 text-sm" placeholder="CPA Link (Banner أعلى المشغل)" defaultValue={editingId ? (matches.find((m) => m.id === editingId)?.cpaLink ?? "") : ""} data-id={editingId ?? undefined} />
              <input name="commentator" className="rounded-md border bg-card p-2 text-sm" placeholder="المعلق" defaultValue={editingId ? ((metas[editingId]?.commentator ?? "")) : ""} />
              <input name="tvChannel" className="rounded-md border bg-card p-2 text-sm" placeholder="القناة الناقلة" defaultValue={editingId ? ((metas[editingId]?.tvChannel ?? "")) : ""} />
              <input name="stadium" className="rounded-md border bg-card p-2 text-sm" placeholder="الملعب" defaultValue={editingId ? ((metas[editingId]?.stadium ?? "")) : ""} />
              <div className="col-span-full">
                <select name="statusNew" className="w-full rounded-md border bg-card p-2 text-sm" defaultValue={editingId ? (statuses[editingId] ?? (matches.find((m) => m.id === editingId)?.status ?? "upcoming")) : "upcoming"}>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="col-span-full">
                <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  {editingId ? "تحديث" : "حفظ"}
                </button>
              </div>
            </form>
          )}
          <div className="overflow-x-auto">
            {matches.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                لا توجد مباريات حالياً. أضف مباراة جديدة
              </div>
            ) : (
              <>
                <div className="mb-3 inline-flex items-center justify-center rounded-full border border-amber-400/40 bg-black/10 p-0.5 text-xs">
                  {[
                    { id: "today", label: "مباريات اليوم" },
                    { id: "tomorrow", label: "مباريات الغد" },
                  ].map((tab) => {
                    const isActive = adminTab === (tab.id as "today" | "tomorrow");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAdminTab(tab.id as "today" | "tomorrow")}
                        className={[
                          "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all",
                          isActive
                            ? "bg-amber-500 text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                            : "text-muted-foreground hover:bg-amber-500/10",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mb-3 inline-flex items-center justify-center rounded-full border border-amber-400/40 bg-black/10 p-0.5 text-xs">
                  {[
                    { id: "all", label: "الكل" },
                    { id: "bein", label: "beIN Sports" },
                    { id: "ssc", label: "SSC" },
                    { id: "others", label: "Others" },
                  ].map((tab) => {
                    const isActive = adminChannelFilter === (tab.id as "all" | "bein" | "ssc" | "others");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setAdminChannelFilter(tab.id as "all" | "bein" | "ssc" | "others")}
                        className={[
                          "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all",
                          isActive
                            ? "bg-emerald-500 text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                            : "text-muted-foreground hover:bg-emerald-500/10",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mb-3 inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-black/10 p-0.5 text-xs">
                  {[
                    { id: "fixedToday", label: "Today (Feb 15, 2026)" },
                    { id: "fixedTomorrow", label: "Tomorrow (Feb 16, 2026)" },
                  ].map((tab) => {
                    const isActive = quickDateFilter === (tab.id as "fixedToday" | "fixedTomorrow");
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setQuickDateFilter(tab.id as "fixedToday" | "fixedTomorrow")}
                        className={[
                          "relative mx-0.5 flex items-center justify-center rounded-full px-2.5 py-1.5 font-medium transition-all",
                          isActive
                            ? "bg-emerald-500 text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                            : "text-muted-foreground hover:bg-emerald-500/10",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setQuickDateFilter("none")}
                    className="ml-2 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-emerald-500/10"
                  >
                    Reset
                  </button>
                </div>
                {(() => {
                  const targetISO =
                    quickDateFilter === "fixedToday"
                      ? "2026-02-15"
                      : quickDateFilter === "fixedTomorrow"
                      ? "2026-02-16"
                      : adminTab === "today"
                      ? todayISO
                      : tomorrowISO;
                  const dayFiltered = matches.filter((m) => (m.date ? m.date === targetISO : true));
                  const getAdjustedDate = (m: Match) => {
                    if (!m.time || m.time === "–") return null;
                    const [hh, mm] = (m.time ?? "").split(":");
                    const h = Number.parseInt(hh ?? "", 10);
                    const m2 = Number.parseInt(mm ?? "", 10);
                    if (Number.isNaN(h) || Number.isNaN(m2)) return null;
                    const d = new Date();
                    if (m.date) {
                      const [y, mo, da] = m.date.split("-").map((x) => Number.parseInt(x, 10));
                      if (!Number.isNaN(y) && !Number.isNaN(mo) && !Number.isNaN(da)) {
                        d.setFullYear(y);
                        d.setMonth(mo - 1);
                        d.setDate(da);
                      }
                    }
                    d.setSeconds(0, 0);
                    d.setHours(h - 3, m2, 0, 0);
                    return d;
                  };
                  const adjustedKey = (m: Match) => {
                    const d = getAdjustedDate(m);
                    if (!d) return Number.MAX_SAFE_INTEGER;
                    return d.getHours() * 60 + d.getMinutes();
                  };
                  const getGroup = (m: Match) => {
                    const slug = (m.channelSlug ?? "").toLowerCase();
                    const ch = (m.tvChannel ?? "").toLowerCase();
                    if (slug.includes("bein") || ch.includes("bein")) return "bein";
                    if (slug.includes("ssc") || ch.includes("ssc")) return "ssc";
                    return "others";
                  };
                  const grouped: Record<"bein" | "ssc" | "others", Match[]> = { bein: [], ssc: [], others: [] };
                  for (const m of dayFiltered) {
                    grouped[getGroup(m)].push(m);
                  }
                  const sortByTime = (arr: Match[]) => [...arr].sort((a, b) => adjustedKey(a) - adjustedKey(b));
                  const sections =
                    adminChannelFilter === "all"
                      ? [
                          { id: "bein", label: "beIN Sports", data: sortByTime(grouped.bein) },
                          { id: "ssc", label: "SSC", data: sortByTime(grouped.ssc) },
                          { id: "others", label: "Others", data: sortByTime(grouped.others) },
                        ]
                      : [
                          {
                            id: adminChannelFilter,
                            label:
                              adminChannelFilter === "bein"
                                ? "beIN Sports"
                                : adminChannelFilter === "ssc"
                                ? "SSC"
                                : "Others",
                            data: sortByTime(grouped[adminChannelFilter]),
                          },
                        ];
                  return sections.map((sec) => (
                    <div key={sec.id} className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">{sec.label}</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="p-2 text-start">المباراة</th>
                            <th className="p-2 text-start">الوقت</th>
                            <th className="p-2 text-start">الدوري</th>
                            <th className="p-2 text-start">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.data.map((m) => {
                            const hasSlug = Boolean(m.channelSlug && m.channelSlug.trim().length > 0);
                            const hasBackup = Boolean(m.backupIframe && m.backupIframe.trim().length > 0);
                            const color = hasSlug ? "bg-emerald-500" : hasBackup ? "bg-sky-500" : "bg-red-600";
                            const realT = m.time ?? "";
                            const adjD = getAdjustedDate(m);
                            const adjT = adjD
                              ? `${String(adjD.getHours()).padStart(2, "0")}:${String(adjD.getMinutes()).padStart(2, "0")}`
                              : realT || "–";
                            return (
                              <tr key={m.id} className="border-t border-border">
                                <td className="p-2">
                                  <span className={["mr-2 inline-block h-2 w-2 rounded-full", color].join(" ")} aria-hidden />
                                  {m.homeTeam} <span className="text-muted-foreground">vs</span> {m.awayTeam}
                                </td>
                                <td className="p-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{adjT}</span>
                                    <span className="text-[11px] text-muted-foreground">{realT} → {adjT}</span>
                                  </div>
                                </td>
                                <td className="p-2">{m.league}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTopMatch(m.id)}
                                      className={[
                                        "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium",
                                        m.isTopMatch ? "bg-emerald-600 text-white" : "bg-sky-600 text-white",
                                      ].join(" ")}
                                      title="تعيين كقمة اليوم"
                                    >
                                      <Star className="h-3.5 w-3.5" />
                                      {m.isTopMatch ? "القمة ✓" : "تعيين القمة"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => beginEdit(m.id)}
                                      className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                                    >
                                      تعديل
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteMatch(m.id)}
                                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                    >
                                      حذف
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ));
                })()}
              </>
            )}
          </div>
          {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
