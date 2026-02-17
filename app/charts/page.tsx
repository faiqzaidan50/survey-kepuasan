import { Suspense } from "react";
import ChartsClient from "./ChartsClient";

export const dynamic = "force-dynamic";

export default function ChartsPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 980, margin: "0 auto", padding: 8 }}><section className="card">Memuat charts…</section></main>}>
      <ChartsClient />
    </Suspense>
  );
}
