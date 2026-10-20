export function buildTxRef(productId: string, userId: string): string {
  // Paystack only allows alphanumeric, hyphens, dots, and equals in references.
  // Use hyphens as separators instead of colons.
  const ts = Date.now();
  return `sf-${productId}-${userId}-${ts}`;
}

export function parseTxRef(
  txRef: string,
): { productId: string; userId: string } | null {
  // Format: sf-<uuid-productId>-<uuid-userId>-<timestamp>
  // UUIDs are 36 chars each (8-4-4-4-12), so we parse by known positions.
  if (!txRef.startsWith("sf-")) return null;
  const rest = txRef.slice(3); // remove "sf-"
  // rest = "<36-char-uuid>-<36-char-uuid>-<timestamp>"
  if (rest.length < 74) return null; // at least two 36-char UUIDs + separator
  const productId = rest.slice(0, 36);
  const userId = rest.slice(37, 73);
  if (!productId || !userId) return null;
  return { productId, userId };
}
