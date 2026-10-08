const fs = require('fs');

// 1. Add Route in main.tsx
let mainTsx = fs.readFileSync('src/main.tsx', 'utf8');
mainTsx = mainTsx.replace(
  'const Storefront = lazy(() => import("./pages/Storefront.tsx"));',
  'const Storefront = lazy(() => import("./pages/Storefront.tsx"));\nconst CoursePage = lazy(() => import("./pages/CoursePage.tsx"));'
);
mainTsx = mainTsx.replace(
  '<Route path="/storefront/admin" element={<StorefrontAdmin />} />',
  '<Route path="/storefront/admin" element={<StorefrontAdmin />} />\n            <Route path="/storefront/product/:id" element={<CoursePage />} />'
);
fs.writeFileSync('src/main.tsx', mainTsx);

// 2. Update navigation in Storefront.tsx
let sfTsx = fs.readFileSync('src/pages/Storefront.tsx', 'utf8');
// Replace the view === "course" block completely
const courseViewRegex = /if\s*\(view\s*===\s*"course"\)\s*\{\s*return\s*\(\s*<div[\s\S]*?<\/div>\s*\);\s*\}/m;
sfTsx = sfTsx.replace(courseViewRegex, '');

// Also remove ` | "course"` from useState
sfTsx = sfTsx.replace(/useState<"storefront" \| "preview" \| "course">/, 'useState<"storefront" | "preview">');

// Update onClick to Navigate or Link
// Since we used Link in the original sfTsx, we can just replace setView("course")
sfTsx = sfTsx.replace(
  'onClick={() => setView("course")}',
  'asChild\n                  >\n                    <Link to={`/storefront/product/${primaryProduct.id}`}>View Course</Link>'
);

fs.writeFileSync('src/pages/Storefront.tsx', sfTsx);
