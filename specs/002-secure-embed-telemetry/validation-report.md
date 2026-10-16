# Validation Report: Secure Embed Connection & Observability (002-secure-embed-telemetry)

**Date**: 2026-10-16 | **For**: PR description / constitution compliance review (task T034)

## Automated evidence

- `npx vitest run`: **15 files, 101 tests, all passing** (incl. 2 automated contract suites for the widget→worker gate and the admin surface — constitution Principle IV).
- `npx tsc -b` (root, strict + noUnusedLocals): clean. `npx tsc --noEmit -p worker`: clean.
- `pnpm run build`: SPA + `dist/conversia-core-widget.js` (840 kB) built.
- Live `wrangler dev` smoke (scenarios 1–9, 13): see quickstart "Recorded results".
- Secret-leak scan: 0 of 235 live log events contained a plaintext credential.

## Success criteria mapping

| SC | Verdict | Evidence |
|----|---------|----------|
| SC-001 100% of credential-less requests refused | ✅ | contract `worker-gate.test.ts` (all refusal paths) + live S1/S2 |
| SC-002 forged origin yields 0 successes | ✅ | contract test "origin allowlist still applies" + live S4 (403 even with valid key) |
| SC-003 revocation ≤ 1 min, other clients unaffected | ✅ | 30 s registry cache (design), contract lifecycle test, live S5 (immediate 401) |
| SC-004 100% attribution + usage summary on demand | ✅ | counters + `/admin/usage`; live drill: served=202 / refused=2 attributed to `globalvsthost` |
| SC-005 one correlation id explains a failure | ✅ | `X-Correlation-Id` header + closed-schema events; fallback chain via `X-Conversia-Attempt` numbering (clarified SC-005 wording) |
| SC-006 < 100 ms added p95 | ✅ (local) | live S13: **p95 47.8 ms** total request time incl. client+dev-server overhead |
| SC-007 0 log/telemetry content leaks | ✅ | redaction unit tests + live scan: 0 plaintext keys / 235 events |
| SC-008 hosts resume after config/deploy update, 0 end-user accounts | ⏳ partial | no account path exists anywhere (widget flows unchanged); GlobalVstHost companion release is tracked in quickstart handoff — closes when that ships |
| SC-009 telemetry backend down → ≥ 99.9% requests succeed | ✅ (design) | export is platform out-of-band; unit test asserts no awaited telemetry fetch in the request path; live verification of scenario 10 needs deployed OTLP destination |

## Constitution compliance

| Principle | Status |
|-----------|--------|
| I. Widget-first library design | ✅ `client-identity.ts`, `client-auth.ts`, `client-registry.ts`, `observability.ts`, `usage.ts`, `admin-api.ts` are single-purpose modules with documented contracts |
| II. CLI protocol & structured I/O | ✅ `tools/conversia-admin` — args → stdout JSON envelope (`--human`), errors → stderr, exit codes 0/1/2/3 |
| III. Test-first (NON-NEGOTIABLE) | ✅ every story's tests written and confirmed failing (RED) before implementation (GREEN); run evidence in task history |
| IV. Integration tests for contracts | ✅ `tests/contract/worker-gate.test.ts` + `tests/contract/admin-api.test.ts` cover all inter-service boundaries incl. revocation→gate cross-contract |
| V. Versioning & observability | ✅ structured logging is the feature core; release-notes.md documents the breaking gate + semver stance; YAGNI (KV not D1, platform OTel not custom pipeline) |

## Known follow-ups (not blockers)

1. OTLP destination + 30-day retention must be configured in the Cloudflare dashboard post-deploy (quickstart Prerequisites step 2).
2. GlobalVstHost companion release (quickstart handoff) — required before/at worker deploy (release-notes.md deploy order).
3. Custom metrics ship as structured counter logs until Cloudflare supports native OTel metric export (research R6; schema is 1:1 ready).
