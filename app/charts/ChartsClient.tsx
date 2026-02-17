"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  q1: number | null; q2: number | null; q3: number | null; q4: number | null; q5: number | null;
  q6: number | null; q7: number | null; q8: number | null; q9: number | null;
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

// warna per unsur (sesuai request: persyaratan merah, prosedur biru, dst)
const COLORS: Record<(typeof KEYS)[number], string> = {
  q1: "#ef4444", // merah
  q2: "#3b82f6", // biru
  q3: "#22c55e", // hijau
  q4: "#f97316", // oranye
  q5: "#a855f7", // ungu
  q6: "#06b6d4", // cyan
  q7: "#f59e0b", // amber
  q8: "#10b981", // emerald
  q9: "#8b5cf6", // violet
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function ChartsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("survey_responses")
        .select("q1,q2,q3,q4,q5,q6,q7,q8,q9")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) alert(error.message);
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const series = useMemo(() => {
    const valid = rows.filter((r) => KEYS.every((k) => typeof r[k] === "number"));
    const n = valid.length;

    const avg: Record<string, number> = {};
    for (const k of KEYS) {
      const vals = valid.map((r) => r[k] as number);
      avg[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }

    return {
      n,
      points: KEYS.map((k) => ({ key: k, label: LABELS[k], value: avg[k] || 0, color: COLORS[k] })),
    };
  }, [rows]);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 8 }}>
      <section className="card">
        <h1 style={{ margin: 0 }}>Charts</h1>
        <div style={{ opacity: 0.75, marginTop: 4 }}>
          {loading ? "Memuat..." : <>Respon lengkap: <b>{series.n}</b></>}
        </div>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Bar Chart Rata-rata per Unsur (1–4)</h3>

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {series.points.map((p) => {
            const widthPct = Math.max(0, Math.min(100, (p.value / 4) * 100));
            return (
              <div
                key={p.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 70px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 950 }}>{p.label}</div>

                <div style={{ background: "rgba(148,163,184,.20)", borderRadius: 999, overflow: "hidden", height: 12 }}>
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: "100%",
                      background: p.color,
                      boxShadow: `0 10px 18px ${p.color}33`,
                      transition: "width .45s ease",
                    }}
                  />
                </div>

                <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 900 }}>
                  {loading ? "-" : round2(p.value)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, opacity: 0.75, fontSize: 12 }}>
          Catatan: Nilai 1–4 (semakin besar semakin baik).
        </div>
      </section>
    </main>
  );
}

