/* ---------- outside ---------- */
renderer.localClippingEnabled=true;
const skyGeo=new THREE.PlaneGeometry(50,25);
function skyLayer(mode,z,bright){const m=new THREE.MeshBasicMaterial({map:skyTexture(mode),fog:false,transparent:mode!==1,depthWrite:false});
  m.color.setScalar(bright);const p=new THREE.Mesh(skyGeo,m);p.position.set(0,6,z);p.renderOrder=[-9,-10,-8][mode];scene.add(p);return m;}
const skyNightMat=skyLayer(1,-14,1),skyDuskMat=skyLayer(0,-13.98,1.3),skyDayMat=skyLayer(2,-13.96,1.45);
const horizon=[new THREE.Plane(new THREE.Vector3(0,1,0),-1.24)];
const glowC=cv(128,128);(function(){const g=glowC.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.2,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);})();
const discMat=new THREE.MeshBasicMaterial({fog:false,clippingPlanes:horizon});
const disc=new THREE.Mesh(new THREE.CircleGeometry(.6,40),discMat);disc.renderOrder=-5;scene.add(disc);
const glowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const glow=new THREE.Mesh(new THREE.PlaneGeometry(9,9),glowMat);glow.renderOrder=-6;scene.add(glow);

/* ---------- lights ---------- */
const hemi=new THREE.HemisphereLight(0xffc7a0,0x3a2630,.3);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffa25e,3);
sun.position.set(2.6,3.4,-7.2);sun.target.position.set(0,.5,0);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:1,far:16});
sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=3;

// dust floating in the sun beam
const DN=260,dPos=new Float32Array(DN*3);
for(let i=0;i<DN;i++){dPos[i*3]=rnd(-2.3,1);dPos[i*3+1]=rnd(.2,2.3);dPos[i*3+2]=rnd(-2.3,2.2);}
const dGeo=new THREE.BufferGeometry();dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
const dust=new THREE.Points(dGeo,new THREE.PointsMaterial({color:0xffd9a8,size:.006,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
scene.add(dust);
