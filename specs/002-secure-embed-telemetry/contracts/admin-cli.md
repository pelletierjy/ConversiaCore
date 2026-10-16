# Contract: Admin CLI + Admin Endpoints

**Feature**: 002-secure-embed-telemetry | **Covers**: FR-005, FR-006, FR-008, FR-009

## CLI (`tools/conversia-admin/`)

Constitution Principle II: args/stdin → stdout, errors → stderr, JSON by default, `--human` for readable output. Exit codes: `0` ok, `1` validation error, `2` auth failure (bad/missing `CONVERSIA_ADMIN_TOKEN`), `3` upstream/service error.

```text
conversia-admin client add    --remote-id <id> [--label <s>] [--limit <rpm>] [--origin <url>]...
conversia-admin client list
conversia-admin client show   --remote-id <id>
conversia-admin client rotate --remote-id <id>            # issues 2nd key, prints it once
conversia-admin client revoke-key --remote-id <id> --key-id <kid>
conversia-admin client revoke --remote-id <id>            # terminal, per data-model
conversia-admin usage         --remote-id <id> [--days <n>]
```

JSON envelope (stdout):

```json
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": { "code": "not_found", "message": "…" } }
```

Secrets policy: `rotate`/`add` print the plaintext key exactly once to stdout; nothing else stores or echoes it. Token from `CONVERSIA_ADMIN_TOKEN` env var (never CLI args — avoid process-list leakage).

## Admin endpoints (worker)

All under `/admin/*`, `POST`/`GET`, JSON. Guard: constant-time compare of `X-Admin-Token` header against the `ADMIN_TOKEN` worker secret; if unset, all `/admin/*` → `503 {"error":"not_configured"}` (safe default). Not CORS-restricted for browser use — operator-only, token-required (no browser surface; do not call from web pages).

| Endpoint | Body/Query | Result |
|----------|-----------|--------|
| `POST /admin/clients` | `{remoteId, label?, requestLimitPerMinute?, origins?}` | creates record; 409 if exists |
| `GET /admin/clients` | — | list (no key hashes) |
| `GET /admin/clients/:remoteId` | — | full record (hashes included; operator-only) |
| `POST /admin/clients/:remoteId/rotate` | — | adds credential, returns `{keyId, key}` (key once) |
| `POST /admin/clients/:remoteId/keys/:keyId/revoke` | — | removes one credential (400 if last active) |
| `POST /admin/clients/:remoteId/revoke` | — | status → revoked (terminal) |
| `GET /admin/usage?remoteId=&days=` | — | `{served, errored, refused, throttled, lastActivity, perDay:[…]}` |

All admin mutations emit `client_registered` / `client_rotated` / `client_revoked` / `usage_report` log events (FR-013).

## Versioning

Endpoint paths and envelope are stable contracts; additive fields are non-breaking, removals/renames are MAJOR.
