const fs = require('fs');
let txt = fs.readFileSync('newPanel.txt', 'utf8');
txt = txt.replace('useState<ProductAccess[]>', 'useState<AccessGrantWithProduct[]>');
txt = txt.replace('portfolio.adminEmails?.includes(session.user.email ?? "") || false', 'session.user.email === portfolio.email');
fs.writeFileSync('newPanel.txt', txt);
