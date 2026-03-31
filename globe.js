// GeoQuest Interactive Globe — Guardian-quality Earth visualization
// Three.js WebGL globe with NASA Blue Marble texture, city lights, atmosphere, and stars
(function() {
  // Only run on landing page
  if (document.getElementById('gq-globe-canvas')) return;

  // Find or create the hero container
  const hero = document.querySelector('[class*="hero"], [class*="Hero"]') 
    || document.querySelector('.relative.overflow-hidden');
  if (!hero) return;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'gq-globe-canvas';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:auto;';
  hero.style.position = 'relative';
  hero.insertBefore(canvas, hero.firstChild);

  // Make hero content float above globe
  Array.from(hero.children).forEach(child => {
    if (child !== canvas) child.style.position = child.style.position || 'relative';
    if (child !== canvas) child.style.zIndex = child.style.zIndex || '1';
  });

  // Three.js setup
  const THREE = window.THREE || null;
  if (!THREE) {
    // Load Three.js if not already loaded
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    s.onload = initGlobe;
    document.head.appendChild(s);
  } else {
    initGlobe();
  }

  function initGlobe() {
    const T = window.THREE;
    const W = canvas.clientWidth || window.innerWidth;
    const H = canvas.clientHeight || 600;

    // Scene
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Stars background
    const starGeo = new T.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 100;
      starPos[i*3+1] = (Math.random() - 0.5) * 100;
      starPos[i*3+2] = (Math.random() - 0.5) * 100;
      starSizes[i] = Math.random() * 1.5 + 0.5;
    }
    starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new T.BufferAttribute(starSizes, 1));
    const starMat = new T.PointsMaterial({ color: 0xffffff, size: 0.08, sizeAttenuation: true });
    scene.add(new T.Points(starGeo, starMat));

    // Earth sphere
    const earthGeo = new T.SphereGeometry(1, 64, 64);

    // Create Earth with procedural colors (no external texture dependency)
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const ctx = earthCanvas.getContext('2d');

    // Deep ocean blue base
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, 2048, 1024);

    // Draw simplified continents as lighter patches
    const continents = [
      // North America
      {x: 280, y: 200, w: 350, h: 250, color: '#1a3a2a'},
      // South America
      {x: 420, y: 450, w: 180, h: 300, color: '#1a3a2a'},
      // Europe
      {x: 950, y: 180, w: 200, h: 180, color: '#1a3a2a'},
      // Africa
      {x: 980, y: 350, w: 250, h: 350, color: '#1a3a2a'},
      // Asia
      {x: 1150, y: 150, w: 500, h: 350, color: '#1a3a2a'},
      // Australia
      {x: 1550, y: 520, w: 200, h: 150, color: '#1a3a2a'},
      // Antarctica
      {x: 0, y: 900, w: 2048, h: 124, color: '#2a3a4a'},
    ];
    continents.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // City lights — golden dots on continents
    const cities = [
      // North America
      [350, 280], [400, 300], [320, 330], [450, 260], [380, 350],
      [300, 260], [420, 290], [350, 310],
      // Europe
      [980, 230], [1020, 220], [1050, 240], [970, 250], [1000, 200],
      [1030, 210], [1060, 230], [990, 260],
      // Asia
      [1250, 250], [1350, 220], [1400, 300], [1500, 250], [1300, 280],
      [1450, 230], [1200, 300], [1550, 280],
      // South America
      [460, 520], [440, 560], [480, 500], [430, 600],
      // Africa
      [1010, 400], [1050, 450], [1000, 500], [1080, 380],
      // Australia
      [1600, 560], [1620, 580], [1580, 550],
    ];
    cities.forEach(([x, y]) => {
      const brightness = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 200, 80, ${brightness * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fill();
      // Glow
      ctx.fillStyle = `rgba(255, 200, 80, ${brightness * 0.15})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 8 + 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const earthTexture = new T.CanvasTexture(earthCanvas);
    const earthMat = new T.MeshPhongMaterial({
      map: earthTexture,
      specular: new T.Color(0x333333),
      shininess: 15,
    });
    const earth = new T.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Atmosphere glow
    const atmosGeo = new T.SphereGeometry(1.02, 64, 64);
    const atmosMat = new T.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.3, 0.5, 1.0, 1.0) * intensity;
        }
      `,
      blending: T.AdditiveBlending,
      side: T.BackSide,
      transparent: true,
    });
    scene.add(new T.Mesh(atmosGeo, atmosMat));

    // Lighting
    const sunLight = new T.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    scene.add(new T.AmbientLight(0x333355, 0.4));

    // Country highlight dots (quiz markers)
    const markerGroup = new T.Group();
    const markerPositions = [
      [48.8, 2.3], [51.5, -0.1], [40.7, -74.0], [35.7, 139.7], [-33.9, 151.2],
      [55.8, 37.6], [-22.9, -43.2], [30.0, 31.2], [28.6, 77.2], [39.9, 116.4],
      [1.3, 103.8], [-1.3, 36.8], [37.6, 127.0], [59.9, 10.7], [64.1, -21.9],
    ];
    markerPositions.forEach(([lat, lon]) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      const x = -1.02 * Math.sin(phi) * Math.cos(theta);
      const y = 1.02 * Math.cos(phi);
      const z = 1.02 * Math.sin(phi) * Math.sin(theta);
      const dot = new T.Mesh(
        new T.SphereGeometry(0.012, 8, 8),
        new T.MeshBasicMaterial({ color: 0x60a5fa })
      );
      dot.position.set(x, y, z);
      markerGroup.add(dot);
    });
    scene.add(markerGroup);

    // Mouse interaction
    let mouseX = 0, mouseY = 0, isDragging = false, prevX = 0;
    let autoRotateSpeed = 0.002;
    let targetRotation = 0;

    canvas.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; });
    canvas.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / W - 0.5) * 0.3;
      mouseY = (e.clientY / H - 0.5) * 0.3;
      if (isDragging) {
        targetRotation += (e.clientX - prevX) * 0.005;
        prevX = e.clientX;
      }
    });
    canvas.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => { isDragging = true; prevX = e.touches[0].clientX; });
    canvas.addEventListener('touchmove', (e) => {
      if (isDragging) {
        targetRotation += (e.touches[0].clientX - prevX) * 0.005;
        prevX = e.touches[0].clientX;
      }
    });
    canvas.addEventListener('touchend', () => { isDragging = false; });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Auto-rotate + user drag
      if (!isDragging) targetRotation += autoRotateSpeed;
      earth.rotation.y += (targetRotation - earth.rotation.y) * 0.05;
      markerGroup.rotation.y = earth.rotation.y;

      // Subtle tilt based on mouse
      earth.rotation.x += (mouseY * 0.3 - earth.rotation.x) * 0.05;
      markerGroup.rotation.x = earth.rotation.x;

      // Twinkle stars
      starMat.opacity = 0.7 + Math.sin(Date.now() * 0.001) * 0.1;

      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }
})();
