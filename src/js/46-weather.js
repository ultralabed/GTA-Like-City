/* ---------- weather ---------- */
// Rain comes and goes by itself, or you press the button. When it starts, people outside get a fright,
// give up whatever they were doing out there, and hurry home.
let rainOn=false,rain=0,rainT=rnd(150,300);
let wx='sun',storm=false,fogOn=false,mist=0,flash=0,flash2=0,boltT=5,boltShow=0,toldBolt=false;   // weather: sun, rain, storm (rain with lightning) or fog
const RN=900,rPos=new Float32Array(RN*6);                                   // each drop is a short streak: two points
for(let i=0;i<RN;i++){const x=rnd(-16,16),y=rnd(0,12),z=rnd(-16,16);rPos.set([x,y,z,x+.03,y+.45,z],i*6);}
const rGeo=new THREE.BufferGeometry();rGeo.setAttribute('position',new THREE.BufferAttribute(rPos,3));
const rainPts=new THREE.LineSegments(rGeo,new THREE.LineBasicMaterial({color:0xbfd4e6,transparent:true,opacity:.4,depthWrite:false,fog:false}));
rainPts.frustumCulled=false;rainPts.visible=false;scene.add(rainPts);
// a lightning bolt: a crooked bright line far away in the sky
const boltGeo=new THREE.BufferGeometry();boltGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12*3),3));
const bolt=new THREE.Line(boltGeo,new THREE.LineBasicMaterial({color:new THREE.Color(9,10,14),fog:false}));bolt.frustumCulled=false;bolt.visible=false;scene.add(bolt);
function strike(){
  const a=rnd(0,6.283),d=rnd(90,220),A=boltGeo.attributes.position;let x=pos.x+Math.cos(a)*d,z=pos.z+Math.sin(a)*d;
  for(let i=0;i<12;i++){A.setXYZ(i,x,90-i*8.2,z);x+=rnd(-7,7);z+=rnd(-7,7);}A.needsUpdate=true;
  bolt.visible=true;boltShow=.22;flash=1;flash2=.13;scareGulls();
  const wait=d/343*4;setTimeout(()=>sfxThunder(1-d/300),wait*1000);                 // light arrives at once; sound takes its time (stretched a little so you can notice)
  if(!toldBolt){toldBolt=true;say('閃電！光跑得非常快，所以先看到亮光；聲音跑得慢，過一下才聽到轟隆隆的雷聲。');}
  for(const n of people)if(!n.hidden&&!n.react&&!n.lie&&!roomAt(n.pos.x,n.pos.z)&&Math.random()<.6)react(n,'哇！打雷了！',1.2,'startle');
  for(const d2 of pets){d2.happy=0;bark(d2);}
}
const WX={sun:'晴天',rain:'下雨',storm:'雷雨',fog:'起霧'};
function setWeather(k){if(k===wx)return;const was=wx;wx=k;storm=k==='storm';fogOn=k==='fog';toldBolt=false;boltT=rnd(3,6);
  $('bRain').textContent='天氣：'+WX[k];rainT=rnd(120,260);planWx();
  const wet=k==='rain'||k==='storm';
  if(wet!==rainOn){rainOn=wet;if(wet)for(const n of people)if(!n.hidden&&!roomAt(n.pos.x,n.pos.z))notify(n,'rain');}
  say(k==='rain'?'下雨了：在外面的人會嚇一跳，放下手邊的事，跑回家。':k==='storm'?'雷雨來了：雨很大，天空還會閃電打雷。':k==='fog'?'起霧了：空氣裡有很多很小的水滴，遠的東西變得白白的看不清楚。':was==='fog'?'霧散了。':'雨停了。');}
