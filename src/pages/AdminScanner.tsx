import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";
 
const AdminScanner = () => {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [server, setServer] = useState<"panda" | "starz">("panda");
  const [cursor, setCursor] = useState(0);
  const PANDA_LIST = [
    ...Array.from({ length: 10 }, (_, i) => `ssc-${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `bein-${i + 1}`),
    "on-time",
    "mbc-action",
  ];
  const STARZ_LIST = [...Array.from({ length: 10 }, (_, i) => `sports-d${i + 1}`)];
  const pandaBase = "https://p4.pandalive.live/albaplayer/";
  const starzBase = "https://a.yallashoot2026.com/albaplayer/";
  const all = server === "panda" ? PANDA_LIST : STARZ_LIST;
  const visible = all.slice(0, cursor);
  const TABLE_LIST = [
    ...Array.from({ length: 10 }, (_, i) => `bein-${i + 1}`),
    ...Array.from({ length: 8 }, (_, i) => `ssc-${i + 1}`),
    ...Array.from({ length: 6 }, (_, i) => `sports-d${i + 1}`),
    "on-time",
    "mbc-action",
    "alkass-1",
  ];
  const [tableCursor, setTableCursor] = useState(0);
  const [tableResults, setTableResults] = useState<Record<string, "online" | "offline" | "pending">>({});
  const [tableProbes, setTableProbes] = useState<string[]>([]);
 
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
 
  function handleLogin() {
    setStatus(null);
    if (pwd === "admin2001") {
      setAuthed(true);
      const expiresAt = Date.now() + 1000 * 60 * 60 * 6;
      window.localStorage.setItem("admin-auth", JSON.stringify({ valid: true, expiresAt }));
      return;
    }
    setStatus("Access Denied");
  }
 
  function copySlug(slug: string) {
    try {
      navigator.clipboard.writeText(slug).then(() => {
        setStatus(`Copied: ${slug}`);
        window.localStorage.setItem("scanner-last-slug", slug);
        const evt = new CustomEvent("scanner-last-slug-set", { detail: slug } as CustomEventInit<string>);
        window.dispatchEvent(evt);
      });
    } catch {
      setStatus("Copy failed");
    }
  }
  function baseForSlug(slug: string) {
    return slug.startsWith("sports-d") ? starzBase : pandaBase;
  }
  function scanNextTable(n: number) {
    const next = TABLE_LIST.slice(tableCursor, Math.min(tableCursor + n, TABLE_LIST.length));
    const updated: Record<string, "online" | "offline" | "pending"> = { ...tableResults };
    for (const s of next) updated[s] = "pending";
    setTableResults(updated);
    setTableProbes(next);
    setTableCursor((c) => Math.min(c + n, TABLE_LIST.length));
  }
 
  if (!authed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container flex items-center gap-4 py-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t.back}</Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">Admin Scanner</span>
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
            {status && <p className="mt-2 text-center text-sm text-red-500">{status}</p>}
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
          <span className="text-sm text-muted-foreground">Admin Scanner</span>
        </div>
      </header>
      <main className="container py-6">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Visual Channel Scanner</h2>
            <span className="text-xs text-muted-foreground">{server === "panda" ? "Panda" : "Starz/Yalla"}</span>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={server}
              onChange={(e) => {
                const v = (e.target.value as "panda" | "starz") ?? "panda";
                setServer(v);
                setCursor(0);
                setStatus(null);
              }}
              className="rounded-md border bg-card p-2 text-sm"
            >
              <option value="panda">Panda Server</option>
              <option value="starz">Starz/Yalla Server</option>
            </select>
            <button
              type="button"
              onClick={() => setCursor((c) => Math.min(c + 1, all.length))}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
            >
              Test Next 1
            </button>
            <button
              type="button"
              onClick={() => setCursor((c) => Math.min(c + 5, all.length))}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Test Next 5 Channels
            </button>
            <button
              type="button"
              onClick={() => setCursor(0)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Reset
            </button>
            {status && <span className="ml-auto text-xs text-muted-foreground">{status}</span>}
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {visible.map((slug) => {
              const src = `${server === "panda" ? pandaBase : starzBase}${slug}/`;
              return (
                <div key={slug} className="rounded-xl border border-border bg-card/60 p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{slug}</span>
                    <button
                      type="button"
                      onClick={() => copySlug(slug)}
                      className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Copy Slug
                    </button>
                  </div>
                  <div className="relative">
                    <iframe
                      src={src}
                      className="h-[120px] w-full rounded-md"
                      width="100%"
                      height="100%"
                      allow="autoplay; fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-forms allow-same-origin allow-scripts"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-card/60 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Table Scanner</span>
              <button
                type="button"
                onClick={() => scanNextTable(5)}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Test Next 5 Channels
              </button>
              <button
                type="button"
                onClick={() => scanNextTable(1)}
                className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
              >
                Test Next 1
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableCursor(0);
                  setTableResults({});
                  setTableProbes([]);
                }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Reset
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2 text-start">Name</th>
                  <th className="p-2 text-start">Status</th>
                  <th className="p-2 text-start">Action</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_LIST.map((slug) => {
                  const st = tableResults[slug];
                  const color =
                    st === "online" ? "text-emerald-600" : st === "offline" ? "text-red-600" : "text-muted-foreground";
                  return (
                    <tr key={slug} className="border-t border-border">
                      <td className="p-2">{slug}</td>
                      <td className={["p-2 font-medium", color].join(" ")}>{st ?? "—"}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => copySlug(slug)}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Copy Slug
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
              {tableProbes.map((slug) => (
                <iframe
                  key={slug}
                  src={`${baseForSlug(slug)}${slug}/`}
                  width="1"
                  height="1"
                  onLoad={() => {
                    setTableResults((prev) => ({ ...prev, [slug]: "online" }));
                    setTableProbes((prev) => prev.filter((s) => s !== slug));
                    try {
                      window.localStorage.setItem(`scanner-status:${slug}`, "online");
                    } catch {
                      void 0;
                    }
                  }}
                  sandbox="allow-forms allow-same-origin allow-scripts"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
 
export default AdminScanner;
