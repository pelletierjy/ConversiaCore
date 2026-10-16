# Phase 0 Research: Secure Embed Connection & Observability

**Feature**: 002-secure-embed-telemetry | **Date**: 2026-10-15

All Technical Context unknowns resolved. Each decision lists Decision / Rationale / Alternatives.

---

## R1 — Where to enforce client authorization

**Decision**: Enforce exclusively in the Cloudflare Worker (the AI proxy). The widget merely forwards the credential it was given; the browser bundle is public and fully untrusted.

**Rationale**: The widget SPA is served from static hosting and can be copied/rebuilt by anyone; only the worker holds leverage (the provider keys behind it). FR-003 demands service-side verification. The existing origin allowlist already lives there, so the gate slots into the same chokepoint.

**Alternatives considered**: (a) Widget-side gating only — useless, the bundle is public; (b) Firebase-issued tokens for widget users — rejected, spec forbids end-user accounts; (c) mTLS client certificates — rejected, far beyond "keep the connection simple".

---

## R2 — Client registry storage

**Decision**: Cloudflare Workers KV (`CLIENTS` namespace binding), records keyed `clients:<remoteId>`, with a 30 s per-isolate cache.

**Rationale**: A handful of tiny, read-heavy records accessed on every request — the exact "configuration data" use case Cloudflare recommends KV for. No new database, no connection plumbing, globally low-latency reads, TTL support for usage counters. Caching mirrors the existing `host-config.ts` pattern but uses a tighter **30 s** TTL so cache drain plus KV propagation stays inside the one-minute revocation budget (FR-005/SC-003).

**Alternatives considered**: (a) D1 — relational power unneeded for ≤ dozens of rows; adds a database to operate; (b) Durable Objects — strong consistency only matters for rate-limit exactness, cost/complexity too high; (c) Firestore — the worker doesn't talk to Firebase today and shouldn't start; the client would gain a second trust domain; (b) hard-coded `wrangler.toml` var — fails FR-005/FR-006 (revocation/rotation without redeploy).

---

## R3 — Credential format and validation

**Decision**: Per-client key of the form `cvk_<remoteId>_<32-byte-random-base64url>`; the registry stores only the SHA-256 hash (via WebCrypto, built into Workers). Requests carry `X-Conversia-Client: <remoteId>` + `X-Conversia-Key: <key>` headers. Missing/malformed/unknown/revoked all collapse into one generic `401 {error:"not_authorized"}`; hash comparison is constant-time.

**Rationale**: The key embeds its remote id, making leaked keys self-attributing in incident response while the hash-at-rest means a KV leak alone doesn't allow impersonation. Bearer-over-TLS matches the clarified threat model (deterrence + attribution + revocation, spec FR-004). Headers (not URL) keep keys out of logs, history, and referrers (FR-020 decision).

**Alternatives considered**: (a) Per-request HMAC signatures — marginally stronger against replay, but TLS already defeats network replay and the secret is extractable anyway; adds client-side complexity for little gain (declined at Q1 of the specify session); (b) JWTs with expiry — introduces expiry/refresh UX the spec doesn't want; (c) plaintext keys in KV — unnecessary exposure.

---

## R4 — Per-client rate limiting

**Decision**: Fixed-window counters in KV: key `usage:<remoteId>:<YYYYMMDDHHmm>` incremented per request, TTL ~2 h, compared against the per-client `requestLimitPerMinute` stored in the registry record (default 600, burst-friendly by nature of per-minute windows). Over-limit → `429 {error:"rate_limited"}` + security log.

**Rationale**: FR-007 requires the limit to be configurable *per client at registration*; KV counters read that value straight from the record with zero extra infra. Eventual consistency of KV writes is acceptable for abuse protection (a compromised key bursting briefly may overshoot — attribution + revocation are the real controls). One counter write per request is cheap at this scale.

**Alternatives considered**: (a) Cloudflare Rate Limiting API — native and precise, but its thresholds are defined per binding in config, not per client at runtime, so it can't satisfy per-client configurability without one rule per client; (b) Durable Objects — exact counters, but a whole new stateful abstraction for a soft limit (violates YAGNI); (c) in-isolate counters only — reset on isolate recycling, trivially bypassed.

---

## R5 — Structured logging mechanism

**Decision**: One `console.log(JSON.stringify(event))` per request lifecycle event through a typed emitter (`observability.ts`), consumed by **Workers Logs** with the retention setting pinned to 30 days in the worker's observability config. Live debugging via `wrangler tail`; investigation via the dashboard Query Builder. Logpush/Tail Worker export deferred until verified need (YAGNI).

**Rationale**: FR-012/FR-015 satisfied with zero new code paths — Workers Logs is exactly "structured, machine-readable, bounded retention, rotated (Cloudflare manages ingestion)". The single emitter guarantees the schema and the FR-014 redaction rule (no message content, keys, or credentials) in one place.