let nextWx=null;
function planWx(){const r=Math.random(),early=clock>4&&clock<9;nextWx=wx!=='sun'?(wx==='rain'&&r<.3?'storm':'sun'):r<(early?.45:.12)?'fog':r<.6?'rain':r<.75?'storm':'sun';}
function forecast(){if(!nextWx)planWx();const m=Math.max(1,Math.round(rainT/60));return'現在'+WX[wx]+'，'+(nextWx===wx?'接下來幾分鐘都一樣':'大約 '+m+' 分鐘後轉'+WX[nextWx])+(windS>5?'；風很大':windS>2.6?'；有風，可以放風箏':'')+'。';}
function setRain(on){setWeather(on?'rain':'sun');}
$('bRain').onclick=()=>setWeather({sun:'rain',rain:'storm',storm:'fog',fog:'sun'}[wx]);
// puddles: they fill while it rains and dry slowly afterwards (water turns into vapour and floats away)
let wet=0,toldDry=true;
const puddleMat=new THREE.MeshStandardMaterial({color:0x0b0f14,roughness:.03,metalness:0,transparent:true,opacity:0,depthWrite:false});
const puddles=new THREE.Group();puddles.visible=false;scene.add(puddles);
{let sd=7;const r=()=>(sd=(sd*16807)%2147483647)/2147483647,S=WORLD.street;
  for(let i=0;i<26;i++){const m=new THREE.Mesh(new THREE.CircleGeometry(1,14),puddleMat);m.rotation.x=-Math.PI/2;
    m.position.set(-36+r()*80,.016,i%4===0?(i%8===0?S.z0-1:S.z1+1)+(r()-.5)*.8:S.z0+.8+r()*(S.z1-S.z0-1.6));m.scale.set(.5+r()*1.1,.35+r()*.7,1);m.rotation.z=r()*3;m.renderOrder=2;puddles.add(m);}}
// the night market: Friday, Saturday and Sunday evenings from 6 to 10, down by the beach, unless it rains
let marketOn=false,marketForce=false,marketTold=false;
function marketStep(){const d=day%7;marketOn=marketForce||((d===5||d===6||d===0)&&clock>=18&&clock<22&&!rainOn);
  const k=marketOn?1:0;lanternMat.color.setRGB(.35+k*5.5,.23+k*2.6,.19+k*.7);
  if(marketOn&&!marketTold){marketTold=true;say('夜市開張了！海邊（碼頭東邊）的兩個攤位亮起燈籠，賣烤玉米和珍珠奶茶。週五、六、日晚上 6 點到 10 點。');}if(!marketOn)marketTold=false;}
function marketBuy(mk){if(!marketOn){say('這個攤位是夜市的，現在沒開。週五、六、日晚上 6 點到 10 點再來（下雨不開）。');return;}
  const price=mk===1?12:18;if(cash<price){say((mk===1?'烤玉米':'珍珠奶茶')+'要 $'+price+'，你的錢不夠。');return;}cash-=price;sfxCoin();
  if(mk===1){stam=Math.min(1,stam+.5);say('你買了一根烤玉米（$12），熱熱的好香。體力恢復了一半。');}else{drinks++;actKey='';say('你買了一杯珍珠奶茶（$18），放進背包。可以自己喝（按 3），也可以請別人喝。');}}
// wind: a gentle breeze most days, stronger in rain, strongest in a storm. It leans the rain and pushes light balls about
let windX=0,windZ=0,windS=0,windDir=rnd(0,6.28),windGoal=1,windT=0,windForce=-1,toldWind=false;
function windStep(dt){windT-=dt;if(windT<=0){windT=rnd(15,40);windGoal=storm?rnd(7,11):rainOn?rnd(3,6):Math.random()<.2?rnd(4,6.5):rnd(0,2.2);windDir+=rnd(-.8,.8);}
  const goal=windForce>=0?windForce:windGoal;windS+=(goal-windS)*(1-Math.exp(-dt*.3));const gust=1+.25*Math.sin(carClock*.7)+.12*Math.sin(carClock*2.3);
  windX=Math.cos(windDir)*windS*gust;windZ=Math.sin(windDir)*windS*gust;
  {const amp=Math.min(.16,.006+windS*.014),cx=Math.cos(windDir),sz=Math.sin(windDir),t2=carClock;                 // trees lean a little downwind and rock; more in a blow
    for(const T of treeTops){if(!T.g.parent.visible)continue;const w=Math.sin(t2*(1.1+windS*.12)*T.k+T.ph)*amp+amp*.6;T.g.rotation.z=-cx*w;T.g.rotation.x=sz*w;}}
  if(isleBeam){const on=dark>.45?1:0;isleBeam.visible=!!on;isleBeam.rotation.y=carClock*.5;isleLamp.material.color.setRGB(.33+on*8,.29+on*7,.19+on*4);}   // the lighthouse turns its beam at night
  if(flagMesh){const k=Math.min(1,windS/6);flagMesh.rotation.y=-windDir+Math.sin(carClock*(3+windS))*(.1+.25*k);flagMesh.rotation.z=-(1-k)*1.1;}   // the flag points downwind, hangs limp in a calm, flaps in a blow
  if(windS>4.2&&!toldWind){toldWind=true;say('起風了！風推東西的力氣跟「面積」有關：又大又輕的海灘球最容易被吹走，小小的網球和很重的保齡球幾乎不動。');}if(windS<2)toldWind=false;}
