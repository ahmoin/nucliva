import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";

export const size = { height: 1000, width: 1500 };

const file = (name: string) => readFileSync(new URL(name, import.meta.url));

const bg = "#040a08";
const green = "#00f08c";
const mint = "#9bffd2";
const muted = "#93ada1";

const SHOT = { height: 805, width: 1284 };
const SCALE = 0.86;
const FRAME = { left: 560, top: 470 };

const shot = `data:image/png;base64,${file("editor-shot.png").toString("base64")}`;

const Line = ({
  children,
  tone,
}: {
  children: string;
  tone: "light" | "green";
}) => (
  <div
    style={{
      backgroundClip: "text",
      backgroundImage:
        tone === "light"
          ? "linear-gradient(180deg, #ffffff, #c9ded4)"
          : `linear-gradient(90deg, ${green}, ${mint} 80%)`,
      color: "transparent",
      display: "flex",
    }}
  >
    {children}
  </div>
);

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        backgroundColor: bg,
        backgroundImage: [
          "radial-gradient(circle at 78% 72%, rgba(0,240,140,0.34), rgba(0,240,140,0) 48%)",
          "radial-gradient(circle at 2% 104%, rgba(20,150,200,0.28), rgba(20,150,200,0) 40%)",
          "radial-gradient(circle at 30% -20%, rgba(255,255,255,0.07), rgba(255,255,255,0) 50%)",
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "100% 100%, 100% 100%, 100% 100%, 50px 50px, 50px 50px",
        color: "white",
        display: "flex",
        fontFamily: "Instrument Sans",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "96px 0 84px 88px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Bricolage Grotesque",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1.02,
            }}
          >
            <Line tone="light">The AI workspace</Line>
            <Line tone="green">that writes like you.</Line>
          </div>
          <div
            style={{
              color: muted,
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              width: 760,
            }}
          >
            Docs, sheets and decks in your voice, researched with Tavily and
            written by NVIDIA Nemotron on Nebius.
          </div>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 20 }}>
          <svg aria-hidden height="64" viewBox="0 0 32 32" width="64">
            <defs>
              <linearGradient id="mark" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#5dffb8" />
                <stop offset="1" stopColor="#00d27a" />
              </linearGradient>
            </defs>
            <path d="M0 0H22L32 10V32H0V0Z" fill="url(#mark)" />
            <path
              d="M8 8H12L24 24H20L8 8ZM8 8H12V24H8V8ZM20 8H24V24H20V8Z"
              fill={bg}
            />
          </svg>
          <div
            style={{
              display: "flex",
              fontFamily: "Bricolage Grotesque",
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: -1.5,
            }}
          >
            nucliva
          </div>
        </div>
      </div>
      <div
        style={{
          borderLeft: "1px solid rgba(255,255,255,0.28)",
          borderTop: "1px solid rgba(255,255,255,0.28)",
          boxShadow:
            "0 0 130px rgba(0,240,140,0.28), 0 30px 90px rgba(0,0,0,0.6)",
          display: "flex",
          height: size.height - FRAME.top,
          left: FRAME.left,
          overflow: "hidden",
          position: "absolute",
          top: FRAME.top,
          width: size.width - FRAME.left,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: drawn by ImageResponse, not by Next */}
        <img
          alt=""
          height={Math.round(SHOT.height * SCALE)}
          src={shot}
          width={Math.round(SHOT.width * SCALE)}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          data: file("fonts/bricolage-700.ttf"),
          name: "Bricolage Grotesque",
          style: "normal",
          weight: 700,
        },
        {
          data: file("fonts/instrument-400.ttf"),
          name: "Instrument Sans",
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
