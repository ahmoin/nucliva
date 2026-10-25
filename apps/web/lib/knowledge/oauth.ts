// Where an app sends the user back after they sign in to it. It has to match
// what is set in that app's OAuth settings exactly.
export const redirectUri = (request: Request, provider: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin}/api/integrations/${provider}/callback`;

// A random value sent to the app and kept in a cookie, so a callback that did
// not start here is turned away.
export const STATE_COOKIE = "nucliva-oauth-state";

export const backToKnowledge = (request: Request, query: string) =>
  new URL(`/dashboard/knowledge-base?${query}`, request.url);
