import React, { useEffect, useState, useRef } from 'react';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import './App.css';
import { FiZap, FiBell, FiActivity, FiShield, FiTrendingUp, FiLock, FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  const previousTarget = useRef(target);

  useEffect(() => {
    if (previousTarget.current === target) return;
    previousTarget.current = target;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}

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
  const [piReady, setPiReady] = useState(false);
  const matrixCanvasRef = useRef(null);
  const [analysisLine, setAnalysisLine] = useState('');

  const activeAccounts = useCountUp(networkStats?.activeAccounts || 0, 1500);
  const totalTransactions = useCountUp(networkStats?.totalTransactions || 0, 1500);
  const totalOperations = useCountUp(networkStats?.totalOperations || 0, 1500);
  const invokeCount = useCountUp(networkStats?.invokeHostFunctionCount || 0, 1500);

  const seedProjects = [
    { id: 'project1', name: 'Pi Chain Mall', description: 'منصة تجارة إلكترونية لامركزية داخل نظام باي', tier: 'safe', liquidity: 120000, volume24h: 45000, createdAt: '2026-08-01', trend: 'up' },
    { id: 'project2', name: 'Pi Games', description: 'منصة ألعاب تقدم مكافآت بعملة Pi', tier: 'golden', liquidity: 35000, volume24h: 28000, createdAt: '2026-08-15', trend: 'down' },
    { id: 'project3', name: 'Pi NFT Market', description: 'سوق للرموز غير القابلة للاستبدال', tier: 'safe', liquidity: 80000, volume24h: 15000, createdAt: '2026-07-20', trend: 'neutral' },
    { id: 'project4', name: 'Pi Launchpad', description: 'منصة إطلاق مشاريع جديدة', tier: 'golden', liquidity: 20000, volume24h: 50000, createdAt: '2026-09-01', trend: 'up' },
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <FiArrowUp style={{ color: '#00ff88' }} />;
    if (trend === 'down') return <FiArrowDown style={{ color: '#ff4444' }} />;
    return <FiMinus style={{ color: '#888' }} />;
  };

  useEffect(() => {
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    const columns = Math.floor(window.innerWidth / 20);
    const drops = Array(columns).fill(0);
    const chars = '01';
    const fontSize = 16;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops.length = Math.floor(canvas.width / fontSize);
      drops.fill(0);
    };
    resize();
    window.addEventListener('resize', resize);

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(char, x, y);
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(drawMatrix);
    };
    drawMatrix();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const phrases = [
      'تحليل العقود الذكية...',
      'فحص أحواض السيولة...',
      'رصد المعاملات الجديدة...',
      'تحديد الفرص الذهبية...',
      'تتبع الأنشطة المشبوهة...',
      'جلب بيانات البلوكشين...',
    ];
    let intervalId;
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    intervalId = setInterval(() => {
      const currentPhrase = phrases[phraseIndex];
      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }
      setAnalysisLine(currentPhrase.substring(0, charIndex));
      if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        setTimeout(() => {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }, 1500);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }, 80);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    async function initPi() {
      try {
        if (window.Pi && typeof window.Pi.init === 'function') {
          await window.Pi.init({ version: '2.0' });
          setPiReady(true);
        }
      } catch (error) {
        console.error('Pi init error:', error);
      }
    }
    initPi();
  }, []);

  async function approvePaymentOnServer(paymentId) {
    try {
      const response = await fetch('/.netlify/functions/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Approval response not ok:', response.status, data);
        return { success: false, error: data.error || 'HTTP ' + response.status };
      }
      return data;
    } catch (error) {
      console.error('Approval request failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async function completePaymentOnServer(paymentId, txid) {
    try {
      const response = await fetch('/.netlify/functions/complete-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, txid }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Completion response not ok:', response.status, data);
        return { success: false, error: data.error || 'HTTP ' + response.status };
      }
      return data;
    } catch (error) {
      console.error('Completion request failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async function saveSubscription(payment) {
    if (!user) return;
    try {
      await setDoc(doc(db, 'subscriptions', user.uid), {
        paymentId: payment.paymentId,
        amount: payment.amount,
        memo: payment.memo,
        timestamp: new Date().toISOString(),
        uid: user.uid,
        username: user.username,
      });
      setIsSubscribed(true);
      setStatus('✅ تم تفعيل الاشتراك بنجاح');
    } catch (error) {
      console.error('Error saving subscription:', error);
      setStatus('❌ فشل حفظ الاشتراك');
    }
  }

  async function handlePiLogin() {
    try {
      const Pi = window.Pi;
      if (!Pi) {
        setStatus('❌ Pi SDK غير محمّل. تأكد أنك داخل متصفح Pi Browser');
        return;
      }
      if (!piReady) {
        setStatus('⏳ Pi SDK لم يكتمل تهيئته بعد، حاول مرة أخرى');
        return;
      }
      setStatus('⏳ جاري المصادقة...');
      const auth = await Pi.authenticate(['username', 'wallet_address', 'payments'], 'RADAR_AI_AGENT');
      setUser(auth.user);
      setStatus(`✅ مرحباً ${auth.user.username}`);
      const subDoc = await getDoc(doc(db, 'subscriptions', auth.user.uid));
      if (subDoc.exists()) {
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Pi login error:', error);
      setStatus('❌ فشل تسجيل الدخول: ' + (error.message || 'خطأ غير معروف'));
    }
  }

  async function handleSubscribe() {
    if (!user) {
      setStatus('⚠️ سجل الدخول أولاً');
      return;
    }
    setPaying(true);
    try {
      const Pi = window.Pi;
      if (!Pi) {
        setStatus('❌ Pi SDK غير محمّل. تأكد أنك داخل متصفح Pi Browser');
        setPaying(false);
        return;
      }

      const paymentData = {
        amount: 1,
        memo: 'اشتراك RADAR AI AGENT الشهري',
        metadata: { userId: user.uid },
      };

      Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId) => {
          setStatus('⏳ بانتظار موافقة الخادم...');
          const approvalResult = await approvePaymentOnServer(paymentId);
          if (approvalResult.success) {
            setStatus('✅ تمت الموافقة على الدفع، بانتظار الاكتمال...');
          } else {
            setStatus('❌ فشلت موافقة الخادم: ' + (approvalResult.error || 'خطأ غير معروف'));
            setPaying(false);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          setStatus('⏳ جاري إتمام الدفع...');
          const completeData = await completePaymentOnServer(paymentId, txid);
          if (completeData.success) {
            await saveSubscription({ paymentId, amount: paymentData.amount, memo: paymentData.memo });
          } else {
            setStatus('⚠️ فشل إتمام الدفع: ' + (completeData.error || 'خطأ غير معروف'));
          }
          setPaying(false);
        },
        onCancel: () => {
          setStatus('❌ تم إلغاء الدفع');
          setPaying(false);
        },
        onError: (error) => {
          setStatus('❌ فشل الدفع: ' + (error.message || 'خطأ غير معروف'));
          setPaying(false);
        },
      });
    } catch (error) {
      setStatus('❌ فشل الدفع: ' + (error.message || 'خطأ غير معروف'));
      setPaying(false);
    }
  }

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
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.trend) data.trend = 'neutral';
          projectList.push({ id: doc.id, ...data });
        });
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
      <canvas ref={matrixCanvasRef} id="matrix-canvas" />
      <header className="header">
        <h1 className="neon-text">RADAR AI AGENT</h1>
        <p className="subtitle">
          <FiActivity style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
          <span className="typing-text">منصة تحليل استخباراتي لنظام باي البيئي</span>
        </p>
        <div className="analysis-line">{analysisLine}</div>
        {!user ? (
          <button className="pi-button" onClick={handlePiLogin}>
            <FiLock style={{ marginRight: '5px' }} /> تسجيل الدخول عبر Pi
          </button>
        ) : (
          <div className="user-box">
            <span>👤 {user.username}</span>
            {!isSubscribed && (
              <button className="pi-button" onClick={handleSubscribe} disabled={paying}>
                {paying ? 'جارٍ الدفع...' : <><FiZap /> اشترك الآن (1 Pi)</>}
              </button>
            )}
            {isSubscribed && <span className="subscribed-badge">✅ مشترك</span>}
          </div>
        )}
      </header>

      <p className="status">{status}</p>

      {alerts.length > 0 && (
        <section className="alerts-section">
          <h2 className="section-title golden-title"><FiBell /> التنبيهات</h2>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className="alert-card"><p>{alert.message}</p></div>
            ))}
          </div>
        </section>
      )}

      {networkStats && (
        <section className="network-stats">
          <h2 className="section-title safe-title"><FiActivity /> إحصائيات الشبكة</h2>
          <div className="stats-grid">
            <div className="stat-card"><span>أحدث بلوك</span><strong>{networkStats.latestLedger}</strong></div>
            <div className="stat-card"><span>الحسابات النشطة</span><strong>{activeAccounts}</strong></div>
            <div className="stat-card"><span>إجمالي المعاملات</span><strong>{totalTransactions}</strong></div>
            <div className="stat-card"><span>عمليات العقود الذكية</span><strong>{invokeCount}</strong></div>
          </div>
        </section>
      )}

      {classifiedProjects.length > 0 && (
        <section className={`activity-section ${!isSubscribed ? 'blurred' : ''}`}>
          <h2 className="section-title golden-title"><FiTrendingUp /> المشاريع المصنفة تلقائياً</h2>
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
          <h2 className="section-title golden-title"><FiActivity /> Live Contract Activity</h2>
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
            <h2 className="section-title safe-title"><FiShield /> Safe Tier</h2>
            <div className="projects-grid">
              {projects.filter(p => p.tier === 'safe').map(project => (
                <div key={project.id} className="project-card">
                  <h3>
                    {getTrendIcon(project.trend)} {project.name}
                  </h3>
                  <p>{project.description}</p>
                  <p>السيولة: {project.liquidity} Pi</p>
                  <p>حجم التداول 24س: {project.volume24h} Pi</p>
                </div>
              ))}
            </div>
          </div>
          <div className={`section ${!isSubscribed ? 'blurred' : ''}`}>
            <h2 className="section-title golden-title"><FiZap /> Golden Radar</h2>
            <div className="projects-grid">
              {projects.filter(p => p.tier === 'golden').map(project => (
                <div key={project.id} className="project-card golden-card">
                  <h3>
                    {getTrendIcon(project.trend)} {project.name}
                  </h3>
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
