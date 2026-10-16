# Contract: Observability (logs + OpenTelemetry)

**Feature**: 002-secure-embed-telemetry | **Covers**: FR-011…FR-019, SC-005…SC-007, SC-009

## Structured logging

Single emitter (`worker/src/observability.ts`): `logEvent(event, fields)` → one `console.log(JSON.stringify(evt))` per event, schema exactly as [data-model.md § LogEvent](./data-model.md). Guarantees:

- **Correlation**: `correlationId` (UUIDv4) minted at request receipt, present on every event and returned to the caller in an `X-Correlation-Id` response header (SC-005 drill: one id → full story).
- **Redaction** (FR-014/FR-018): closed field set; unknown fields are dropped with a warning, and any string value matching a secret pattern (`cvk_…` keys, `Bearer …`, `sk-…`) is replaced with `[redacted]`. Unit tests assert both behaviors, and the live smoke run found 0 plaintext keys across 235 production-shaped events (SC-007). Redaction happens in the emitter — it never throws, so logging cannot fail a request (FR-019).
- **Security severity** (FR-013): `request_refused`, `request_throttled`, `client_revoked`, … log at `warn`/`error`; routine traffic at `info`.
- **Retention** (FR-015): worker `observability` config in `wrangler.toml` pins Workers Logs retention to 30 days (adjustable by config change only).

## OpenTelemetry

- **Traces**: enable Cloudflare automatic tracing + OTel export in `wrangler.toml` (`observability.traces`) and configure the OTLP destination (dashboard or config) — export to any OTLP endpoint without code changes (FR-016).
- **Domain attributes** ride the correlated log events: `conversia.remote_id`, `conversia.route`, `conversia.outcome`, `conversia.provider`, `conversia.fallback_count`, `conversia.correlation_id`.
- **Metrics today**: counter-shaped log events (`event=request_served|request_refused|request_throttled|request_errored` + dimension fields) aggregatable in the log backend; a 1:1 mapping to OTel counters is reserved in the schema for when Cloudflare ships native metrics export (research R6).
- **FR-017 scope**: service side only. The widget/browser emits no telemetry.
- **FR-019**: export is platform out-of-band; the worker never awaits or retries telemetry. Unit/contract tests verify request paths contain no `await` on export handles.

## Widget-side behavior

The widget only translates 401/429 into friendly user messages and logs a developer console warning for a missing/invalid `conversiaClient` global. No telemetry, no content logging (keeps GlobalVstHost's privacy posture intact).

## Operations view

| Need | Tool |
|------|------|
| Live tail | `npx wrangler tail` |
| Investigation / usage drill | Dashboard Query Builder over Workers Logs (30-day window) |
| Dashboards/alerts | OTLP destination (Grafana/Honeycomb/etc.) — operator-selected |
