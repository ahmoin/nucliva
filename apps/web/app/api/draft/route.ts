import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { writeInUserVoice } from "@/lib/style-engine";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const result = await writeInUserVoice({ prompt, userId: session.user.id });

  return Response.json(result);
}
