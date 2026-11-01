import { makeOrders } from './rows.ts';

const orders = makeOrders(1_000_000);

const refunds = orders.values().filter((o) => o.status === 'refunded');

const total = refunds.toArray().length;
const again = refunds.toArray().length;

console.log({ total, again });
