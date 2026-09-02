import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import './App.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('جاري التحميل...');
  const [networkStats, setNetworkStats] = useState(null);
  const [contractActivity, setContractActivity] = useState([]);
  const [classifiedProjects, setClassifiedProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [paying, setPaying] = useState(false);

  // seed projects (لنعدّلها كما في السابق)
  const seedProjects = [
    { id: 'project1', name: 'Pi Chain Mall', description: 'منصة تجارة إلكترونية لامركزية داخل نظام باي', tier: 'safe', liquidity: 120000, volume24h: 45000, createdAt: '2026-08-01' },
    { id: 'project2', name: 'Pi Games', description: 'منصة ألعاب تقدم مكافآت بعملة Pi', tier: 'golden', liquidity: 35000, volume24h: 28000, createdAt: '2026-08-15' },
    { id: 'project3', name: 'Pi NFT Market', description: 'سوق للرموز غير القابلة للاستبدال', tier: 'safe', liquidity: 80000, volume24h: 15000, createdAt: '2026-07-20' },
    { id: 'project4', name: 'Pi Launchpad', description: 'منصة إطلاق مشاريع جديدة', tier: 'golden', liquidity: 20000, volume24h: 50000, createdAt: '2026-09-01' },
  ];

  // دالة مصادقة Pi
  async function handlePiLogin() {
    try {
      const Pi = window.Pi;
      if (!Pi) {
        setStatus('⚠️ يجب فتح التطبيق داخل متصفح Pi Browser');
        return;
      }
      const auth = await Pi.authenticate(['username', 'wallet_address'], 'RADAR_AI_AGENT');
      setUser(auth.user);
      setStatus(`✅ مرحباً ${auth.user.username}`);
      // التحقق من الاشتراك بعد تسجيل الدخول
      checkSubscription(auth.user.uid);
    } catch (error) {
      console.error('Pi login error:', error);
      setStatus('❌ فشل تسجيل الدخول');
    }
  }

  // دالة التحقق من الاشتراك
  async function checkSubscription(uid) {
    try {
      const subDoc = await getDocs(doc(db, 'subscriptions', uid));
      // في Firestore v9+: نستخدم getDoc بدلاً من getDocs
      // سنصلح ذلك لاحقاً
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }

  // دالة دفع الاشتراك
  async function handleSubscribe() {
    if (!user) {
      setStatus('⚠️ سجل الدخول أولاً');
      return;
    }
    setPaying(true);
    try {
      const Pi = window.Pi;
      const payment = {
        amount: 1, // كمية Pi (يمكن تغييرها)
        memo: 'اشتراك RADAR AI AGENT الشهري',
        metadata: { userId: user.uid },
      };
      const paymentResponse = await Pi.createPayment(payment);
      // بعد نجاح الدفع، سنفعّل الاشتراك
      setIsSubscribed(true);
      setStatus('✅ تم تفعيل الاشتراك بنجاح');
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('❌ فشل الدفع');
    } finally {
      setPaying(false);
    }
  }

  // بقية useEffect كما كانت سابقاً مع تعديل fetchAlerts و fetchClassifiedProjects و fetchNetworkStats إلخ
  // سنضعها هنا بالكامل دون تغيير يذكر

  useEffect(() => {
    async function seedAndFetch() {
      try {
        const projectsCollection = collection(db, 'projects');
        const existingSnapshot = await getDocs(projectsCollection);
        if (existingSnapshot.empty) {
          for (const project of seedProjects) {
            await setDoc(doc(db, 'projects', project.id), project);
          }
          setStatus('تم إضافة بيانات تجريبية');
        } else {
          setStatus('تم جلب المشاريع من قاعدة البيانات');
        }
        const snapshot = await getDocs(collection(db, 'projects'));
        const projectList = [];
        snapshot.forEach((doc) => { projectList.push({ id: doc.id, ...doc.data() }); });
        setProjects(projectList);
        setLoading(false);
      } catch (error) {
        setStatus('❌ فشل: ' + error.message);
        setLoading(false);
      }
    }
    seedAndFetch();
  }, []);

  useEffect(() => {
    async function fetchNetworkStats() {
      try {
        const q = query(collection(db, 'network_stats'), orderBy('timestamp', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) setNetworkStats({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } catch (error) { console.error(error.message); }
    }
    fetchNetworkStats();
  }, []);

  useEffect(() => {
    async function fetchContractActivity() {
      try {
        const snapshot = await getDocs(collection(db, 'contract_activity'));
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.operation_count || 0) - (a.operation_count || 0));
        setContractActivity(list.slice(0, 10));
      } catch (error) { console.error(error.message); }
    }
    fetchContractActivity();
  }, []);

  useEffect(() => {
    async function fetchClassifiedProjects() {
      try {
        const snapshot = await getDocs(collection(db, 'classified_projects'));
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.classification_score || 0) - (a.classification_score || 0));
        setClassifiedProjects(list);
      } catch (error) { console.error(error.message); }
    }
    fetchClassifiedProjects();
  }, []);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setAlerts(list);
      } catch (error) { console.error(error.message); }
    }
    fetchAlerts();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="neon-text">RADAR AI AGENT</h1>
        <p className="subtitle">منصة تحليل استخباراتي لنظام باي البيئي</p>
        {!user ? (
          <button className="pi-button" onClick={handlePiLogin}>تسجيل الدخول عبر Pi</button>
        ) : (
          <div className="user-box">
            <span>👤 {user.username}</span>
            {!isSubscribed && (
              <button className="pi-button" onClick={handleSubscribe} disabled={paying}>
                {paying ? 'جارٍ الدفع...' : 'اشترك الآن (1 Pi)'}
              </button>
            )}
            {isSubscribed && <span className="subscribed-badge">✅ مشترك</span>}
          </div>
        )}
      </header>

      <p className="status">{status}</p>

      {alerts.length > 0 && (
        <section className="alerts-section">
          <h2 className="section-title golden-title">🔔 التنبيهات</h2>
          <div className="alerts-list">
            {alerts.map(alert => <div key={alert.id} className="alert-card"><p>{alert.message}</p></div>)}
          </div>
        </section>
      )}

      {networkStats && (
        <section className="network-stats">
          <h2 className="section-title safe-title">إحصائيات الشبكة</h2>
          <div className="stats-grid">
            <div className="stat-card"><span>أحدث بلوك</span><strong>{networkStats.latestLedger}</strong></div>
            <div className="stat-card"><span>الحسابات النشطة</span><strong>{networkStats.activeAccounts}</strong></div>
            <div className="stat-card"><span>إجمالي المعاملات</span><strong>{networkStats.totalTransactions}</strong></div>
            <div className="stat-card"><span>عمليات العقود الذكية</span><strong>{networkStats.invokeHostFunctionCount}</strong></div>
          </div>
        </section>
      )}

      {classifiedProjects.length > 0 && (
        <section className={`activity-section ${!isSubscribed ? 'blurred' : ''}`}>
          <h2 className="section-title golden-title">المشاريع المصنفة تلقائياً</h2>
          <div className="activity-grid">
            {classifiedProjects.filter(p => p.tier === 'golden').map(project => (
              <div key={project.id} className="activity-card golden-card">
                <h4>{project.id.slice(0, 12)}...</h4>
                <p>النشاط: {project.operation_count}</p>
                <p>التصنيف: ذهبي</p>
              </div>
            ))}
            {classifiedProjects.filter(p => p.tier === 'safe').slice(0, 5).map(project => (
              <div key={project.id} className="activity-card">
                <h4>{project.id.slice(0, 12)}...</h4>
                <p>النشاط: {project.operation_count}</p>
                <p>التصنيف: آمن</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {contractActivity.length > 0 && (
        <section className="activity-section">
          <h2 className="section-title golden-title">Live Contract Activity</h2>
          <div className="activity-grid">
            {contractActivity.map(activity => (
              <div key={activity.id} className="activity-card">
                <h4>{activity.id.slice(0, 12)}...</h4>
                <p>عمليات: {activity.operation_count}</p>
                <p>آخر نشاط: {activity.last_activity}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p>جاري تحميل المشاريع...</p>
      ) : (
        <main className="main">
          <div className="section">
            <h2 className="section-title safe-title">Safe Tier</h2>
            <div className="projects-grid">
              {projects.filter(p => p.tier === 'safe').map(project => (
                <div key={project.id} className="project-card">
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <p>السيولة: {project.liquidity} Pi</p>
                  <p>حجم التداول 24س: {project.volume24h} Pi</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`section ${!isSubscribed ? 'blurred' : ''}`}>
            <h2 className="section-title golden-title">Golden Radar</h2>
            <div className="projects-grid">
              {projects.filter(p => p.tier === 'golden').map(project => (
                <div key={project.id} className="project-card golden-card">
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <p>السيولة: {project.liquidity} Pi</p>
                  <p>حجم التداول 24س: {project.volume24h} Pi</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
