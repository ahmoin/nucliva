import { cookies, headers } from "next/headers";
import { after, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { connectors, isConnectorId } from "@/lib/knowledge/connectors";
import {
  backToKnowledge,
  redirectUri,
  STATE_COOKIE,
} from "@/lib/knowledge/oauth";
import { saveConnection, syncIntegration } from "@/lib/knowledge/sync";

// The first sync runs after the redirect, for as long as the platform allows.
export const maxDuration = 300;

// Where the app sends the user back. The code it gives is traded for tokens,
// and the first sync starts.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { provider } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const store = await cookies();
  const expected = store.get(STATE_COOKIE)?.value;

  store.delete(STATE_COOKIE);

  if (!(session && isConnectorId(provider))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    !code ||
    expected !== `${provider}:${url.searchParams.get("state") ?? ""}`
  ) {
    return NextResponse.redirect(
      backToKnowledge(request, `error=denied&provider=${provider}`)
    );
  }

  try {
    const tokens = await connectors[provider].exchange(
      code,
      redirectUri(request, provider)
    );

    await saveConnection(session.user.id, provider, tokens);
  } catch (error) {
    console.error(`${provider} connect failed:`, error);

    return NextResponse.redirect(
      backToKnowledge(request, `error=failed&provider=${provider}`)
    );
  }

  const userId = session.user.id;

  after(() => syncIntegration(userId, provider));

  return NextResponse.redirect(
    backToKnowledge(request, `connected=${provider}`)
  );
}
