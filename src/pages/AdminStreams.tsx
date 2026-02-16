import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";

const AdminStreams = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ id: string; homeTeam: string; awayTeam: string; league: string; time: string; status: "live" | "upcoming" | "finished" }[]>([]);
  const [entries, setEntries] = useState<Record<string, string[]>>({});
  const [statuses, setStatuses] = useState<Record<string, "live" | "upcoming" | "finished">>({});

  useEffect(() => {
    try {
      const rawList = window.localStorage.getItem("custom-matches");
      if (rawList) {
        const arr = JSON.parse(rawList) as typeof matches;
        setMatches(Array.isArray(arr) ? arr : []);
      } else {
        setMatches([]);
      }
    } catch {
      setMatches([]);
    }
  }, []);

  useEffect(() => {
    const initial: Record<string, string[]> = {};
    const initialStatuses: Record<string, "live" | "upcoming" | "finished"> = {};
    for (const m of matches) {
      try {
        const raw = window.localStorage.getItem(`match-streams:${m.id}`);
        initial[m.id] = raw ? (JSON.parse(raw) as string[]) : ["", "", "", ""];
      } catch {
        initial[m.id] = ["", "", "", ""];
      }
      const st = window.localStorage.getItem(`match-status:${m.id}`);
      initialStatuses[m.id] =
        st === "live" || st === "upcoming" || st === "finished" ? (st as "live" | "upcoming" | "finished") : m.status;
    }
    setEntries(initial);
    setStatuses(initialStatuses);
  }, [matches]);

  function updateEntry(id: string, idx: number, value: string) {
    setEntries((prev) => {
      const arr = prev[id] ? [...prev[id]] : ["", "", "", ""];
      arr[idx] = value;
      return { ...prev, [id]: arr };
    });
  }

  function save(id: string) {
    setStatus(null);
    const arr = (entries[id] ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
    window.localStorage.setItem(`match-streams:${id}`, JSON.stringify(arr));
    window.localStorage.setItem(`match-status:${id}`, statuses[id]);
    setStatus("Saved");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">{t.back}</Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Admin Streams</span>
        </div>
      </header>
      <main className="container py-6">
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Static Matches Admin</h2>
            <span className="text-xs text-muted-foreground">Feb 14, 2026</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="p-2 text-start">المباراة</th>
                  <th className="p-2 text-start">الدوري</th>
                  <th className="p-2 text-start">الوقت</th>
                  <th className="p-2 text-start">Stream URL</th>
                  <th className="p-2 text-start">Status</th>
                  <th className="p-2 text-start">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{m.homeTeam}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-semibold text-foreground">{m.awayTeam}</span>
                      </div>
                    </td>
                    <td className="p-2">{m.league}</td>
                    <td className="p-2">{m.time}</td>
                    <td className="p-2">
                      <input
                        className="w-full rounded-md border bg-card p-2 text-sm"
                        placeholder="https://... (.m3u8 or iframe src)"
                        value={(entries[m.id] ?? ["", "", "", ""])[0] ?? ""}
                        onChange={(e) => updateEntry(m.id, 0, e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <select
                        className="rounded-md border bg-card p-2 text-sm"
                        value={statuses[m.id] ?? m.status}
                        onChange={(e) =>
                          setStatuses((prev) => ({
                            ...prev,
                            [m.id]: e.target.value as "live" | "upcoming" | "finished",
                          }))
                        }
                      >
                        <option value="live">Live</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="finished">Finished</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => save(m.id)}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Save
                        </button>
                        <Link to={`/match/${m.id}`} className="text-xs text-primary hover:underline">
                          Watch
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {status && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
        </div>
      </main>
    </div>
  );
};

export default AdminStreams;
