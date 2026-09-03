(function() {
  var canvas = document.createElement('canvas');
  canvas.id = 'matrix-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var fontSize = 16;
  var columns = Math.floor(window.innerWidth / fontSize);
  var drops = Array(columns).fill(0);
  var chars = '01';
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drops = Array(Math.floor(canvas.width / fontSize)).fill(0);
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px "Share Tech Mono", monospace';
    for (var i = 0; i < drops.length; i++) {
      var char = chars[Math.floor(Math.random() * chars.length)];
      var x = i * fontSize;
      var y = drops[i] * fontSize;
      ctx.fillText(char, x, y);
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

(function() {
  var analysisDiv = document.createElement('div');
  analysisDiv.className = 'analysis-line';
  analysisDiv.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;font-family:"Share Tech Mono",monospace;color:#00ff41;font-size:14px;text-shadow:0 0 5px #00ff41;';
  document.body.appendChild(analysisDiv);

  var phrases = [
    'تحليل العقود الذكية...',
    'فحص أحواض السيولة...',
    'رصد المعاملات الجديدة...',
    'تحديد الفرص الذهبية...',
    'تتبع الأنشطة المشبوهة...',
    'جلب بيانات البلوكشين...'
  ];
  var phraseIndex = 0;
  var charIndex = 0;
  var isDeleting = false;

  function typeEffect() {
    var currentPhrase = phrases[phraseIndex];
    if (isDeleting) {
      charIndex--;
    } else {
      charIndex++;
    }
    analysisDiv.textContent = currentPhrase.substring(0, charIndex);
    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      setTimeout(typeEffect, 1500);
      return;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
    setTimeout(typeEffect, isDeleting ? 50 : 100);
  }
  typeEffect();
})();
