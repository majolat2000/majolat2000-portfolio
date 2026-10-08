export function buildTxRef(productId: string, userId: string): string {
  return `sf:${productId}:${userId}`;
}

export function parseTxRef(
  txRef: string,
): { productId: string; userId: string } | null {
  const parts = txRef.split(":");
  if (parts.length !== 3 || parts[0] !== "sf") return null;
  const [, productId, userId] = parts;
  if (!productId || !userId) return null;
  return { productId, userId };
}
