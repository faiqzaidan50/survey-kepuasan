"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Identity = {
  visit_date: string;
  time_slot: "08-12" | "13-17";
  service_type: string;
  gender: "" | "L" | "P";
  age: string;
  education: "" | "SD" | "SMP" | "SMA" | "S1" | "S2" | "S3";
  job: "" | "PNS" | "TNI" | "Polri" | "Swasta" | "Wirausaha" | "Lainnya";
};

export default function IdentitasPage() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState<Identity>({
    visit_date: today,
    time_slot: "08-12",
    service_type: "",
    gender: "",
    age: "",
    education: "",
    job: "",
  });

  function saveAndNext() {
    if (!form.service_type.trim()) return alert("Jenis layanan wajib diisi.");
    if (!form.gender) return alert("Jenis kelamin wajib dipilih.");
    if (!form.age) return alert("Usia wajib diisi.");
    localStorage.setItem("survey_identity", JSON.stringify(form));
    router.push("/survey");
  }

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 8 }}>
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Identitas Responden</h1>
        <p style={{ marginTop: -6, opacity: 0.75 }}>Tanpa nama. Dipakai untuk rekap.</p>

        <div style={grid2}>
          <Field label="Tanggal">
            <input type="date" value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
          </Field>

          <Field label="Waktu">
            <select value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value as Identity["time_slot"] })}>
              <option value="08-12">08.00 – 12.00</option>
              <option value="13-17">13.00 – 17.00</option>
            </select>
          </Field>
        </div>

        <Field label="Jenis layanan yang diterima">
          <input
            value={form.service_type}
            onChange={(e) => setForm({ ...form, service_type: e.target.value })}
            placeholder="Contoh: Pendaftaran / Poli / Lab / Apotek"
          />
        </Field>

        <div style={grid2}>
          <Field label="Jenis kelamin">
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Identity["gender"] })}>
              <option value="">Pilih</option>
              <option value="L">L</option>
              <option value="P">P</option>
            </select>
          </Field>

          <Field label="Usia (tahun)">
            <input type="number" min={0} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </Field>
        </div>

        <div style={grid2}>
          <Field label="Pendidikan">
            <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value as Identity["education"] })}>
              <option value="">Pilih</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>
          </Field>

          <Field label="Pekerjaan">
            <select value={form.job} onChange={(e) => setForm({ ...form, job: e.target.value as Identity["job"] })}>
              <option value="">Pilih</option>
              <option value="PNS">PNS</option>
              <option value="TNI">TNI</option>
              <option value="Polri">Polri</option>
              <option value="Swasta">Swasta</option>
              <option value="Wirausaha">Wirausaha</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <button onClick={saveAndNext} className="btn btnPrimary" type="button">
            Lanjut Isi Survei →
          </button>
          <button onClick={() => router.push("/")} className="btn" type="button">
            ← Home
          </button>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};
