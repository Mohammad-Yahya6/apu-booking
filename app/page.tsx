"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BUILDINGS, type BuildingKey } from "../lib/data";
import Navbar from "./components/Navbar";

function CampusMap({ onSelect }: { onSelect: (key: BuildingKey) => void }) {
  const [hovered, setHovered] = useState<BuildingKey | null>(null);
  const h = (key: BuildingKey) => hovered === key;

  const bld = (key: BuildingKey) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered(null),
    onClick: () => onSelect(key),
    style: { cursor: "pointer" } as React.CSSProperties,
  });

  const box  = (key: BuildingKey): React.CSSProperties => ({ fill: h(key) ? "#06111f" : "#0e0e0e", stroke: h(key) ? "#3b82f6" : "#6d6d6d", strokeWidth: h(key) ? 1 : 0.5, transition: "fill 0.15s, stroke 0.15s" });
  const bar  = (key: BuildingKey): React.CSSProperties => ({ fill: h(key) ? "#60a5fa" : "#2563eb", transition: "fill 0.15s" });
  const name = (key: BuildingKey): React.CSSProperties => ({ fill: h(key) ? "#ffffff" : "#ffffff", transition: "fill 0.15s", pointerEvents: "none", userSelect: "none" });
  const sub  = (key: BuildingKey): React.CSSProperties => ({ fill: h(key) ? "#3b82f6" : "#595959", transition: "fill 0.15s", pointerEvents: "none", userSelect: "none" });
  const lbl  : React.CSSProperties = { fill: "#4d4d4d", pointerEvents: "none", userSelect: "none" };

  return (
    <svg viewBox="0 0 580 340" style={{ width: "100%", display: "block", minHeight: "300px" }}>
      <defs>
        <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.5" fill="#111" />
        </pattern>
      </defs>
      <rect width="580" height="340" fill="url(#g)" />

      <rect x="90" y="158" width="360" height="12" rx="2" fill="#0b0b0b" />
      <line x1="90" y1="164" x2="450" y2="164" stroke="#161616" strokeWidth="1" strokeDasharray="10 7" />
      <rect x="174" y="100" width="10" height="68" rx="2" fill="#0b0b0b" />
      <rect x="334" y="100" width="10" height="68" rx="2" fill="#0b0b0b" />
      <rect x="174" y="160" width="10" height="68" rx="2" fill="#0b0b0b" />
      <rect x="334" y="160" width="10" height="68" rx="2" fill="#0b0b0b" />
      <rect x="440" y="158" width="52" height="12" rx="2" fill="#0b0b0b" />

      <rect x="12" y="144" width="78" height="44" rx="3" fill="#1c1c1c" stroke="#474646" strokeWidth="0.5" />
      {[0,1,2,3].map(i => (
        <line key={i} x1="12" y1={153 + i * 9} x2="90" y2={153 + i * 9} stroke="#171717" strokeWidth="0.8" />
      ))}
      <text x="51" y="200" textAnchor="middle" fontSize="6.5" fill="#3f3f3f" fontFamily="'Roboto Mono', monospace" letterSpacing="0.12em">STAIRS</text>

      <g {...bld("B")}>
        <rect x="104" y="34" width="132" height="70" rx="5" style={box("B")} />
        <rect x="104" y="34" width="3" height="70" rx="1.5" style={bar("B")} />
        <text x="172" y="67" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="'Roboto', sans-serif" style={name("B")}>Block B</text>
        <text x="172" y="83" textAnchor="middle" fontSize="9.5" fontFamily="'Roboto', sans-serif" style={sub("B")}>4 classrooms</text>
        <text x="172" y="96" textAnchor="middle" fontSize="7" fontFamily="'Roboto Mono', monospace" letterSpacing="0.1em" style={lbl}>TAP TO BOOK</text>
      </g>

      <g {...bld("C")}>
        <rect x="272" y="34" width="144" height="70" rx="5" style={box("C")} />
        <rect x="272" y="34" width="3" height="70" rx="1.5" style={bar("C")} />
        <text x="345" y="67" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="'Roboto', sans-serif" style={name("C")}>Block C</text>
        <text x="345" y="83" textAnchor="middle" fontSize="9.5" fontFamily="'Roboto', sans-serif" style={sub("C")}>2 auditoriums · 3 rooms</text>
        <text x="345" y="96" textAnchor="middle" fontSize="7" fontFamily="'Roboto Mono', monospace" letterSpacing="0.1em" style={lbl}>TAP TO BOOK</text>
      </g>

      <g {...bld("A")}>
        <rect x="104" y="228" width="132" height="72" rx="5" style={box("A")} />
        <rect x="104" y="228" width="3" height="72" rx="1.5" style={bar("A")} />
        <text x="172" y="261" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="'Roboto', sans-serif" style={name("A")}>Block A</text>
        <text x="172" y="277" textAnchor="middle" fontSize="9.5" fontFamily="'Roboto', sans-serif" style={sub("A")}>2 auditoriums · 3 rooms</text>
        <text x="172" y="290" textAnchor="middle" fontSize="7" fontFamily="'Roboto Mono', monospace" letterSpacing="0.1em" style={lbl}>TAP TO BOOK</text>
      </g>

      <g {...bld("D")}>
        <rect x="272" y="228" width="132" height="72" rx="5" style={box("D")} />
        <rect x="272" y="228" width="3" height="72" rx="1.5" style={bar("D")} />
        <text x="340" y="261" textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="'Roboto', sans-serif" style={name("D")}>Block D</text>
        <text x="340" y="277" textAnchor="middle" fontSize="9.5" fontFamily="'Roboto', sans-serif" style={sub("D")}>4 classrooms</text>
        <text x="340" y="290" textAnchor="middle" fontSize="7" fontFamily="'Roboto Mono', monospace" letterSpacing="0.1em" style={lbl}>TAP TO BOOK</text>
      </g>

      <g {...bld("Library")}>
        <rect x="452" y="128" width="116" height="72" rx="5" style={box("Library")} />
        <rect x="452" y="128" width="3" height="72" rx="1.5" style={bar("Library")} />
        <text x="511" y="161" textAnchor="middle" fontSize="13" fontWeight="600" fontFamily="'Roboto', sans-serif" style={name("Library")}>Library</text>
        <text x="511" y="177" textAnchor="middle" fontSize="9.5" fontFamily="'Roboto', sans-serif" style={sub("Library")}>15 discussion rooms</text>
        <text x="511" y="190" textAnchor="middle" fontSize="7" fontFamily="'Roboto Mono', monospace" letterSpacing="0.1em" style={lbl}>TAP TO BOOK</text>
      </g>
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080808; --border: #141414; --border-mid: #232323;
          --text: #e4e4e4; --dim: #444; --muted: #858585;
          --blue: #3b82f6; --blue-dark: #1d4ed8;
          --font-head: 'Roboto', sans-serif;
          --font-body: 'Roboto', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .page { max-width: 960px; margin: 0 auto; padding: 64px 32px 80px; }
        .headline-wrap { animation: fadeUp 0.4s ease both; }
        .eyebrow { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .eyebrow::before { content: ''; display: block; width: 20px; height: 0.5px; background: var(--blue-dark); }
        .headline { font-family: var(--font-head); font-size: clamp(24px, 3.2vw, 42px); font-weight: 700; line-height: 1.16; letter-spacing: -0.025em; color: #f0f0f0; }
        .headline-link { color: var(--blue); text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1px; text-decoration-color: #1d4ed855; transition: text-decoration-color 0.2s; }
        .headline-link:hover { text-decoration-color: var(--blue); }

        .map-card { margin-top: 48px; border: 0.5px solid #222; border-radius: 12px; overflow: hidden; animation: fadeUp 0.4s ease 0.1s both; }
        .map-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 0.5px solid var(--border); }
        .map-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }
        .live { display: flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 9px; color: var(--muted); }
        .live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); animation: pulse 2s ease-in-out infinite; }
        .map-body { padding: 16px; background: #0c0c0c; }

        @media (max-width: 700px) {
          .page { padding: 32px 16px 60px; }
          .map-card { margin-top: 28px; }
          .map-body { padding: 8px; }
          .eyebrow { margin-bottom: 12px; }
        }
      `}</style>

      <Navbar />

      <main className="page">
        <div className="headline-wrap">
          <p className="eyebrow">Room booking</p>
          <h1 className="headline">
            Choose where you want to book<br />
            or <a href="/bookings" className="headline-link">manage current bookings</a>
          </h1>
        </div>

        <div className="map-card">
          <div className="map-bar">
            <span className="map-label">APU Campus Map</span>
            <span className="live"><span className="live-dot" />Live availability</span>
          </div>
          <div className="map-body">
            {mounted && <CampusMap onSelect={(key) => router.push(`/buildings/${key.toLowerCase()}`)} />}
          </div>
        </div>
      </main>
    </>
  );
}