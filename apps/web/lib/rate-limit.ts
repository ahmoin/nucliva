// In-memory and per instance, so not a hard limit across instances.
const hits = new Map<string, number[]>();

export const HOUR = 60 * 60 * 1000;

export function allow(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= max) {
    hits.set(key, recent);

    return false;
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [name, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) {
        hits.delete(name);
      }
    }
  }

  return true;
}

export function limitGuest(
  session: { user: { id: string; isAnonymous?: boolean | null } },
  bucket: string,
  max: number
) {
  if (!session.user.isAnonymous) {
    return null;
  }

  if (allow(`${bucket}:${session.user.id}`, max, HOUR)) {
    return null;
  }

  return Response.json(
    {
      error:
        "You have used the sandbox allowance for now. Sign up to keep going.",
    },
    { status: 429 }
  );
}
