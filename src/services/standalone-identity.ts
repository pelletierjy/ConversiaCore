// First-party credential bootstrap for the standalone SPA (feature 002-secure-embed-telemetry).
//
// The <conversia-app> widget bundle must NEVER carry credentials (FR-020) — embedding hosts
// (GlobalVstHost, ScalesViewer, HomeworkTutora) inject their own via the browser bridge.
// The operator-hosted SPA on GitHub Pages, however, has no host to inject for it, so when the
// build provides these two build-time values the SPA injects `window.conversiaClient` for
// itself before any widget/chat code runs (contracts/embedder-injection.md: "first-party
// bootstrap page").
//
// Values ship only in the Pages build (Actions secrets → VITE_CONVERSIA_*). Without them the
// SPA degrades exactly like any unconfigured host: friendly "not configured" message.
// The key is necessarily public in this bundle — accepted FR-004 deterrence model; the
// `conversia-web` client is rate-limited (60 req/min) and revocable independently.

interface ConversiaClientGlobal {
  version: number;
  remoteId: string;
  key: string;
}

/** Sets window.conversiaClient from build-time env unless a value is already present
 *  (an embedder or a previous bootstrap owns it). Safe to call in any environment. */
export function bootstrapStandaloneIdentity(): void {
  if (typeof window === 'undefined') return;
  const target = window as unknown as { conversiaClient?: ConversiaClientGlobal };
  if (target.conversiaClient) return;
  const remoteId = import.meta.env.VITE_CONVERSIA_REMOTE_ID as string | undefined;
  const key = import.meta.env.VITE_CONVERSIA_CLIENT_KEY as string | undefined;
  if (!remoteId || !key) return;
  target.conversiaClient = { version: 1, remoteId, key };
}
