# ts-iterator-helpers-demo

The first ten refunds in a million orders, found two ways:

```ts
orders.filter(isRefund).map(toRefund).slice(0, 10);                 // array chain
orders.values().filter(isRefund).map(toRefund).take(10).toArray();   // iterator helpers
```

Every callback is counted, so the result is the same number on every machine.

Companion to the post
[Find the first 10 matches in a million rows without copying the array, using iterator helpers](https://gdhami.net/blog/find-the-first-10-matches-without-copying-the-array-using-iterator-helpers).

## What it proves

`npm run check` asserts each of these and exits 1 if any fails.

| Claim | Result |
|---|---|
| Array chain on 1,000,000 orders, one refund in ten | filter runs 1,000,000 times, map 100,000 times |
| Iterator chain on the same orders | filter runs 100 times, map 10 times |
| Both return the same ten refunds | ids 9, 19, ... 99 |
| Only 2 refunds in the million | both chains run filter 1,000,000 times and map twice |
| Read the same helper iterator twice | `{ total: 100000, again: 0 }` |
| `Map.prototype.entries()` with helpers, no `Array.from` | `[ 'keyboard', 'monitor' ]` |
| `target: "ES2022"` and no `lib` (what `ng new` writes in Angular 22) | `error TS2339: Property 'filter' does not exist on type 'ArrayIterator<number>'.` |
| `target: "es2025"`, no target at all, `lib: ["es2025", "dom"]`, or `"es2025.iterator"` added to `lib` | compiles |
| `tsc -p tsconfig.json` on the whole demo | passes |

## Run it

```sh
npm install
npm run check        # every claim above
npm run bench        # time and allocation, secondary numbers
npm run single-use   # the second read is empty
npm run map          # Map.entries() with filter and map
npm run lib-probe    # what tsc 7 says under each target/lib setting
npm run typecheck    # tsc, noEmit
```

The `.ts` files run directly on Node 22.18+ (type stripping is on by default
there). The iterator helpers themselves need Node 22.0.0 or newer.

## Versions used

- Node v26.1.0, Windows 11
- TypeScript 7.0.2 (`@typescript/typescript-win32-x64`), `@types/node` 26.6.6
- Angular tsconfig template checked in `@schematics/angular` 22.2.4 and 22.2.5
- Browser data: `@mdn/browser-compat-data` 8.1.7, `web-features` 3.44.0

## Time and memory (secondary, machine-dependent)

`npm run bench`: median of 25 runs, Intel Core Ultra 9 285HX, 63 GiB of RAM reported by Node,
Node v26.1.0, Windows 11. "Allocated" is the change in V8's
`total_allocated_bytes` across one run; small values are rounded up to V8's
allocation chunk, so read 256 KiB as "almost nothing".

```
One refund in ten rows (first ten found by row 99):
  array chain                        median   11.085 ms   allocated    8227 KiB
  iterator chain                     median    0.010 ms   allocated     256 KiB

Two refunds in the whole million (both chains walk every row):
  array chain                        median   11.058 ms   allocated     818 KiB
  iterator chain                     median   12.316 ms   allocated   39694 KiB
```

When nothing stops early the iterator chain is a little slower and allocates
far more. About 40 bytes per row points at one `{ value, done }` result object
per step; I haven't profiled it to confirm.

## Edge cases the post leaves out

- `take(n)` closes the iterator it reads from. Store `orders.values().filter(f)`
  in a variable, call `.take(3).toArray()` on it, and the variable is finished:
  its `next()` returns `{ value: undefined, done: true }`. Breaking out of a
  `for...of` over it closes it too.
- Infinite generators work: `gen().filter(odd).map(x10).take(3).toArray()`
  returns `[10, 30, 50]` and the generator's `finally` block runs.
- The helpers pass an index as the second argument (`filter((value, index) => ...)`),
  but there's no third argument: no array to look back at.
- `Iterator.from(x)` wraps any iterable or iterator-like object so the helpers
  work on it.
- Browser support (MDN browser-compat-data 8.1.7): Chrome and Edge 122,
  Firefox 131, Safari and iOS Safari 18.4. Baseline newly available since
  2025-03-31. Angular 22 supports the "Baseline widely available on
  2026-05-07" set, which reaches back to Chrome 119, Firefox 119 and Safari 17.0,
  so it includes browsers without these methods.
- MDN's main `Iterator` page shows "Baseline Widely available, since September
  2016": that banner is about the `Iterator` object, not the helper methods.
  Each method's own page says "Baseline 2025, Newly available".

## License

MIT
