const fs = require('fs');
let code = fs.readFileSync('src/pages/StorefrontAdmin.tsx', 'utf8');

// Import adminDeleteProduct and AuthPanel
code = code.replace(
  'adminAddProduct,',
  'adminAddProduct,\n  adminDeleteProduct,'
);
code = code.replace(
  'import { Link, Navigate } from "react-router";',
  'import { Link, Navigate } from "react-router";\nimport { AuthPanel } from "./Storefront";'
);

// Delete Handler
const deleteHandler = `
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setBusy(true);
    setError(null);
    try {
      await adminDeleteProduct(productId);
      setMessage("Product deleted.");
      setProducts(await listProducts());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
`;
code = code.replace(
  'const handleAddProduct = async (event: FormEvent) => {',
  deleteHandler + '\n  const handleAddProduct = async (event: FormEvent) => {'
);

// Auth fallback
code = code.replace(
  `  if (!session || !isAdmin) {
    return <Navigate to="/storefront" replace />;
  }`,
  `  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <AuthPanel />
      </div>
    );
  }
  if (!isAdmin) {
    return <Navigate to="/storefront" replace />;
  }`
);

// Delete button in the catalog list
code = code.replace(
  `{product.duration_days} days
                          </span>
                        </li>`,
  `{product.duration_days} days
                          </span>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="ml-4 shrink-0" 
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={busy}
                          >
                            Delete
                          </Button>
                        </li>`
);

// Lifetime Access Option in Add Product
code = code.replace(
  `<Label htmlFor="product-days">Access (days)</Label>`,
  `<div className="flex items-center justify-between"><Label htmlFor="product-days">Access (days)</Label><span className="text-[10px] text-muted-foreground">Or type 36500 for Lifetime</span></div>`
);

// Lifetime Access in Grant Access
code = code.replace(
  `<Label htmlFor="grant-days">Days of access</Label>`,
  `<div className="flex items-center justify-between"><Label htmlFor="grant-days">Days of access</Label><span className="text-[10px] text-muted-foreground">36500 = Lifetime</span></div>`
);

fs.writeFileSync('src/pages/StorefrontAdmin.tsx', code);
