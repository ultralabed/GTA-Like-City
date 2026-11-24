/* ---------- furniture prefabs ---------- */
// Every number in here is measured from the furniture's own middle (or from the wall it hangs on).
PREFAB.spot=o=>({spots:[{type:o.kind,ap:[0,0],yaw:o.yaw,pose:o.pose,label:o.label,chase:o.chase}]});

PREFAB.rug=o=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(o.w||2.5,o.d||3.1),M.rug);m.rotation.x=-Math.PI/2;m.position.y=.008;m.receiveShadow=true;cur.add(m);};

// low cabinet with a TV above it. Stands against a wall; the screen faces +x.
PREFAB.tvConsole=()=>{
  box(.45,.42,1.9,M.walnut,.28,.33,0,{r:.015});
  [-.75,.75].forEach(z=>box(.35,.12,.05,M.black,.28,.06,z));
  box(.04,.78,1.36,M.black,.1,1.25,0,{r:.012});
  const c=cv(256,144),tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;
  const mat=new THREE.MeshBasicMaterial({map:tex});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.72),mat);scr.rotation.y=Math.PI/2;scr.position.set(.124,1.25,0);cur.add(scr);
  scr.userData={label:'電視',act:userTv};interact.push(scr);
  const light=new THREE.PointLight(0x9f8cff,0,5,2);light.position.set(.7,1.2,0);cur.add(light);
  dev.tvs.push({mat,tex,g:c.getContext('2d'),light});
  box(.12,.2,.12,M.ceramic,.28,.64,-.75,{r:.03});                     // vase
  cyl(.05,.05,.02,M.black,.28,.55,.7,24);                             // little speaker puck
  box(.2,.03,.28,M.coral,.3,.555,.45);box(.19,.03,.27,M.teal,.3,.585,.45,{ry:.15});
  return{solid:[[0,.52,-.98,.98]],boxes:[[.05,.51,0,.54,-.95,.95],[.07,.13,.86,1.64,-.68,.68]]};
};

// three-seat sofa. You sit facing -x. Two people can sit, or one can lie down.
PREFAB.sofa=()=>{
  box(.95,.3,2.1,M.sofa,0,.25,0,{r:.07});
  box(.28,.62,2.1,M.sofa,.41,.6,0,{r:.09});
  [-1,1].forEach(s=>box(.95,.5,.22,M.sofa,0,.38,s*1.08,{r:.08}));
  [-.48,.48].forEach(z=>box(.72,.16,.92,M.sofa,-.09,.46,z,{r:.07}));
  box(.14,.4,.42,M.coral,.21,.72,-.7,{r:.06,rz:-.25});
  box(.14,.4,.42,M.teal,.21,.72,.65,{r:.06,rz:-.25});
  [[-.4,-1],[-.4,1],[.45,-1],[.45,1]].forEach(p=>cyl(.02,.015,.1,M.brass,p[0],.05,p[1],12));
  const sit=z=>({type:'tv',ap:[-.8,z],an:[-.03,.62,z],yaw:-Math.PI/2,pose:'sit',label:'看電視',tv:true});
  return{solid:[[-.5,.57,-1.2,1.2]],
    boxes:[[-.48,.3,0,.54,-1.05,1.05],[.27,.55,0,.91,-1.05,1.05],[-.48,.48,0,.63,-1.19,-.97],[-.48,.48,0,.63,.97,1.19]],
    spots:[sit(-.48),sit(.48),{type:'sleep',ap:[-.8,0],an:[-.07,.66,0],lie:true,solo:true,pose:'lie',label:'在沙發睡覺 💤'}]};
};

// glass top on brass legs, with a wooden shelf underneath
PREFAB.coffeeTable=()=>{
  box(.62,.02,1.15,new THREE.MeshPhysicalMaterial({color:0xbfe8e4,roughness:.04,transparent:true,opacity:.28}),0,.4,0,{shadow:false});
  box(.56,.03,1.09,M.walnut,0,.16,0);
  [[-.27,-.52],[.27,-.52],[-.27,.52],[.27,.52]].forEach(p=>cyl(.014,.014,.4,M.brass,p[0],.2,p[1],12));
  cyl(.045,.036,.09,M.ceramic,.1,.455,-.25,24);                        // mug
  box(.2,.025,.27,M.teal,-.08,.423,.25,{ry:.3});box(.19,.02,.26,M.coral,-.08,.446,.25,{ry:.1});
  cyl(.1,.07,.05,M.brass,0,.435,-.1,28);                              // bowl
  return{solid:[[-.33,.33,-.6,.6]],boxes:[[-.31,.31,.39,.41,-.575,.575],[-.28,.28,.145,.175,-.545,.545]]};
};

