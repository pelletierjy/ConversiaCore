# Phase 1 Data Model: Secure Embed Connection & Observability

**Feature**: 002-secure-embed-telemetry | **Date**: 2026-10-15

Storage lives in Workers KV (see [research.md R2](./research.md)). All times are ISO-8601 UTC strings.

---

## EmbeddingClient (KV: `clients:<remoteId>`)

A registered host application allowed to use the service (spec Key Entities).

| Field | Type | Rules / validation |
|-------|------|--------------------|
| `remoteId` | string | Primary key. `^[a-z0-9][a-z0-9-]{2,63}$` (lowercase, digits, hyphens; e.g. `globalvsthost`). Immutable once created; reused across requests forever (the "reusable remote_id"). |
| `label` | string | Human-readable description (e.g. `"GlobalVstHost desktop app"`). Free text, ≤ 120 chars. |
| `status` | `"active" \| "revoked"` | Lifecycle state (see transitions below). |
| `credentials` | Credential[] | 1–2 entries; **max 2 active** (clarified FR-006 rotation overlap). At least one must exist while `status = "active"`. |
| `requestLimitPerMinute` | number | ≥ 1, default **600** (clarified FR-007). Operator-tunable at registration and afterwards. |
| `origins` | string[] | Optional defense-in-depth: expected browser origins. Empty = any origin accepted (credential is still required). Never sufficient alone (FR-003). |
| `createdAt` | ISO string | Set at creation. |
| `updatedAt` | ISO string | Last modification (rotate/revoke/limit change). |
| `revokedAt` | ISO string \| absent | Set when `status → revoked`. |

### Credential (embedded in EmbeddingClient)

| Field | Type | Rules |
|-------|------|-------|
| `keyId` | string | Random 8-char id; lets the CLI rotate and revoke *individual* keys and lets logs attribute without exposing the secret. |
| `keyHash` | string | SHA-256 (hex) of the full presented key `cvk_<remoteId>_<32-byte-base64url>`. The plaintext key is shown **once** at issue time and never stored. |
| `issuedAt` | ISO string | — |

**Verification** ([client-auth.ts]): hash the presented `X-Conversia-Key` with SHA-256 (WebCrypto) and compare constant-time against every active credential of the record named by `X-Conversia-Client`. Any mismatch → the same generic `not_authorized` outcome (no oracle).

### State transitions

```
(create) ──────────────► active (1 credential)
active ──rotate────────► active (2 credentials; old keyId kept)
active ──revoke-key────► active (1 credential)          # after fielded app confirmed updated
active ──revoke-client► revoked (0 valid credentials)  # terminal; CLI "add" creates a new record
```

- `revoked` is terminal for the record (re-enabling = new `remoteId` or operator data edit); every presented credential of a `revoked` client → refused + security event (FR-010).
- Revocation visibility: the KV read cache TTL is **30 s** — cache drain (≤ 30 s) plus KV write propagation (typically seconds) stays inside the ≤ 1 minute revocation budget (FR-005, SC-003); admin mutations take effect immediately in the origin, edge isolates drain within the TTL.

---

## UsageCounter (KV: `usage:<remoteId>:<YYYYMMDDHHmm>` + `usage-day:<remoteId>:<YYYYMMDD>`)

Two-tier counters per client powering rate limiting (minute tier) and the usage summary (day tier, FR-009). Minute buckets carry TTL ≈ 2 h; day aggregates carry the 30-day usage retention (clarify Q5 — same window as logs, no long-term aggregates beyond it).

| Field | Type | Meaning |
|-------|------|---------|
| `s` | number | Served requests in this minute |
| `e` | number | Errored requests (upstream/provider failures) in this minute |
| `r` | number | Refused-authorization requests attributed to this remote id |
| `t` | number | Throttled (rate-limited) requests |
| `la` | ISO string | Last activity timestamp (coarse: bucket minute) |

- **Rate check**: `s >= requestLimitPerMinute` → throttle (increment `t` and refuse with `rate_limited`). The limit counts **gate-allowed traffic only** (`s`): refused (`r`) and throttled (`t`) attempts do not consume the budget, so an attacker hammering with a known remote id and bad keys cannot exhaust a legitimate client's allowance.
- **Usage summary** (FR-009): the worker's `/admin/usage?remoteId=X` sums the **day aggregates** across the retention window (default 30 days). The minute buckets exist only for the rate window (2 h TTL); daily aggregates are written alongside every counter update and expire after 30 days — matching the "no long-term aggregates" constraint.
- **KV write caveat**: KV writes are eventually consistent (worst case global convergence seconds); overshoot under attack is bounded and acceptable for a soft limit (research R4).

---

## LogEvent (Workers Logs, schema enforced by `observability.ts`)

One structured JSON line per event (FR-012). Field set is closed — the emitter rejects/redacts anything else (FR-014, FR-018).

| Field | Type | Notes |
|-------|------|-------|
| `ts` | ISO string | Event time |
| `level` | `"info" \| "warn" \| "error"` | Security events use `warn`/`error` (FR-013) |
| `event` | enum | `request_served`, `request_refused`, `request_throttled`, `request_errored`, `client_registered`, `client_rotated`, `client_revoked`, `usage_report` |
| `correlationId` | string | UUIDv4 minted at request receipt (FR-011) |
| `remoteId` | string \| `"unknown"` | Client attribution (FR-009) |
| `route` | string | e.g. `/gemini/chat` |
| `origin` | string \| absent | Claimed Origin header |
| `outcome` | `"served" \| "refused" \| "throttled" \| "errored"` | — |
| `status` | number | HTTP status returned |
| `durationMs` | number | — |
| `provider` | string \| absent | e.g. `gemini` |
| `fallbackCount` | number \| absent | Provider fallback chain depth used |
| `errorKind` | string \| absent | Coarse failure class (`origin_not_allowed`, `not_authorized`, `rate_limited`, `upstream_error`, …) — never message content |

**Forbidden** (asserted by unit test): message/chat content, `Authorization`-style secrets, plaintext keys, API key values.

## Telemetry attributes (traces)

Platform automatic tracing supplies spans; the log events above (correlated by the platform) carry the domain dimensions: `conversia.remote_id`, `conversia.route`, `conversia.outcome`, `conversia.provider`, `conversia.fallback_count`. Custom metrics are emitted today as counter **log events** (`event=request_served` etc. with the dimension fields) and map 1:1 to OTel counters once Cloudflare ships native metrics export (research R6).

---

## Relationships

```
EmbeddingClient 1──* Credential
EmbeddingClient 1──* UsageCounter          (one per minute bucket, TTL-bound)
LogEvent.remoteId ──► EmbeddingClient.remoteId   (or "unknown")
Traces ◄── correlated ── LogEvent               (platform-side, by correlationId)
```

No cross-entity transactions are required; every entity is independently readable/writable in KV.
