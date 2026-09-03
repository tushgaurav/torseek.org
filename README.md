# torseek

A rewrite of [torseek](https://www.tushgaurav.com/projects/torseek), a torrent search client backed by Jackett, this time as a Node/TypeScript monorepo.

## Structure

```
torseek/
├── apps/
│   ├── api/   # Express server (@torseek/api)
│   └── web/   # Vite + React frontend (@torseek/web)
├── packages/  # shared workspace packages (empty for now)
└── package.json
```

Managed as a [Bun workspace](https://bun.sh/docs/install/workspaces).

## Getting started

Requires [Bun](https://bun.sh) 1.3+.

```bash
bun install
cp apps/api/.env.example apps/api/.env
bun run dev
```

- Web: http://localhost:5173
- API: http://localhost:8000 (health check at `/api/health`, search at `/api/search?q=...&page=1&sort=seeders_desc&cat=2000&indexers=1337x,thepiratebay`)

In development, Vite proxies `/api/*` to the Express server, so the frontend can call the API with relative URLs.

If `JACKETT_API_KEY` is empty, `/api/search` serves captured results from `apps/api/fixtures/` so the UI can be developed without a running Jackett instance.

## Running Jackett

Search results come from [Jackett](https://github.com/Jackett/Jackett), which proxies dozens of torrent indexers behind one API. The repo ships a `docker-compose.yml` that runs it next to the API.

```bash
docker compose up -d jackett
```

1. Open http://localhost:9117. Set an admin password (top right) on first visit.
2. Click **Add indexer**, pick the indexers you want (public ones need no credentials), and save.
3. Copy the **API Key** shown at the top of the dashboard, or read it from the container:

   ```bash
   docker compose exec jackett cat /config/Jackett/ServerConfig.json
   ```

4. Put it in `apps/api/.env` as `JACKETT_API_KEY=...` and restart `bun run dev:api`.

Jackett only generates the key on first boot; there is no environment variable to preset it. The port is bound to `127.0.0.1` on purpose: the API key grants full admin access, so Jackett must never be reachable from outside the machine. The torseek API is the only client.

`GET /api/status` reports whether the API can reach Jackett and how many indexers are configured. `GET /api/indexers` lists them.

Some indexers sit behind Cloudflare and need [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr). It is included as an opt-in profile:

```bash
docker compose --profile flaresolverr up -d
```

Then set **FlareSolverr API URL** to `http://flaresolverr:8191` under Jackett settings.

### Production

The `prod` profile builds the API into the same stack, where it reaches Jackett over the internal network as `http://jackett:9117`:

```bash
JACKETT_API_KEY=... CORS_ORIGIN=https://your-site docker compose --profile prod up -d --build
```

Jackett stays bound to loopback on the host; reach its admin UI over an SSH tunnel (`ssh -L 9117:127.0.0.1:9117 host`). The API container listens on `127.0.0.1:8000`; the public entry point is the `caddy` service, which terminates TLS for `API_DOMAIN` (e.g. `api.torseek.org`) with an automatically issued Let's Encrypt certificate and proxies to the API over the compose network. Its config lives in `deploy/Caddyfile`.

To point a domain at the host:

1. Allocate an Elastic IP and associate it with the instance, so the address survives stop/start.
2. Add a DNS `A` record for `api.torseek.org` (or your domain) to that IP.
3. Open inbound TCP 80 and 443 (and UDP 443 for HTTP/3, optional) in the instance's security group. Port 80 is required for the ACME challenge even though traffic is redirected to HTTPS.
4. Set `API_DOMAIN=api.torseek.org` and `CORS_ORIGIN=https://torseek.org` (the origin the frontend is served from) in the root `.env` on the VM.

`curl https://api.torseek.org/api/health` should return 200 within a few seconds of Caddy starting.

### Deploying the API from CI

`.github/workflows/deploy-api.yml` runs on every push to `main` that touches the API. It builds `apps/api/Dockerfile` on the runner, pushes it to GHCR as `ghcr.io/<owner>/<repo>/api:<sha>`, then ssh-es into the VM, copies `docker-compose.yml` and `deploy/Caddyfile`, writes `API_IMAGE=<that tag>` into the VM's `.env`, and runs `docker compose --profile prod pull && up -d --no-build api caddy` followed by a Caddy config reload. The run fails if the API container does not report healthy within about two minutes. Trigger it by hand from the Actions tab (`workflow_dispatch`) for a redeploy without a code change.

One-time VM setup:

1. Install Docker (with the compose plugin) and add the deploy user to the `docker` group.
2. Create the deploy directory (default `/opt/torseek`) with a `.env` containing at least:

   ```
   JACKETT_API_KEY=...
   API_DOMAIN=api.torseek.org
   CORS_ORIGIN=https://torseek.org
   ```

   Compose reads this file automatically; CI appends `API_IMAGE=` to it on each deploy. Start Jackett once (`docker compose up -d jackett`) to generate the API key.
3. Generate a dedicated ssh key pair (`ssh-keygen -t ed25519 -f deploy_key -N ""`) and add the public half to the deploy user's `~/.ssh/authorized_keys`.

Repository secrets (Settings → Secrets and variables → Actions, or scoped to the `production` environment):

| Name                 | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| `DEPLOY_HOST`        | Public IP or hostname of the VM                              |
| `DEPLOY_USER`        | The ssh user (must be in the `docker` group)                 |
| `DEPLOY_SSH_KEY`     | Contents of the private `deploy_key`                         |
| `DEPLOY_KNOWN_HOSTS` | Optional. Output of `ssh-keyscan -H <host>`; if unset, CI trusts the host key on first connect |

Optional variable `DEPLOY_PATH` overrides the deploy directory. The image is pulled on the VM with the workflow's own `GITHUB_TOKEN`, so no registry credentials need to live on the box. If the VM is a Graviton instance, change `platforms` in the workflow to `linux/arm64`.

## Frontend

`apps/web` is a Vite + React SPA styled with Tailwind v4 and [shadcn/ui](https://ui.shadcn.com) (`bunx shadcn@latest add <component>` from `apps/web` to add more). Routing is `react-router`, theming is `next-themes` (dark by default), icons are `lucide-react`.

```
src/
├── pages/         # home, search, not-found
├── layouts/       # app shell (nav + footer + toaster)
├── components/
│   ├── ui/        # shadcn primitives
│   ├── shared/    # nav-bar, footer, mode-toggle, page
│   ├── home/      # doodle
│   └── search/    # search-bar, result card, buttons, empty state
├── content/       # site copy and menu structure
└── lib/           # api client, utils
```

## Scripts

Run from the repo root:

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `bun run dev`       | Start api and web together         |
| `bun run dev:api`   | Start only the Express server      |
| `bun run dev:web`   | Start only the Vite dev server     |
| `bun run build`     | Build all apps                     |
| `bun run typecheck` | Typecheck all apps                 |
| `bun run lint`      | Lint (oxlint in web)               |

Or target a single workspace: `bun run --filter @torseek/api dev`.

## Environment

See `apps/api/.env.example`. Bun loads `.env` files automatically; no `dotenv` needed.
