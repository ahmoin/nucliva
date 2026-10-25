// Must match each app's OAuth redirect setting exactly.
export const redirectUri = (request: Request, provider: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin}/api/integrations/${provider}/callback`;

export const STATE_COOKIE = "nucliva-oauth-state";

export const backToKnowledge = (request: Request, query: string) =>
  new URL(`/dashboard/knowledge-base?${query}`, request.url);
