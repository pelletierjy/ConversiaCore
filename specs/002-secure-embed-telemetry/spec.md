# Feature Specification: Secure Embed Connection & Observability

**Feature Branch**: `002-secure-embed-telemetry`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "GlobalVstHost app is connecting to Conversia-Core. How is the connection secured? I would like to strengthen the connection to prevent hackers from figuring out how to use conversia-core in an unknown embedding client. But I'd like to keep the connection simple so users don't need to create an account — each client could reuse a reusable remote_id or something like that for tracking. I would like to add OpenTelemetry as well and a proper logging mechanism."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Only approved embedding clients get service (Priority: P1)

An embedding host app (such as GlobalVstHost) identifies itself to ConversiaCore with a reusable client credential that the operator issued once, ahead of time. The service serves requests that present a valid credential and refuses requests that do not — without ever asking an end user to create an account or sign in. Today the only gate is a browser-origin check, which any non-browser caller can fake; this story closes that gap.

**Why this priority**: This is the core of the feature. Without it, anyone who discovers the public service address can embed ConversiaCore in their own app and consume AI-provider capacity at the operator's expense.

**Independent Test**: Can be fully tested by calling the AI proxy with no credential, with a made-up credential, and with a valid credential — expecting refusal, refusal, and success respectively — while an end user completes a chat session through an approved host with no account prompt.

**Acceptance Scenarios**:

1. **Given** a registered host app presenting a valid client credential, **When** it sends an AI request, **Then** the request is served normally and no account or sign-in prompt appears to the end user.
2. **Given** an unknown embedding client with no credential, **When** it sends an AI request, **Then** the request is refused with a generic "not authorized" error and no AI response is produced.
3. **Given** an unknown client presenting a fabricated or malformed credential, **When** it sends an AI request, **Then** the request is refused and the error does not reveal whether the credential was close to correct or which part was wrong.
4. **Given** a caller that forges the browser origin header of an approved site, **When** it sends a request without a valid credential, **Then** the request is still refused (origin alone is never sufficient).
5. **Given** an attacker who copies the public web address of the chat widget, **When** they attempt to run it inside their own app, **Then** the AI proxy still refuses their requests because the approved client credential is missing.
6. **Given** a registered host app, **When** it opens the widget, **Then** the credential is delivered by runtime injection, never appearing in the launch URL, and the session still authenticates successfully.

---

### User Story 2 - Reusable client identifier for tracking and control (Priority: P2)

Each embedding client is registered once and receives a reusable identifier (remote id) plus a matching credential. The operator can see which client made which requests, and can revoke a client — for example if its credential leaks — without redeploying the service or affecting other clients.

**Why this priority**: It delivers the requested "reusable remote_id for tracking" and turns an unavoidable credential leak into a contained, closable incident rather than a permanent hole.

**Independent Test**: Can be tested by registering two clients, generating traffic from both, confirming the operator can attribute traffic to each id, then revoking one and confirming its requests are refused while the other keeps working.

**Acceptance Scenarios**:

1. **Given** a newly registered embedding client, **When** it makes requests, **Then** every request is attributed to that client's remote id in usage records.
2. **Given** a client whose credential has been revoked, **When** it sends a request, **Then** the request is refused within one minute of the revocation and the event is logged as a security event.
3. **Given** two registered clients, **When** one is revoked, **Then** the other continues to work with no interruption.
4. **Given** the operator, **When** they review usage, **Then** they can see, per remote id, request volume, error counts, and recent activity.

---

### User Story 3 - Diagnose problems with logs and telemetry (Priority: P3)

When something goes wrong — a provider outage, a fallback chain, a burst of refused requests — the operator can trace the flow of a single request end to end using one correlation identifier, and can watch live health metrics, without reading chat contents.

**Why this priority**: Multi-provider AI failures are currently hard to localize; observability is what makes the security work operable day to day (a revocation or attack is only useful if it is visible).

**Independent Test**: Can be tested by triggering a failure (e.g., an unavailable provider) and confirming that a single correlation id leads to complete log entries and telemetry covering request receipt, provider attempts, fallback, and final outcome.

**Acceptance Scenarios**:

1. **Given** any request, **When** it completes or fails, **Then** structured log entries exist containing timestamp, severity, correlation id, client remote id (when known), operation, outcome, and duration.
2. **Given** the observability pipeline, **When** requests flow through the service, **Then** traces and metrics (request rate, latency, error rate, provider fallback counts, refused-request counts) are emitted in an OpenTelemetry-compatible format to an operator-selected destination.
3. **Given** a sample of production traffic, **When** logs and telemetry are inspected, **Then** no chat/message content, API key, or client credential appears in them.
4. **Given** the telemetry destination is unreachable, **When** requests arrive, **Then** requests are still served normally — observability failure never breaks the product.

