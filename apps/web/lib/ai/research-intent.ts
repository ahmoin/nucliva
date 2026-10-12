// Whether a request asks for facts from the web, which is when a draft is
// grounded in a search first. It is kept apart from the search itself so the
// editor can use it too, to say what it is doing while it waits.
export const wantsResearch = (prompt: string) =>
  /\b(research|look ?up|search|latest|news|sources?|cite|citations?)\b/i.test(
    prompt
  );

// Whether the writing itself should carry its sources: numbered marks in the
// text and a list at the end. Otherwise the sources are shown beside it.
export const wantsCitations = (prompt: string) =>
  /\b(cite|citations?|sources?|references?|bibliography|footnotes?)\b/i.test(
    prompt
  );
