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

    const contractIds = new Set();
    if (events.events) {
      for (const ev of events.events) {
        if (ev.contractId && ev.contractId._id) {
          const hex = toHexString(ev.contractId._id);
          contractIds.add(hex);
        }
      }
    }

    console.log('Unique Contract IDs (hex):');
    for (const id of contractIds) {
      console.log(id);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
