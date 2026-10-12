import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/lib/auth/server";
import { detailOf, findSolution } from "@/lib/content/solutions";
import { allow, HOUR } from "@/lib/rate-limit";
import { createSandbox, embedAll } from "@/lib/sandbox/create";

// Opens a solution for someone to try. A visitor without an account becomes a
// guest first, and everyone gets a document of notes with the request for that
// solution ready to send.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const solution =
    typeof body?.category === "string" && typeof body?.example === "string"
      ? findSolution(body.category, body.example)
      : undefined;

  if (!solution) {
    return Response.json({ error: "Unknown solution" }, { status: 404 });
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  let userId = session?.user.id;
  let guest = Boolean(session?.user.isAnonymous);

  if (!session) {
    const address =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!allow(`sandbox:${address}`, 10, HOUR)) {
      return Response.json(
        { error: "Too many sandboxes from here. Try again later." },
        { status: 429 }
      );
    }

    const created = await auth.api.signInAnonymous({
      headers: requestHeaders,
    });

    userId = created.user.id;
    guest = true;
  }

  if (!userId) {
    return Response.json(
      { error: "Could not start a sandbox" },
      { status: 500 }
    );
  }

  const { documentId, embeds } = await createSandbox({
    guest,
    solution,
    userId,
  });

  if (!documentId) {
    return Response.json(
      { error: "Could not start a sandbox" },
      { status: 500 }
    );
  }

  if (embeds.length > 0) {
    const owner = userId;

    after(() => embedAll(owner, embeds));
  }

  const prompt = detailOf(solution.slug)?.prompt;
  const url = `/dashboard/docs/${documentId}${
    prompt ? `?prompt=${encodeURIComponent(prompt)}` : ""
  }`;

  return Response.json({ url });
}
