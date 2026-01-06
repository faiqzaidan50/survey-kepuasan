"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Legend,
  Cell,
} from "recharts";

type Row = { id: string; created_at: string; rating: number; suggestion: string | null };

const EMOJI: Record<number, string> = { 1: "😡", 2: "😕", 3: "🙂", 4: "😊", 5: "😍" };

const LABELS: Record<number, string> = {
  1: "Buruk",
  2: "Kurang",
  3: "Cukup",
  4: "Baik",
  5: "Sangat Baik",
};

// Warna mengikuti “rasa” emoticon (dan cocok untuk instansi kesehatan)
const RATING_COLORS: Record<number, string> = {
  1: "#ef4444", // merah
  2: "#f97316", // oranye
  3: "#eab308", // kuning
  4: "#22c55e", // hijau
  5: "#3b82f6", // biru (sangat puas)
};

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "7d", label: "7 hari" },
  { key: "30d", label: "30 hari" },
  { key: "custom", label: "Custom" },
] as const;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(d: Date) {
  return d.toISOString();
}

function formatDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// Keyword mapping ringan buat "Top Issues"
const ISSUE_KEYWORDS: Record<string, string[]> = {
  Antrian: ["antri", "antrian", "lama", "nunggu", "menunggu", "queue", "mengantri"],
  Keramahan: ["ramah", "senyum", "sopan", "jutek", "galak"],
  Kebersihan: ["bersih", "kotor", "bau", "toilet", "wc", "sampah"],
  Fasilitas: ["kursi", "ac", "ruang", "parkir", "fasilitas", "kipas", "tv"],
  Kecepatan: ["cepat", "lama", "lambat", "respons", "respon"],
  Administrasi: ["bpjs", "berkas", "admin", "pendaftaran", "nomor", "loket"],
};

function detectIssues(text: string) {
  const t = text.toLowerCase();
  const hits: string[] = [];
  for (const [issue, words] of Object.entries(ISSUE_KEYWORDS)) {
    if (words.some((w) => t.includes(w))) hits.push(issue);
  }
  return hits.length ? hits : ["Lainnya"];
}

function scoreLabel(r: number) {
  return `${r} ${EMOJI[r] ?? ""}`;
}

