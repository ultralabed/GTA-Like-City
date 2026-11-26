/* ---------- furniture prefabs ---------- */
// Every number in here is measured from the furniture's own middle (or from the wall it hangs on).
PREFAB.spot=o=>({spots:[{type:o.kind,ap:[0,0],yaw:o.yaw,pose:o.pose,label:o.label,chase:o.chase,catch:o.catch,lift:o.lift,hide:o.hide,shared:o.shared,pub:o.pub}]});

PREFAB.rug=o=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(o.w||2.5,o.d||3.1),M.rug);m.rotation.x=-Math.PI/2;m.position.y=.008;m.receiveShadow=true;cur.add(m);};

// low cabinet with a TV above it. Stands against a wall; the screen faces +x.
PREFAB.tvConsole=()=>{
  box(.45,.42,1.9,M.walnut,.28,.33,0,{r:.015});
  [-.75,.75].forEach(z=>box(.35,.12,.05,M.black,.28,.06,z));
  box(.04,.78,1.36,M.black,.1,1.25,0,{r:.012});
  const c=cv(256,144),tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;
  const mat=new THREE.MeshBasicMaterial({map:tex});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.72),mat);scr.rotation.y=Math.PI/2;scr.position.set(.124,1.25,0);cur.add(scr);
  const H=bH;scr.userData={label:'電視',act:()=>userTv(H)};interact.push(scr);
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
  box(.2,.02,.2,M.ceramic,-.12,.42,-.42);box(.1,.05,.1,M.coral,-.12,.45,-.42,{r:.02});                  // a plate with a snack
  return{solid:[[-.33,.33,-.6,.6]],boxes:[[-.31,.31,.39,.41,-.575,.575],[-.28,.28,.145,.175,-.545,.545]],
    spots:[{type:'snack',ap:[-.75,-.3],an:[-.72,.3,-.3],yaw:Math.PI/2,pose:'eat',label:'坐在地毯上吃點心'}]};
};

// tall shelf full of books. Stands against a wall; the books face -x.
const bookCols=[0xb5533a,0x1f5a5e,0xe0a45c,0x3b2a3f,0xe8d9c0,0x7a2c5a,0x2b3a67,0xd9783f];
PREFAB.bookshelf=()=>{
  const bx=-.2;
  box(.34,2.0,.03,M.walnut,bx,1.0,-.62);box(.34,2.0,.03,M.walnut,bx,1.0,.62);
  for(let i=0;i<5;i++)box(.34,.03,1.24,M.walnut,bx,.03+i*.49,0);
  box(.02,2.0,1.24,M.walnut,-.04,1.0,0);
  const books=[];
  for(let s=0;s<4;s++){let z=-.58;const y0=.045+s*.49;
    while(z<.5){const w=rnd(.025,.06),hh=rnd(.24,.38),d=rnd(.18,.26);
      if(Math.random()<.14){z+=rnd(.1,.22);continue;}
      books.push([d,hh,w,bx-.02,y0+hh/2,z+w/2,bookCols[Math.floor(rnd(0,8))],Math.random()<.1?.12:0]);
      z+=w+.004;}}
  boxBatch(books);
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
  const H=bH;sh.userData={label:'立燈',act:()=>userLamp(H)};interact.push(sh);
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
  const H=bH;hit.userData={label:'霓虹燈',act:()=>userNeon(H)};interact.push(hit);
  const l1=new THREE.PointLight(0xff3fa0,0,5,2);l1.position.set(-.45,1.8,0);cur.add(l1);
  const l2=new THREE.PointLight(0x35e6ff,0,3.5,2);l2.position.set(-.4,1.45,0);cur.add(l2);
  dev.neons.push({pink,cyan,l1,l2});
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
  [-.35,.35].forEach(x=>{const dr=box(.66,1.98,.02,M.trim,x,1.06,-.56);dr.userData={tip:'點一下：換衣服',act:nextOutfit};interact.push(dr);cyl(.012,.012,.3,M.brass,x<0?x+.27:x-.27,1.05,-.585,10);});
  return{solid:[[-.72,.72,-.58,0]],boxes:[[-.7,.7,0,2.1,-.55,0]]};
};

