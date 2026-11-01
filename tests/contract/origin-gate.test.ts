// @vitest-environment node
// Origin gate (CORS allowlist) for the worker proxy — worker/src/index.ts.
//
// Why this exists: the embedded widget is served from the host app's origin, so
// the proxy's preflight must echo an origin the browser will accept. A missing
// Access-Control-Allow-Origin makes the browser reject the response, `fetch`
// throws, and the widget surfaces `chat.errorNetwork` ("Connection problem.
// Check your internet and try again.") — which is what the Tauri desktop build
// and the Capacitor Android build reported until the native-shell origins were
// added to the allowlist.
import { describe, expect, it } from 'vitest';
import worker from '../../worker/src/index';

const WORKER_URL = 'https://conversia-core-proxy.example.workers.dev';

const ALLOWED_ORIGINS = [
  'https://pelletierjy.github.io',
  'https://scales-viewer.vercel.app',
  'https://homework-tutora.vercel.app',
  'http://localhost:5173',
  // Native shells of the host apps.
  'http://tauri.localhost', // Tauri v2 on Windows/Linux
  'tauri://localhost', // Tauri v2 on macOS
  'https://localhost', // Capacitor, androidScheme: "https"
  'capacitor://localhost', // Capacitor, capacitor:// scheme
  // Vercel preview deployments of the hosted hosts.
  'https://scales-viewer-git-fix-default-instrument-route-jy-ps-projects.vercel.app',
  'https://homework-tutora-git-some-feature.vercel.app',
];

const DENIED_ORIGINS = [
  'https://evil.example',
  null, // missing Origin header (non-browser caller) — the credential gate still applies
  'http://tauri.localhost.evil.com', // suffix of an allowed origin must not match
  'https://tauri.localhost', // scheme matters
  'http://localhost', // dev allowance requires a port
  'https://scales-viewer-git-x.vercel.app.evil.com', // preview-pattern suffix spoof
  'https://not-scales-viewer.vercel.app', // arbitrary Vercel project
  'https://scales-viewer.vercel.app.evil.com', // production-origin suffix spoof
];

async function call(request: Request): Promise<Response> {
  return worker.fetch(request as never, { CLIENTS: undefined } as never);
}

function preflight(origin: string): Request {
  return new Request(`${WORKER_URL}/gemini/chat`, { method: 'OPTIONS', headers: { Origin: origin } });
}

function post(origin: string): Request {
  return new Request(`${WORKER_URL}/gemini/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: '{}',
  });
}

describe('origin gate (CORS allowlist)', () => {
  describe.each(ALLOWED_ORIGINS)('allowed origin %s', (origin) => {
    it('echoes Access-Control-Allow-Origin on preflight', async () => {
      const res = await call(preflight(origin));
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    });

    it('does not refuse the request as origin_not_allowed', async () => {
      const res = await call(post(origin));
      expect(res.status).not.toBe(403);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    });
  });

  describe.each(DENIED_ORIGINS)('denied origin %s', (origin) => {
    it('withholds Access-Control-Allow-Origin on preflight (browser blocks the response)', async () => {
      const res = await call(preflight(origin as string));
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });

    it('refuses the POST before any provider work', async () => {
      const res = await call(post(origin as string));
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'origin_not_allowed' });
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });
});