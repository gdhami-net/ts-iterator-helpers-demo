// Secondary numbers: time and bytes allocated per run. These depend on the
// machine and the Node version; the callback counts in check.ts do not.
// Run with: node --expose-gc src/bench.ts
import { cpus, totalmem } from 'node:os';
import { getHeapStatistics } from 'node:v8';
import { makeOrders, type Counts, type Order, type Refund } from './rows.ts';
import { firstTenWithArrays, firstTenWithIterators } from './first-ten.ts';

const gc = (globalThis as { gc?: () => void }).gc;
const RUNS = 25;

function measure(name: string, orders: Order[], fn: (o: Order[], c: Counts) => Refund[]) {
  const times: number[] = [];
  const bytes: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    gc?.();
    const before = getHeapStatistics().total_allocated_bytes;
    const t0 = performance.now();
    fn(orders, { filter: 0, map: 0 });
    times.push(performance.now() - t0);
    bytes.push(getHeapStatistics().total_allocated_bytes - before);
  }
  const median = (xs: number[]) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)];
  console.log(
    `${name.padEnd(36)} median ${median(times).toFixed(3).padStart(8)} ms   allocated ${(median(bytes) / 1024).toFixed(0).padStart(7)} KiB`,
  );
}

console.log(`Node ${process.version}, ${cpus()[0].model}, ${(totalmem() / 2 ** 30).toFixed(0)} GiB RAM, ${RUNS} runs each\n`);

const oneInTen = makeOrders(1_000_000);
console.log('One refund in ten rows (first ten found by row 99):');
measure('  array chain', oneInTen, firstTenWithArrays);
measure('  iterator chain', oneInTen, firstTenWithIterators);

const onlyTwo = makeOrders(1_000_000, 400_000);
console.log('\nTwo refunds in the whole million (both chains walk every row):');
measure('  array chain', onlyTwo, firstTenWithArrays);
measure('  iterator chain', onlyTwo, firstTenWithIterators);
