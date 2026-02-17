"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// contoh tipe data (sesuaikan dengan tabelmu)
type SurveyRow = {
  id: string;
  created_at: string;
  q1: number; q2: number; q3: number; q4: number; q5: number; q6: number; q7: number; q8: number; q9: number;
};

const QUESTIONS = [
  { key: "q1", label: "Persyaratan" },
  { key: "q2", label: "Prosedur" },
  { key: "q3", label: "Kecepatan" },
  { key: "q4", label: "Kewajaran biaya" },
  { key: "q5", label: "Kesesuaian produk" },
  { key: "q6", label: "Kompetensi petugas" },
  { key: "q7", label: "Sikap/keramahan" },
  { key: "q8", label: "Sarana prasarana" },
  { key: "q9", label: "Pengaduan" },
] as const;

export default function ChartsClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<SurveyRow[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("survey_responses")
        .select("id, created_at, q1,q2,q3,q4,q5,q6,q7,q8,q9")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (!alive) return;

      if (error) {
        setErr(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data || []) as SurveyRow[]);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length || 0;

    const avg: Record<string, number> = {};
    for (const q of QUESTIONS) avg[q.key] = 0;

    if (total === 0) return { total: 0, avg };

    for (const r of rows) {
      for (const q of QUESTIONS) {
        avg[q.key] += (r as any)[q.key] || 0;
      }
    }
    for (const q of QUESTIONS) avg[q.key] = avg[q.key] / total;

    return { total, avg };
  }, [rows]);

  return (
    <div className="container">
      <h1 className="pageTitle">Charts</h1>
      <p className="pageSubtitle">Ringkasan rata-rata per pertanyaan (Q1–Q9).</p>

      {loading ? (
        <div className="card">Memuat data chart…</div>
      ) : err ? (
        <div className="card errorBox">Error: {err}</div>
      ) : stats.total === 0 ? (
        <div className="card">Belum ada data.</div>
      ) : (
        <div className="card">
          <div className="muted">Total respon: <b>{stats.total}</b></div>

          <div className="barList">
            {QUESTIONS.map((q, idx) => {
              const value = stats.avg[q.key]; // skala 1–4
              const pct = Math.max(0, Math.min(100, (value / 4) * 100));

              return (
                <div className="barRow" key={q.key}>
                  <div className="barLeft">
                    <div className="barLabel">
                      {idx + 1}. {q.label}
                    </div>
                    <div className="barValue">Rata-rata: {value.toFixed(2)}</div>
                  </div>

                  <div className={`barTrack c${idx + 1}`}>
                    <div className="barFill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
