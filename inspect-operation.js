const BASE_URL = 'https://api.testnet.minepi.com';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  try {
    const opsUrl = `${BASE_URL}/operations?limit=1&order=desc&join=transactions`;
    const opsData = await fetchJson(opsUrl);
    const records = opsData._embedded?.records || [];
    if (records.length === 0) {
      console.log('No operations found');
      return;
    }

    // نبحث عن أول عملية invoke_host_function
    for (const op of records) {
      if (op.type === 'invoke_host_function' || op.type_i === 24) {
        console.log(JSON.stringify(op, null, 2));
        break;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
