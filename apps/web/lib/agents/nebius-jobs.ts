import { createSign } from "node:crypto";

const API = "https://api.nebius.cloud/ai/v1/jobs";
const TOKEN_EXCHANGE = "https://auth.eu.nebius.com:443/oauth2/token/exchange";
const TOKEN_LIFETIME = 11 * 60 * 60 * 1000;
const GIB = 1024 ** 3;

const SECRET_KEYS = [
  "DATABASE_URL",
  "NEBIUS_API_KEY",
  "TAVILY_API_KEY",
  "LANGSMITH_API_KEY",
] as const;
const PLAIN_KEYS = ["LANGSMITH_TRACING", "LANGSMITH_PROJECT"] as const;

const env = (name: string) => process.env[name]?.trim() || undefined;

export const nebiusJobsConfigured = () =>
  Boolean(
    env("NEBIUS_PROJECT_ID") &&
      env("NEBIUS_SERVICE_ACCOUNT_ID") &&
      env("NEBIUS_AUTHORIZED_KEY_ID") &&
      env("NEBIUS_PRIVATE_KEY") &&
      env("NEBIUS_AGENT_IMAGE")
  );

const base64url = (value: Buffer | string) =>
  Buffer.from(value).toString("base64url");

let cached: { expires: number; token: string } | null = null;

async function accessToken() {
  if (cached && cached.expires > Date.now()) {
    return cached.token;
  }

  const account = env("NEBIUS_SERVICE_ACCOUNT_ID") ?? "";
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(
    JSON.stringify({ alg: "RS256", kid: env("NEBIUS_AUTHORIZED_KEY_ID"), typ: "JWT" })
  );
  const claims = base64url(
    JSON.stringify({ exp: now + 300, iat: now, iss: account, sub: account })
  );
  // Env-pasted keys often have literal \n instead of line breaks.
  const key = (env("NEBIUS_PRIVATE_KEY") ?? "").replaceAll("\\n", "\n");
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claims}`)
    .sign(key);
  const response = await fetch(TOKEN_EXCHANGE, {
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      subject_token: `${header}.${claims}.${base64url(signature)}`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Nebius token exchange failed: ${response.status} ${await response.text()}`
    );
  }

  const { access_token: token } = (await response.json()) as {
    access_token: string;
  };

  cached = { expires: Date.now() + TOKEN_LIFETIME, token };

  return token;
}

function environment(runId: string) {
  const secret = env("NEBIUS_SECRET_ID");
  const secrets = SECRET_KEYS.flatMap(
    (name): { mysteryboxSecret?: { secretId: string }; name: string; value?: string }[] => {
      if (secret) {
        return [{ mysteryboxSecret: { secretId: secret }, name }];
      }

      const value = env(name);

      return value ? [{ name, value }] : [];
    }
  );
  const plain = PLAIN_KEYS.flatMap((name) => {
    const value = env(name);

    return value ? [{ name, value }] : [];
  });

  return [{ name: "RUN_ID", value: runId }, ...secrets, ...plain];
}

export async function createAgentJob(runId: string) {
  const response = await fetch(API, {
    body: JSON.stringify({
      metadata: {
        name: `nucliva-agent-${runId.slice(0, 8)}-${Date.now().toString(36)}`,
        parentId: env("NEBIUS_PROJECT_ID"),
      },
      spec: {
        disk: { sizeBytes: String(20 * GIB), type: "NETWORK_SSD" },
        environmentVariables: environment(runId),
        image: env("NEBIUS_AGENT_IMAGE"),
        platform: env("NEBIUS_AGENT_PLATFORM") ?? "cpu-d3",
        preset: env("NEBIUS_AGENT_PRESET") ?? "4vcpu-16gb",
        publicIp: true,
        subnetId: env("NEBIUS_SUBNET_ID"),
        // Shortest timeout Nebius allows.
        timeout: "3600s",
      },
    }),
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Nebius job creation failed: ${response.status} ${await response.text()}`
    );
  }

  const operation = (await response.json()) as { resourceId?: string };

  if (!operation.resourceId) {
    throw new Error("Nebius did not say which job it made.");
  }

  return operation.resourceId;
}

export async function agentJobState(jobId: string) {
  const response = await fetch(`${API}/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });

  if (!response.ok) {
    return null;
  }

  const job = (await response.json()) as { status?: { state?: string } };

  return job.status?.state ?? null;
}

export const ENDED_STATES = new Set(["CANCELLED", "COMPLETED", "ERROR", "FAILED"]);
