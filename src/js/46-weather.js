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
  bolt.visible=true;boltShow=.22;flash=1;flash2=.13;
  const wait=d/343*4;setTimeout(()=>sfxThunder(1-d/300),wait*1000);                 // light arrives at once; sound takes its time (stretched a little so you can notice)
  if(!toldBolt){toldBolt=true;say('閃電！光跑得非常快，所以先看到亮光；聲音跑得慢，過一下才聽到轟隆隆的雷聲。');}
  for(const n of people)if(!n.hidden&&!n.react&&!n.lie&&!roomAt(n.pos.x,n.pos.z)&&Math.random()<.6)react(n,'哇！打雷了！',1.2,'startle');
  for(const d2 of pets){d2.happy=0;bark(d2);}
}
const WX={sun:'晴天',rain:'下雨',storm:'雷雨',fog:'起霧'};
function setWeather(k){if(k===wx)return;const was=wx;wx=k;storm=k==='storm';fogOn=k==='fog';toldBolt=false;boltT=rnd(3,6);
  $('bRain').textContent='天氣：'+WX[k];rainT=rnd(120,260);
  const wet=k==='rain'||k==='storm';
  if(wet!==rainOn){rainOn=wet;if(wet)for(const n of people)if(!n.hidden&&!roomAt(n.pos.x,n.pos.z))notify(n,'rain');}
  say(k==='rain'?'下雨了：在外面的人會嚇一跳，放下手邊的事，跑回家。':k==='storm'?'雷雨來了：雨很大，天空還會閃電打雷。':k==='fog'?'起霧了：空氣裡有很多很小的水滴，遠的東西變得白白的看不清楚。':was==='fog'?'霧散了。':'雨停了。');}
function setRain(on){setWeather(on?'rain':'sun');}
$('bRain').onclick=()=>setWeather({sun:'rain',rain:'storm',storm:'fog',fog:'sun'}[wx]);
function updateWeather(dt){
  rainT-=dt;if(rainT<=0){const r=Math.random(),early=clock>4&&clock<9;setWeather(wx!=='sun'?(wx==='rain'&&r<.3?'storm':'sun'):r<(early?.45:.12)?'fog':r<.6?'rain':r<.75?'storm':'sun');}
  mist+=((fogOn?1:0)-mist)*(1-Math.exp(-dt*.5));
  flash*=Math.exp(-dt*10);if(flash2>0){flash2-=dt;if(flash2<=0)flash=.8;}          // a flash flickers twice
  if(boltShow>0){boltShow-=dt;if(boltShow<=0)bolt.visible=false;}
  if(storm&&rain>.5){boltT-=dt;if(boltT<=0){boltT=rnd(7,18);strike();}}
  rain+=((rainOn?1:0)-rain)*(1-Math.exp(-dt*.8));
  M.asphalt.roughness=.85-.5*rain;M.concrete.roughness=.9-.4*rain;               // wet ground shines
  rainPts.visible=rain>.03;if(!rainPts.visible)return;
  rainPts.material.opacity=.4*rain;rainPts.position.set(pos.x,0,pos.z);
  for(let i=0;i<RN;i++){const k=i*6;let x=rPos[k],y=rPos[k+1]-15*dt,z=rPos[k+2];
    if(y<0||(use.umbrella&&!ride&&y<2.4&&Math.hypot(x,z)<1.15)||(y<RH+.3&&roomAt(pos.x+x,pos.z+z))){x=rnd(-16,16);y=rnd(8,12);z=rnd(-16,16);}   // your umbrella and the roofs keep the rain out
    rPos[k]=x;rPos[k+1]=y;rPos[k+2]=z;rPos[k+3]=x+.03;rPos[k+4]=y+.45;rPos[k+5]=z;}
  rGeo.attributes.position.needsUpdate=true;
}
