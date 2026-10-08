const fs = require('fs');
let sfTsx = fs.readFileSync('src/pages/Storefront.tsx', 'utf8');

sfTsx = sfTsx.replace(
  `                    asChild
                    <Link to={\`/storefront/product/\${primaryProduct.id}\`}>View Course</Link>`,
  `                    asChild>
                    <Link to={\`/storefront/product/\${primaryProduct.id}\`}>View Course</Link>`
);

sfTsx = sfTsx.replace(
  `                    onClick={() => setView("preview")}
                    View Details`,
  `                    onClick={() => setView("preview")}>
                    View Details`
);

fs.writeFileSync('src/pages/Storefront.tsx', sfTsx);
