# Implementation Plan: Secure Embed Connection & Observability

**Branch**: `002-secure-embed-telemetry` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-secure-embed-telemetry/spec.md`

## Summary

Gate every AI-proxy request on the Cloudflare Worker behind a per-client credential (reusable `remote_id` + secret key) stored in Workers KV, so only operator-registered embedding hosts (GlobalVstHost first) can use the service — enforced immediately, with no end-user accounts. Embedding hosts deliver the credential to the widget by runtime injection through the embedded-browser bridge (a `window.conversiaClient` global), never via URLs or baked into bundles. The operator manages clients (issue / list / rotate with two overlapping keys / revoke) through a small CLI that calls admin endpoints on the worker. Observability rides Cloudflare's platform: structured JSON logs via Workers Logs (30-day retention, no chat content) plus OpenTelemetry trace export configured in `wrangler.toml`, with per-client attribution via the `remote_id` attribute; custom counters are emitted as structured counter logs because native OTel metrics export is not yet supported.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict) — both the widget (`src/`) and the worker (`worker/src/`)

**Primary Dependencies**: Cloudflare Workers runtime (`nodejs_compat`), Workers KV binding, Workers Logs + platform OTel export (config-driven, no new runtime deps), Vitest + jsdom; widget keeps its zero-framework design

**Storage**: Workers KV — `clients:*` registry records (small, read-heavy, global) and `usage:<remoteId>:<bucket>` rolling counters with TTL; no new database

**Testing**: Vitest (`pnpm test`, `tests/unit/**`) for widget and worker pure modules; contract/integration validation via `wrangler dev` + scripted HTTP checks per `quickstart.md` (constitution: TDD + integration tests for contracts)

**Target Platform**: Cloudflare Workers (edge), browser widget (incl. WebView2 hosts), Node CLI for administration

**Project Type**: web-service (Worker proxy) + embeddable widget library + operator CLI

**Performance Goals**: added authorization + observability overhead < 100 ms p95 per request (SC-006 — measured by a dedicated task in tasks.md Phase 6); registry lookups cached per isolate (30 s TTL, tighter than the 60 s pattern in `host-config.ts`, to keep revocation inside the one-minute budget)

**Constraints**: no chat content / API keys / credentials in logs or telemetry; immediate enforcement at deploy; per-client default limit ~600 req/min configurable at registration; up to two active keys per client during rotation; usage/log retention default 30 days

**Scale/Scope**: a handful of registered embedding clients (single digits to dozens), thousands of proxy requests/day; operator is a single person using the CLI

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* — **PASS (re-checked after design, still PASS)**

| Principle | Verdict | Evidence |
|-----------|---------|----------|
| I. Widget-First Library Design | ✅ | Credential loader is a standalone `src/services/client-identity.ts` module with a documented public contract ([contracts/embedder-injection.md](./contracts/embedder-injection.md)); auth middleware is a self-contained worker module |
| II. CLI Protocol & Structured I/O | ✅ | The admin CLI required by FR-008 is exactly this shape: stdin/args → stdout (JSON + human modes), errors → stderr, non-zero exit codes ([contracts/admin-cli.md](./contracts/admin-cli.md)) |
| III. Test-First (NON-NEGOTIABLE) | ✅ (process) | `/speckit.tasks` must emit failing tests before implementation for: credential validation, rotation/revocation, rate limiting, log schema, injection contract |
| IV. Integration Testing for Contracts | ✅ | New/changed contracts covered: worker auth endpoints, admin endpoints, widget↔worker headers, embedder injection global — see [quickstart.md](./quickstart.md) |
| V. Versioning & Observability | ✅ | Widget gets a MINOR semver bump (new optional injection contract + new required headers = coordinated host release, no API break for the SPA itself; worker change is a breaking gate → documented in release notes); structured logging is the feature's core; YAGNI applied: KV not D1, platform OTel export not a custom pipeline |

No violations → no Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/002-secure-embed-telemetry/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── client-auth.md             # Worker auth contract (headers, errors, CORS)
│   ├── embedder-injection.md      # window.conversiaClient host→widget contract
│   ├── admin-cli.md               # CLI + admin endpoint schema
│   └── observability.md           # Log event schema + telemetry attribute rules
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
worker/
├── src/
│   ├── index.ts                    # route table + origin allowlist (modified)
│   ├── client-auth.ts              # NEW: credential verification, rotation, revocation
│   ├── credential-utils.ts         # NEW: key generation, SHA-256 hashing, constant-time compare
│   ├── client-registry.ts          # NEW: KV access, caching, CLI-facing mutations
│   ├── rate-limit.ts               # NEW: per-client fixed-window counters
│   ├── admin-api.ts                # NEW: /admin/* endpoints (ADMIN_TOKEN guarded)
│   ├── usage.ts                    # NEW: per-client usage aggregation from counter buckets
│   ├── observability.ts            # NEW: correlation ids, structured log emitter
│   └── *.ts (existing provider handlers, unchanged)
└── wrangler.toml                   # + KV binding, observability/OTel export config

src/
├── services/
│   ├── client-identity.ts          # NEW: reads window.conversiaClient, exposes remoteId+key
│   └── worker-client.ts            # modified: attach auth headers, map 401/429 to typed errors
└── config.ts                       # modified: expose client identity

tools/
└── conversia-admin/                # NEW: operator CLI (Node, zero-dep, JSON envelope)

tests/
├── unit/                           # auth, registry, rate-limit, identity loader, log schema
└── contract/                       # worker endpoint contract checks (against wrangler dev)
```

**Structure Decision**: extend the existing two-package layout (root widget/SPA + `worker/`) rather than introducing new packages; the only new top-level directory is `tools/conversia-admin/` for the constitution-mandated CLI.

## Complexity Tracking

No constitution violations to justify.
