const { rpc } = require('@stellar/stellar-sdk');

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

    const contractMap = new Map(); // hex -> _id (Uint8Array)

    if (events.events) {
      for (const ev of events.events) {
        if (ev.contractId && ev.contractId._id) {
          const hex = toHexString(ev.contractId._id);
          if (!contractMap.has(hex)) {
            contractMap.set(hex, ev.contractId._id);
          }
        }
      }
    }

    console.log(`Found ${contractMap.size} unique contracts.\n`);

    for (const [hex, idBytes] of contractMap.entries()) {
      console.log(`\n=== Contract: ${hex} ===`);
      try {
        // نمرر الـ Uint8Array مباشرة
        const methods = await server.getContractMethods(idBytes);
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

      try {
        const instance = await server.getContractInstance(idBytes);
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
