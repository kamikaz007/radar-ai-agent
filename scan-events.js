const { rpc } = require('@stellar/stellar-sdk');

const RPC_URL = 'https://rpc.testnet.minepi.com';

async function main() {
  const server = new rpc.Server(RPC_URL);
  try {
    // جلب أحدث الأحداث (قد تحتاج إلى معاملات صحيحة)
    const events = await server.getEvents({
      startLedger: 26400000,
      filters: [], // بدون فلتر
      limit: 50,
    });
    console.log('Events found:', events.events?.length || 0);
    if (events.events) {
      for (const ev of events.events) {
        console.log('Event type:', ev.type);
        console.log('Contract ID:', ev.contractId);
        console.log('---');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
