import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Survey Kepuasan",
  description: "Survey modern dengan emoticon + saran",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        {/* Background kesehatan + animasi (CSS-only, ringan, no JS) */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-sky-50 to-cyan-50" />

          {/* Subtle grid texture (opsional, bikin modern & clean) */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.12) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Animated blobs */}
          <div className="blob blob-a absolute -top-28 -left-28 h-[420px] w-[420px] rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="blob blob-b absolute -bottom-32 -right-32 h-[460px] w-[460px] rounded-full bg-sky-200/40 blur-3xl" />
          <div className="blob blob-c absolute left-1/2 top-1/3 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-10">
          <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Survey Kepuasan Pelayanan</h1>
              <p className="text-sm text-slate-600">Isi cepat, hasil real-time.</p>
            </div>

            <nav className="flex gap-2 text-sm">
              <Link
                className="rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur hover:bg-white"
                href="/"
              >
                Survey
              </Link>
              <Link
                className="rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur hover:bg-white"
                href="/results"
              >
                Results
              </Link>
              <Link
                className="rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur hover:bg-white"
                href="/charts"
              >
                Charts
              </Link>
            </nav>
          </header>

          {children}

          <footer className="mt-10 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Survey App
          </footer>
        </div>

        {/* CSS animasi global (taruh di layout biar gak perlu edit globals.css) */}
        <style>{`
          @keyframes blobFloatA {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(18px, 12px) scale(1.06); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes blobFloatB {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-16px, -10px) scale(1.05); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes blobPulseC {
            0% { transform: translateX(-50%) scale(1); opacity: .55; }
            50% { transform: translateX(-50%) scale(1.10); opacity: .85; }
            100% { transform: translateX(-50%) scale(1); opacity: .55; }
          }

          .blob-a { animation: blobFloatA 9s ease-in-out infinite; }
          .blob-b { animation: blobFloatB 10s ease-in-out infinite; }
          .blob-c { animation: blobPulseC 8s ease-in-out infinite; }

          /* Respect user preference: reduce motion */
          @media (prefers-reduced-motion: reduce) {
            .blob-a, .blob-b, .blob-c { animation: none !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
