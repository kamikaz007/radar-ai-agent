const { rpc } = require('@stellar/stellar-sdk');

const RPC_URL = 'https://rpc.testnet.minepi.com';

async function main() {
  const server = new rpc.Server(RPC_URL);
  try {
    const events = await server.getEvents({
      startLedger: 26400000,
      filters: [],
      limit: 200,
    });

    const contractMap = new Map(); // hex -> Contract object

    if (events.events) {
      for (const ev of events.events) {
        if (ev.contractId) {
          // استخراج hex من _id
          const hex = Buffer.from(ev.contractId._id).toString('hex');
          if (!contractMap.has(hex)) {
            contractMap.set(hex, ev.contractId);
          }
        }
      }
    }

    console.log(`Found ${contractMap.size} unique contracts.\n`);

    for (const [hex, contractObj] of contractMap.entries()) {
      console.log(`\n=== Contract: ${hex} ===`);
      try {
        const methods = await server.getContractMethods(contractObj);
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
        const instance = await server.getContractInstance(contractObj);
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
