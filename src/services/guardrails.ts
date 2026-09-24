/** Lightweight client-side pre-check for obviously off-topic messages, against a host-supplied keyword list. */
export function isLikelyOffTopic(message: string, keywords: string[]): boolean {
  const lower = message.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}
