import { readFileSync } from "node:fs";
import { ImageResponse } from "next/og";

// The design of the share image. It is baked into app/opengraph-image.png by
// render-opengraph.mts, so the site serves a plain file instead of drawing it
// on every build. Change the design here, then run that script.
export const size = { height: 630, width: 1200 };

// ImageResponse cannot read the theme tokens, so the brand colours are written
// out here, with the fonts the site uses kept in ./fonts. The picture of the
// editor is a real screenshot of it (editor-shot.png), with a document that has
// the AI's suggestions in it.
const file = (name: string) => readFileSync(new URL(name, import.meta.url));

const bg = "#040a08";
const green = "#00f08c";
const mint = "#9bffd2";
const muted = "#93ada1";

const SHOT = { height: 805, width: 1284 };
const SCALE = 0.7;
const FRAME = { left: 470, top: 66 };

const shot = `data:image/png;base64,${file("editor-shot.png").toString("base64")}`;

const Line = ({ children, tone }: { children: string; tone: "light" | "green" }) => (
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
          // a glow of the brand green behind the screenshot, a cooler one low
          // on the left, then a fine grid over all of it
          "radial-gradient(circle at 74% 46%, rgba(0,240,140,0.36), rgba(0,240,140,0) 50%)",
          "radial-gradient(circle at 4% 106%, rgba(20,150,200,0.3), rgba(20,150,200,0) 42%)",
          "radial-gradient(circle at 40% -20%, rgba(255,255,255,0.07), rgba(255,255,255,0) 50%)",
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        ].join(","),
        backgroundSize: "100% 100%, 100% 100%, 100% 100%, 48px 48px, 48px 48px",
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
          padding: "96px 0 64px 64px",
          width: 440,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Bricolage Grotesque",
            fontSize: 62,
            fontWeight: 700,
            letterSpacing: -2.5,
            lineHeight: 1.04,
          }}
        >
          <Line tone="light">The AI</Line>
          <Line tone="light">workspace</Line>
          <Line tone="green">that writes</Line>
          <Line tone="green">like you.</Line>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
          <svg aria-hidden height="48" viewBox="0 0 32 32" width="48">
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
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: -1,
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
            "0 0 110px rgba(0,240,140,0.28), 0 30px 80px rgba(0,0,0,0.6)",
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
        {
          data: file("fonts/instrument-500.ttf"),
          name: "Instrument Sans",
          style: "normal",
          weight: 500,
        },
        {
          data: file("fonts/geistmono-500.ttf"),
          name: "Geist Mono",
          style: "normal",
          weight: 500,
        },
      ],
    }
  );
}
