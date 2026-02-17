import dynamic from "next/dynamic";

const ChartsClient = dynamic(() => import("./ChartsClient"), {
  ssr: false,
});

export default function ChartsPage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 8 }}>
      <ChartsClient />
    </main>
  );
}

