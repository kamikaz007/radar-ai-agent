const { rpc } = require('@stellar/stellar-sdk');

const RPC_URL = 'https://rpc.testnet.minepi.com';

async function main() {
  try {
    // إنشاء كائن الاتصال بـ RPC
    const server = new rpc.Server(RPC_URL);

    // فحص صحة الشبكة
    const health = await server.getHealth();
    console.log('Network health:', health);

    // جلب أحدث دفتر أستاذ
    const latestLedger = await server.getLatestLedger();
    console.log('Latest ledger:', latestLedger);

    console.log('✅ Connected successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error(error);
  }
}

main();
