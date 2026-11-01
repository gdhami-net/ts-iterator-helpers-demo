import type { Order, Refund } from './rows.ts';

// The snippet in the post: first-ten.ts without the callback counters.
export const firstTenArrays = (orders: Order[]): Refund[] =>
  orders
    .filter((o) => o.status === 'refunded')
    .map((o) => ({ id: o.id, amount: o.amount }))
    .slice(0, 10);

export const firstTenIterators = (orders: Order[]): Refund[] =>
  orders
    .values()
    .filter((o) => o.status === 'refunded')
    .map((o) => ({ id: o.id, amount: o.amount }))
    .take(10)
    .toArray();
