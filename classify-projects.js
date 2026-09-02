const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const cron = require('node-cron');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

const db = getFirestore();

async function classifyProjects() {
  try {
    console.log('Classifying projects...');
    
    // جلب نشاط العقود
    const activitySnapshot = await db.collection('contract_activity').get();
    const activities = [];
    activitySnapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });

    if (activities.length === 0) {
      console.log('No activity data to classify.');
      return;
    }

    // حساب متوسط النشاط والانحراف المعياري
    const counts = activities.map(a => a.operation_count || 0);
    const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    
    console.log(`Average operations: ${avg.toFixed(2)}, Std Dev: ${stdDev.toFixed(2)}`);

    // التصنيف بناءً على النشاط
    const classified = activities.map(activity => {
      const score = activity.operation_count || 0;
      // ذهبي إذا كان النشاط أعلى من المتوسط + انحراف معياري واحد
      const tier = score > (avg + stdDev) ? 'golden' : 'safe';
      
      return {
        ...activity,
        tier,
        classification_score: score,
        classified_at: FieldValue.serverTimestamp(),
      };
    });

    // حفظ التصنيفات في Firestore
    for (const item of classified) {
      await db.collection('classified_projects').doc(item.id).set(item, { merge: true });
    }

    // إحصائيات التصنيف
    const goldenCount = classified.filter(c => c.tier === 'golden').length;
    const safeCount = classified.filter(c => c.tier === 'safe').length;
    
    console.log(`✅ Classified: ${goldenCount} golden, ${safeCount} safe`);
  } catch (error) {
    console.error('❌ Error classifying projects:', error.message);
  }
}

// تشغيل فوري
classifyProjects();

// جدولة كل 15 دقيقة
cron.schedule('*/15 * * * *', classifyProjects);

console.log('⏳ Classifier running...');
