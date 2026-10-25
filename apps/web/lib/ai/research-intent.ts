// Kept free of imports so client code can use it.
export const wantsResearch = (prompt: string) =>
  /\b(research|look ?up|search|latest|news|sources?|cite|citations?)\b/i.test(
    prompt
  );

export const wantsCitations = (prompt: string) =>
  /\b(cite|citations?|sources?|references?|bibliography|footnotes?)\b/i.test(
    prompt
  );