// something small you can take and keep: a flashlight lying down, or a closed umbrella standing up
PREFAB.item=o=>{const g=new THREE.Group();g.userData.dyn=true;g.position.y=o.y||0;cur.add(g);const pv=cur;cur=g;
  if(o.kind==='flashlight'){cyl(.022,.028,.17,M.steel,0,.03,0,12).rotation.x=Math.PI/2;cyl(.036,.03,.04,M.brass,0,.03,.1,12).rotation.x=Math.PI/2;}
  else{cyl(.035,.05,.78,M.teal,0,.43,0,10);cyl(.009,.009,.96,M.black,0,.5,0,6);}
  cur=pv;return{marks:[{kind:'item',x:0,z:0,item:o.kind,mesh:g}]};
};

// shop counter with a till. The shopkeeper stands behind it (at -z) facing the customers (+z). Click the till to buy.
PREFAB.counter=()=>{
  box(2.4,.95,.6,M.walnut,0,.475,0,{r:.02});box(2.5,.05,.7,M.ceramic,0,.975,0);
  const till=box(.42,.3,.36,M.black,-.6,1.15,0,{r:.03});box(.3,.16,.02,M.teal,-.6,1.36,.1,{rz:0});
  till.userData={tip:'點一下：買東西',act:shopMenu};interact.push(till);
  [.2,.55,.9].forEach((x,i)=>cyl(.05,.05,.16,[M.teal,M.brass,M.coral][i],x,1.08,.05,10));
  return{solid:[[-1.25,1.25,-.35,.35]],boxes:[[-1.2,1.2,0,1,-.3,.3]],
    spots:[{type:'serve',ap:[0,-.8],yaw:0,pose:'window',label:'顧店'}]};
};
// a low double-sided shelf of goods. People stand in front of it to look.
PREFAB.rack=()=>{
  box(1.6,1.2,.5,M.trim,0,.6,0);
  const goods=[];for(let s=0;s<3;s++)for(let i=0;i<7;i++)[-1,1].forEach(k=>goods.push([.16,rnd(.14,.24),.14,-.66+i*.22,.2+s*.4,k*.2,bookCols[Math.floor(rnd(0,8))]]));boxBatch(goods);
  const look=(x,z,yaw)=>({type:'browse',ap:[x,z],yaw,pose:'read',label:'逛商店',pub:true});
  return{solid:[[-.82,.82,-.27,.27]],boxes:[[-.8,.8,0,1.2,-.25,.25]],spots:[look(-.3,.75,Math.PI),look(.3,-.75,0)]};
};

