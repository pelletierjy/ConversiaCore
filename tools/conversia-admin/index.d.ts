// Type declarations for the conversia-admin CLI (keeps the root tsconfig strict build green
// while the implementation stays plain ESM JavaScript per the constitution's CLI principle).

export interface CliFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export interface CliDeps {
  fetchImpl: (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<CliFetchResponse>;
  env: Record<string, string | undefined>;
}

export interface CliResult {
  exitCode: number;
  output: unknown;
}

export function parseFlags(args: string[]): Record<string, string>;
export function runCommand(argv: string[], deps: CliDeps): Promise<CliResult>;
export function main(
  argv?: string[],
  io?: { out: (line: string) => void },
): Promise<number>;