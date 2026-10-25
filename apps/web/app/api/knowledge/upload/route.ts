import { headers } from "next/headers";
import { extractText } from "unpdf";
import { auth } from "@/lib/auth/server";
import { saveSource } from "@/lib/knowledge/sources";
import { limitGuest } from "@/lib/rate-limit";

export const maxDuration = 120;

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const TEXT_TYPES = /\.(txt|md|markdown|csv)$/i;

async function textOf(file: File) {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const { text } = await extractText(new Uint8Array(await file.arrayBuffer()), {
      mergePages: true,
    });

    return text;
  }

  return TEXT_TYPES.test(file.name) || file.type.startsWith("text/")
    ? file.text()
    : null;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = limitGuest(session, "embeddings", 5);

  if (limited) {
    return limited;
  }

  const form = await request.formData().catch(() => null);
  const files = (form?.getAll("files") ?? [])
    .filter((value): value is File => value instanceof File)
    .slice(0, MAX_FILES);

  if (files.length === 0) {
    return Response.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const added: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    try {
      const text = file.size <= MAX_BYTES ? await textOf(file) : null;
      const chunks = text
        ? await saveSource(session.user.id, "local", {
            externalId: `${file.name}:${file.size}`,
            text,
            title: file.name,
          })
        : 0;

      (chunks > 0 ? added : skipped).push(file.name);
    } catch (error) {
      console.error("upload failed:", error);
      skipped.push(file.name);
    }
  }

  return Response.json({ added, skipped });
}
