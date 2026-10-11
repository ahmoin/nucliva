import type { NextConfig } from "next";

// A request that asks for Markdown, as agents and tools do, gets the Markdown
// version of the page at the normal address.
const wantsMarkdown = [
  { key: "accept", type: "header" as const, value: ".*text/markdown.*" },
];

const legalPages = "terms|privacy|cookies|security";
const sitePages = `features|built-with|solutions|${legalPages}`;

const nextConfig: NextConfig = {
  async headers() {
    // The same address can answer with a page or with Markdown, so caches
    // have to keep the two apart.
    return [
      "/",
      `/:page(${sitePages})`,
      "/solutions/:category",
      "/solutions/:category/:example",
    ].map((source) => ({
      headers: [{ key: "Vary", value: "Accept" }],
      source,
    }));
  },
  async rewrites() {
    return {
      afterFiles: [],
      beforeFiles: [
        // The address of a page with .md on the end.
        { destination: "/md/home", source: "/.md" },
        { destination: "/md/:path+", source: "/:path+.md" },
        // The normal address, from someone who asks for Markdown.
        { destination: "/md/home", has: wantsMarkdown, source: "/" },
        {
          destination: "/md/:page",
          has: wantsMarkdown,
          source: `/:page(${sitePages})`,
        },
        {
          destination: "/md/solutions/:category",
          has: wantsMarkdown,
          source: "/solutions/:category",
        },
        {
          destination: "/md/solutions/:category/:example",
          has: wantsMarkdown,
          source: "/solutions/:category/:example",
        },
      ],
      fallback: [],
    };
  },
  transpilePackages: ["@workspace/db", "@workspace/ui"],
};

export default nextConfig;
