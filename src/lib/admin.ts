export function matchesStock(quantity: number, filter: string) {
  return filter === "Out" ? quantity === 0 : filter === "Low" ? quantity > 0 && quantity <= 5 : true;
}
