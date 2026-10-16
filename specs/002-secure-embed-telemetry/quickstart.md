# Quickstart Validation Guide: Secure Embed Connection & Observability

**Feature**: 002-secure-embed-telemetry | **Date**: 2026-10-15

Run-book proving the feature end-to-end. Implementation details live in [plan.md](./plan.md), [data-model.md](./data-model.md), and [contracts/](./contracts/). Constitution requires the TDD versions of these scenarios to exist as failing tests *before* implementation (`/speckit.tasks` phase).

## Prerequisites

- `pnpm install` (root) and `cd worker && npm install`
- Cloudflare account with Workers KV; wrangler 4 authenticated (`npx wrangler login`)
- `CONVERSIA_ADMIN_TOKEN` chosen (any long random string) and provider secrets already configured per AGENTS.md

## Setup (once)

```powershell
# 1. Create the KV namespace and note its id
cd worker
npx wrangler kv namespace create CLIENTS        # add [[kv_namespaces]] binding to wrangler.toml

# 2. Observability: enable logs + traces in wrangler.toml (observability block,
#    30-day retention), then configure the OTLP destination in the Cloudflare
#    dashboard (Workers & Pages → conversia-core-proxy → Observability → Traces)

# 3. Set the admin token secret
echo "<your-token>" | npx wrangler secret put ADMIN_TOKEN

# 4. Deploy and register the first client
npm run deploy
$env:CONVERSIA_ADMIN_TOKEN="<your-token>"; $env:CONVERSIA_WORKER_URL="https://conversia-core-proxy.<account>.workers.dev"
node ../../tools/conversia-admin/index.js client add --remote-id globalvsthost --label "GlobalVstHost desktop app" --limit 600
#    → prints the key ONCE: cvk_globalvsthost_…
```

Widget dev (`pnpm run dev`): simulate injection in the browser console before loading the app —
`window.conversiaClient = { version: 1, remoteId: 'globalvsthost', key: 'cvk_…' }; location.reload();`

## Validation scenarios

| # | Scenario (spec ref) | Steps | Expected |
|---|--------------------|-------|----------|
| 1 | Unauthenticated refused (SC-001) | `curl -X POST $W/gemini/chat -H "Content-Type: application/json" -H "Origin: https://pelletierjy.github.io" -d '{"messages":[]}'` | `401 {"error":"not_authorized"}`; log event `request_refused` with `remoteId:"unknown"` |
| 2 | Forged origin alone useless (SC-002) | As #1 with allowed Origin but no key; also with made-up key | `401`, identical body to #1 (no oracle) |
| 3 | Valid client served (SC-001) | Widget (or curl) with both `X-Conversia-*` headers from a registered key | `200`, `X-Correlation-Id` header present, `request_served` event with `remoteId=globalvsthost` |
| 4 | Origin still gated | Request with bad Origin + valid key | `403 origin_not_allowed` (allowlist unchanged) |
| 5 | Revocation ≤ 1 min (SC-003) | `client revoke --remote-id globalvsthost`, then retry #3 immediately and after ~30 s | Refused within ~30 s (≤ 1 min budget incl. KV propagation); other clients unaffected; `client_revoked` + `request_refused` logged |
| 6 | Rotation overlap (FR-006) | `client rotate` → new key works; old key still works; `revoke-key` old → old refused, new OK; 3rd key attempt → `400` (max 2) | Matches [data-model transitions](./data-model.md) |
| 7 | Rate limit (FR-007) | `client add --limit 5` test client; send 10 requests | First ~5 served, rest `429 {"error":"rate_limited"}`; `request_throttled` events; default client (600) never trips in manual testing |
| 8 | Admin auth | Call `/admin/clients` with wrong/missing token; with token | `401`/`503` vs `200` JSON list; CLI JSON envelope `{"ok":true,"data":…}` |
| 9 | Log schema & redaction (SC-007) | Run unit tests; then `npx wrangler tail` during #1–#3 | Tests pass (no secrets/content fields); tail shows closed-schema JSON events only |
| 10 | Observability export (SC-005, SC-009) | Dashboard Query Builder: `event:"request_refused"` last hour; verify trace export destination receives spans | Refused request findable via its `correlationId`; traces visible/exported; requests succeed with destination misconfigured (test by pointing at invalid OTLP URL) |
| 11 | Injection contract (FR-020) | Widget with no `window.conversiaClient`; then with valid one; then with credential in URL param | Degraded friendly message; works; URL credential ignored |
| 12 | Host integration (SC-008) | GlobalVstHost release with `AddScriptToExecuteOnDocumentCreated` injection | Assistant chats end-to-end; no account prompt anywhere |
| 13 | Latency overhead (SC-006) | Script ~200 authenticated requests against `wrangler dev`; record p95 with the gate+observability active and compare to a pre-feature baseline build | Added overhead < 100 ms p95; record both numbers in this file |

