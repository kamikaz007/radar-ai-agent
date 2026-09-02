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
    const operationId = '113621719138197505'; // أول عملية invoke_host_function وجدناها سابقاً
    const opUrl = `${BASE_URL}/operations/${operationId}`;
    const op = await fetchJson(opUrl);
    
    console.log('Operation type:', op.type);
    console.log('Full operation:');
    console.log(JSON.stringify(op, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
