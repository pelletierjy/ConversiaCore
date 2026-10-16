# Tasks: Secure Embed Connection & Observability

**Input**: Design documents from `/specs/002-secure-embed-telemetry/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the constitution (Principle III, NON-NEGOTIABLE) and plan.md mandate TDD: every test task below is written and confirmed FAILING before its implementation task. Automated contract tests (T012, T020) satisfy Principle IV (integration testing for inter-service contracts).

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and delivered independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Root widget/SPA package (`src/`, `tests/`) + separate `worker/` package (`worker/src/`) + new operator CLI (`tools/conversia-admin/`), per plan.md Structure Decision. Note: `worker/` is an npm package with its own lockfile — never regenerate lockfiles of either manager (AGENTS.md).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Storage binding and file scaffolding shared by every story

- [X] T001 Create the `CLIENTS` KV namespace (`cd worker && npx wrangler kv namespace create CLIENTS`) and add the `[[kv_namespaces]]` binding with id to `worker/wrangler.toml` per specs/002-secure-embed-telemetry/data-model.md
- [X] T002 [P] Scaffold stub files per plan.md Source Code tree: `worker/src/client-registry.ts`, `worker/src/client-auth.ts`, `worker/src/credential-utils.ts`, `worker/src/rate-limit.ts`, `worker/src/admin-api.ts`, `worker/src/usage.ts`, `worker/src/observability.ts`, `tools/conversia-admin/index.js`, `tests/unit/worker/`, `tests/contract/` (empty exports only; `npx tsc -b` must stay green)
- [X] T003 [P] Document new environment setup in `worker/wrangler.toml` comments and root `.env.example`: `ADMIN_TOKEN` worker secret (`wrangler secret put ADMIN_TOKEN`), CLI env vars `CONVERSIA_ADMIN_TOKEN` + `CONVERSIA_WORKER_URL`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The structured logger and the client registry primitives that both the auth gate (US1) and the management CLI (US2) build on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Write failing unit tests for the structured log emitter: closed LogEvent schema, required fields (incl. `durationMs`), correlationId presence, redaction guard refusing forbidden fields (message content, keys, tokens) — `tests/unit/worker/observability.test.ts` per contracts/observability.md and data-model.md § LogEvent
- [X] T005 [P] Write failing unit tests for registry/credential primitives: remoteId regex `^[a-z0-9][a-z0-9-]{2,63}$`, record validation (limit ≥ 1, max 2 credentials), `cvk_<remoteId>_<random>` key generation, SHA-256 hash match/mismatch, constant-time compare behavior, 30 s read-cache expiry/invalidation — `tests/unit/worker/client-registry.test.ts`
- [X] T006 Implement `worker/src/observability.ts`: `logEvent(event, fields)` emitting one `console.log(JSON.stringify(evt))`, UUIDv4 correlation ids, closed-schema validation, redaction refusal (make T004 pass)
- [X] T007 [P] Implement `worker/src/client-registry.ts`: `EmbeddingClient`/`Credential` types per data-model.md, KV read through a `CLIENTS` namespace interface with **30 s** per-isolate cache (revocation budget, FR-005/SC-003), record validation (make T005 validation/cache tests pass)
- [X] T008 [P] Implement `worker/src/credential-utils.ts`: key generation (`cvk_…`, 32-byte base64url), SHA-256 via WebCrypto, constant-time comparison (make T005 crypto tests pass)

**Checkpoint**: Logger + registry + credential primitives green — US1 and US2 can now start in parallel

---

## Phase 3: User Story 1 - Only approved embedding clients get service (Priority: P1) 🎯 MVP

**Goal**: The worker refuses every request lacking a valid client credential (immediate enforcement), rate-limits per client, and the widget authenticates via the injected `window.conversiaClient` global — no end-user accounts anywhere.

**Independent Test**: Call the AI proxy with no credential (401), a fabricated credential (401, identical body), and a valid credential (200) — while an end user chats through a widget with an injected credential with no sign-in prompt. See quickstart scenarios 1–4, 7, 11.

### Tests for User Story 1 (TDD — write FIRST, confirm FAIL)

- [X] T009 [P] [US1] Failing unit tests for authorization evaluation: origin→credential→rate-limit precedence, generic `not_authorized` for missing/malformed/unknown/revoked/bad-key (identical bodies), `origins` field as defense-in-depth only — `tests/unit/worker/client-auth.test.ts` per contracts/client-auth.md
- [X] T010 [P] [US1] Failing unit tests for per-client fixed-window rate limiting: bucket key format `usage:<remoteId>:<YYYYMMDDHHmm>`, limit from record (default 600), over-limit → throttled + `t` counter, TTL — `tests/unit/worker/rate-limit.test.ts` per data-model.md § UsageCounter
- [X] T011 [P] [US1] Failing unit tests for the widget identity loader: valid global accepted, missing/invalid shape → degraded mode, `version !== 1` → console warning + degraded, URL-supplied credentials ignored — `tests/unit/client-identity.test.ts` per contracts/embedder-injection.md
- [X] T012 [P] [US1] Failing **automated contract tests** for the worker gate through the router-level `fetch` handler (mocked env + KV): full request path with origin allowlist → credential → rate limit, CORS preflight grants the two `X-Conversia-*` headers, `X-Correlation-Id` response header present, `X-Conversia-Attempt` optional header accepted and never used for authorization — `tests/contract/worker-gate.test.ts` per contracts/client-auth.md (constitution Principle IV)

### Implementation for User Story 1

- [X] T013 [US1] Implement `worker/src/client-auth.ts`: `verifyCredential(headers, env, origin)` — hash-and-compare against the registry record, constant-time, one generic failure outcome; emits `request_refused` security event via T006 logger (make T009 pass)
- [X] T014 [US1] Implement `worker/src/rate-limit.ts`: `checkAndIncrement(remoteId, limitPerMinute, kv)` per data-model.md (make T010 pass); emits `request_throttled` events
- [X] T015 [US1] Wire the gate into `worker/src/index.ts` in order origin allowlist → credential → rate limit; add `Access-Control-Allow-Headers: Content-Type, X-Conversia-Client, X-Conversia-Key` on OPTIONS preflight; return `X-Correlation-Id` on every response; wrap handler in correlation-id context and capture `durationMs` (make T012 pass)
- [X] T016 [P] [US1] Implement `src/services/client-identity.ts`: read/validate `window.conversiaClient` once at startup, expose `getClientIdentity(): { remoteId, key } | null` (make T011 pass)
- [X] T017 [US1] Update `src/services/worker-client.ts`: attach `X-Conversia-Client`/`X-Conversia-Key` from client-identity and the orchestrator attempt number as `X-Conversia-Attempt`; map 401 → "not authorized in this app" and 429 → "please slow down" messages through `src/i18n/translations.ts` (en/fr/es) surfaced in the chat UI

**Checkpoint**: US1 fully functional — an unknown embedding client is refused; the widget with injected credential chats end-to-end

---

## Phase 4: User Story 2 - Reusable client identifier for tracking and control (Priority: P2)

**Goal**: Operator issues/rotates/revokes clients via CLI with per-client usage attribution (remote id on every request, revocation inside the one-minute budget).

**Independent Test**: Register two clients, generate traffic from both, confirm `/admin/usage` attribution per remote id, revoke one and confirm refusal within ~30 s while the other keeps working. Quickstart scenarios 5–8.

### Tests for User Story 2 (TDD — write FIRST, confirm FAIL)

- [X] T018 [P] [US2] Failing unit tests for admin endpoints: missing/wrong `X-Admin-Token` → 401, unset `ADMIN_TOKEN` secret → 503 `not_configured`, create (409 on existing), list (no key hashes), rotate (max 2 active), revoke-key (400 when last active), revoke (terminal), usage aggregation — `tests/unit/worker/admin-api.test.ts` per contracts/admin-cli.md
- [X] T019 [P] [US2] Failing unit tests for the CLI JSON envelope `{"ok":…,"data|error":…}`, exit codes 0/1/2/3, human mode output, secret printed exactly once on add/rotate — `tests/unit/tools/conversia-admin.test.ts` per contracts/admin-cli.md
- [X] T020 [P] [US2] Failing **automated contract tests** for the admin surface through the router-level `fetch` handler (mocked env + KV): token guard, full add→rotate→revoke-key→revoke lifecycle over HTTP, usage endpoint shape, security events emitted per mutation — `tests/contract/admin-api.test.ts` per contracts/admin-cli.md (constitution Principle IV)

### Implementation for User Story 2

- [X] T021 [US2] Implement `worker/src/admin-api.ts`: `/admin/*` routes with constant-time token guard and all endpoints per contracts/admin-cli.md (make T018 and T020 pass)
- [X] T022 [US2] Implement `worker/src/usage.ts`: sum `usage:<remoteId>:<bucket>` counters into `{served, errored, refused, throttled, lastActivity, perDay}` over the retention window (default 30 days)
- [X] T023 [US2] Implement `tools/conversia-admin/index.js`: commands `client add|list|show|rotate|revoke-key|revoke` and `usage` per contracts/admin-cli.md (make T019 pass)
- [X] T024 [US2] Emit `client_registered` / `client_rotated` / `client_revoked` / `usage_report` security events from the admin endpoints via the T006 logger; invalidate the registry cache entry on every mutation (make revocation-effective-in-≤30 s testable)

**Checkpoint**: US1 + US2 both functional — revocation drill (quickstart scenario 5) passes

---

## Phase 5: User Story 3 - Diagnose problems with logs and telemetry (Priority: P3)

**Goal**: Every request traceable end-to-end via one correlation id in Workers Logs; OTLP trace export configured; provider/fallback visibility per client; zero content/secret leakage.

**Independent Test**: Trigger a failure and a refused request, then find both in `wrangler tail` / Query Builder by correlation id; confirm traces reach the OTLP destination; confirm requests still succeed with the destination misconfigured. Quickstart scenarios 9–10.

### Tests for User Story 3 (TDD — write FIRST, confirm FAIL)

- [X] T025 [P] [US3] Failing unit tests asserting served/errored events carry domain attributes `conversia.remote_id`, `conversia.route`, `conversia.outcome`, `conversia.provider`, `conversia.fallback_count` (derived from `X-Conversia-Attempt`), and that request handling contains no awaited telemetry export — `tests/unit/worker/observability-attributes.test.ts` per contracts/observability.md

### Implementation for User Story 3

- [X] T026 [US3] Enrich provider request logging in `worker/src/index.ts`: log `provider` and `fallbackCount = (X-Conversia-Attempt − 1)` on `request_served`/`request_errored` events (make T025 pass; attempt header is a request field, not widget telemetry — preserves FR-017)
- [X] T027 [US3] Enable platform observability in `worker/wrangler.toml`: `observability` block with traces + logs, retention pinned to 30 days; document the OTLP destination setup in `specs/002-secure-embed-telemetry/quickstart.md` § Prerequisites; verify with `npx wrangler tail` (scenarios 9–10)

**Checkpoint**: All three stories functional — full quickstart pass possible

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, release safety, measurement, and hardening across stories

- [X] T028 [P] Update root `README.md` host-embedding instructions: injection contract (`window.conversiaClient`), credential-obtaining flow (operator issues via CLI), link `specs/002-secure-embed-telemetry/contracts/embedder-injection.md`
- [X] T029 [P] Write release notes: breaking gate with immediate enforcement, deploy order (register client → release GlobalVstHost update → deploy worker), widget MINOR semver bump, legacy-embed refusal notice (per research R9)
- [X] T030 [P] Add GlobalVstHost companion handoff note (out-of-repo work): `AddScriptToExecuteOnDocumentCreated` snippet + test step for quickstart scenario 12 — in `specs/002-secure-embed-telemetry/quickstart.md`
- [X] T031 Run full validation per `specs/002-secure-embed-telemetry/quickstart.md`: `pnpm test`, `npx tsc -b`, `pnpm run build`, and `wrangler dev` scenarios 1–11
- [X] T032 Measure authorization + telemetry overhead per `specs/002-secure-embed-telemetry/quickstart.md` scenario 13: ~200 authenticated requests against `wrangler dev`, record p95 vs a pre-feature baseline, confirm < 100 ms added p95 (SC-006), write both numbers into quickstart.md
- [X] T033 Security hardening pass: grep worker logs paths for secret leakage, re-audit constant-time compare, confirm `/admin/*` → 503 with token unset, confirm CORS preflight grants nothing without credential, confirm widget ignores URL credentials
- [X] T034 Verify spec compliance end-to-end against `specs/002-secure-embed-telemetry/spec.md` success criteria SC-001…SC-009 and record results in the PR description (constitution: compliance review at PR)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (KV binding needed by registry tests) — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 (T006 logger, T007 registry, T008 crypto)
- **User Story 2 (Phase 4)**: Depends on Phase 2; uses T006/T007/T008. May run **in parallel with US1** (different files; only shared touchpoint is registry cache invalidation T024 vs US1 reads)
- **User Story 3 (Phase 5)**: Depends on Phase 2 (logger) and benefits from US1/US2 event emission being in place (T026 extends the same handler logging T015 added — **sequence T015 before T026**)
- **Polish (Phase 6)**: T028–T030 parallel any time after their content exists; T031–T034 after all desired stories complete

### User Story Dependencies

- **US1 (P1)**: starts after Foundational; independent of US2/US3
- **US2 (P2)**: starts after Foundational; independent of US1 (admin endpoints don't require the widget gate to be wired, though revocation E2E needs US1's gate)
- **US3 (P3)**: starts after Foundational; T026 depends on US1's T015 having wrapped the handler

### Within Each Story

Tests (failing) → implementation → wiring → story checkpoint. Commit after each task or logical group.

### Parallel Opportunities

- Phase 1: T002 ∥ T003 (T001 standalone first)
- Phase 2: T004 ∥ T005 (tests), then T007 ∥ T008 (implementations)
- US1: T009 ∥ T010 ∥ T011 ∥ T012 (tests), then T016 ∥ T013/T014 (widget vs worker files)
- US2: T018 ∥ T019 ∥ T020 (tests), then T022 ∥ T021
- US1 ∥ US2 once Phase 2 checkpoint passes (no shared files until wiring)
- Polish: T028 ∥ T029 ∥ T030

---

## Parallel Example: User Story 1

```text
# Launch all US1 tests together (first, to see them fail):
Task: "T009 failing auth tests in tests/unit/worker/client-auth.test.ts"
Task: "T010 failing rate-limit tests in tests/unit/worker/rate-limit.test.ts"
Task: "T011 failing identity-loader tests in tests/unit/client-identity.test.ts"
Task: "T012 failing contract tests in tests/contract/worker-gate.test.ts"

# Then implementation streams (worker vs widget, different files):
Task: "T013+T014 worker gate in worker/src/client-auth.ts + rate-limit.ts"
Task: "T016 widget loader in src/services/client-identity.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup + Phase 2 Foundational (critical, blocking)
2. Phase 3 US1 — the security gate itself, incl. automated contract tests (T012)
3. **STOP and VALIDATE**: quickstart scenarios 1–4 and 11 (unknown client refused; injected credential works)
4. Ship-capable only when paired with the GlobalVstHost release (immediate enforcement — see T029 release notes)

### Incremental Delivery

- After US1: enforcement live (MVP), attribution limited to logs
- After US2: revocation/rotation/usage operational (operable security)
- After US3: full observability with OTLP export (diagnosable)
- Each story adds value without breaking previous ones; US2 and US3 can be swapped if operational need changes

---

## Notes

- Tests are included because the constitution (Principle III) makes TDD non-negotiable and plan.md requires failing tests first — not because of template default. Automated contract tests (T012, T020) exist because Principle IV requires integration coverage of inter-service contracts (analysis finding C1).
- Registry read-cache TTL is **30 s** (not 60 s) so cache drain + KV propagation stays inside SC-003's one-minute revocation budget (analysis finding F1).
- T032 exists to close the SC-006 measurement gap (analysis finding F2).
- `[P]` tasks touch different files with no dependencies; the only shared-file risk is `worker/src/index.ts` (T015, T026) — sequence those two.
- The GlobalVstHost C++ change lives in the other repository; T030 is the handoff note only.
- Do not regenerate `pnpm-lock.yaml` or `worker/package-lock.json` (AGENTS.md).
- Every user-facing string added in T006/T017 goes through `src/i18n/translations.ts` (en/fr/es).
