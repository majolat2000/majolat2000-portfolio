const fs=require('fs'); 
const content = fs.readFileSync('src/pages/Storefront.tsx', 'utf8'); 
const startIdx = content.indexOf('function AccountPanel'); 
const endIdx = content.indexOf('export default function Storefront()'); 
fs.writeFileSync('src/pages/Storefront.tsx', content.substring(0, startIdx) + fs.readFileSync('newPanel.txt', 'utf8') + '\n\n' + content.substring(endIdx));
