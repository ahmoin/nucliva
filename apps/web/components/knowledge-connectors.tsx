"use client";

import {
  ArrowsClockwiseIcon,
  UploadSimpleIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface ConnectorView {
  configured: boolean;
  description: string;
  // What was brought in, and when, once there has been a sync.
  detail: string | null;
  id: "google_drive" | "local" | "notion" | "slack";
  name: string;
  status: "Available" | "Connected" | "Not connected" | "Sync failed" | "Syncing";
}

const names: Record<string, string> = {
  google_drive: "Google Drive",
  notion: "Notion",
  slack: "Slack",
};

const POLL_EVERY = 3000;
const ACCEPT = ".pdf,.txt,.md,.markdown,.csv";

// What came back from signing in to an app, said once at the top.
function useCallbackMessage() {
  const params = useSearchParams();
  const name = names[params.get("provider") ?? params.get("connected") ?? ""];

  if (params.get("connected")) {
    return {
      text: `Connected to ${name}. Bringing in your files now, which can take a minute.`,
      tone: "ok" as const,
    };
  }

  const error = params.get("error");
  const errors: Record<string, string> = {
    denied: `${name ?? "The app"} was not connected. Try again, and allow access when asked.`,
    failed: `Could not finish connecting to ${name ?? "the app"}. Try again in a moment.`,
    guest: "Sign up to connect your own apps. The sandbox has a knowledge base of its own.",
    setup: `${name ?? "This app"} is not set up on this server yet. Its OAuth keys need to be added first.`,
  };

  return error ? { text: errors[error] ?? errors.failed, tone: "error" as const } : null;
}

// Files from the computer, for the knowledge base. Shared by the card and the
// button in the page header.
function useUpload() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const form = new FormData();

      for (const file of files) {
        form.append("files", file);
      }

      const response = await fetch("/api/knowledge/upload", {
        body: form,
        method: "POST",
      });
      const data = (await response.json()) as {
        added?: string[];
        error?: string;
        skipped?: string[];
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not upload.");
      }

      const added = data.added?.length ?? 0;
      const skipped = data.skipped ?? [];

      setMessage(
        [
          added > 0 ? `Added ${added} ${added === 1 ? "file" : "files"}.` : null,
          skipped.length > 0
            ? `Could not read ${skipped.join(", ")}. PDFs, text and Markdown work.`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      );
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not upload.");
    } finally {
      setUploading(false);

      if (input.current) {
        input.current.value = "";
      }
    }
  };

  const picker = (
    <input
      accept={ACCEPT}
      className="hidden"
      multiple
      onChange={(event) => upload(event.target.files)}
      ref={input}
      type="file"
    />
  );

  return {
    choose: () => input.current?.click(),
    message,
    picker,
    uploading,
  };
}

export function AddSourceButton() {
  const { choose, message, picker, uploading } = useUpload();

  return (
    <div className="flex flex-col items-end gap-1">
      {picker}
      <Button disabled={uploading} onClick={choose}>
        <UploadSimpleIcon />
        {uploading ? "Uploading..." : "Add source"}
      </Button>
      {message ? (
        <span className="max-w-xs text-right text-muted-foreground text-xs">
          {message}
        </span>
      ) : null}
    </div>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorView }) {
  const router = useRouter();
  const { choose, message, picker, uploading } = useUpload();
  const [busy, setBusy] = useState(false);
  const connected = ["Connected", "Sync failed", "Syncing"].includes(
    connector.status
  );

  const act = async (method: "DELETE" | "POST") => {
    setBusy(true);

    try {
      await fetch(`/api/integrations/${connector.id}`, { method });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="line-clamp-2 break-words text-base">
          {connector.name}
        </CardTitle>
        <CardDescription className="line-clamp-3 break-words">
          {connector.description}
        </CardDescription>
      </CardHeader>
      <div className="mt-auto flex min-w-0 flex-col items-start gap-3 px-(--card-spacing)">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={connector.status === "Connected" ? "default" : "secondary"}
          >
            {connector.status === "Syncing" ? (
              <ArrowsClockwiseIcon className="motion-safe:animate-spin" />
            ) : null}
            {connector.status === "Sync failed" ? <WarningIcon /> : null}
            {connector.status}
          </Badge>
          {connector.detail ? (
            <span className="text-muted-foreground text-xs">
              {connector.detail}
            </span>
          ) : null}
        </div>
        {connector.id === "local" ? (
          <>
            {picker}
            <Button
              disabled={uploading}
              onClick={choose}
              size="sm"
              variant="outline"
            >
              {uploading ? "Uploading..." : "Upload files"}
            </Button>
            {message ? (
              <span className="text-muted-foreground text-xs">{message}</span>
            ) : null}
          </>
        ) : null}
        {connector.id !== "local" && connected ? (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || connector.status === "Syncing"}
              onClick={() => act("POST")}
              size="sm"
              variant="outline"
            >
              Sync now
            </Button>
            <Button
              disabled={busy}
              onClick={() => act("DELETE")}
              size="sm"
              variant="ghost"
            >
              Disconnect
            </Button>
          </div>
        ) : null}
        {connector.id !== "local" && !connected ? (
          connector.configured ? (
            <Button
              nativeButton={false}
              render={<a href={`/api/integrations/${connector.id}/connect`} />}
              size="sm"
              variant="outline"
            >
              Connect
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              Needs setup
            </Button>
          )
        ) : null}
      </div>
    </Card>
  );
}

export function KnowledgeConnectors({
  connectors,
}: {
  connectors: ConnectorView[];
}) {
  const router = useRouter();
  const notice = useCallbackMessage();
  const syncing = connectors.some((item) => item.status === "Syncing");

  // While an app is bringing files in, the page looks again now and then.
  useEffect(() => {
    if (!syncing) {
      return;
    }

    const timer = setInterval(() => router.refresh(), POLL_EVERY);

    return () => clearInterval(timer);
  }, [router, syncing]);

  return (
    <>
      {notice ? (
        <p
          className={`border px-4 py-3 text-sm ${notice.tone === "error" ? "border-destructive/40 text-destructive" : "border-primary/40 bg-primary/5"}`}
          role="status"
        >
          {notice.text}
        </p>
      ) : null}
      <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
        {connectors.map((connector) => (
          <ConnectorCard connector={connector} key={connector.id} />
        ))}
      </div>
    </>
  );
}
