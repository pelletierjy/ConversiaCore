#!/usr/bin/env node
// conversia-admin — operator CLI for the embedding-client registry
// (specs/002-secure-embed-telemetry/contracts/admin-cli.md, FR-005/006/008/009).
// Constitution Principle II: args → stdout (JSON envelope by default), errors → stderr,
// structured output, meaningful exit codes: 0 ok · 1 validation/conflict · 2 auth · 3 upstream.

const COMMANDS = new Set(['client', 'usage']);
const CLIENT_ACTIONS = new Set(['add', 'list', 'show', 'rotate', 'revoke-key', 'revoke']);

/** Parses trailing `--flag value` pairs; repeated flags (e.g. --origin) collect into arrays. */
export function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const name = arg.slice(2);
    const value = args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[++i] : 'true';
    if (name === 'origin') {
      (flags.origins ??= []).push(value);
    } else {
      flags[name] = value;
    }
  }
  return flags;
}

function fail(code, message, exitCode) {
  return { exitCode, output: { ok: false, error: { code, message } } };
}

function httpExit(status) {
  if (status === 401) return { code: 'unauthorized', exitCode: 2 };
  if (status === 503) return { code: 'not_configured', exitCode: 3 };
  if (status >= 500) return { code: 'service_error', exitCode: 3 };
  if (status === 409) return { code: 'conflict', exitCode: 1 };
  if (status === 404) return { code: 'not_found', exitCode: 1 };
  if (status === 400) return { code: 'bad_request', exitCode: 1 };
  return { code: 'request_error', exitCode: 1 };
}

function humanize(command, action, data) {
  if (command === 'client' && action === 'list') {
    return (data.clients ?? [])
      .map((c) => `${c.remoteId}\t${c.status}\tkeys=${c.credentialCount}\tlimit=${c.requestLimitPerMinute}\t${c.label ?? ''}`)
      .join('\n') || '(no registered clients)';
  }
  if (command === 'usage') {
    return [
      `client: ${data.remoteId} (last ${data.windowDays} days)`,
      `served=${data.served} errored=${data.errored} refused=${data.refused} throttled=${data.throttled}`,
      `lastActivity=${data.lastActivity ?? 'never'}`,
    ].join('\n');
  }
  if (data && typeof data === 'object' && 'key' in data) {
    return [
      `${action === 'add' ? 'registered' : 'rotated'} ${data.remoteId ?? ''}`,
      `keyId: ${data.keyId}`,
      `key (SHOWN ONCE, store it safely): ${data.key}`,
    ].join('\n');
  }
  return JSON.stringify(data, null, 2);
}

/** Runs one command against the worker. `deps` allows injection in tests. */
export async function runCommand(argv, deps) {
  const { fetchImpl, env } = deps;
  const [group, second, ...tailStart] = argv;
  // `usage` takes no action word: its first token after the group is already a flag.
  const secondIsFlag = typeof second === 'string' && second.startsWith('--');
  const action = group === 'client' ? (secondIsFlag ? undefined : second) : undefined;
  const rest = secondIsFlag ? [second, ...tailStart] : tailStart;
  if (!group || !COMMANDS.has(group)) return fail('usage', 'Usage: conversia-admin <client add|list|show|rotate|revoke-key|revoke|usage> [flags]', 1);
  if (group === 'client' && (!action || !CLIENT_ACTIONS.has(action))) {
    return fail('usage', `Unknown client action "${second ?? ''}". Expected one of: ${[...CLIENT_ACTIONS].join(', ')}`, 1);
  }
  if (!env.CONVERSIA_WORKER_URL || !env.CONVERSIA_ADMIN_TOKEN) {
    return fail('missing_env', 'Set CONVERSIA_WORKER_URL and CONVERSIA_ADMIN_TOKEN (see .env.example).', 1);
  }

  const flags = parseFlags(rest);
  const needsRemoteId = !(group === 'client' && (action === 'list' || action === 'add'));
  if (group === 'usage' || needsRemoteId) {
    if (!flags['remote-id']) return fail('usage', `--remote-id is required for "${group}${action ? ' ' + action : ''}"`, 1);
  }
  if (group === 'client' && action === 'revoke-key' && !flags['key-id']) {
    return fail('usage', '--key-id is required for client revoke-key', 1);
  }

  const base = env.CONVERSIA_WORKER_URL.replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': env.CONVERSIA_ADMIN_TOKEN };
  let url;
  let method = 'GET';
  let body;

  if (group === 'usage') {
    const days = flags.days ? `&days=${encodeURIComponent(flags.days)}` : '';
    url = `${base}/admin/usage?remoteId=${encodeURIComponent(flags['remote-id'])}${days}`;
  } else if (action === 'add') {
    method = 'POST';
    url = `${base}/admin/clients`;
    body = {
      remoteId: flags['remote-id'],
      ...(flags.label ? { label: flags.label } : {}),
      ...(flags.limit ? { requestLimitPerMinute: Number(flags.limit) } : {}),
      ...(flags.origins ? { origins: flags.origins } : {}),
    };
  } else if (action === 'list') {
    url = `${base}/admin/clients`;
  } else if (action === 'show') {
    url = `${base}/admin/clients/${encodeURIComponent(flags['remote-id'])}`;
  } else if (action === 'rotate') {
    method = 'POST';
    url = `${base}/admin/clients/${encodeURIComponent(flags['remote-id'])}/rotate`;
  } else if (action === 'revoke-key') {
    method = 'POST';
    url = `${base}/admin/clients/${encodeURIComponent(flags['remote-id'])}/keys/${encodeURIComponent(flags['key-id'])}/revoke`;
  } else {
    method = 'POST';
    url = `${base}/admin/clients/${encodeURIComponent(flags['remote-id'])}/revoke`;
  }

  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    return fail('network', error instanceof Error ? error.message : String(error), 3);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const mapped = httpExit(response.status);
    const serverCode = data && data.error ? ` (${data.error})` : '';
    return { exitCode: mapped.exitCode, output: { ok: false, error: { code: mapped.code, message: `${response.status} ${mapped.code}${serverCode}` } } };
  }

  if (flags.human === 'true') return { exitCode: 0, output: humanize(group, action, data) };
  return { exitCode: 0, output: { ok: true, data } };
}

/** CLI entry: writes the JSON envelope (or human text) to stdout, returns the exit code. */
export async function main(argv = process.argv.slice(2), io = { out: (line) => process.stdout.write(`${line}\n`) }) {
  const result = await runCommand(argv, { fetchImpl: (url, init) => fetch(url, init), env: process.env });
  io.out(typeof result.output === 'string' ? result.output : JSON.stringify(result.output));
  return result.exitCode;
}

const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;
if (invokedDirectly) {
  main().then((code) => {
    process.exitCode = code;
  });
}