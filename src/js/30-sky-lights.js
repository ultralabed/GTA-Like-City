/* ---------- outside: sky, far city, sun and moon ---------- */
renderer.localClippingEnabled=true;
// the sky is a huge ball painted with three colours (top, middle, horizon) that change with the time of day
const skyU={cTop:{value:new THREE.Color()},cMid:{value:new THREE.Color()},cHor:{value:new THREE.Color()},stars:{value:0}};
const skyMesh=new THREE.Mesh(new THREE.SphereGeometry(320,32,20),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`uniform vec3 cTop;uniform vec3 cMid;uniform vec3 cHor;uniform float stars;varying vec3 vDir;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec3 d=normalize(vDir);float h=max(d.y,0.0);
      vec3 col=h<0.16?mix(cHor,cMid,h/0.16):mix(cMid,cTop,pow((h-0.16)/0.84,0.55));
      vec2 g=vec2(atan(d.z,d.x)*330.0,d.y*520.0);
      float s=step(0.9975,hash(floor(g)))*stars*smoothstep(0.03,0.25,d.y);
      gl_FragColor=vec4(col+vec3(s),1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`}));
skyMesh.renderOrder=-10;skyMesh.frustumCulled=false;scene.add(skyMesh);
// a ring of far-away city around the horizon
const ringTex=ringTextures(),ringGeo=new THREE.CylinderGeometry(1,1,1,96,1,true);
const ringMat=new THREE.MeshBasicMaterial({map:ringTex[0],transparent:true,side:THREE.BackSide,depthWrite:false,fog:false});
const ringGlow=new THREE.MeshBasicMaterial({map:ringTex[1],transparent:true,side:THREE.BackSide,depthWrite:false,fog:false,blending:THREE.AdditiveBlending});
const ring=new THREE.Group();[[ringMat,250,-8],[ringGlow,249,-7]].forEach(q=>{const m=new THREE.Mesh(ringGeo,q[0]);m.scale.set(q[1],36,q[1]);m.position.y=17;m.renderOrder=q[2];ring.add(m);});
scene.add(ring);
const SUN_R=290,horizon=[new THREE.Plane(new THREE.Vector3(0,1,0),0)];
const glowC=cv(128,128);(function(){const g=glowC.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.2,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);})();
const discMat=new THREE.MeshBasicMaterial({fog:false,clippingPlanes:horizon});
const disc=new THREE.Mesh(new THREE.CircleGeometry(10.5,40),discMat);disc.renderOrder=-5;scene.add(disc);
const glowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(glowC),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const glow=new THREE.Mesh(new THREE.PlaneGeometry(160,160),glowMat);glow.renderOrder=-6;scene.add(glow);
scene.fog=new THREE.FogExp2(0x000000,.0045);

/* ---------- lights ---------- */
const hemi=new THREE.HemisphereLight(0xffc7a0,0x3a2630,.3);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffa25e,3);
scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:90});   // the shadow follows you around, 19 m each way
sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;sun.shadow.radius=3;

// dust floating in the sun beam (in number 1's living room)
const DN=260,dPos=new Float32Array(DN*3);
for(let i=0;i<DN;i++){dPos[i*3]=rnd(-2.3,1);dPos[i*3+1]=rnd(.2,2.3);dPos[i*3+2]=rnd(-2.3,2.2);}
const dGeo=new THREE.BufferGeometry();dGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
const dust=new THREE.Points(dGeo,new THREE.PointsMaterial({color:0xffd9a8,size:.006,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
scene.add(dust);
