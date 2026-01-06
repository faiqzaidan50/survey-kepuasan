"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

const OPTIONS = [
  { rating: 1, label: "Buruk", emoji: "😡" },
  { rating: 2, label: "Kurang", emoji: "😕" },
  { rating: 3, label: "Cukup", emoji: "🙂" },
  { rating: 4, label: "Baik", emoji: "😊" },
  { rating: 5, label: "Sangat Baik", emoji: "😍" },
] as const;

export default function Page() {
  const [rating, setRating] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => OPTIONS.find((o) => o.rating === rating), [rating]);

  async function submit() {
    setError(null);
    if (!rating) {
      setError("Pilih emoticon dulu ya 🙂");
      return;
    }
    setLoading(true);

    const { error: err } = await supabase.from("survey_responses").insert({
      rating,
      suggestion: suggestion.trim() || null,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setDone(true);
    setSuggestion("");
    setRating(null);

    setTimeout(() => setDone(false), 2200);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/5">
      {/* Background kesehatan (mint/teal) */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-sky-50 to-cyan-50" />

      {/* Animated blobs (halus & modern) */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
        animate={{ x: [0, -18, 0], y: [0, -12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Card utama */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative rounded-3xl bg-white/70 p-6 shadow-sm backdrop-blur"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Bagaimana pengalaman Anda hari ini?</h2>
          <p className="text-sm text-slate-600">Pilih satu emoticon, lalu tulis saran (opsional).</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {OPTIONS.map((o) => {
            const active = o.rating === rating;
            return (
              <motion.button
                key={o.rating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRating(o.rating)}
                className={[
                  "rounded-2xl p-3 text-center shadow-sm ring-1 transition",
                  active
                    ? "bg-emerald-600 text-white ring-emerald-600/30"
                    : "bg-white ring-black/5 hover:bg-slate-50",
                ].join(" ")}
                aria-label={o.label}
                type="button"
              >
                <div className="text-3xl">{o.emoji}</div>
                <div className={"mt-2 text-xs " + (active ? "text-emerald-50" : "text-slate-600")}>
                  {o.label}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium">
            Saran / komentar <span className="text-slate-500">(opsional)</span>
          </label>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            maxLength={300}
            placeholder="Contoh: antrean lebih dipercepat, petugas sangat ramah, dsb."
            className="min-h-[110px] w-full rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="mt-2 text-xs text-slate-500">{suggestion.length}/300</div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {selected ? (
              <span>
                Dipilih: <span className="font-semibold">{selected.emoji} {selected.label}</span>
              </span>
            ) : (
              <span>Belum memilih emoticon.</span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={submit}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Survey"}
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200"
          >
            {error}
          </motion.div>
        )}

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200"
          >
            Terima kasih! Survey berhasil terkirim ✅
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
