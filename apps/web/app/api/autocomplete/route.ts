import { headers } from "next/headers";
import { autocompleteInput, autocompletePrompt } from "@/lib/ai/prompts";
import { auth } from "@/lib/auth";
import { limitGuest } from "@/lib/rate-limit";
import { getChatModel } from "@/lib/nebius";

// The model is asked for {"space", "text"}, and the space is put back in front
// of the text here. A reply that is not that is taken as the text itself, with
// the space it starts with if it has one.
function parseInsertion(reply: string) {
  const raw = reply.replace(/^\n+/, "").trimEnd();
  const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;

  try {
    const parsed: { space?: unknown; text?: unknown } = JSON.parse(json);

    if (typeof parsed.text === "string") {
      const text = parsed.text.trim();

      return parsed.space === true ? ` ${text}` : text;
    }
  } catch {
    // Not JSON.
  }

  return raw;
}

export async function POST(request: Request) {
  const started = performance.now();
  const session = await auth.api.getSession({ headers: await headers() });
  const authenticated = performance.now();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Autocomplete runs as they type, so a guest gets plenty of it.
  if (limitGuest(session, "autocomplete", 200)) {
    return Response.json({ completion: null });
  }

  const body = await request.json().catch(() => null);
  const context = typeof body?.context === "string" ? body.context : "";
  const before = typeof body?.before === "string" ? body.before : "";

  if (context.trim().length < 3) {
    return Response.json({ completion: null });
  }

  try {
    const response = await getChatModel("nano", {
      maxTokens: 64,
      temperature: 0.3,
      thinking: false,
    }).invoke([
      ["system", autocompletePrompt],
      ["human", autocompleteInput(context, before)],
    ]);
    const completion = parseInsertion(response.text);

    // Where the time goes: signing in, or waiting on the model.
    console.log(
      `autocomplete: auth ${Math.round(authenticated - started)}ms, model ${Math.round(performance.now() - authenticated)}ms, raw ${JSON.stringify(response.text)} -> ${JSON.stringify(completion)}`
    );

    return Response.json({ completion: completion.trim() ? completion : null });
  } catch (error) {
    // Autocomplete is optional, so the editor just sees no suggestion. The
    // terminal still shows why, such as a rate limit or an empty balance.
    console.error("autocomplete failed:", error);

    return Response.json({ completion: null });
  }
}
