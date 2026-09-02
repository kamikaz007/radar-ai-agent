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
    // جلب العمليات من نوع invoke_host_function
    const opsUrl = `${BASE_URL}/operations?limit=200&order=desc&join=transactions`;
    console.log('Fetching operations...');
    const opsData = await fetchJson(opsUrl);

    const records = opsData._embedded?.records || [];
    console.log(`Total operations fetched: ${records.length}`);

    const contractIds = new Set();

    for (const op of records) {
      // نوع العملية 24 هو invoke_host_function في Stellar
      // قد يكون الحقل type_i أو type
      if (op.type === 'invoke_host_function' || op.type_i === 24) {
        console.log('Found invoke_host_function operation:', op.id);
        // نبحث عن معرف العقد في الحقول المختلفة
        // قد يكون في op.contract_id أو op.body أو op.parameters
        const contractId = op.contract_id || op.contract || op.body?.contract_id;
        if (contractId) {
          contractIds.add(contractId);
          console.log('Contract ID:', contractId);
        } else {
          // طباعة العملية كاملة لفحصها
          console.log('Operation details (no contract_id found):');
          console.log(JSON.stringify(op, null, 2).slice(0, 1000));
        }
      }
    }

    console.log('\n=== Unique Contract IDs found ===');
    if (contractIds.size === 0) {
      console.log('No contract IDs found in these operations.');
    } else {
      for (const id of contractIds) {
        console.log(id);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
