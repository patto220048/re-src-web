import { getResources } from './app/lib/api.js';

async function test() {
  const res = await getResources({ limit: 5 });
  console.log(JSON.stringify(res, null, 2));
}

test();
