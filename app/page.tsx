"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={shell}>
      <section className="card" style={box}>
        <h1 style={{ margin: 0, textAlign: "center" }}>UPTD Puskesmas Ciwaru</h1>
        <p style={{ marginTop: 8, opacity: 0.8, textAlign: "center" }}>
          Survey Kepuasan 
        </p>

        <div style={btnRow}>
          <Link href="/identitas" className="btn btnPrimary">
            Mulai Survei →
          </Link>
          <Link href="/results" className="btn">
            Lihat Results
          </Link>
          <Link href="/charts" className="btn">
            Charts
          </Link>
        </div>

        <p style={{ marginTop: 14, opacity: 0.75, textAlign: "center" }}>
          Terima Kasih Telah Meluangkan Waktu Anda...
        </p>
      </section>
    </main>
  );
}

const shell: React.CSSProperties = {
  minHeight: "calc(100vh - 170px)",
  display: "grid",
  placeItems: "center",
  padding: 10,
};

const box: React.CSSProperties = {
  width: "min(920px, 100%)",
  padding: 22,
  borderRadius: 22,
};

const btnRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 14,
};
