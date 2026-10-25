import type { SourceItem } from "@/lib/knowledge/sources";

const MAX_ITEMS = 25;

export interface Tokens {
  accessToken: string;
  expiresAt?: number;
  name?: string;
  refreshToken?: string;
}

export interface Connector {
  authorizeUrl: (state: string, redirectUri: string) => string;
  configured: () => boolean;
  exchange: (code: string, redirectUri: string) => Promise<Tokens>;
  refresh?: (tokens: Tokens) => Promise<Tokens>;
  sync: (tokens: Tokens) => Promise<SourceItem[]>;
}

const env = (name: string) => process.env[name]?.trim() ?? "";

async function json<T>(response: Response, what: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`${what} failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as T;
}

const GOOGLE_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};
const PLAIN_TYPES = ["text/plain", "text/markdown"];

const googleToken = async (body: Record<string, string>) => {
  const data = await json<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>(
    await fetch("https://oauth2.googleapis.com/token", {
      body: new URLSearchParams({
        client_id: env("GOOGLE_CLIENT_ID"),
        client_secret: env("GOOGLE_CLIENT_SECRET"),
        ...body,
      }),
      method: "POST",
    }),
    "Google sign in"
  );

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token,
  };
};

const googleDrive: Connector = {
  authorizeUrl: (state, redirectUri) =>
    `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      access_type: "offline",
      client_id: env("GOOGLE_CLIENT_ID"),
      prompt: "consent",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.readonly",
      state,
    })}`,
  configured: () =>
    Boolean(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")),
  exchange: async (code, redirectUri) => ({
    ...(await googleToken({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    })),
    name: "Google Drive",
  }),
  refresh: async (tokens) => {
    if (!tokens.refreshToken) {
      return tokens;
    }

    const fresh = await googleToken({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    });

    return { ...tokens, ...fresh, refreshToken: tokens.refreshToken };
  },
  sync: async (tokens) => {
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const types = [...Object.keys(GOOGLE_TYPES), ...PLAIN_TYPES]
      .map((type) => `mimeType='${type}'`)
      .join(" or ");
    const { files } = await json<{
      files: { id: string; mimeType: string; name: string; webViewLink?: string }[];
    }>(
      await fetch(
        `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
          fields: "files(id,name,mimeType,webViewLink)",
          orderBy: "modifiedTime desc",
          pageSize: String(MAX_ITEMS),
          q: `(${types}) and trashed=false`,
        })}`,
        { headers }
      ),
      "Listing Drive files"
    );

    const items = await Promise.all(
      files.map(async (file): Promise<SourceItem | null> => {
        const exportType = GOOGLE_TYPES[file.mimeType];
        const url = exportType
          ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportType)}`
          : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const response = await fetch(url, { headers });

        return response.ok
          ? {
              externalId: file.id,
              text: await response.text(),
              title: file.name,
              url: file.webViewLink,
            }
          : null;
      })
    );

    return items.filter((item): item is SourceItem => item !== null);
  },
};

const NOTION = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

interface NotionText {
  plain_text: string;
}

const notionText = (parts: NotionText[] | undefined) =>
  (parts ?? []).map((part) => part.plain_text).join("");

