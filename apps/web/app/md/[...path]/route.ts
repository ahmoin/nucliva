import { canonicalFor, markdownFor } from "@/lib/content/markdown";

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
