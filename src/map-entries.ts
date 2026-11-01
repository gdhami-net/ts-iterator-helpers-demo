const stock = new Map<string, number>([
  ['keyboard', 0],
  ['mouse', 14],
  ['monitor', 0],
  ['dock', 3],
]);

const soldOut = stock
  .entries()
  .filter(([, qty]) => qty === 0)
  .map(([sku]) => sku)
  .toArray();

console.log(soldOut);
