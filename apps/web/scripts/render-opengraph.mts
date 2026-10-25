//   pnpm dlx tsx scripts/render-opengraph.mts
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import Image from "./opengraph-image";
import Thumbnail from "./thumbnail-image";

// The design files use JSX without importing React, so provide it globally.
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