// tall shelf full of books. Stands against a wall; the books face -x.
const bookCols=[0xb5533a,0x1f5a5e,0xe0a45c,0x3b2a3f,0xe8d9c0,0x7a2c5a,0x2b3a67,0xd9783f];
PREFAB.bookshelf=()=>{
  const bx=-.2;
  box(.34,2.0,.03,M.walnut,bx,1.0,-.62);box(.34,2.0,.03,M.walnut,bx,1.0,.62);
  for(let i=0;i<5;i++)box(.34,.03,1.24,M.walnut,bx,.03+i*.49,0);
  box(.02,2.0,1.24,M.walnut,-.04,1.0,0);
  for(let s=0;s<4;s++){let z=-.58;const y0=.045+s*.49;
    while(z<.5){const w=rnd(.025,.06),hh=rnd(.24,.38),d=rnd(.18,.26);
      if(Math.random()<.14){z+=rnd(.1,.22);continue;}
      box(d,hh,w,new THREE.MeshStandardMaterial({color:bookCols[Math.floor(rnd(0,8))],roughness:.75}),bx-.02,y0+hh/2,z+w/2,{rz:Math.random()<.1?.12:0});
      z+=w+.004;}}
  cyl(.09,.06,.16,M.terracotta,bx-.02,2.07,-.3,20);cyl(.07,.07,.2,M.brass,bx-.02,2.09,.3,20);
  return{solid:[[-.42,0,-.7,.7]],boxes:[[-.38,-.03,0,2.0,-.64,.64]],
    spots:[{type:'read',ap:[-.85,0],yaw:Math.PI/2,pose:'read',label:'看書'}]};
};

// framed picture. Hangs on a wall; faces -z.
PREFAB.art=o=>{
  box(.78,1.02,.03,M.black,0,1.55,-.02);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(.7,.94),new THREE.MeshStandardMaterial({map:artTexture(o.seed||0),roughness:.6}));
  p.rotation.y=Math.PI;p.position.set(0,1.55,-.037);p.receiveShadow=true;cur.add(p);
};

const leafG=new THREE.SphereGeometry(1,14,8);
PREFAB.plant=()=>{
  cyl(.2,.15,.36,M.terracotta,0,.18,0,28);
  cyl(.185,.185,.02,new THREE.MeshStandardMaterial({color:0x2a1c12,roughness:1}),0,.35,0,28);
  for(let i=0;i<16;i++){const p=new THREE.Group();p.position.set(0,.36,0);p.rotation.y=i*2.4+rnd(-.2,.2);
    const tilt=rnd(.25,1.05),L=rnd(.55,1.05);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.006,.01,L,6),M.leaf);stem.position.set(0,Math.cos(tilt)*L/2,Math.sin(tilt)*L/2);stem.rotation.x=tilt;
    const lf=new THREE.Mesh(leafG,M.leaf);lf.scale.set(rnd(.09,.14),.008,rnd(.17,.26));lf.position.set(0,Math.cos(tilt)*L,Math.sin(tilt)*L);lf.rotation.x=tilt-.5;
    [stem,lf].forEach(m=>{m.castShadow=true;m.receiveShadow=true;p.add(m);});cur.add(p);}
  return{solid:[[-.35,.35,-.35,.35]],boxes:[[-.18,.18,0,.36,-.18,.18]],
    spots:[{type:'plant',ap:[.6,.15],yaw:-Math.PI/2,pose:'water',label:'照顧盆栽'}]};
};

// little round table with a floor lamp next to it
PREFAB.lampCorner=()=>{
  cyl(.24,.24,.025,M.walnut,0,.5,0,32);cyl(.02,.02,.5,M.black,0,.25,0,12);cyl(.16,.16,.015,M.black,0,.008,0,28);
  const LX=.5,LZ=.15;
  cyl(.16,.17,.02,M.brass,LX,.01,LZ,32);cyl(.012,.012,1.5,M.brass,LX,.76,LZ,12);
  const shade=new THREE.MeshStandardMaterial({color:0xf3e3c8,roughness:.9,side:THREE.DoubleSide,emissive:0xffa050,emissiveIntensity:0});
  const sh=cyl(.15,.22,.3,shade,LX,1.6,LZ,32,true);sh.castShadow=false;
  sh.userData={label:'立燈',act:userLamp};interact.push(sh);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.04,12,8),new THREE.MeshBasicMaterial({color:0x000000}));bulb.position.set(LX,1.58,LZ);cur.add(bulb);
  const light=new THREE.PointLight(0xffab66,0,7,2);light.position.set(LX,1.5,LZ);cur.add(light);
  dev.lamps.push({light,shade,bulb:bulb.material.color});
  return{solid:[[-.3,.7,-.25,.55]],boxes:[[-.2,.2,.48,.515,-.2,.2]]};
};