// fireworks over the sea: Saturday and Sunday evening from 8 to 9, if it is not raining
let fwOn=false,fwForce=false,fwT=0,fwTold=false,fwCount=0;
const FW=[];for(let i=0;i<5;i++){const N=70,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:1.6,transparent:true,opacity:0,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,color:0xffffff}));pts.frustumCulled=false;pts.visible=false;scene.add(pts);
  FW.push({pts,geo,N,v:new Float32Array(N*3),t:9});}
const FW_COL=[[6,2,1.5],[1.5,5,2],[2,3,7],[7,5,1.5],[6,2,6],[2,6,6]];
function fwStep(dt){
  fwOn=fwForce||(isWeekend()&&clock>=20&&clock<21&&!rainOn&&mist<.3);
  if(fwOn&&!fwTold){fwTold=true;say('咻——碰！海邊在放煙火（週末晚上 8 點到 9 點）。很多居民會走去海邊看。');
    for(const n of people){if(n.hidden||n.lie||n.guard||!n.goal||n.goal.id==='work'||n.goal.id==='sleep'||Math.random()>.75||!freeAct(n,'watch'))continue;        // the first bang: most people who are up drop what they are doing
      react(n,'外面在放煙火！去海邊看！',1.6,'startle',()=>{n.resume=null;setGoal(n,'watch');});}}if(!fwOn)fwTold=false;
  if(fwOn){fwT-=dt;if(fwT<=0){fwT=rnd(.7,2.2);const f=FW.find(q=>q.t>2.6);if(f){const cx=pos.x+rnd(-45,45),cy=rnd(26,44),cz=WORLD.shore-rnd(45,80),A=f.geo.attributes.position,c=FW_COL[Math.floor(Math.random()*FW_COL.length)],sp=rnd(7,12);
        for(let i=0;i<f.N;i++){const u=Math.random()*2-1,a=Math.random()*6.283,s=Math.sqrt(1-u*u),k=sp*(.75+Math.random()*.3);A.setXYZ(i,cx,cy,cz);f.v[i*3]=Math.cos(a)*s*k;f.v[i*3+1]=u*k;f.v[i*3+2]=Math.sin(a)*s*k;}
        f.pts.material.color.setRGB(c[0],c[1],c[2]);f.t=0;f.pts.visible=true;fwCount++;const d=Math.hypot(cx-pos.x,cz-pos.z);setTimeout(()=>sfxBoom(1-d/160),d/343*1000);}}}
  for(const f of FW){if(f.t>2.6)continue;f.t+=dt;const A=f.geo.attributes.position,a=A.array,drag=Math.exp(-dt*1.4);
    for(let i=0;i<f.N*3;i+=3){f.v[i]*=drag;f.v[i+1]=f.v[i+1]*drag-2.2*dt;f.v[i+2]*=drag;a[i]+=f.v[i]*dt;a[i+1]+=f.v[i+1]*dt;a[i+2]+=f.v[i+2]*dt;}
    A.needsUpdate=true;f.pts.material.opacity=Math.max(0,1-f.t/2.4);if(f.t>2.6)f.pts.visible=false;}}
// a rainbow: after rain, when the sun is out, look away from the sun
const bowC=document.createElement('canvas');bowC.width=512;bowC.height=256;
{const g=bowC.getContext('2d'),cols=['#ff3b3b','#ff9a2e','#ffe53b','#4fd66a','#3ba8ff','#5a5bff','#a44dff'];g.lineWidth=7;
  cols.forEach((c,i)=>{g.strokeStyle=c;g.beginPath();g.arc(256,256,236-i*6.5,Math.PI,0);g.stroke();});}
const bowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(bowC),transparent:true,opacity:0,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const bow=new THREE.Mesh(new THREE.PlaneGeometry(360,180),bowMat);bow.visible=false;bow.frustumCulled=false;scene.add(bow);
let bowK=0,toldBow=false;
// --- shooting stars: on clear nights one streaks across the sky now and then. Looking at one lifts your spirits a little ---
const meteor=new THREE.Mesh(new THREE.BoxGeometry(1,.6,.6),new THREE.MeshBasicMaterial({color:new THREE.Color(3,3,2.4),fog:false}));meteor.visible=false;meteor.frustumCulled=false;scene.add(meteor);
let meteorT=9,meteorNext=25,meteorSeen=0;const meteorA=new THREE.Vector3(),meteorV=new THREE.Vector3();
function meteorNow(front){if(front)camera.getWorldDirection(meteorV);const a=front?Math.atan2(meteorV.z,meteorV.x)+rnd(-.25,.25):Math.random()*6.28,b=a+rnd(1.6,2.4)*(Math.random()<.5?1:-1);meteorA.set(Math.cos(a)*260,front?rnd(110,150):rnd(170,230),Math.sin(a)*260).add(camera.position);meteorA.x-=Math.cos(b)*90;meteorA.z-=Math.sin(b)*90;
  meteorV.set(Math.cos(b)*180,-rnd(30,60),Math.sin(b)*180);meteorT=0;meteor.visible=true;}
function meteorStep(dt){if(meteorT>1.1){meteor.visible=false;if(dark>.75&&rain<.05&&mist<.1){meteorNext-=dt;if(meteorNext<=0){meteorNext=rnd(35,80);meteorNow();}}return;}
  meteorT+=dt;const k=meteorT/1.1;meteor.position.copy(meteorA).addScaledVector(meteorV,meteorT);meteor.lookAt(meteor.position.x+meteorV.x,meteor.position.y+meteorV.y,meteor.position.z+meteorV.z);meteor.rotateY(Math.PI/2);
  meteor.scale.set(26*Math.sin(Math.PI*Math.min(1,k)),1-k*.6,1-k*.6);
  if(k<.2&&!roomAt(pos.x,pos.z)&&performance.now()-meteorSeen>240000){pv3.copy(meteor.position).project(camera);if(pv3.z<1&&Math.abs(pv3.x)<.8&&Math.abs(pv3.y)<.8){meteorSeen=performance.now();say('🌠 流星！快許願！');}}}
function bowStep(dt){const want=wet>.25&&rain<.15&&mist<.1&&sunDir.y>.08&&dark<.4?1:0;bowK+=(want-bowK)*(1-Math.exp(-dt*.25));
  bow.visible=bowK>.02;if(!bow.visible){if(want===0&&bowK<.01)toldBow=false;return;}
  const L=Math.hypot(sunDir.x,sunDir.z)||1,dx=-sunDir.x/L,dz=-sunDir.z/L;bow.position.set(pos.x+dx*250,90-sunDir.y*120,pos.z+dz*250);bow.lookAt(pos.x,bow.position.y,pos.z);bowMat.opacity=bowK*.8;
  if(!toldBow&&bowK>.5){toldBow=true;say('彩虹！太陽光照到空中的小水滴，被分成紅橙黃綠藍靛紫。彩虹永遠在太陽的對面，背對太陽找找看。');}}
