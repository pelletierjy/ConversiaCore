# Release Notes: Secure Embed Connection & Observability (002-secure-embed-telemetry)

**Breaking change** — the AI proxy now enforces a per-client credential gate from the moment this ships. There is **no transition window** (clarified decision): any request without a valid credential returns `401 not_authorized`.

## What host apps must do (deploy order matters)

1. **Register the client** (operator): `node tools/conversia-admin/index.js client add --remote-id globalvsthost --label "GlobalVstHost desktop app"` — store the printed `cvk_…` key (shown once).
2. **Release the host app update** that injects `window.conversiaClient = { version: 1, remoteId, key }` at document start (WebView2: `AddScriptToExecuteOnDocumentCreated`). See `contracts/embedder-injection.md`.
3. **Deploy the worker** (`cd worker && npm run deploy`) and set the `ADMIN_TOKEN` secret first (`npx wrangler secret put ADMIN_TOKEN`).

Fielded releases of embedding hosts that predate step 2 will be **refused immediately** after step 3 — this is intended (spec Assumptions + SC-008: hosts resume after a configuration/deployment update).

## Versioning (constitution V)

- **Widget/SPA**: MINOR bump — new optional input (`window.conversiaClient`) and new request headers; the standalone SPA degrades gracefully without the global.
- **Worker**: behaviorally breaking (new gate) even though no route changed — call it out in the tag/release body; rollback = redeploy previous worker version (registry in KV is additive and harmless to older code).
- **Worker CORS**: preflight now also allows `X-Conversia-Client`, `X-Conversia-Key`, `X-Conversia-Attempt` — old hosts that send no credential are unaffected by CORS (they fail at the gate, not the browser).

## Operational additions

- KV namespace `CLIENTS` (`wrangler.toml` binding) stores the client registry.
- `/admin/*` endpoints (enabled only with the `ADMIN_TOKEN` secret) + `tools/conversia-admin` CLI: add/list/show/rotate/revoke-key/revoke + usage.
- Structured JSON logs (Workers Logs, 30-day retention) with `X-Correlation-Id` on every response; platform tracing/OTel export enabled via `[observability]` in `wrangler.toml` (configure the OTLP destination + 30-day retention in the Cloudflare dashboard).
- Per-client rate limits (default ~600 req/min, configurable per client) → `429 rate_limited`.