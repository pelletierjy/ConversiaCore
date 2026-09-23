import { WORKER_BASE_URL } from '../config';

/** Posts to a route on the Cloudflare Worker proxy that holds the provider API keys server-side. */
export async function postToWorker<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${WORKER_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'unknown' }));
    throw new Error(`${response.status} ${body.error}`);
  }
  return response.json() as Promise<T>;
}
