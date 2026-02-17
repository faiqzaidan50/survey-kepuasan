"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  created_at: string;
  rating: number | null;
  q1: number | null; q2: number | null; q3: number | null; q4: number | null; q5: number | null;
  q6: number | null; q7: number | null; q8: number | null; q9: number | null;
  suggestion: string | null;
  service_type: string | null;
};

const KEYS = ["q1","q2","q3","q4","q5","q6","q7","q8","q9"] as const;

const LABELS: Record<(typeof KEYS)[number], string> = {
  q1: "Persyaratan",
  q2: "Prosedur",
  q3: "Waktu",
  q4: "Biaya/Tarif",
  q5: "Produk",
  q6: "Kompetensi",
  q7: "Perilaku",
  q8: "Sarpras",
  q9: "Pengaduan",
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function overallText(v: number) {
  if (v >= 3.5) return "😍 Sangat puas";
  if (v >= 2.5) return "🙂 Puas";
  if (v >= 1.5) return "🙁 Kurang puas";
  return "😡 Tidak puas";
}

export default function ResultsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("survey_responses")
        .select("created_at,rating,q1,q2,q3,q4,q5,q6,q7,q8,q9,suggestion,service_type")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) alert(error.message);
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const valid = rows.filter((r) => KEYS.every((k) => typeof r[k] === "number") && typeof r.rating === "number");
    const n = valid.length;

    const avgQ: Record<string, number> = {};
    for (const k of KEYS) {
      const vals = valid.map((r) => r[k] as number);
      avgQ[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }

    const avgRating = n ? valid.reduce((s, r) => s + (r.rating as number), 0) / n : 0;

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<1|2|3|4, number>;
    for (const r of valid) {
      const v = r.rating as 1|2|3|4;
      if (v >= 1 && v <= 4) dist[v] += 1;
    }

    const latestSuggestions = rows.filter((r) => (r.suggestion ?? "").trim().length > 0).slice(0, 6);

    return { n, avgQ, avgRating, dist, latestSuggestions };
  }, [rows]);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 8 }}>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0 }}>Results</h1>
            <div style={{ opacity: 0.75, marginTop: 4 }}>
              Respon lengkap: <b>{loading ? "…" : stats.n}</b>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/identitas" className="btn btnPrimary">Isi Survei</Link>
            <Link href="/charts" className="btn">Charts</Link>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Rating Keseluruhan</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <div className="card" style={{ background: "white" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Rata-rata (1–4)</div>
            <div style={{ fontSize: 34, fontWeight: 950, marginTop: 6 }}>{loading ? "…" : round2(stats.avgRating)}</div>
            <div style={{ marginTop: 6, fontWeight: 900 }}>{loading ? "" : overallText(stats.avgRating)}</div>
          </div>

          <div className="card" style={{ background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Distribusi rating overall</div>
                <div style={{ fontWeight: 950 }}>Diagram Lingkaran</div>
              </div>
              <Legend dist={stats.dist} />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
              <Pie dist={stats.dist} />
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Rata-rata per Pertanyaan (1–4)</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Unsur</th>
                <th style={th}>Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {KEYS.map((k) => (
                <tr key={k}>
                  <td style={td}>{LABELS[k]}</td>
                  <td style={td}>{loading ? "-" : round2(stats.avgQ[k] || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Saran terbaru</h3>
        {stats.latestSuggestions.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Belum ada saran.</div>
        ) : (
          <ul style={{ marginTop: 8, paddingLeft: 18 }}>
            {stats.latestSuggestions.map((r, idx) => (
              <li key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {new Date(r.created_at).toLocaleString()} • {r.service_type ?? "-"}
                </div>
                <div style={{ marginTop: 4 }}>{r.suggestion}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Legend({ dist }: { dist: Record<1|2|3|4, number> }) {
  const items = [
    { v: 4, label: "😍 Sangat puas", dot: "#3b82f6" },
    { v: 3, label: "🙂 Puas", dot: "#22c55e" },
    { v: 2, label: "🙁 Kurang puas", dot: "#f97316" },
    { v: 1, label: "😡 Tidak puas", dot: "#ef4444" },
  ] as const;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {items.map((it) => (
        <div key={it.v} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: it.dot, display: "inline-block" }} />
          <span>{it.label}</span>
          <b style={{ fontVariantNumeric: "tabular-nums" }}>{dist[it.v as 1|2|3|4] ?? 0}</b>
        </div>
      ))}
    </div>
  );
}

function Pie({ dist }: { dist: Record<1|2|3|4, number> }) {
  const total = (dist[1] || 0) + (dist[2] || 0) + (dist[3] || 0) + (dist[4] || 0);
  const parts = [
    { v: 4, color: "#3b82f6" },
    { v: 3, color: "#22c55e" },
    { v: 2, color: "#f97316" },
    { v: 1, color: "#ef4444" },
  ] as const;

  const r = 46;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const slices = parts.map((p) => {
    const value = dist[p.v as 1|2|3|4] ?? 0;
    const frac = total ? value / total : 0;
    const dash = frac * c;
    const slice = (
      <circle
        key={p.v}
        r={r}
        cx="60"
        cy="60"
        fill="transparent"
        stroke={p.color}
        strokeWidth="22"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={-offset}
      />
    );
    offset += dash;
    return slice;
  });

  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle r={r} cx="60" cy="60" fill="transparent" stroke="rgba(148,163,184,.25)" strokeWidth="22" />
        <g transform="rotate(-90 60 60)">{slices}</g>
      </svg>
      <div style={{ marginTop: -6, fontSize: 12, opacity: 0.75 }}>
        Total: <b>{total}</b>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb", fontSize: 13 };
const td: React.CSSProperties = { padding: 10, borderBottom: "1px solid #f1f5f9", fontSize: 14 };
