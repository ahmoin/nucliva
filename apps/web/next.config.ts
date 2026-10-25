import type { NextConfig } from "next";

const wantsMarkdown = [
  { key: "accept", type: "header" as const, value: ".*text/markdown.*" },
];

const legalPages = "terms|privacy|cookies|security";
const sitePages = `features|built-with|solutions|${legalPages}`;

const nextConfig: NextConfig = {
  async headers() {
    // Same URL serves HTML or Markdown, so caches must vary on Accept.
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
        { destination: "/md/home", source: "/.md" },
        { destination: "/md/:path+", source: "/:path+.md" },
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
