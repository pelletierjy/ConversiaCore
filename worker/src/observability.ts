// Structured log emitter — feature 002-secure-embed-telemetry (FR-011…FR-014, contracts/observability.md).
// One JSON line per event via console.log; Workers Logs ingests it platform-side.

export type LogLevel = 'info' | 'warn' | 'error';

/** Closed schema — data-model.md § LogEvent. Unknown fields are dropped, never emitted. */
export interface LogEvent {
  ts: string;
  level: LogLevel;
  event: string;
  correlationId: string;
  remoteId?: string;
  route?: string;
  origin?: string;
  outcome?: string;
  status?: number;
  durationMs?: number;
  provider?: string;
  fallbackCount?: number;
  errorKind?: string;
}

export type LogEventInput = Omit<Partial<LogEvent>, 'event' | 'level' | 'correlationId'> & {
  event: string;
  level: LogLevel;
  correlationId: string;
};

const ALLOWED_FIELDS = new Set<string>([
  'ts',
  'level',
  'event',
  'correlationId',
  'remoteId',
  'route',
  'origin',
  'outcome',
  'status',
  'durationMs',
  'provider',
  'fallbackCount',
  'errorKind',
]);

/** Anything matching these is replaced with "[redacted]" before it can reach a log backend (FR-014/FR-018/SC-007). */
const SECRET_VALUE_PATTERNS = [/^cvk_/, /\bBearer\s+\S+/i, /^sk-/];

function redact(value: string): string {
  return SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value)) ? '[redacted]' : value;
}

/** Mints the per-request correlation id (FR-011). */
export function newCorrelationId(): string {
  return crypto.randomUUID();
}

/** Validates and sanitizes an event against the closed schema. Throws only on programmer
 *  error (missing required fields) — never on data — so it cannot affect request handling. */
export function buildLogEvent(input: LogEventInput): LogEvent {
  if (!input || typeof input.event !== 'string' || input.event.length === 0) {
    throw new Error('logEvent: "event" is required');
  }
  if (input.level !== 'info' && input.level !== 'warn' && input.level !== 'error') {
    throw new Error(`logEvent: invalid level "${String(input.level)}"`);
  }
  if (typeof input.correlationId !== 'string' || input.correlationId.length === 0) {
    throw new Error('logEvent: "correlationId" is required');
  }

  const evt: LogEvent = {
    ts: new Date().toISOString(),
    level: input.level,
    event: input.event,
    correlationId: input.correlationId,
  };
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (key === 'ts') continue;
    if (!ALLOWED_FIELDS.has(key)) {
      dropped.push(key);
      continue;
    }
    (evt as unknown as Record<string, unknown>)[key] = typeof value === 'string' ? redact(value) : value;
  }
  if (dropped.length > 0) {
    console.warn(`logEvent: dropped fields outside the closed schema: ${dropped.join(', ')}`);
  }
  return evt;
}

/** Builds, sanitizes and emits one single-line JSON log entry; returns the emitted event (FR-012). */
export function logEvent(input: LogEventInput): LogEvent {
  const evt = buildLogEvent(input);
  console.log(JSON.stringify(evt));
  return evt;
}