/* ----- things that stand outside ----- */
const icoG=new THREE.IcosahedronGeometry(1,1);
PREFAB.tree=o=>{const s=o.s||1;
  cyl(.13*s,.19*s,2.3*s,M.bark,0,1.15*s,0,10);
  [[0,3.1,0,1.25],[.55,2.6,.3,.9],[-.5,2.75,-.35,.95],[.1,3.9,-.1,.8]].forEach((q,i)=>{const m=new THREE.Mesh(icoG,i%2?M.crown2:M.crown);
    m.position.set(q[0]*s,q[1]*s,q[2]*s);m.scale.setScalar(q[3]*s);m.rotation.set(i,i*2,0);add(m);});
  return{solid:[[-.24,.24,-.24,.24]],boxes:[[-.17,.17,0,2.3*s,-.17,.17]]};
};
// street lamp: the arm reaches toward +z
PREFAB.streetLamp=()=>{
  cyl(.05,.08,4.3,M.steel,0,2.15,0,10);box(.06,.06,1.0,M.steel,0,4.25,.45);
  const mat=new THREE.MeshBasicMaterial({color:0x111111});const head=box(.26,.07,.42,mat,0,4.2,.9);head.castShadow=false;
  return{solid:[[-.1,.1,-.1,.1]],boxes:[[-.07,.07,0,4.3,-.07,.07]],marks:[{kind:'streetLamp',x:0,z:.9,y:4.1,mat}]};
};
// park bench for two. You sit facing +z.
PREFAB.bench=()=>{
  box(1.5,.06,.46,M.walnut,0,.45,0);box(1.5,.44,.05,M.walnut,0,.76,-.22);
  [-.65,.65].forEach(x=>{box(.06,.45,.42,M.steel,x,.225,0);box(.06,.5,.05,M.steel,x,.7,-.22);});
  const sit=x=>({type:'bench',ap:[x,.62],an:[x,.56,.04],yaw:0,pose:'sit',label:'坐在長椅上'});
  return{solid:[[-.78,.78,-.28,.25]],boxes:[[-.75,.75,0,.48,-.23,.23],[-.75,.75,.48,.98,-.26,-.19]],spots:[sit(-.38),sit(.38)]};
};
// drinks machine. The front faces +z; click it to buy.
PREFAB.rod=()=>{                                                           // a rod holder stuck in the sand: this is a fishing place
  cyl(.03,.03,.5,M.steel,0,.25,0,8);const r=cyl(.012,.02,2.4,M.black,0,1.25,-.75,6);r.rotation.x=-.75;
  const l=cyl(.004,.004,1.9,M.ceramic,0,1.1,-1.62,4);l.castShadow=false;
};
PREFAB.flag=()=>{                                                          // a pole with a chequered flag
  cyl(.04,.05,3.2,M.steel,0,1.6,0,8);
  const c=document.createElement('canvas');c.width=64;c.height=48;const g=c.getContext('2d');for(let i=0;i<4;i++)for(let j=0;j<3;j++){g.fillStyle=(i+j)%2?'#111':'#f4f4f4';g.fillRect(i*16,j*16,16,16);}
  const f=new THREE.Mesh(new THREE.PlaneGeometry(1,.75),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));f.position.set(.52,2.8,0);cur.add(f);
  f.userData={tip:'點一下：計時賽的起點（要先坐上車、機車或腳踏車）',act:()=>startRace()};interact.push(f);
  return{solid:[[-.08,.08,-.08,.08]]};
};
PREFAB.pump=()=>{
  box(.9,.12,.6,M.concrete,0,.06,0);box(.6,1.5,.4,M.teal,0,.87,0,{r:.04});box(.66,.2,.46,M.ceramic,0,1.7,0,{r:.04});
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.4,.3),new THREE.MeshBasicMaterial({color:0xfff0c0}));scr.position.set(0,1.25,.205);cur.add(scr);
  box(.06,.5,.06,M.black,.34,.9,.1);cyl(.03,.03,.3,M.steel,.34,1.2,.1,8);
  scr.userData={tip:'點一下：加油（要先把車停在旁邊）',act:()=>refuel()};interact.push(scr);
  return{solid:[[-.4,.4,-.28,.28]],boxes:[[-.3,.3,0,1.8,-.2,.2]]};
};
PREFAB.vending=()=>{
  box(1,1.9,.7,M.coral,0,.95,0,{r:.03});
  const front=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.1),new THREE.MeshBasicMaterial({color:0xbfe8ff}));front.position.set(0,1.2,.356);cur.add(front);
  [-.25,0,.25].forEach((x,i)=>cyl(.05,.05,.16,[M.teal,M.brass,M.ceramic][i],x,1.25,.33,10));
  box(.6,.12,.02,M.black,0,.35,.36);
  front.userData={tip:'點一下：買飲料（$20）',act:buyDrink};interact.push(front);
  return{solid:[[-.52,.52,-.37,.37]],boxes:[[-.5,.5,0,1.9,-.35,.35]]};
};
// street-food stall with two stools. You eat facing -z (toward the stall). Click the counter to buy a snack.
PREFAB.stall=()=>{
  box(2.2,.9,.7,M.coral,0,.45,-.6,{r:.03});box(2.3,.05,.8,M.ceramic,0,.925,-.6);
  [-1.05,1.05].forEach(x=>cyl(.03,.03,2.3,M.steel,x,1.15,-.95,8));
  const aw=box(2.6,.06,1.5,M.teal,0,2.3,-.45);aw.rotation.x=.12;
  [-.5,0,.5].forEach((x,i)=>cyl(.12,.1,.1,[M.brass,M.ceramic,M.terracotta][i],x,1,-.6,14));
  const till=box(.3,.2,.25,M.black,.85,1.05,-.6,{r:.02});till.userData={tip:'點一下：買點心（$15）',act:buySnack};interact.push(till);
  const seat=x=>{cyl(.17,.17,.05,M.walnut,x,.5,.25,16);cyl(.03,.04,.5,M.steel,x,.25,.25,8);
    return{type:'eat',ap:[x,.95],an:[x,.58,.25],yaw:Math.PI,pose:'eat',label:'在小吃攤吃東西',pub:true};};
  return{solid:[[-1.15,1.15,-1,-.2],[-.7,-.3,.05,.45],[.3,.7,.05,.45]],boxes:[[-1.1,1.1,0,.95,-.95,-.25],[-1.3,1.3,2.25,2.35,-1.2,.3]],spots:[seat(-.5),seat(.5)]};
};
// bus stop: a sign, a little shelter and a bench. People wait in front of it (+z, toward the road).
PREFAB.busStop=o=>{
  cyl(.04,.05,2.6,M.steel,-1.5,1.3,.3,8);box(.5,.5,.04,M.teal,-1.5,2.4,.3);box(.3,.12,.045,M.trim,-1.5,2.4,.3);
  [-1,1].forEach(x=>cyl(.04,.04,2.3,M.steel,x,1.15,-.5,8));box(2.5,.06,1.2,M.teal,0,2.32,-.1);box(2.3,1.3,.03,M.glass,0,1.35,-.52,{shadow:false});
  box(1.8,.06,.4,M.walnut,0,.45,-.3);[-.75,.75].forEach(x=>box(.06,.45,.36,M.steel,x,.225,-.3));
  return{solid:[[-1.05,1.05,-.6,-.1],[-1.6,-1.4,.2,.4]],boxes:[[-.95,.95,0,.5,-.5,-.1],[-1.3,1.3,2.28,2.36,-.7,.5]],
    spots:[{type:'exit',ap:[0,.55],yaw:0,pose:'idle',hide:true,shared:true,bus:o.dir,label:'搭公車'}]};
};
// a big building you only see from outside: a box with rows of windows that light up at night
const blockMats=[];
PREFAB.block=o=>{
  const c=cv(128,256),g=c.getContext('2d'),e=cv(128,256),ge=e.getContext('2d');
  g.fillStyle='#'+o.col.toString(16).padStart(6,'0');g.fillRect(0,0,128,256);ge.fillStyle='#000';ge.fillRect(0,0,128,256);
  for(let y=14;y<240;y+=30)for(let x=10;x<118;x+=22){g.fillStyle='#2a3340';g.fillRect(x,y,14,18);if(Math.random()<.55){ge.fillStyle=Math.random()<.25?'#9fe0ff':'#ffd98a';ge.fillRect(x,y,14,18);}}
  const map=tex(c,true,1),em=tex(e,true,1);map.repeat.set(1/4,1/8);em.repeat.set(1/4,1/8);                     // one copy of the picture covers 4 m by 8 m of wall
  const mat=new THREE.MeshStandardMaterial({map,emissiveMap:em,emissive:0xffffff,emissiveIntensity:0,roughness:.85});blockMats.push(mat);
  box(o.w,o.h,o.d,mat,0,o.h/2,0);box(o.w+.3,.25,o.d+.3,M.steel,0,o.h+.12,0);
  return{solid:[[-o.w/2,o.w/2,-o.d/2,o.d/2]],boxes:[[-o.w/2,o.w/2,0,o.h,-o.d/2,o.d/2]]};
};
// basketball hoop. The board faces +z. Get a ball down through the ring to score.
const hoops=[];
PREFAB.hoop=()=>{
  cyl(.07,.09,2.9,M.steel,0,1.45,-.35,10);box(.08,.08,.5,M.steel,0,2.85,-.12);
  box(1.3,.9,.05,M.trim,0,3.0,.1);box(.5,.36,.055,M.coral,0,2.82,.1);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.26,.02,8,24),M.coral);ring.rotation.x=Math.PI/2;ring.position.set(0,2.62,.42);ring.castShadow=true;cur.add(ring);
  return{solid:[[-.15,.15,-.5,-.2]],boxes:[[-.65,.65,2.55,3.45,.07,.13],[-.1,.1,0,2.9,-.45,-.25]],marks:[{kind:'hoop',x:0,z:.42,y:2.62}]};
};
