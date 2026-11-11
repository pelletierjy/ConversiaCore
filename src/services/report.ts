import { postToWorker } from './worker-client';
import type { ContentReport } from '../models/types';

/** Sends a "Report an issue" submission for an AI-generated reply to the worker, which
 *  stores it for review. Goes through the same client-credential gate as chat requests. */
export async function submitContentReport(report: ContentReport): Promise<void> {
  await postToWorker<{ ok: true; id: string }>('/report', report);
}
