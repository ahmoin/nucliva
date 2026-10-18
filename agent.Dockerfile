# The suite agent as a Nebius Serverless AI job. It does one run, given in
# RUN_ID, and stops. Build it from the root of the repository:
#
#   docker build -f agent.Dockerfile -t <registry>/nucliva-agent:latest .
FROM node:20-slim

WORKDIR /app

RUN corepack enable && npm install --global tsx@4.19.2

COPY . .

RUN pnpm install --frozen-lockfile --filter "web..."

WORKDIR /app/apps/web

CMD ["tsx", "scripts/agent-run.mts"]