**Alternatives considered**: (a) Third-party log SaaS from day one — adds cost/dependency before need; (b) writing logs to KV/R2 — reimplements what the platform gives free; (c) unstructured `console.log` sprinkled around — fails FR-012.

---

## R6 — OpenTelemetry mechanism

**Decision**: Use Cloudflare's **platform-native OTel support**: enable `observability` (traces + logs) in `wrangler.toml` and configure an OTLP export destination in the dashboard/wrangler config. Automatic request tracing covers spans and timing; the worker adds domain attributes (remote id, route, outcome, provider, fallback count) via the structured log events which the platform correlates to traces. Custom metrics (`requests_total`, `auth_failures_total`, `provider_fallback_total`, `throttle_total`) are emitted as structured **counter log events** until Cloudflare supports native metrics export.

**Rationale**: FR-016/FR-019 — exportable to any OTLP endpoint "without changing application code" is literally the platform feature (GA export; automatic tracing in beta as of late 2025). Observability-backend outage cannot affect requests (FR-019) because export is out-of-band by design. Zero OTel SDK dependencies in the worker bundle.

**Alternatives considered**: (a) Hand-rolled `@opentelemetry/*` SDK in the worker — custom span lifecycle, serialization and batching code in an edge runtime that the platform already instruments; (b) metrics-only SaaS agent — rejected, OTel-compatible export is explicitly required; (c) waiting for native metrics export — counter logs cover the gap now with the same schema.

---

## R7 — Admin/management interface (FR-008)

**Decision**: `tools/conversia-admin/` Node CLI speaking JSON to new `/admin/*` worker endpoints guarded by an `ADMIN_TOKEN` worker secret. Endpoints: list/add/show/rotate/revoke clients + usage summary. CLI supports `--json` (default) and human-readable output, exit codes per contract.

**Rationale**: The constitution (Principle II) mandates CLI + structured I/O; the clarify session confirmed CLI (FR-008). A single operator with a handful of clients needs scriptable control, not an admin UI. Admin endpoints live in the same worker → direct KV access, one deploy surface.

**Alternatives considered**: (a) Admin UI page in the SPA — more UI work, and admin auth becomes a new security surface; (b) `wrangler kv` commands only — no validation, no rotation semantics, easy to fat-finger; (c) separate admin worker — second deploy surface for no isolation gain.

---

## R8 — Credential delivery to the widget (clarified decision, FR-020)

**Decision**: The embedding host injects `window.conversiaClient = { remoteId, key, version: 1 }` into the page **before widget scripts run** (WebView2: `AddScriptToExecuteOnDocumentCreated` / `ExecuteScript` at document start). `src/services/client-identity.ts` reads it once; missing/invalid shape → widget loads but all proxy calls fail with a friendly "assistant not configured" message. The widget ignores credentials in URL parameters.

**Rationale**: Matches the clarify-session decision (runtime injection), keeps keys out of URLs, and works for both the standalone SPA and the `<conversia-app>` widget with one contract. A version field allows future evolution.

**Alternatives considered**: postMessage handshake — two-way protocol and origin bookkeeping for no security gain at this maturity; per-client builds — rejected at clarify (weakens deterrence).

---

## R9 — Rollout / migration sequencing (clarified decision)

**Decision**: Immediate enforcement at worker deploy (clarify Q1 = B). Safe deploy order: (1) register the `GlobalVstHost` client via CLI, (2) release the GlobalVstHost app update that injects the credential, (3) verify old releases are expendable, (4) deploy the gated worker. The spec explicitly accepts that fielded old releases are refused from step 4 onward.

**Rationale**: The user chose immediate enforcement knowing legacy embeds break; sequencing just minimizes the window of confusion. SC-008 ("resume after at most a configuration/deployment update") is satisfied by the GlobalVstHost release.

**Alternatives considered**: (a) grace window — explicitly declined at clarify; (b) dual-mode worker flag — transitional complexity the spec no longer needs.

---

## R10 — CORS / preflight for the new headers

**Decision**: The custom `X-Conversia-Client` / `X-Conversia-Key` headers are added to the existing CORS policy: `Access-Control-Allow-Headers` on preflight (OPTIONS) responses and `Vary: Origin` retained. Origin allowlist stays as defense in depth (spec assumption); refusal order: origin → credential → rate limit.

**Rationale**: Browsers preflight any non-simple header, so the widget's existing `postToWorker` path must be able to succeed; keeping origin checks first preserves current behavior for disallowed origins (no credential probing signals).

**Alternatives considered**: (a) Bearer `Authorization` header — also triggers preflight and collides with future provider-auth semantics; custom headers keep the contract self-describing.

---

## Open questions resolved

None remaining — every Technical Context field and spec clarification maps to a decision above (R1–R10).
