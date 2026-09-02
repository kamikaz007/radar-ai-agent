const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const HORIZON_URL = 'https://api.testnet.minepi.com';

async function fetchHorizonData() {
  try {
    // جلب آخر 200 معاملة
    const txResponse = await fetch(`${HORIZON_URL}/transactions?limit=200&order=desc`);
    const txData = await txResponse.json();
    const transactions = txData._embedded?.records || [];

    // جلب آخر 200 عملية
    const opsResponse = await fetch(`${HORIZON_URL}/operations?limit=200&order=desc`);
    const opsData = await opsResponse.json();
    const operations = opsData._embedded?.records || [];

    // حساب بعض الإحصائيات
    const activeAccounts = new Set(transactions.map(tx => tx.source_account)).size;
    const totalTransactions = transactions.length;
    const totalOperations = operations.length;
    const invokeHostFunctionCount = operations.filter(op => op.type === 'invoke_host_function').length;

    const stats = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      activeAccounts,
      totalTransactions,
      totalOperations,
      invokeHostFunctionCount,
      latestLedger: transactions[0]?.ledger || null,
      latestTxHash: transactions[0]?.hash || null,
    };

    // حفظ في Firestore داخل مجموعة network_stats
    await db.collection('network_stats').add(stats);
    return stats;
  } catch (error) {
    console.error('Error fetching horizon data:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}

// دالة HTTP للاستدعاء اليدوي أو عبر Cron خارجي
exports.fetchNetworkStats = functions.https.onRequest(async (req, res) => {
  try {
    const stats = await fetchHorizonData();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// دالة مجدولة كل 5 دقائق (تتطلب خطة Blaze)
exports.scheduledFetchNetworkStats = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    await fetchHorizonData();
    return null;
  });