### Recorded results (2026-10-16, local `wrangler dev`, scenarios 1–9 + 13)

| Check | Result |
|-------|--------|
| S1 no credential | `401 {"error":"not_authorized"}` + `X-Correlation-Id` present ✓ |
| S2 fabricated credential | `401`, byte-identical body to S1 (no oracle) ✓ |
| S3 valid credential | reached handler → `503 not_configured` (gate passed; no provider key locally) ✓ |
| S4 forged origin + valid key | `403 origin_not_allowed` ✓ |
| S5 revocation | effective **immediately** (first probe after `client revoke` → 401; still 401 after 32 s) — within the ≤ 1 min budget ✓ |
| S6 rotation overlap | issue 2nd key → both work; `revoke-key` old → old 401, new served; 3rd key → `400 too_many_credentials` ✓ (unit + contract tests) |
| S7 rate limit (`--limit 5`) | `503,503,503,503,503,429,429` ✓ |
| S8 admin + CLI + usage | wrong token → 401; CLI `client list` → 1 client, no hashes; usage after drill → `served=202, refused=2` ✓ |
| S9 structured logs | 235 closed-schema JSON events; security events `level:warn`; **0 lines containing a plaintext key** ✓ |
| S13 latency | 200 authenticated requests: **p50 36.8 ms, p95 47.8 ms** (min 27.1 / max 130.3), incl. PowerShell client overhead + local dev server — well under the 100 ms p95 budget. Pre-feature baseline not captured (gate runs in-process; per-request gate cost visible in event `durationMs`, typically 0–53 ms total handler time). |

Scenarios 10 (OTLP export), 12 (GlobalVstHost host release) and production-retention settings require the deployed worker + Cloudflare dashboard + the companion app release — see quickstart Prerequisites and the GlobalVstHost handoff below.

## Regression safety

- Old behavior preserved for disallowed origins (scenario 4) and all provider routes unchanged.
- `pnpm test` green; `npx tsc -b` clean; `pnpm run build` produces SPA + widget artifacts.
- Release notes MUST announce the breaking gate (immediate enforcement) + the host-release requirement (semver: widget MINOR, worker gate documented).

## GlobalVstHost companion change (handoff — lives in the other repository)

The currently shipped GlobalVstHost release injects no credential and will be refused the moment the gated worker deploys. Companion work in `D:\Repos\GlobalVstHost`:

1. Obtain the credential from the operator (step 3 of Prerequisites above) — ship `remoteId = "globalvsthost"` plus its `cvk_…` key in the app (extractable by design: deterrence + attribution + revocation, see spec FR-004).
2. In the tray app's assistant launcher (`src/tray-app/ui/assistant_dialog.*`), inject at document creation **before** the Conversia URL loads (WebView2 `AddScriptToExecuteOnDocumentCreated`):

   ```cpp
   // JS executed at document creation — must NOT put the key in the URL
   webview->ExecuteScript(
     L"window.conversiaClient = { version: 1, remoteId: L\"globalvsthost\", key: L\"cvk_globalvsthost_…\" };");
   ```

   (Exact WebView2/JUCE call depends on the host's webview wrapper; the contract only requires the global to exist before the widget bundle evaluates.)

3. Verify: scenario 12 passes — assistant opens, chats end-to-end, no account prompt; then deliberately blank the key and confirm the friendly "not authorized" message appears (widget side of FR-020).
4. Ship that app release **before or together with** the worker deploy (release-notes.md deploy order).
