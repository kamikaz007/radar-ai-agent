const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cron = require('node-cron');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();

async function checkAlerts() {
  try {
    console.log('Checking for golden opportunities...');
    const classifiedSnapshot = await db.collection('classified_projects').where('tier', '==', 'golden').get();
    const goldenProjects = [];
    classifiedSnapshot.forEach(doc => goldenProjects.push({ id: doc.id, ...doc.data() }));

    if (goldenProjects.length === 0) {
      console.log('No golden projects found.');
      return;
    }

    // جلب آخر تنبيهات لتجنب التكرار
    const alertsSnapshot = await db.collection('alerts').orderBy('timestamp', 'desc').limit(50).get();
    const recentAlertIds = new Set();
    alertsSnapshot.forEach(doc => recentAlertIds.add(doc.data().contract_id));

    for (const project of goldenProjects) {
      if (!recentAlertIds.has(project.id)) {
        // إنشاء تنبيه جديد
        const alert = {
          contract_id: project.id,
          message: `فرصة ذهبية: ${project.id.slice(0, 12)}... نشاط مرتفع (${project.operation_count} عملية)`,
          timestamp: FieldValue.serverTimestamp(),
          seen: false,
        };
        await db.collection('alerts').add(alert);
        console.log('🔔 New alert:', alert.message);
      }
    }
    console.log('Alerts check completed.');
  } catch (error) {
    console.error('❌ Error checking alerts:', error.message);
  }
}

checkAlerts();
cron.schedule('*/5 * * * *', checkAlerts);
console.log('⏳ Alert checker running...');
