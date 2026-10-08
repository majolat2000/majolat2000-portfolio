const fs = require('fs');
let storeTs = fs.readFileSync('src/lib/store.ts', 'utf8');

// 1. Fix listMyAccess to filter by current user
storeTs = storeTs.replace(
  'export async function listMyAccess(): Promise<AccessGrantWithProduct[]> {',
  'export async function listMyAccess(userId: string): Promise<AccessGrantWithProduct[]> {'
);
storeTs = storeTs.replace(
  '.gte("expires_at", new Date().toISOString())',
  '.eq("user_id", userId)\n    .gte("expires_at", new Date().toISOString())'
);

// 2. Add adminDeleteProduct
const deleteFunc = `
export async function adminDeleteProduct(productId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);
  if (error) throw new Error(error.message);
}
`;
storeTs += deleteFunc;

fs.writeFileSync('src/lib/store.ts', storeTs);

// 3. Fix Storefront.tsx to pass session.user.id to listMyAccess
let sfTs = fs.readFileSync('src/pages/Storefront.tsx', 'utf8');
sfTs = sfTs.replace('listMyAccess()', 'listMyAccess(session.user.id)');

// Also export AuthPanel
sfTs = sfTs.replace('function AuthPanel()', 'export function AuthPanel()');

// And remove the Dashboard "Admin" button
sfTs = sfTs.replace(/\{\s*isAdmin && \(\s*<Button\s*variant="outline"\s*asChild\s*className="flex-1 rounded-full font-semibold"\s*>\s*<Link to="\/storefront\/admin">\s*<ShieldCheck className="size-4" \/>\s*Admin\s*<\/Link>\s*<\/Button>\s*\)\s*\}/, '');
sfTs = sfTs.replace(/\{\s*isAdmin\s*\?\s*\(\s*<Button[^>]+>\s*<Link to="\/storefront\/admin">.*?<\/Link>\s*<\/Button>\s*\)\s*:\s*null\s*\}/g, '');

fs.writeFileSync('src/pages/Storefront.tsx', sfTs);
