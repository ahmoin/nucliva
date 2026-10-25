import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { connectors, isConnectorId } from "@/lib/knowledge/connectors";
import {
  backToKnowledge,
  redirectUri,
  STATE_COOKIE,
} from "@/lib/knowledge/oauth";

// Sends the user to the app to sign in and allow Nucliva to read it.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { provider } = await params;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isConnectorId(provider)) {
    return NextResponse.redirect(backToKnowledge(request, "error=unknown"));
  }

  // A guest's sandbox is not the place to connect a real account.
  if (session.user.isAnonymous) {
    return NextResponse.redirect(backToKnowledge(request, "error=guest"));
  }

  const connector = connectors[provider];

  if (!connector.configured()) {
    return NextResponse.redirect(
      backToKnowledge(request, `error=setup&provider=${provider}`)
    );
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(
    connector.authorizeUrl(state, redirectUri(request, provider))
  );

  response.cookies.set(STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });

  return response;
}
