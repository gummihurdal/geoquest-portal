// GeoQuest Interactive Globe — Guardian-quality Earth visualization
(function() {
  if (document.getElementById('gq-globe-canvas')) return;

  function tryInit() {
    // Target the body or the auth card's parent — the globe goes behind everything
    const target = document.body;
    if (!target) { setTimeout(tryInit, 500); return; }

    // Create fullscreen canvas behind everything
    const canvas = document.createElement('canvas');
    canvas.id = 'gq-globe-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    // Load Three.js from CDN
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    s.onload = function() { buildGlobe(canvas); };
    document.head.appendChild(s);
  }

  function buildGlobe(canvas) {
    const T = window.THREE;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 2.8;
    camera.position.x = 0.5; // Offset right so globe doesn't cover login form

    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Stars
    const starGeo = new T.BufferGeometry();
    const starCount = 4000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 80;
      starPos[i*3+1] = (Math.random() - 0.5) * 80;
      starPos[i*3+2] = -Math.random() * 50 - 5;
    }
    starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3));
    scene.add(new T.Points(starGeo, new T.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.8 })));

    // Earth
    const earthGeo = new T.SphereGeometry(1, 64, 64);
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 2048;
    earthCanvas.height = 1024;
    const ctx = earthCanvas.getContext('2d');

    // Deep ocean
    const grad = ctx.createLinearGradient(0, 0, 2048, 1024);
    grad.addColorStop(0, '#071422');
    grad.addColorStop(0.5, '#0a1a30');
    grad.addColorStop(1, '#061018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Continents — soft green/brown landmasses
    const lands = [
      {x:280,y:200,w:350,h:250},{x:420,y:450,w:180,h:300},
      {x:950,y:180,w:200,h:180},{x:980,y:350,w:250,h:350},
      {x:1150,y:150,w:500,h:350},{x:1550,y:520,w:200,h:150},
      {x:100,y:900,w:1900,h:124},
    ];
    lands.forEach(c => {
      ctx.fillStyle = '#0f2a1a';
      ctx.beginPath();
      ctx.ellipse(c.x+c.w/2, c.y+c.h/2, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
      // Subtle border
      ctx.strokeStyle = 'rgba(40,80,60,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // City lights — warm golden glow
    const cities = [
      [350,280],[400,300],[320,330],[450,260],[380,350],[300,260],[420,290],
      [980,230],[1020,220],[1050,240],[970,250],[1000,200],[1030,210],
      [1250,250],[1350,220],[1400,300],[1500,250],[1300,280],[1450,230],
      [460,520],[440,560],[480,500],
      [1010,400],[1050,450],[1000,500],
      [1600,560],[1620,580],
      [1200,300],[1550,280],[990,260],[1060,230],
    ];
    cities.forEach(([x,y]) => {
      const b = Math.random()*0.5+0.5;
      // Core
      ctx.fillStyle = `rgba(255,210,80,${b*0.9})`;
      ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill();
      // Glow
      const g = ctx.createRadialGradient(x,y,0,x,y,12);
      g.addColorStop(0, `rgba(255,200,60,${b*0.3})`);
      g.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
    });

    const earthTexture = new T.CanvasTexture(earthCanvas);
    const earthMat = new T.MeshPhongMaterial({
      map: earthTexture, specular: new T.Color(0x222244), shininess: 20,
    });
    const earth = new T.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Atmosphere — blue rim glow
    const atmosGeo = new T.SphereGeometry(1.015, 64, 64);
    const atmosMat = new T.ShaderMaterial({
      vertexShader: 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec3 vN;void main(){float i=pow(0.7-dot(vN,vec3(0,0,1)),3.0);gl_FragColor=vec4(0.3,0.6,1.0,1.0)*i;}',
      blending: T.AdditiveBlending, side: T.BackSide, transparent: true,
    });
    scene.add(new T.Mesh(atmosGeo, atmosMat));

    // Outer glow ring
    const outerGlow = new T.SphereGeometry(1.08, 64, 64);
    const outerMat = new T.ShaderMaterial({
      vertexShader: 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec3 vN;void main(){float i=pow(0.5-dot(vN,vec3(0,0,1)),5.0);gl_FragColor=vec4(0.2,0.4,0.9,1.0)*i*0.5;}',
      blending: T.AdditiveBlending, side: T.BackSide, transparent: true,
    });
    scene.add(new T.Mesh(outerGlow, outerMat));

    // Quiz marker dots on cities
    const markers = new T.Group();
    [[48.8,2.3],[51.5,-0.1],[40.7,-74],[35.7,139.7],[-33.9,151.2],
     [55.8,37.6],[-22.9,-43.2],[30,31.2],[28.6,77.2],[39.9,116.4],
     [1.3,103.8],[-1.3,36.8],[37.6,127],[59.9,10.7],[64.1,-21.9]
    ].forEach(([lat,lon]) => {
      const phi=(90-lat)*Math.PI/180, theta=(lon+180)*Math.PI/180;
      const r=1.025;
      const dot = new T.Mesh(
        new T.SphereGeometry(0.015,8,8),
        new T.MeshBasicMaterial({color:0x60a5fa})
      );
      dot.position.set(-r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
      markers.add(dot);
    });
    scene.add(markers);

    // Lights
    const sun = new T.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    scene.add(new T.AmbientLight(0x222244, 0.6));

    // Animate
    let rot = 0;
    function animate() {
      requestAnimationFrame(animate);
      rot += 0.001;
      earth.rotation.y = rot;
      markers.rotation.y = rot;
      earth.rotation.x = 0.15; // Slight tilt like real Earth
      markers.rotation.x = 0.15;
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
