const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cron = require('node-cron');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();
const HORIZON_URL = 'https://api.testnet.minepi.com';

// دالة لجلب effects لعملية معينة واستخراج contract_id
async function getContractIdFromEffects(operationId) {
  try {
    const response = await fetch(`${HORIZON_URL}/operations/${operationId}/effects?limit=1`);
    const data = await response.json();
    const records = data._embedded?.records || [];
    if (records.length > 0) {
      // البحث عن effect يحتوي على contract_id
      for (const effect of records) {
        if (effect.contract_id) {
          return effect.contract_id;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function analyzeContractActivity() {
  try {
    console.log('Analyzing contract activity...');
    // جلب آخر 200 عملية من نوع invoke_host_function
    const response = await fetch(`${HORIZON_URL}/operations?limit=200&order=desc&filter=invoke_host_function`);
    const data = await response.json();
    const operations = data._embedded?.records || [];

    if (operations.length === 0) {
      console.log('No contract operations found.');
      return;
    }

    // تجميع العمليات حسب contract_id الفعلي
    const contractCounts = {};
    for (const op of operations) {
      let contractId = op.contract_id || null;
      if (!contractId) {
        // محاولة جلبه من effects
        contractId = await getContractIdFromEffects(op.id);
      }
      // إذا لم نجد، نستخدم source_account كخطة بديلة
      if (!contractId) {
        contractId = op.source_account;
      }

      if (!contractCounts[contractId]) {
        contractCounts[contractId] = {
          contract_id: contractId,
          operation_count: 0,
          last_activity: op.created_at,
        };
      }
      contractCounts[contractId].operation_count += 1;
      contractCounts[contractId].last_activity = op.created_at;
    }

    // حفظ النتائج
    for (const [key, activity] of Object.entries(contractCounts)) {
      await db.collection('contract_activity').doc(key).set({
        ...activity,
        updated_at: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    console.log(`✅ Saved activity for ${Object.keys(contractCounts).length} contracts`);
  } catch (error) {
    console.error('❌ Error analyzing contracts:', error.message);
  }
}

analyzeContractActivity();
cron.schedule('*/10 * * * *', analyzeContractActivity);
console.log('⏳ Contract analyzer running...');