---

### Edge Cases

- Credential leaked (extracted from a shipped host app; or from the launch URL of an unsupported integration): operator revokes and reissues; attribution already recorded under the old remote id limits the damage window.
- Revocation racing with in-flight requests: requests already accepted complete; new requests from the revoked client are refused.
- Malformed, truncated, or empty credentials: refused with the same generic error as missing credentials (no oracle for guessing).
- Origin forgery by non-browser clients: origin checks alone never grant access.
- Forged client-display values (e.g., the `context` host label in the widget URL): never trusted for authorization; only the registered credential establishes identity.
- Credential supplied in a launch URL (unsupported host integration): ignored by the widget; the request it produces is refused like any unauthenticated one, and the misconfiguration is logged.
- Rate limit exceeded for a client: polite, generic throttling response; throttling events logged.
- Legacy embeds in the field during rollout (e.g., the currently shipped GlobalVstHost release) present no credential and are refused immediately from deployment; embedding hosts must be updated or configured with a credential before this feature ships.
- Telemetry backend down or slow: requests unaffected; telemetry is dropped or buffered, never blocking.
- Requests arriving from a registered client via a network origin outside its registered origins (when the operator has registered any): refused and logged, so misconfiguration is visible rather than silent; clients with no registered origins accept any origin — the credential remains mandatory.

## Clarifications

### Session 2026-10-15

- Q: Should enforcement be immediate or after a transition window for existing embeds? → A: Immediate enforcement from deployment; legacy embeds without a credential are refused (no transition window).
- Q: How do embedding hosts pass the client credential to the widget? → A: Runtime injection through the embedded-browser bridge; never via launch URLs or baked into widget bundles.
- Q: How does credential rotation work per client? → A: Overlapping keys — up to two active credentials per client; the old key is revoked only after the fielded app is confirmed updated.
- Q: What per-client rate limit should the system enforce? → A: Configurable per client at registration, with a generous default (~600 requests/minute, burst-friendly).
- Q: How long are per-request usage/attribution records kept? → A: Same bounded period as logs (default 30 days); no long-term aggregates.

## Requirements *(mandatory)*

### Functional Requirements

**Client identity & authorization**