const notion: Connector = {
  authorizeUrl: (state, redirectUri) =>
    `${NOTION}/oauth/authorize?${new URLSearchParams({
      client_id: env("NOTION_CLIENT_ID"),
      owner: "user",
      redirect_uri: redirectUri,
      response_type: "code",
      state,
    })}`,
  configured: () =>
    Boolean(env("NOTION_CLIENT_ID") && env("NOTION_CLIENT_SECRET")),
  exchange: async (code, redirectUri) => {
    const data = await json<{ access_token: string; workspace_name?: string }>(
      await fetch(`${NOTION}/oauth/token`, {
        body: JSON.stringify({
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
        headers: {
          Authorization: `Basic ${Buffer.from(`${env("NOTION_CLIENT_ID")}:${env("NOTION_CLIENT_SECRET")}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      "Notion sign in"
    );

    return { accessToken: data.access_token, name: data.workspace_name };
  },
  sync: async (tokens) => {
    const headers = {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    };
    const { results } = await json<{
      results: {
        id: string;
        properties?: Record<string, { title?: NotionText[]; type: string }>;
        url?: string;
      }[];
    }>(
      await fetch(`${NOTION}/search`, {
        body: JSON.stringify({
          filter: { property: "object", value: "page" },
          page_size: MAX_ITEMS,
          sort: { direction: "descending", timestamp: "last_edited_time" },
        }),
        headers,
        method: "POST",
      }),
      "Searching Notion"
    );

    const items = await Promise.all(
      results.map(async (page): Promise<SourceItem | null> => {
        const title = Object.values(page.properties ?? {}).find(
          (property) => property.type === "title"
        );
        const response = await fetch(
          `${NOTION}/blocks/${page.id}/children?page_size=100`,
          { headers }
        );

        if (!response.ok) {
          return null;
        }

        const { results: blocks } = (await response.json()) as {
          results: ({ type: string } & Record<string, unknown>)[];
        };
        const text = blocks
          .map((block) =>
            notionText(
              (block[block.type] as { rich_text?: NotionText[] } | undefined)
                ?.rich_text
            )
          )
          .filter(Boolean)
          .join("\n");

        return {
          externalId: page.id,
          text,
          title: notionText(title?.title) || "Untitled",
          url: page.url,
        };
      })
    );

    return items.filter((item): item is SourceItem => item !== null);
  },
};

const SLACK = "https://slack.com/api";
const MAX_CHANNELS = 10;

const slackGet = async <T>(token: string, method: string, params: object) => {
  const data = await json<T & { error?: string; ok: boolean }>(
    await fetch(
      `${SLACK}/${method}?${new URLSearchParams(params as Record<string, string>)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    `Slack ${method}`
  );

  if (!data.ok) {
    throw new Error(`Slack ${method} failed: ${data.error}`);
  }

  return data;
};

const slack: Connector = {
  authorizeUrl: (state, redirectUri) =>
    `https://slack.com/oauth/v2/authorize?${new URLSearchParams({
      client_id: env("SLACK_CLIENT_ID"),
      redirect_uri: redirectUri,
      state,
      user_scope: "channels:read,channels:history",
    })}`,
  configured: () =>
    Boolean(env("SLACK_CLIENT_ID") && env("SLACK_CLIENT_SECRET")),
  exchange: async (code, redirectUri) => {
    const data = await json<{
      authed_user?: { access_token?: string };
      error?: string;
      ok: boolean;
      team?: { name?: string };
    }>(
      await fetch(`${SLACK}/oauth.v2.access`, {
        body: new URLSearchParams({
          client_id: env("SLACK_CLIENT_ID"),
          client_secret: env("SLACK_CLIENT_SECRET"),
          code,
          redirect_uri: redirectUri,
        }),
        method: "POST",
      }),
      "Slack sign in"
    );
    const token = data.authed_user?.access_token;

    if (!(data.ok && token)) {
      throw new Error(`Slack sign in failed: ${data.error ?? "no token"}`);
    }

    return { accessToken: token, name: data.team?.name };
  },
  sync: async (tokens) => {
    const { channels } = await slackGet<{
      channels: { id: string; is_member?: boolean; name: string }[];
    }>(tokens.accessToken, "conversations.list", {
      exclude_archived: "true",
      limit: "200",
      types: "public_channel",
    });
    const mine = channels
      .filter((channel) => channel.is_member)
      .slice(0, MAX_CHANNELS);

    return Promise.all(
      mine.map(async (channel) => {
        const { messages } = await slackGet<{
          messages: { text?: string }[];
        }>(tokens.accessToken, "conversations.history", {
          channel: channel.id,
          limit: "200",
        });

        return {
          externalId: channel.id,
          // Slack returns newest first, so reverse to read in order.
          text: messages
            .map((message) => message.text?.trim())
            .filter(Boolean)
            .reverse()
            .join("\n"),
          title: `#${channel.name}`,
        };
      })
    );
  },
};

export const connectors = {
  google_drive: googleDrive,
  notion,
  slack,
} satisfies Record<string, Connector>;

export type ConnectorId = keyof typeof connectors;

export const isConnectorId = (value: string): value is ConnectorId =>
  value in connectors;
