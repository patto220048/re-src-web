const fs = require('fs');

let content = fs.readFileSync('app/pricing/PricingClient.js', 'utf8');
content = content.replace(/<a href="\/account\/subscription\/"/g, '<Link href="/account/subscription/"');
content = content.replace(/Manage Subscription\s*<\/a>/g, 'Manage Subscription\n                </Link>');
content = content.replace('import { useRouter, useSearchParams } from "next/navigation";', 'import { useRouter, useSearchParams } from "next/navigation";\nimport Link from "next/link";');
fs.writeFileSync('app/pricing/PricingClient.js', content);

let privacy = fs.readFileSync('app/privacy/page.js', 'utf8');
privacy = privacy.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
fs.writeFileSync('app/privacy/page.js', privacy);

let terms = fs.readFileSync('app/terms/page.js', 'utf8');
terms = terms.replace(/"Terms"/g, '&quot;Terms&quot;');
fs.writeFileSync('app/terms/page.js', terms);
