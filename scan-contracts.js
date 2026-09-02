const { rpc } = require('@stellar/stellar-sdk');

const RPC_URL = 'https://rpc.testnet.minepi.com';

async function main() {
  const server = new rpc.Server(RPC_URL);
  console.log('Fetching latest ledger...');
  const latest = await server.getLatestLedger();
  console.log('Ledger sequence:', latest.sequence);

  // جلب المعاملات في هذا ledger (قد تتطلب الدالة getTransactions)
  try {
    const txs = await server.getTransactions({ ledgerSequence: latest.sequence });
    console.log('Transactions count:', txs.transactions.length);
    for (const tx of txs.transactions) {
      // طباعة نوع المعاملة وأي عمليات بها
      console.log('Tx hash:', tx.hash);
      console.log('Status:', tx.status);
      if (tx.envelopeXdr) {
        // يمكن فك الترميز لاستخراج العناوين لكنها معقدة هنا
      }
    }
  } catch (e) {
    console.log('Could not get transactions:', e.message);
  }

  // بديل: محاولة جلب السجلات من نوع contractCode
  try {
    const entries = await server.getLedgerEntries({ ledgerSeq: latest.sequence, type: 'contractCode' });
    console.log('Contract code entries found:', entries.entries?.length || 0);
    if (entries.entries) {
      for (const entry of entries.entries) {
        console.log('Contract ID (from key):', entry.key);
      }
    }
  } catch (e) {
    console.log('Could not get contractCode entries:', e.message);
  }

  // أيضاً جرب contractData
  try {
    const entries = await server.getLedgerEntries({ ledgerSeq: latest.sequence, type: 'contractData' });
    console.log('Contract data entries found:', entries.entries?.length || 0);
    if (entries.entries) {
      for (const entry of entries.entries.slice(0, 20)) {
        console.log('Entry key:', entry.key);
      }
    }
  } catch (e) {
    console.log('Could not get contractData entries:', e.message);
  }
}

main();
