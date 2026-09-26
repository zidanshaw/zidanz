import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const missing = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(root, clean);
    if (!fs.existsSync(target)) missing.push(`${file} -> ${ref}`);
  }
}

if (missing.length) {
  console.error('Missing local references:');
  missing.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML pages. Local references are valid.`);
