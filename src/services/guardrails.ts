import { OFF_TOPIC_KEYWORDS } from '../models/constants';

/** Lightweight client-side pre-check for obviously off-topic messages. */
export function isLikelyOffTopic(message: string): boolean {
  const lower = message.toLowerCase();
  return OFF_TOPIC_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function buildRedirectMessage(subject: string): string {
  return `Let's stay focused on your ${subject} homework — that question is outside what I can help with here. Want another practice problem?`;
}
