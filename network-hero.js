// Rede 3D do Hero - carregada sem bloquear a primeira pintura
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const touch = window.matchMedia('(pointer: coarse)').matches;
  const mobile = window.innerWidth < 768;
  const nodeCount = mobile ? 34 : 68;
  const maxDistance = mobile ? 3.6 : 3.15;

  const start = async () => {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
    const layer = document.createElement('div');
    layer.className = 'network-3d';
    layer.setAttribute('aria-hidden', 'true');
    hero.prepend(layer);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, hero.clientWidth / hero.clientHeight, .1, 100);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
    renderer.setSize(hero.clientWidth, hero.clientHeight);
    layer.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    const positions = [];
    for (let i = 0; i < nodeCount; i++) {
      positions.push(new THREE.Vector3(
        (Math.random() - .5) * 15,
        (Math.random() - .5) * 10,
        (Math.random() - .5) * 8
      ));
    }

    const pointGeometry = new THREE.BufferGeometry().setFromPoints(positions);
    const pointMaterial = new THREE.PointsMaterial({
      color: 0x52d9ff, size: mobile ? .09 : .115,
      transparent: true, opacity: .9, sizeAttenuation: true
    });
    group.add(new THREE.Points(pointGeometry, pointMaterial));

    const segments = [];
    const links = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < maxDistance) {
          segments.push(positions[i].x, positions[i].y, positions[i].z);
          segments.push(positions[j].x, positions[j].y, positions[j].z);
          links.push([i, j]);
        }
      }
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
    group.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
      color: 0x168cff, transparent: true, opacity: .18
    })));

    // Pacotes de dados usados pelo pulso disparado no clique
    const packetGeometry = new THREE.SphereGeometry(.1, 10, 10);
    const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xb8ff46 });
    const packets = [];
    const firePulse = () => {
      const available = links.slice().sort(() => Math.random() - .5).slice(0, mobile ? 8 : 18);
      available.forEach(([a, b], index) => {
        setTimeout(() => {
          const mesh = new THREE.Mesh(packetGeometry, packetMaterial);
          mesh.position.copy(positions[a]);
          group.add(mesh);
          packets.push({ mesh, from: positions[a], to: positions[b], progress: 0 });
        }, index * 38);
      });
    };
    if (!touch) layer.addEventListener('pointerdown', firePulse);

    let mouseX = 0, mouseY = 0;
    if (!touch) hero.addEventListener('pointermove', e => {
      const rect = hero.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - .5) * .75;
      mouseY = -((e.clientY - rect.top) / rect.height - .5) * .5;
    });

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => visible = entry.isIntersecting, { threshold: .02 });
    observer.observe(hero);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), .035);
      group.rotation.y += dt * .055;
      group.rotation.x += dt * .018;
      camera.position.x += (mouseX - camera.position.x) * .025;
      camera.position.y += (mouseY - camera.position.y) * .025;
      packets.forEach((p, i) => {
        p.progress += dt * 1.35;
        p.mesh.position.lerpVectors(p.from, p.to, p.progress);
        if (p.progress >= 1) {
          group.remove(p.mesh);
          packets.splice(i, 1);
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = hero.clientWidth, h = hero.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', resize, { passive: true });
  };

  // Fallback Canvas 2D para navegadores com WebGL desativado
  const start2D = () => {
    document.querySelector('.network-3d')?.remove();
    const layer = document.createElement('div');
    layer.className = 'network-3d network-fallback';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    hero.prepend(layer);
    const ctx = canvas.getContext('2d');
    const count = mobile ? 34 : 68;
    const nodes = Array.from({ length: count }, () => ({
      x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00013,
      vy: (Math.random() - .5) * .00013, pulse: 0
    }));
    let visible = true;
    new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(hero);
    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 1.5);
      canvas.width = hero.clientWidth * ratio; canvas.height = hero.clientHeight * ratio;
      canvas.style.width = hero.clientWidth + 'px'; canvas.style.height = hero.clientHeight + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize(); window.addEventListener('resize', resize, { passive: true });
    if (!touch) layer.addEventListener('pointerdown', e => {
      const r = layer.getBoundingClientRect();
      let nearest = nodes[0], best = Infinity;
      nodes.forEach(n => { const d = Math.hypot(n.x*r.width-(e.clientX-r.left),n.y*r.height-(e.clientY-r.top)); if(d<best){best=d;nearest=n;} });
      nearest.pulse = 1;
    });
    const draw = () => {
      requestAnimationFrame(draw); if (!visible) return;
      const w = hero.clientWidth, h = hero.clientHeight;
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if(n.x<0||n.x>1)n.vx*=-1;if(n.y<0||n.y>1)n.vy*=-1;
        n.pulse = Math.max(0, n.pulse - .012);
      });
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j],dx=(a.x-b.x)*w,dy=(a.y-b.y)*h,dist=Math.hypot(dx,dy);
        if(dist<145){ctx.strokeStyle='rgba(30,150,255,'+((1-dist/145)*.28)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x*w,a.y*h);ctx.lineTo(b.x*w,b.y*h);ctx.stroke();
          if(a.pulse>.75)b.pulse=Math.max(b.pulse,a.pulse-.05);
        }
      }
      nodes.forEach(n=>{ctx.fillStyle=n.pulse>0?'#b8ff46':'#52d9ff';ctx.shadowBlur=n.pulse>0?18:8;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(n.x*w,n.y*h,n.pulse>0?3.8:2.1,0,Math.PI*2);ctx.fill();});
      ctx.shadowBlur=0;
    };
    draw();
  };
  const boot = () => start().catch(error => {
    console.warn('WebGL indisponível; usando rede 2D.', error);
    start2D();
  });
  // Carrega quando o navegador estiver livre
  if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1200 });
  else setTimeout(boot, 250);
})();