// Legend custom untuk rating
function RatingLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((r) => (
        <div
          key={r}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold ring-1 ring-black/5"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: RATING_COLORS[r] }}
          />
          <span>
            {EMOJI[r]} {LABELS[r]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ChartsPage() {
  // Filters
  const [preset, setPreset] = useState<(typeof PRESETS)[number]["key"]>("7d");
  const [fromDate, setFromDate] = useState<string>(() => formatDateInput(new Date(Date.now() - 6 * 86400000)));
  const [toDate, setToDate] = useState<string>(() => formatDateInput(new Date()));
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [q, setQ] = useState("");

  // Data
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Apply preset -> update date inputs
  useEffect(() => {
    const now = new Date();
    const today = startOfToday();

    if (preset === "today") {
      setFromDate(formatDateInput(today));
      setToDate(formatDateInput(now));
    } else if (preset === "7d") {
      const d = new Date(today.getTime() - 6 * 86400000);
      setFromDate(formatDateInput(d));
      setToDate(formatDateInput(now));
    } else if (preset === "30d") {
      const d = new Date(today.getTime() - 29 * 86400000);
      setFromDate(formatDateInput(d));
      setToDate(formatDateInput(now));
    }
  }, [preset]);

  async function load() {
    setLoading(true);
    setErr(null);

    const from = parseDateInput(fromDate);
    const to = parseDateInput(toDate);
    const toExclusive = new Date(to.getTime() + 86400000);

    let query = supabase
      .from("survey_responses")
      .select("id, created_at, rating, suggestion")
      .gte("created_at", toISO(from))
      .lt("created_at", toISO(toExclusive))
      .order("created_at", { ascending: false })
      .limit(2000);

    if (ratingFilter !== "all") query = query.eq("rating", ratingFilter);

    const { data, error } = await query;

    setLoading(false);
    if (error) setErr(error.message);
    else setRows((data || []) as Row[]);
  }

  // load when filters change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, ratingFilter]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("survey-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "survey_responses" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, ratingFilter]);

  const filteredBySearch = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((r) => (r.suggestion || "").toLowerCase().includes(keyword));
  }, [rows, q]);

  const stats = useMemo(() => {
    const data = filteredBySearch;
    const total = data.length;

    const counts = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      name: scoreLabel(r),
      count: data.filter((x) => x.rating === r).length,
      color: RATING_COLORS[r],
      label: `${EMOJI[r]} ${LABELS[r]}`,
    }));

    const avg = total ? data.reduce((a, b) => a + b.rating, 0) / total : 0;

    const satisfied = total ? data.filter((x) => x.rating >= 4).length : 0;
    const satisfiedPct = total ? (satisfied / total) * 100 : 0;

    const mode = counts.reduce(
      (best, cur) => (cur.count > best.count ? cur : best),
      counts[0] ?? { rating: 0, count: 0, name: "" }
    );

    // Issues count from suggestions
    const issueCounts: Record<string, number> = {};
    for (const r of data) {
      const s = (r.suggestion || "").trim();
      if (!s) continue;
      for (const issue of detectIssues(s)) {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      }
    }

    const issuesChart = Object.entries(issueCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Insight text ringan
    const topRating = mode?.rating ?? null;
    const topIssue = issuesChart[0]?.name ?? null;

    const insights: string[] = [];
    if (total) {
      insights.push(`Mayoritas rating: ${topRating ? `${topRating} ${EMOJI[topRating]}` : "-"} (paling banyak).`);
      insights.push(`Kepuasan (rating 4–5): ${satisfiedPct.toFixed(0)}%.`);
      if (topIssue) insights.push(`Isu yang paling sering muncul: ${topIssue}.`);
    } else {
      insights.push("Belum ada data untuk filter ini.");
    }

    const pie = counts.map((c) => ({ name: c.name, value: c.count, rating: c.rating }));

    return { total, avg, satisfiedPct, mode, counts, issuesChart, insights, pie };
  }, [filteredBySearch]);

  return (
    <main className="space-y-4">
      {/* Filters */}
      <section className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Charts</h2>
              <p className="text-sm text-slate-600">Filter data + KPI + insight otomatis + top issues.</p>
            </div>
            <button
              onClick={load}
              className="w-fit rounded-2xl bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-xs font-semibold text-slate-600">Periode</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPreset(p.key)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-black/5",
                      preset === p.key ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-xs font-semibold text-slate-600">Tanggal</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setPreset("custom");
                    setFromDate(e.target.value);
                  }}
                  className="rounded-xl bg-slate-50 p-2 text-xs ring-1 ring-black/5"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setPreset("custom");
                    setToDate(e.target.value);
                  }}
                  className="rounded-xl bg-slate-50 p-2 text-xs ring-1 ring-black/5"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-xs font-semibold text-slate-600">Filter Rating</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setRatingFilter("all")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-black/5",
                    ratingFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100",
                  ].join(" ")}
                >
                  Semua
                </button>
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingFilter(r)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-black/5",
                      ratingFilter === r ? "bg-indigo-600 text-white" : "bg-slate-50 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {EMOJI[r]} {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="text-xs font-semibold text-slate-600">Search Saran</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='contoh: "antri", "ramah"'
                className="mt-2 w-full rounded-xl bg-slate-50 p-2 text-xs ring-1 ring-black/5"
              />
              <div className="mt-2 text-[11px] text-slate-500">Search memfilter tampilan + KPI + chart.</div>
            </div>
          </div>

          {loading && <p className="text-sm text-slate-600">Loading...</p>}
          {err && <p className="text-sm text-rose-700">{err}</p>}
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Respon" value={String(stats.total)} sub="sesuai filter aktif" />
        <KpiCard title="Rata-rata Rating" value={stats.avg.toFixed(2)} sub="skala 1–5" />
        <KpiCard title="Persentase Puas" value={`${stats.satisfiedPct.toFixed(0)}%`} sub="rating 4–5" />
        <KpiCard title="Rating Terbanyak" value={stats.mode?.name ?? "-"} sub="mode" />
      </section>

      {/* Legend custom */}
      <section className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <div className="text-xs font-semibold text-slate-600 mb-2">Legenda Warna Rating</div>
        <RatingLegend />
      </section>

      {/* Insights */}
      <section className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <h3 className="text-sm font-semibold text-slate-700">Insight Otomatis</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {stats.insights.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Distribusi Rating</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.counts}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {stats.counts.map((entry) => (
                    <Cell key={`bar-${entry.rating}`} fill={RATING_COLORS[entry.rating]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Proporsi Rating</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pie} dataKey="value" nameKey="name" outerRadius={95} label>
                  {stats.pie.map((entry) => (
                    <Cell key={`pie-${entry.rating}`} fill={RATING_COLORS[entry.rating]} />
                  ))}
                </Pie>
                {/* Legend bawaan dimatikan biar gak dobel (kita punya legend custom) */}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Top Issues (berdasarkan keyword saran)</h3>
          <p className="mb-2 text-xs text-slate-500">
            Deteksi ringan (tanpa AI) dari kata-kata seperti “antri”, “ramah”, “bersih”, dll.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.issuesChart}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!stats.issuesChart.length && (
            <p className="mt-2 text-sm text-slate-500">Belum ada saran yang bisa dianalisis untuk periode ini.</p>
          )}
        </div>
      </section>

      {/* Recent suggestions */}
      <section className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Saran Terbaru (hasil filter + search)</h3>
          <span className="text-xs text-slate-500">maks 30</span>
        </div>
        <div className="mt-3 divide-y divide-slate-200/70">
          {filteredBySearch
            .filter((r) => (r.suggestion || "").trim())
            .slice(0, 30)
            .map((r) => (
              <div key={r.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {EMOJI[r.rating]} Rating {r.rating}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-slate-700">{r.suggestion}</p>
              </div>
            ))}
          {!filteredBySearch.filter((r) => (r.suggestion || "").trim()).length && (
            <p className="py-3 text-sm text-slate-500">Belum ada saran untuk filter ini.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
      <div className="text-xs font-semibold text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}
