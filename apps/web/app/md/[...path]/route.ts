import { canonicalFor, markdownFor } from "@/lib/content/markdown";

// The Markdown version of a page. Visitors do not come here directly: the
// rewrites in next.config.ts send a ".md" address, or a request that asks for
// Markdown, to this route.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const body = markdownFor(path);

  if (!body) {
    return new Response("Not found", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 404,
    });
  }

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Content-Type": "text/markdown; charset=utf-8",
      Link: `<${canonicalFor(path)}>; rel="canonical"`,
      Vary: "Accept",
    },
  });
}
