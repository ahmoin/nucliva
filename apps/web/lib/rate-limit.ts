// A small allowance of requests per key in a window of time, kept in memory.
// Each server instance counts for itself, so this slows a runaway guest down
// but is not a hard limit across all of them.
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

  // Keep the map from growing without end on a busy instance.
  if (hits.size > 5000) {
    for (const [name, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) {
        hits.delete(name);
      }
    }
  }

  return true;
}

// Guests trying the sandbox get a smaller allowance of the requests that cost
// money to answer. Returns a response to send back when they are over it.
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
