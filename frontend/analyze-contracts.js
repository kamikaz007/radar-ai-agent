const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cron = require('node-cron');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();
const HORIZON_URL = 'https://api.testnet.minepi.com';

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

    // عدّ العمليات لكل عقد (نستخدم source_account كمعرف مبدئي، لأن معرف العقد غير مكشوف مباشرة)
    const contractCounts = {};
    for (const op of operations) {
      // نستخرج عنوان العقد من المعاملات أو نستخدم source_account كتجميع
      // في Horizon، العملية تحتوي على source_account وهو الحساب الذي استدعى العقد
      // لكننا نريد معرفة العقد نفسه. يمكن محاولة استخراجه من parameters أو effects
      // حالياً سنستخدم source_account للتبسيط، وسنحاول لاحقاً استخراج العقد بدقة
      const key = op.source_account;
      if (!contractCounts[key]) {
        contractCounts[key] = {
          source_account: key,
          operation_count: 0,
          last_activity: op.created_at,
          transaction_count: 0,
        };
      }
      contractCounts[key].operation_count += 1;
      contractCounts[key].last_activity = op.created_at;
    }

    // حفظ النتائج في Firestore
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

// تشغيل فوري
analyzeContractActivity();

// جدولة كل 10 دقائق
cron.schedule('*/10 * * * *', analyzeContractActivity);

console.log('⏳ Contract analyzer running...');