// going through a puddle fast throws water sideways: anyone standing close gets wet, and says so
const splashRing=new THREE.Mesh(new THREE.RingGeometry(.55,.75,20),new THREE.MeshBasicMaterial({color:0xcfe3f2,transparent:true,opacity:0,depthWrite:false}));splashRing.rotation.x=-Math.PI/2;splashRing.position.y=.05;splashRing.visible=false;scene.add(splashRing);
let ringT=0,splashAt=-9,toldSplash=false,whooshAt=-9;
function splashStep(dt){
  if(ringT>0){ringT-=dt;const k=1-ringT/.45;splashRing.scale.setScalar(.6+k*2.4);splashRing.material.opacity=.7*(1-k);if(ringT<=0)splashRing.visible=false;}
  const now=carClock,sp=ride?Math.abs(ride.v):Math.hypot(vel.x,vel.z);
  if(!onBus&&!ride&&sp>4&&now-whooshAt>2.5&&!roomAt(pos.x,pos.z))for(const n of people)if(!n.hidden&&!n.react&&n.phase==='go'&&Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<1.1){whooshAt=now;notify(n,'whoosh');break;}   // skating or running right past someone
  if(wet<.3||onBus||sp<2.5||jumpY>.05||now-splashAt<.8||(ride&&ride.S.water))return;
  for(const m of puddles.children){const dx=pos.x-m.position.x,dz=pos.z-m.position.z;if(dx*dx+dz*dz>m.scale.x*m.scale.x)continue;
    splashAt=now;splashRing.position.x=pos.x;splashRing.position.z=pos.z;splashRing.visible=true;ringT=.45;noise(.22,ride?700:1100,.7,ride?.3:.16);
    const reach=ride?3.2:1.8;let hit=0;for(const n of people)if(!n.hidden&&!n.lie&&Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)<reach){notify(n,'splash',ride);hit++;}
    if(!toldSplash){toldSplash=true;say('嘩啦！你衝過水坑，水往兩邊噴。'+(hit?'':'旁邊有人的話會被濺濕，他會不高興。'));}
    return;}}
function updateWeather(dt){
  splashStep(dt);bowStep(dt);fwStep(dt);meteorStep(dt);windStep(dt);marketStep();
  wet+=((rain>.5?1:0)-wet)*(1-Math.exp(-dt*(rain>.5?.05:.012)));
  puddles.visible=wet>.04;puddleMat.opacity=Math.min(.8,wet);if(puddles.visible)puddleMat.emissive.copy(skyU.cHor.value).multiplyScalar(.5);   // a puddle is a little mirror: it shows the colour of the sky
  if(wet>.5)toldDry=false;else if(!toldDry&&wet<.06&&rain<.1){toldDry=true;say('地上的水坑乾了：水變成看不見的水蒸氣，飄到空氣裡去了。');}
  if(!nextWx)planWx();rainT-=dt;if(rainT<=0){const nx=nextWx;if(nx===wx){rainT=rnd(120,260);planWx();}else setWeather(nx);}             // the weather to come is decided ahead of time, so there can be a forecast
  mist+=((fogOn?1:0)-mist)*(1-Math.exp(-dt*.5));
  flash*=Math.exp(-dt*10);if(flash2>0){flash2-=dt;if(flash2<=0)flash=.8;}          // a flash flickers twice
  if(boltShow>0){boltShow-=dt;if(boltShow<=0)bolt.visible=false;}
  if(storm&&rain>.5){boltT-=dt;if(boltT<=0){boltT=rnd(7,18);strike();}}
  rain+=((rainOn?1:0)-rain)*(1-Math.exp(-dt*.8));
  {const w=Math.max(rain,wet);M.asphalt.roughness=.85-.5*w;M.concrete.roughness=.9-.4*w;}               // wet ground shines
  rainPts.visible=rain>.03;if(!rainPts.visible)return;
  rainPts.material.opacity=.4*rain;rainPts.position.set(pos.x,0,pos.z);
  const wx2=windX*.045,wz2=windZ*.045;
  for(let i=0;i<RN;i++){const k=i*6;let x=rPos[k]+windX*dt*.6,y=rPos[k+1]-15*dt,z=rPos[k+2]+windZ*dt*.6;if(x>16||x<-16||z>16||z<-16){x=rnd(-16,16);z=rnd(-16,16);}
    if(y<0||(use.umbrella&&!ride&&y<2.4&&Math.hypot(x,z)<1.15)||(y<RH+.3&&roomAt(pos.x+x,pos.z+z))){x=rnd(-16,16);y=rnd(8,12);z=rnd(-16,16);}   // your umbrella and the roofs keep the rain out
    rPos[k]=x;rPos[k+1]=y;rPos[k+2]=z;rPos[k+3]=x+.03+wx2;rPos[k+4]=y+.45;rPos[k+5]=z+wz2;}
  rGeo.attributes.position.needsUpdate=true;
}
