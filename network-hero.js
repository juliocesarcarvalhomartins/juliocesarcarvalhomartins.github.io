// Hero 3D integrado ao portfólio real a partir do demo fornecido
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const mobile = innerWidth < 768;
  const touch = matchMedia('(pointer: coarse)').matches;

  const createLayer = () => {
    document.querySelector('.network-3d')?.remove();
    const layer = document.createElement('div');
    layer.className = 'network-3d';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas); hero.prepend(layer);
    return { layer, canvas };
  };

  const fallback2D = () => {
    const { layer, canvas } = createLayer();
    layer.classList.add('network-fallback');
    const ctx = canvas.getContext('2d');
    const nodes = Array.from({length: mobile ? 36 : 72}, () => ({
      x:Math.random(), y:Math.random(), vx:(Math.random()-.5)*.00016,
      vy:(Math.random()-.5)*.00016, pulse:0
    }));
    let visible=true;
    new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(hero);
    const resize=()=>{const r=Math.min(devicePixelRatio,1.5);canvas.width=hero.clientWidth*r;canvas.height=hero.clientHeight*r;canvas.style.width=hero.clientWidth+'px';canvas.style.height=hero.clientHeight+'px';ctx.setTransform(r,0,0,r,0,0)};
    resize();addEventListener('resize',resize,{passive:true});
    if(!touch)layer.addEventListener('pointerdown',e=>{const b=layer.getBoundingClientRect();let near=nodes[0],best=1e9;nodes.forEach(n=>{const d=Math.hypot(n.x*b.width-(e.clientX-b.left),n.y*b.height-(e.clientY-b.top));if(d<best){best=d;near=n}});near.pulse=1});
    const draw=()=>{requestAnimationFrame(draw);if(!visible)return;const w=hero.clientWidth,h=hero.clientHeight;ctx.clearRect(0,0,w,h);nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>1)n.vx*=-1;if(n.y<0||n.y>1)n.vy*=-1;n.pulse=Math.max(0,n.pulse-.012)});
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],d=Math.hypot((a.x-b.x)*w,(a.y-b.y)*h);if(d<150){ctx.strokeStyle='rgba(55,145,255,'+((1-d/150)*.3)+')';ctx.beginPath();ctx.moveTo(a.x*w,a.y*h);ctx.lineTo(b.x*w,b.y*h);ctx.stroke();if(a.pulse>.76)b.pulse=Math.max(b.pulse,a.pulse-.05)}}
      nodes.forEach(n=>{ctx.fillStyle=n.pulse?'#b8ff46':'#4fd1c5';ctx.shadowBlur=n.pulse?18:7;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(n.x*w,n.y*h,n.pulse?4:2.2,0,Math.PI*2);ctx.fill()});ctx.shadowBlur=0};
    draw();
  };

  const start3D = () => {
    if (!window.THREE) throw new Error('Three.js não carregou');
    const { layer, canvas } = createLayer();
    let renderer;
    try { renderer = new THREE.WebGLRenderer({canvas,antialias:!mobile,alpha:true}); }
    catch(e){ fallback2D(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.75));
    renderer.setSize(hero.clientWidth,hero.clientHeight);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,hero.clientWidth/hero.clientHeight,.1,1000);camera.position.z=26;
    const count=mobile?42:90,nodes=[],positions=new Float32Array(count*3);
    for(let i=0;i<count;i++){const x=(Math.random()-.5)*50,y=(Math.random()-.5)*30,z=(Math.random()-.5)*30;nodes.push(new THREE.Vector3(x,y,z));positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z}
    const nodeGeo=new THREE.BufferGeometry();nodeGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const points=new THREE.Points(nodeGeo,new THREE.PointsMaterial({color:0x4fd1c5,size:mobile?.28:.35,transparent:true,opacity:.9,blending:THREE.AdditiveBlending}));
    const lineVerts=[],links=[];for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)if(nodes[i].distanceTo(nodes[j])<9){lineVerts.push(nodes[i].x,nodes[i].y,nodes[i].z,nodes[j].x,nodes[j].y,nodes[j].z);links.push([i,j])}
    const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(lineVerts),3));
    const lines=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:0x5b8def,transparent:true,opacity:.17}));
    const group=new THREE.Group();group.add(points,lines);scene.add(group);
    const packetGeo=new THREE.SphereGeometry(.18,8,8),packetMat=new THREE.MeshBasicMaterial({color:0xb8ff46}),packets=[];
    if(!touch)layer.addEventListener('pointerdown',()=>links.slice().sort(()=>Math.random()-.5).slice(0,18).forEach(([a,b],i)=>setTimeout(()=>{const mesh=new THREE.Mesh(packetGeo,packetMat);mesh.position.copy(nodes[a]);group.add(mesh);packets.push({mesh,a:nodes[a],b:nodes[b],p:0})},i*35)));
    let mx=0,my=0,visible=true;
    if(!touch)hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5});
    new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(hero);
    const clock=new THREE.Clock();
    const animate=()=>{requestAnimationFrame(animate);if(!visible)return;const dt=Math.min(clock.getDelta(),.035);group.rotation.y+=.0009*(dt*60);group.rotation.x+=.0002*(dt*60);camera.position.x+=(mx*4-camera.position.x)*.02;camera.position.y+=(-my*4-camera.position.y)*.02;camera.lookAt(scene.position);packets.forEach((o,i)=>{o.p+=dt*1.3;o.mesh.position.lerpVectors(o.a,o.b,o.p);if(o.p>=1){group.remove(o.mesh);packets.splice(i,1)}});renderer.render(scene,camera)};animate();
    addEventListener('resize',()=>{camera.aspect=hero.clientWidth/hero.clientHeight;camera.updateProjectionMatrix();renderer.setSize(hero.clientWidth,hero.clientHeight)},{passive:true});
  };

  const boot=()=>{try{start3D()}catch(e){console.warn('Usando rede 2D:',e);fallback2D()}};
  if('requestIdleCallback' in window)requestIdleCallback(boot,{timeout:1200});else setTimeout(boot,250);
})();