// neon sign: a sun setting into the sea. Hangs on a wall; faces -x.
PREFAB.neon=()=>{
  const pink=new THREE.MeshBasicMaterial({color:0xffffff}),cyan=new THREE.MeshBasicMaterial({color:0xffffff});
  const tube=(pts,mat)=>cur.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*6,.011,8,false),mat));
  const X=-.03,cy=1.72,r=.36,a=[];
  for(let i=0;i<=20;i++){const t=Math.PI*i/20;a.push(new THREE.Vector3(X,cy+Math.sin(t)*r,Math.cos(t)*r));}
  tube(a,pink);
  [[.03,.29],[.13,.22]].forEach(l=>tube([new THREE.Vector3(X,cy+l[0]+.08,-l[1]),new THREE.Vector3(X,cy+l[0]+.08,l[1])],pink));
  [[0,.5],[-.09,.38],[-.18,.26]].forEach(l=>{const p=[];for(let i=0;i<=8;i++){const u=i/8;p.push(new THREE.Vector3(X,cy-.06+l[0]+Math.sin(u*Math.PI*4)*.012,-l[1]+u*2*l[1]));}tube(p,cyan);});
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.9),new THREE.MeshBasicMaterial({visible:false}));hit.rotation.y=-Math.PI/2;hit.position.set(X-.02,cy+.05,0);cur.add(hit);
  hit.userData={label:'霓虹燈',act:userNeon};interact.push(hit);
  const l1=new THREE.PointLight(0xff3fa0,0,5,2);l1.position.set(-.45,1.8,0);cur.add(l1);
  const l2=new THREE.PointLight(0x35e6ff,0,3.5,2);l2.position.set(-.4,1.45,0);cur.add(l2);
  dev.neons.push({pink,cyan,l1,l2});
};

// the way out. Sits in a wall; you walk up to it from the -z side.
PREFAB.door=()=>{
  box(.95,2.1,.05,M.walnut,0,1.05,-.02);box(1.07,2.16,.03,M.trim,0,1.08,-.012);
  cyl(.022,.022,.14,M.brass,-.35,1.02,-.07,16).rotation.x=Math.PI/2;
  return{spots:[{type:'out',ap:[0,-.45],yaw:0,pose:'idle',hide:true,shared:true,label:'出門上班'}]};
};

// double bed. The pillows are at the +z end. Two people can sleep in it, one from each side.
PREFAB.bed=()=>{
  box(1.62,.22,2.08,M.walnut,0,.17,0,{r:.02});                          // frame
  box(1.5,.2,1.96,M.linen,0,.37,0,{r:.06});                             // mattress
  box(1.62,.95,.08,M.walnut,0,.6,1.06,{r:.02});                         // headboard
  [-.37,.37].forEach(x=>box(.6,.12,.38,M.ceramic,x,.52,.72,{r:.05}));   // pillows
  box(1.54,.08,1.25,M.teal,0,.48,-.34,{r:.035});                        // blanket
  [[-.72,-.95],[.72,-.95],[-.72,.95],[.72,.95]].forEach(p=>cyl(.03,.025,.08,M.black,p[0],.04,p[1],12));
  const lie=x=>({type:'sleep',ap:[x<0?-1.05:1.05,0],an:[x,.6,-.12],lie:true,pref:2,pose:'lie',label:'睡覺 💤'});
  return{solid:[[-.81,.81,-1.04,1.1]],boxes:[[-.8,.8,0,.47,-1.03,1.03],[-.8,.8,0,1.07,1.02,1.1]],spots:[lie(-.36),lie(.36)]};
};

// wardrobe. Stands against a wall; the doors face -z.
PREFAB.wardrobe=()=>{
  box(1.4,2.1,.55,M.walnut,0,1.05,-.275,{r:.012});
  [-.35,.35].forEach(x=>{box(.66,1.98,.02,M.trim,x,1.06,-.56);cyl(.012,.012,.3,M.brass,x<0?x+.27:x-.27,1.05,-.585,10);});
  return{solid:[[-.72,.72,-.58,0]],boxes:[[-.7,.7,0,2.1,-.55,0]]};
};
