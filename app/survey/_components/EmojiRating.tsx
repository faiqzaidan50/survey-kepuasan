"use client";

export type ScaleOption = {
  v: 1 | 2 | 3 | 4;
  emoji: string;
  label: string;
};

function activeBg(v: number) {
  switch (v) {
    case 1: return "linear-gradient(135deg, #fee2e2, #fecaca)";
    case 2: return "linear-gradient(135deg, #ffedd5, #fed7aa)";
    case 3: return "linear-gradient(135deg, #dcfce7, #bbf7d0)";
    case 4: return "linear-gradient(135deg, #dbeafe, #bfdbfe)";
    default: return "white";
  }
}

function activeShadow(v: number) {
  switch (v) {
    case 1: return "0 10px 22px rgba(239,68,68,.18)";
    case 2: return "0 10px 22px rgba(249,115,22,.18)";
    case 3: return "0 10px 22px rgba(34,197,94,.18)";
    case 4: return "0 10px 22px rgba(59,130,246,.18)";
    default: return "none";
  }
}

export default function EmojiRating({
  value,
  onChange,
  scale,
}: {
  value?: number;
  onChange: (v: 1 | 2 | 3 | 4) => void;
  scale: ScaleOption[];
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
      {scale.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              border: active ? "2px solid rgba(17,24,39,.9)" : "1px solid rgba(226,232,240,1)",
              borderRadius: 16,
              padding: "12px 12px",
              background: active ? activeBg(o.v) : "rgba(255,255,255,.85)",
              boxShadow: active ? activeShadow(o.v) : "0 1px 0 rgba(15,23,42,.04)",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              gap: 10,
              alignItems: "center",
              transition: "transform .08s ease, box-shadow .18s ease, border-color .18s ease",
              transform: active ? "translateY(-1px)" : "translateY(0px)",
            }}
            aria-pressed={active}
          >
            <div style={{ fontSize: 30, lineHeight: 1, filter: active ? "none" : "grayscale(1) opacity(.65)" }}>
              {o.emoji}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Nilai {o.v}</div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.2 }}>{o.label}</div>
            </div>

            <div style={{ marginLeft: "auto", opacity: active ? 0.95 : 0.2, fontWeight: 900 }}>
              ✓
            </div>
          </button>
        );
      })}
    </div>
  );
}
