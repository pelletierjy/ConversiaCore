# Contract: Embedder Credential Injection (host → widget)

**Feature**: 002-secure-embed-telemetry | **Covers**: FR-020, clarified decisions 2026-10-15

## Host obligation

Before any widget/SPA script executes, the embedding host defines a global:

```js
window.conversiaClient = {
  version: 1,
  remoteId: 'globalvsthost',   // registered identifier (immutable, reusable)
  key: 'cvk_globalvsthost_…'   // credential issued by conversia-admin (shown once)
};
```

**WebView2 (GlobalVstHost)**: use `AddScriptToExecuteOnDocumentCreated` (or `ExecuteScript` before first navigation) so the global exists before `conversia-core-widget.js` / the SPA boot script runs.

Rules:
- The credential MUST NOT be placed in the launch URL, query string, or any baked-in widget bundle (FR-020). The widget ignores `conversiaClient`-like URL parameters.
- `version` allows contract evolution; the widget accepts `version: 1` and refuses unknown versions with a console warning + degraded mode.

## Widget obligation (`src/services/client-identity.ts`)

- Read `window.conversiaClient` **once** at startup; validate shape (version === 1, non-empty strings, remoteId matches `^[a-z0-9][a-z0-9-]{2,63}$`).
- Valid → `worker-client.ts` attaches the two headers on every request.
- Missing/invalid → the widget still renders and chat history/admin features work, but any AI request surfaces a friendly *"This assistant is not configured in this app"* message (analogous to today's `STANDALONE_EMBED_ONLY_PROMPT` handling). Console warning explains the missing global (developer-facing only).
- No retry loops or network probes for identity — the global is the only source.

## Compatibility

- Standalone SPA (pelletierjy.github.io direct visits): global absent → degraded mode as above. If the operator wants the standalone SPA usable, they set the global via a first-party bootstrap page.
- `<conversia-app>` widget embedders: same contract; the custom element reads the same global before initializing.

## Versioning

MINOR widget release adds this contract (new optional input). Bumping `version` is a MINOR if backward-compatible reading of v1 is retained, otherwise MAJOR.
