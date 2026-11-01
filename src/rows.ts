export interface Order {
  id: number;
  status: 'paid' | 'refunded';
  amount: number;
}

export interface Refund {
  id: number;
  amount: number;
}

// One row in ten is a refund: rows 9, 19, 29, ... The data is the same on
// every run, so the callback counts below are the same on every run.
export function makeOrders(count: number, refundEvery = 10): Order[] {
  const orders: Order[] = [];
  for (let id = 0; id < count; id++) {
    orders.push({
      id,
      status: id % refundEvery === refundEvery - 1 ? 'refunded' : 'paid',
      amount: (id % 500) + 1,
    });
  }
  return orders;
}

export interface Counts {
  filter: number;
  map: number;
}
