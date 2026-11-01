import type { Counts, Order, Refund } from './rows.ts';

// The array chain: every step builds a new array before the next one starts.
export function firstTenWithArrays(orders: Order[], counts: Counts): Refund[] {
  return orders
    .filter((o) => {
      counts.filter++;
      return o.status === 'refunded';
    })
    .map((o) => {
      counts.map++;
      return { id: o.id, amount: o.amount };
    })
    .slice(0, 10);
}

// The iterator chain: one row at a time, and it stops after the tenth.
export function firstTenWithIterators(orders: Order[], counts: Counts): Refund[] {
  return orders
    .values()
    .filter((o) => {
      counts.filter++;
      return o.status === 'refunded';
    })
    .map((o) => {
      counts.map++;
      return { id: o.id, amount: o.amount };
    })
    .take(10)
    .toArray();
}