- **FR-001**: Each embedding client MUST be registered ahead of time by the operator and receive a reusable identifier (remote id) and a matching credential; no registration or account may be required from end users.
- **FR-002**: Every AI-proxy request MUST present the client credential; requests with a missing, malformed, unknown, or revoked credential MUST be refused with a single generic authorization error.
- **FR-003**: Authorization MUST be verified on the service side and MUST NOT rely on browser-origin checks, client-declared labels (such as the widget `context` parameter), or any other value the embedding client fully controls.
- **FR-004**: Every request MUST present the reusable credential over the encrypted channel, and the mechanism MUST target deterrence, per-client attribution, and fast revocation rather than unbreakable secrecy (a value shipped inside a host app can always be extracted by a determined attacker — see Assumptions).
- **FR-020**: The embedding host MUST deliver the client credential to the widget at runtime through the embedded-browser bridge; the widget MUST NOT accept credentials supplied in launch URLs, and no widget bundle may have credentials baked in.
- **FR-005**: The operator MUST be able to revoke any client credential, taking effect within one minute, without redeploying the service and without affecting other clients.
- **FR-006**: The operator MUST be able to reissue/rotate a client's credential and to register additional embedding clients without service downtime; each client MAY hold up to two active credentials at once so a replacement can be deployed before the old credential is revoked.
- **FR-007**: The system MUST enforce a per-client request-volume limit so that a single misbehaving or compromised client cannot exhaust the service; the limit MUST be configurable per client at registration with a generous default (on the order of 600 requests/minute with a burst allowance) so legitimate interactive tutoring traffic across all users of a host app is never throttled under normal use.
- **FR-008**: Client management operations (issue, list, revoke) MUST be available to the operator through a command-line interface that talks to the service, so credential management is scriptable and requires no new web surface (aligned with the project constitution's CLI principle).

**Tracking & attribution**

- **FR-009**: Every accepted request MUST be attributed to the presenting client's remote id in usage records, and the operator MUST be able to retrieve per-client usage summaries (volume, errors, last activity); usage records are retained for the same bounded, configurable period as logs (default 30 days) and no long-term aggregates are kept.
- **FR-010**: Refused requests MUST be recorded as security events including, when available: presented remote id, claimed origin, time, and correlation id.

**Logging**

- **FR-011**: Every request MUST carry a single correlation identifier that appears in all log entries and telemetry produced while handling it.
- **FR-012**: The system MUST emit structured, machine-readable log entries (one event per entry) with at minimum: timestamp, severity, correlation id, client remote id when known, operation, outcome/status, and duration.
- **FR-013**: Security-relevant events (refused authorization, revoked-credential attempts, throttling, management actions) MUST be logged at a severity that distinguishes them from ordinary traffic.
- **FR-014**: Logs MUST NOT contain chat/message content, AI provider API keys, or client credentials.
- **FR-015**: Logs MUST be retained for a bounded, configurable period with rotation so they cannot grow without limit.

**OpenTelemetry**

- **FR-016**: The system MUST produce OpenTelemetry-compatible traces and metric data — request rate, latency, error rate, refused-authorization count, AI-provider fallback counts — exportable to an operator-selected backend without changing application code; until the platform supports native metric export, metrics are delivered as structured counter events that map one-to-one onto OpenTelemetry counters (see plan research).
- **FR-017**: Instrumentation MUST cover the service side (request handling, authorization, AI-provider calls); widget/browser-side instrumentation is explicitly out of scope for this version so embedding hosts' privacy disclosures are unaffected.
- **FR-018**: Telemetry MUST NOT include chat/message content, credentials, or API keys, and MUST carry the client remote id as an attribute so usage can be broken down per client.
- **FR-019**: Observability failures (backend unreachable, export errors) MUST NOT fail or delay user-facing requests.

### Key Entities

- **Embedding Client**: A registered host application allowed to use the service. Attributes: remote id (reusable, human-meaningful), credentials (up to two active secrets during rotation, individually revocable), status (active/revoked), request-volume limit (configurable, generous default), registered origins or environments, created/revoked timestamps.
- **Usage/Security Event**: A record of one request. Attributes: correlation id, client remote id (or "unknown"), time, operation, outcome (served/refused/throttled), duration, claimed origin.
- **Telemetry Record** (trace span / metric): Observability data about request handling and provider calls. Attributes: correlation id, client remote id, operation, timing, outcome — never message content.
- **Log Entry**: A structured line-level record of one event, tied to a correlation id.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of requests lacking a valid client credential are refused; an unknown embedding client cannot complete a single AI conversation through the public endpoint.
- **SC-002**: Forging the browser origin of an approved site without a credential yields 0 successful AI responses across all test attempts.
- **SC-003**: Within one minute of a revocation, that client's requests are refused, while other clients' success rate is unaffected (0 errors attributable to the revocation).
- **SC-004**: The operator can attribute 100% of served requests to a remote id (or explicitly to "unknown" for refused ones) and can produce a per-client usage summary at any time.
- **SC-005**: A single failed request can be fully explained — receipt, provider attempts (each attempt numbered by the client so a fallback chain reads as numbered requests across correlation ids), fallback, outcome — by following its correlation id, with 100% of failures represented in logs.
- **SC-006**: Authorization and telemetry add no user-perceptible delay: chat responses are not noticeably slower than before the change (added overhead under 100 ms per request at the 95th percentile).
- **SC-007**: Across a representative sample of production requests, 0 log or telemetry entries contain message content, API keys, or credentials.
- **SC-008**: Existing approved host apps resume service after at most a configuration/deployment update, and 0 end users are ever asked to create an account.
- **SC-009**: With the telemetry backend down, at least 99.9% of legitimate requests still succeed — observability outages do not become product outages.

## Assumptions

- The current connection is protected only in transit (HTTPS) plus a browser-origin allowlist on the AI proxy; the widget itself is publicly hosted, the client address is public, and no caller credential is checked. Any non-browser client can bypass the origin check today, which is the gap this feature closes.
- Registration of embedding clients is done manually by the operator (invite/approval model): there is deliberately no self-service signup, which is what keeps the connection free of end-user accounts.
- Because the credential must be recoverable from the shipped host app, it can be extracted by a determined attacker; the design goal is deterrence, per-client attribution, and fast revocation — not unbreakable secrecy.
- The existing browser-origin allowlist stays in place as defense in depth, but stops being the primary gate.
- AI provider API keys remain server-side only; this feature does not change that.
- From the moment the feature deploys, enforcement is immediate: any request without a valid credential is refused. Embedding hosts in the field (such as the currently shipped GlobalVstHost release) present no credential and will be refused until updated or configured with one; there is no transition window.
- Observability is operator-side: logs and telemetry are for running the service, not end-user analytics; chat content is excluded by default.
- Log retention defaults to 30 days with rotation, adjustable by the operator; per-request usage/attribution records share the same retention window (no long-term aggregates).
- All clarification decisions (credential strength, management interface, telemetry scope, rollout timing, credential delivery, rotation model, rate limit, usage retention) are recorded verbatim in the Clarifications section; the service-side cache for client records is kept short (about 30 seconds) so revocation meets the one-minute guarantee of SC-003.
- Widget/browser-side telemetry may be proposed later as its own feature, with a privacy-disclosure review for embedding hosts.
