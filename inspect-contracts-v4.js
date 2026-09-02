const { rpc, StrKey } = require('@stellar/stellar-sdk');

const RPC_URL = 'https://rpc.testnet.minepi.com';

function toHexString(byteArray) {
  return Buffer.from(byteArray).toString('hex');
}

async function main() {
  const server = new rpc.Server(RPC_URL);
  try {
    const events = await server.getEvents({
      startLedger: 26400000,
      filters: [],
      limit: 200,
    });

    const contractMap = new Map(); // hex -> { strKey, idBytes }

    if (events.events) {
      for (const ev of events.events) {
        if (ev.contractId && ev.contractId._id) {
          const idBytes = ev.contractId._id;
          const hex = toHexString(idBytes);
          if (!contractMap.has(hex)) {
            try {
              const strKey = StrKey.encodeContract(Buffer.from(idBytes));
              contractMap.set(hex, { strKey, idBytes });
            } catch (e) {
              console.log('Error encoding contract for', hex, ':', e.message);
            }
          }
        }
      }
    }

    console.log(`Found ${contractMap.size} unique contracts.\n`);

    for (const [hex, { strKey, idBytes }] of contractMap.entries()) {
      console.log(`\n=== Contract: ${hex} ===`);
      console.log('StrKey:', strKey);

      // جلب الطرق باستخدام StrKey
      try {
        const methods = await server.getContractMethods(strKey);
        console.log('Methods:');
        if (methods && methods.methods) {
          for (const m of methods.methods) {
            console.log(' -', m.name, '=>', m.kind, '(', m.inputs?.map(i => i.type).join(', ') || '', ')');
          }
        } else {
          console.log('  (no methods found)');
        }
      } catch (e) {
        console.log('  Error fetching methods:', e.message);
      }

      // جلب بيانات العقد
      try {
        const instance = await server.getContractInstance(strKey);
        console.log('Instance info:', JSON.stringify(instance, null, 2).slice(0, 500));
      } catch (e) {
        console.log('  Error fetching instance:', e.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
