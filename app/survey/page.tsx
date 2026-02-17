"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EmojiRating, { ScaleOption } from "./_components/EmojiRating";
import { supabase } from "@/lib/supabaseClient";

type Scale = ScaleOption[];

const SCALE_SESUAI: Scale = [
  { v: 1, emoji: "😡", label: "Tidak sesuai" },
  { v: 2, emoji: "🙁", label: "Kurang sesuai" },
  { v: 3, emoji: "🙂", label: "Sesuai" },
  { v: 4, emoji: "😍", label: "Sangat sesuai" },
];

const SCALE_MUDAH: Scale = [
  { v: 1, emoji: "😡", label: "Tidak mudah" },
  { v: 2, emoji: "🙁", label: "Kurang mudah" },
  { v: 3, emoji: "🙂", label: "Mudah" },
  { v: 4, emoji: "😍", label: "Sangat mudah" },
];

const SCALE_CEPAT: Scale = [
  { v: 1, emoji: "😡", label: "Tidak cepat" },
  { v: 2, emoji: "🙁", label: "Kurang cepat" },
  { v: 3, emoji: "🙂", label: "Cepat" },
  { v: 4, emoji: "😍", label: "Sangat cepat" },
];

const SCALE_WAJAR: Scale = [
  { v: 1, emoji: "😡", label: "Tidak wajar" },
  { v: 2, emoji: "🙁", label: "Kurang wajar" },
  { v: 3, emoji: "🙂", label: "Wajar" },
  { v: 4, emoji: "😍", label: "Sangat wajar" },
];

const SCALE_KOMPETEN: Scale = [
  { v: 1, emoji: "😡", label: "Tidak kompeten" },
  { v: 2, emoji: "🙁", label: "Kurang kompeten" },
  { v: 3, emoji: "🙂", label: "Kompeten" },
  { v: 4, emoji: "😍", label: "Sangat kompeten" },
];

const SCALE_RAMAH: Scale = [
  { v: 1, emoji: "😡", label: "Tidak sopan & ramah" },
  { v: 2, emoji: "🙁", label: "Kurang sopan & ramah" },
  { v: 3, emoji: "🙂", label: "Sopan & ramah" },
  { v: 4, emoji: "😍", label: "Sangat sopan & ramah" },
];

const SCALE_SARPRAS: Scale = [
  { v: 1, emoji: "😡", label: "Buruk" },
  { v: 2, emoji: "🙁", label: "Cukup" },
  { v: 3, emoji: "🙂", label: "Baik" },
  { v: 4, emoji: "😍", label: "Sangat baik" },
];

const SCALE_PENGADUAN: Scale = [
  { v: 1, emoji: "😡", label: "Tidak ada" },
  { v: 2, emoji: "🙁", label: "Ada tapi tidak berfungsi" },
  { v: 3, emoji: "🙂", label: "Berfungsi kurang maksimal" },
  { v: 4, emoji: "😍", label: "Dikelola dengan baik" },
];

const SCALE_OVERALL: Scale = [
  { v: 1, emoji: "😡", label: "Tidak puas" },
  { v: 2, emoji: "🙁", label: "Kurang puas" },
  { v: 3, emoji: "🙂", label: "Puas" },
  { v: 4, emoji: "😍", label: "Sangat puas" },
];

const QUESTION_MAP = [
  { key: "q1", text: "Kesesuaian persyaratan pelayanan dengan jenis pelayanannya", scale: SCALE_SESUAI },
  { key: "q2", text: "Kemudahan prosedur pelayanan di unit ini", scale: SCALE_MUDAH },
  { key: "q3", text: "Kecepatan waktu dalam memberi pelayanan", scale: SCALE_CEPAT },
  { key: "q4", text: "Kewajaran biaya/tarif dalam pelayanan", scale: SCALE_WAJAR },
  { key: "q5", text: "Kesesuaian produk pelayanan (standar vs hasil yang diberikan)", scale: SCALE_SESUAI },
  { key: "q6", text: "Kompetensi/kemampuan petugas dalam pelayanan", scale: SCALE_KOMPETEN },
  { key: "q7", text: "Perilaku petugas (kesopanan dan keramahan)", scale: SCALE_RAMAH },
  { key: "q8", text: "Kualitas sarana dan prasarana", scale: SCALE_SARPRAS },
  { key: "q9", text: "Penanganan pengaduan pengguna layanan", scale: SCALE_PENGADUAN },
] as const;

type QKey = (typeof QUESTION_MAP)[number]["key"];
type Answers = Partial<Record<QKey, 1 | 2 | 3 | 4>>;

export default function SurveyPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<any>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [overall, setOverall] = useState<1 | 2 | 3 | 4 | undefined>(undefined);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("survey_identity");
    if (!raw) router.push("/identitas");
    else setIdentity(JSON.parse(raw));
  }, [router]);

  const allAnswered = useMemo(() => QUESTION_MAP.every((q) => answers[q.key]), [answers]);

  function setQ(key: QKey, v: 1 | 2 | 3 | 4) {
    setAnswers((p) => ({ ...p, [key]: v }));
  }

  async function submit() {
    if (!identity) return;
    if (!allAnswered) return alert("Masih ada pertanyaan yang belum dijawab.");
    if (!overall) return alert("Rating keseluruhan wajib diisi.");

    setLoading(true);
    try {
      const payload = {
        ...identity,
        age: identity.age ? Number(identity.age) : null,
        suggestion,
        ...answers,
        rating: overall,
      };

      const { error } = await supabase.from("survey_responses").insert(payload);
      if (error) throw error;

      localStorage.removeItem("survey_identity");
      router.push("/results");
    } catch (e: any) {
      alert(e.message ?? "Gagal submit");
    } finally {
      setLoading(false);
    }
  }

  if (!identity) return null;

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 8 }}>
      <section className="card">
        <h1 style={{ marginTop: 0, marginBottom: 6 }}>Isi Survei</h1>
        <p style={{ marginTop: 0, opacity: 0.75 }}>Pilih emoticon untuk tiap pertanyaan.</p>
      </section>

      {QUESTION_MAP.map((q, i) => (
        <section key={q.key} className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>
            {i + 1}. {q.text}
          </div>
          <EmojiRating value={answers[q.key]} onChange={(v) => setQ(q.key, v)} scale={q.scale} />
        </section>
      ))}

      <section className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 950, marginBottom: 10 }}>Secara keseluruhan, Anda puas dengan pelayanan?</div>
        <EmojiRating value={overall} onChange={(v) => setOverall(v)} scale={SCALE_OVERALL} />
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Saran dan masukan (opsional)</div>
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          rows={4}
          placeholder="Tulis saran singkat..."
        />
      </section>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <button onClick={submit} disabled={loading} className="btn btnPrimary" type="button">
          {loading ? "Mengirim..." : "Kirim Survei"}
        </button>
        <button onClick={() => router.push("/identitas")} className="btn" type="button">
          ← Kembali ke Identitas
        </button>
      </div>
    </main>
  );
}
