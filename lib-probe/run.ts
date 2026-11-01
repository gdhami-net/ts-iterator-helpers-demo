// Type-checks lib-probe/probe.ts under several target/lib settings and prints
// what tsc says for each. The configs are written to lib-probe/tmp/ and
// removed again at the end.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const here = import.meta.dirname;
const tmp = join(here, 'tmp');
const tsc = join(here, '..', 'node_modules', 'typescript', 'bin', 'tsc');

export interface ProbeResult {
  name: string;
  ok: boolean;
  output: string;
}

export const cases: { name: string; options: Record<string, unknown> }[] = [
  // What `ng new` writes in Angular 22: target ES2022 and no lib, so the
  // default lib for ES2022 plus the DOM.
  { name: 'angular-22-default (target ES2022, no lib)', options: { target: 'ES2022' } },
  { name: 'target es2024, no lib', options: { target: 'es2024' } },
  { name: 'no target, no lib (the tsc 7 default)', options: {} },
  { name: 'target es2025, no lib', options: { target: 'es2025' } },
  { name: 'target ES2022, lib es2025 + dom', options: { target: 'ES2022', lib: ['es2025', 'dom'] } },
  { name: 'target ES2022, lib es2022 + dom + es2025.iterator', options: { target: 'ES2022', lib: ['es2022', 'dom', 'es2025.iterator'] } },
  { name: 'target esnext, no lib', options: { target: 'esnext' } },
];

export function runProbes(): ProbeResult[] {
  mkdirSync(tmp, { recursive: true });
  try {
    return cases.map((c, i) => {
      const file = join(tmp, `tsconfig.${i}.json`);
      writeFileSync(
        file,
        JSON.stringify({
          compilerOptions: { ...c.options, strict: true, noEmit: true, types: [] },
          files: ['../probe.ts'],
        }),
      );
      try {
        const out = execFileSync(process.execPath, [tsc, '-p', file], { encoding: 'utf8' });
        return { name: c.name, ok: true, output: out.trim() };
      } catch (e) {
        const err = e as { stdout?: string };
        return { name: c.name, ok: false, output: (err.stdout ?? '').trim() };
      }
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  for (const r of runProbes()) {
    console.log(`${r.ok ? 'compiles' : 'ERROR   '}  ${r.name}`);
    if (r.output) console.log('          ' + r.output.replaceAll('\n', '\n          '));
  }
}
