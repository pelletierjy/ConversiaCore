import { OFF_TOPIC_KEYWORDS } from '../models/constants';
import { t } from '../i18n/translations';

/** Lightweight client-side pre-check for obviously off-topic messages. */
export function isLikelyOffTopic(message: string): boolean {
  const lower = message.toLowerCase();
  return OFF_TOPIC_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function buildRedirectMessage(subject: string): string {
  return t('guardrails.redirectMessage', { subject });
}
