// GeoQuest Interactive Globe — Guardian-quality Earth visualization
(function() {
  if (document.getElementById('gq-globe-canvas')) return;

  function tryInit() {
    // Inject CSS to make page backgrounds transparent so globe shows through
    const style = document.createElement('style');
    style.textContent = `
      body { background: transparent !important; }
      #gq-globe-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; }
      /* Make the auth overlay semi-transparent so globe peeks through */
      [style*="z-index: 99999"], [style*="position: fixed"][style*="inset: 0"] {
        background: rgba(10, 16, 32, 0.85) !important;
      }
      /* Make cards slightly transparent */
      [class*="gq-auth"], [id*="gq-auth"] {
        background: rgba(15, 23, 42, 0.9) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
      }
    `;
    document.head.appendChild(style);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gq-globe-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);

    // Load Three.js
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    s.onload = function() { buildGlobe(canvas); };
    document.head.appendChild(s);
  }

  function buildGlobe(canvas) {
    var T = window.THREE;
    var W = window.innerWidth, H = window.innerHeight;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(45, W/H, 0.1, 1000);
    camera.position.set(0.8, 0.3, 2.8);

    var renderer = new T.WebGLRenderer({canvas:canvas, alpha:true, antialias:true});
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Stars — dense field
    var sg = new T.BufferGeometry();
    var sp = new Float32Array(5000 * 3);
    for(var i=0; i<5000; i++){
      sp[i*3]=(Math.random()-0.5)*100;
      sp[i*3+1]=(Math.random()-0.5)*100;
      sp[i*3+2]=-Math.random()*50-5;
    }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({color:0xffffff, size:0.05, sizeAttenuation:true, transparent:true, opacity:0.7})));

    // Earth sphere
    var eg = new T.SphereGeometry(1, 64, 64);
    var ec = document.createElement('canvas');
    ec.width=2048; ec.height=1024;
    var cx = ec.getContext('2d');

    // Ocean
    var grd = cx.createRadialGradient(1024,512,100,1024,512,1024);
    grd.addColorStop(0,'#0d1f35');
    grd.addColorStop(1,'#060e1a');
    cx.fillStyle=grd;
    cx.fillRect(0,0,2048,1024);

    // Continents
    [[280,200,350,250],[420,450,180,300],[950,180,200,180],[980,350,250,350],
     [1150,150,500,350],[1550,520,200,150],[100,900,1900,124]].forEach(function(c){
      cx.fillStyle='#112a1c';
      cx.beginPath();
      cx.ellipse(c[0]+c[1]/2,c[1]+c[3]/2,c[2]/2,c[3]/2,0,0,Math.PI*2);
      cx.fill();
    });

    // City lights
    [[350,280],[400,300],[320,330],[450,260],[380,350],[420,290],
     [980,230],[1020,220],[1050,240],[970,250],[1000,200],[1030,210],
     [1250,250],[1350,220],[1400,300],[1500,250],[1300,280],[1450,230],
     [460,520],[440,560],[480,500],
     [1010,400],[1050,450],[1000,500],
     [1600,560],[1620,580],[1200,300],[1550,280]].forEach(function(p){
      var b=Math.random()*0.5+0.5;
      cx.fillStyle='rgba(255,210,80,'+b*0.9+')';
      cx.beginPath(); cx.arc(p[0],p[1],2,0,Math.PI*2); cx.fill();
      var g=cx.createRadialGradient(p[0],p[1],0,p[0],p[1],15);
      g.addColorStop(0,'rgba(255,200,60,'+b*0.25+')');
      g.addColorStop(1,'rgba(255,200,60,0)');
      cx.fillStyle=g;
      cx.beginPath(); cx.arc(p[0],p[1],15,0,Math.PI*2); cx.fill();
    });

    var et = new T.CanvasTexture(ec);
    var earth = new T.Mesh(eg, new T.MeshPhongMaterial({map:et, specular:new T.Color(0x222244), shininess:20}));
    scene.add(earth);

    // Atmosphere
    var ag = new T.SphereGeometry(1.015,64,64);
    scene.add(new T.Mesh(ag, new T.ShaderMaterial({
      vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec3 vN;void main(){float i=pow(0.7-dot(vN,vec3(0,0,1)),3.0);gl_FragColor=vec4(0.3,0.6,1.0,1.0)*i;}',
      blending:T.AdditiveBlending, side:T.BackSide, transparent:true
    })));

    // Outer glow
    scene.add(new T.Mesh(new T.SphereGeometry(1.08,64,64), new T.ShaderMaterial({
      vertexShader:'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec3 vN;void main(){float i=pow(0.5-dot(vN,vec3(0,0,1)),5.0);gl_FragColor=vec4(0.2,0.4,0.9,1.0)*i*0.4;}',
      blending:T.AdditiveBlending, side:T.BackSide, transparent:true
    })));

    // Lights
    var sun=new T.DirectionalLight(0xffffff,1.0); sun.position.set(5,3,5); scene.add(sun);
    scene.add(new T.AmbientLight(0x222244,0.5));

    // Quiz dots
    var mk=new T.Group();
    [[48.8,2.3],[51.5,-0.1],[40.7,-74],[35.7,139.7],[-33.9,151.2],
     [55.8,37.6],[-22.9,-43.2],[30,31.2],[28.6,77.2],[39.9,116.4],
     [1.3,103.8],[-1.3,36.8],[37.6,127],[59.9,10.7],[64.1,-21.9]].forEach(function(ll){
      var phi=(90-ll[0])*Math.PI/180, theta=(ll[1]+180)*Math.PI/180, r=1.025;
      var d=new T.Mesh(new T.SphereGeometry(0.015,8,8),new T.MeshBasicMaterial({color:0x60a5fa}));
      d.position.set(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
      mk.add(d);
    });
    scene.add(mk);

    // Animate
    var rot=0;
    function animate(){
      requestAnimationFrame(animate);
      rot+=0.0008;
      earth.rotation.y=rot; mk.rotation.y=rot;
      earth.rotation.x=0.15; mk.rotation.x=0.15;
      renderer.render(scene,camera);
    }
    animate();

    window.addEventListener('resize',function(){
      W=window.innerWidth; H=window.innerHeight;
      camera.aspect=W/H; camera.updateProjectionMatrix();
      renderer.setSize(W,H);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tryInit);
  else tryInit();
})();
