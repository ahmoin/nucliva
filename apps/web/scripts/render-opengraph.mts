// Bakes scripts/opengraph-image.tsx into app/opengraph-image.png, which is the
// file Next.js serves, and scripts/thumbnail-image.tsx into
// public/brand/thumbnail.png, the Devpost thumbnail. Run it from apps/web after
// changing either design:
//
//   pnpm dlx tsx scripts/render-opengraph.mts
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import Image from "./opengraph-image";
import Thumbnail from "./thumbnail-image";

// The design file uses JSX without importing React, as the app compiles it, so
// give it React to use here.
(globalThis as { React?: unknown }).React = createRequire(import.meta.url)(
  "react"
);

const renders: [() => unknown, string][] = [
  [Image, "../app/opengraph-image.png"],
  [Thumbnail, "../public/brand/thumbnail.png"],
];

for (const [draw, path] of renders) {
  const response = draw() as Response;
  const target = fileURLToPath(new URL(path, import.meta.url));

  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  console.log("Wrote", target);
}
