// Bakes scripts/opengraph-image.tsx into app/opengraph-image.png, which is the
// file Next.js serves. Run it from apps/web after changing the design:
//
//   pnpm dlx tsx scripts/render-opengraph.mts
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import Image from "./opengraph-image";

// The design file uses JSX without importing React, as the app compiles it, so
// give it React to use here.
(globalThis as { React?: unknown }).React = createRequire(import.meta.url)(
  "react"
);

const response = Image() as Response;
const target = fileURLToPath(
  new URL("../app/opengraph-image.png", import.meta.url)
);

writeFileSync(target, Buffer.from(await response.arrayBuffer()));
console.log("Wrote", target);
