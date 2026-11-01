// Asserts every claim the post makes. Exits 1 on the first failure.
// Run with: node check.ts
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { makeOrders, type Counts } from './src/rows.ts';
import { firstTenWithArrays, firstTenWithIterators } from './src/first-ten.ts';
import { runProbes } from './lib-probe/run.ts';

let failed = 0;
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (detail) console.log(`      ${detail}`);
  if (!ok) failed++;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log(`Node ${process.version}\n`);

// 1. The core claim: callback counts on a million orders, one refund in ten.
const orders = makeOrders(1_000_000);
const arr: Counts = { filter: 0, map: 0 };
const itr: Counts = { filter: 0, map: 0 };
const fromArrays = firstTenWithArrays(orders, arr);
const fromIterators = firstTenWithIterators(orders, itr);

check('1,000,000 orders, 100,000 of them refunds', orders.filter((o) => o.status === 'refunded').length === 100_000);
check('array chain: filter ran 1,000,000 times, map 100,000 times', arr.filter === 1_000_000 && arr.map === 100_000, JSON.stringify(arr));
check('iterator chain: filter ran 100 times, map 10 times', itr.filter === 100 && itr.map === 10, JSON.stringify(itr));
check(
  'callbacks in total: 1,100,000 against 110',
  arr.filter + arr.map === 1_100_000 && itr.filter + itr.map === 110,
);
check('both return the same ten refunds', same(fromArrays, fromIterators), fromIterators.map((r) => r.id).join(', '));
check(
  'the array chain built two 100,000-item arrays before slice kept ten',
  orders.filter((o) => o.status === 'refunded').length === 100_000 &&
    orders.filter((o) => o.status === 'refunded').map((o) => o.id).length === 100_000,
);

// 2. Fewer than ten matches: the iterator chain walks the whole list too.
const sparse = makeOrders(1_000_000, 400_000);
const arr2: Counts = { filter: 0, map: 0 };
const itr2: Counts = { filter: 0, map: 0 };
const few1 = firstTenWithArrays(sparse, arr2);
const few2 = firstTenWithIterators(sparse, itr2);
check(
  'only 2 refunds: both chains run filter 1,000,000 times and map twice',
  arr2.filter === 1_000_000 && itr2.filter === 1_000_000 && arr2.map === 2 && itr2.map === 2,
  `array ${JSON.stringify(arr2)}  iterator ${JSON.stringify(itr2)}`,
);
check('only 2 refunds: both return the same 2', few1.length === 2 && same(few1, few2), few2.map((r) => r.id).join(', '));

// 3. Single use: the second read of the same iterator is empty.
const out = execFileSync(process.execPath, [join(import.meta.dirname, 'src', 'single-use.ts')], { encoding: 'utf8' }).trim();
check('single-use.ts prints { total: 100000, again: 0 }', out === '{ total: 100000, again: 0 }', out);

// 4. Map entries, no Array.from.
const mapOut = execFileSync(process.execPath, [join(import.meta.dirname, 'src', 'map-entries.ts')], { encoding: 'utf8' }).trim();
check("map-entries.ts prints [ 'keyboard', 'monitor' ]", mapOut === "[ 'keyboard', 'monitor' ]", mapOut);

// 5. Which TypeScript settings give the types.
const probes = runProbes();
const byName = (n: string) => probes.find((p) => p.name.startsWith(n))!;
const angular = byName('angular-22-default');
check(
  "target ES2022 with no lib (Angular 22's default) fails with TS2339 on 'filter'",
  !angular.ok && angular.output.includes("error TS2339: Property 'filter' does not exist on type 'ArrayIterator<number>'."),
  angular.output.split('\n')[0],
);
check('target es2024 with no lib fails the same way', !byName('target es2024').ok);
check('target es2025 compiles', byName('target es2025').ok);
check('no target at all compiles (tsc 7 defaults to es2025)', byName('no target').ok);
check('target ES2022 with lib [es2025, dom] compiles', byName('target ES2022, lib es2025').ok);
check('target ES2022 with es2025.iterator added to lib compiles', byName('target ES2022, lib es2022 + dom + es2025.iterator').ok);

// 6. The demo itself type-checks.
const tsc = join(import.meta.dirname, 'node_modules', 'typescript', 'bin', 'tsc');
let tscOk = true;
let tscOut = '';
try {
  tscOut = execFileSync(process.execPath, [tsc, '-p', join(import.meta.dirname, 'tsconfig.json')], { encoding: 'utf8' }).trim();
} catch (e) {
  tscOk = false;
  tscOut = String((e as { stdout?: string }).stdout ?? e);
}
const version = execFileSync(process.execPath, [tsc, '--version'], { encoding: 'utf8' }).trim();
check(`tsc --noEmit passes on the whole demo (${version})`, tscOk, tscOut.split('\n')[0]);

console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
