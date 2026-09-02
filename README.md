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
- API: http://localhost:8000 (health check at `/api/health`, search at `/api/search?q=...&page=1`)

In development, Vite proxies `/api/*` to the Express server, so the frontend can call the API with relative URLs.

If `JACKETT_API_KEY` is empty, `/api/search` serves captured results from `apps/api/fixtures/` so the UI can be developed without a running Jackett instance.

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
