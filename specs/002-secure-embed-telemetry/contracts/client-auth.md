# Contract: Worker Client-Authorization (client-auth)

**Feature**: 002-secure-embed-telemetry | **Covers**: FR-001…FR-007, FR-020, SC-001…SC-003

## Request contract (widget → worker)

Every `POST` to any AI-proxy route (`/gemini/chat`, `/gemini/embed`, `/groq/chat`, `/openrouter/chat`, `/deepseek/chat`, `/huggingface/chat`) MUST include:

```http
X-Conversia-Client: <remoteId>          # e.g. globalvsthost
X-Conversia-Key:    <key>               # cvk_<remoteId>_<random>, shown once at issue
Content-Type: application/json
Origin: <host app origin>               # still required; allowlist unchanged (defense in depth)
```

Optional informational header (never used for authorization): `X-Conversia-Attempt: <n>` — the widget orchestrator's attempt number within a provider fallback chain; logged as `fallbackCount = n − 1`.

## Evaluation order (worker)

1. **Origin allowlist** (existing `ALLOWED_ORIGINS_EXACT` + localhost) → else `403 {"error":"origin_not_allowed"}` (unchanged behavior).
2. **Credential** — headers present, remoteId matches `^[a-z0-9][a-z0-9-]{2,63}$`, record exists, `status = "active"`, SHA-256 hash of presented key matches one active credential (constant-time), optional `origins` entry matches claimed Origin → else `401 {"error":"not_authorized"}` (single generic error for *all* failure modes; no oracle).
3. **Rate limit** — per-client minute bucket < `requestLimitPerMinute` → else `429 {"error":"rate_limited"}` + `request_throttled` security event.
4. Handler executes normally (unchanged provider behavior).

## Preflight

`OPTIONS` responses gain `Access-Control-Allow-Headers: Content-Type, X-Conversia-Client, X-Conversia-Key` and keep `Vary: Origin`. Allowed origins unchanged.

## Error semantics

| Status | Body | Logged as |
|--------|------|-----------|
| 403 `origin_not_allowed` | generic | `request_refused` (warn) |
| 401 `not_authorized` | generic, identical for missing/malformed/unknown/revoked/bad-key | `request_refused` (warn) + `remoteId` when parseable |
| 429 `rate_limited` | generic | `request_throttled` (warn) |

Error bodies never distinguish failure causes. Widget maps 401 → "This assistant isn't authorized in this app" (friendly, non-technical) and 429 → "Please slow down".

## Revocation / rotation semantics

- Revocation effective within ≤ 30 s of cache drain plus KV write propagation (typically seconds) — inside the one-minute budget (FR-005/SC-003); the registry read cache TTL is 30 s per isolate.
- Rotation: the new key is valid immediately; the old key stays valid until explicitly revoked (`keyId`-level revocation), max 2 active keys per client.

## Versioning

Header names are stable; adding headers is non-breaking, renaming/removing is a MAJOR (semver, constitution V).
