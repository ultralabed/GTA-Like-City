/* ---------- weather ---------- */
// Rain comes and goes by itself, or you press the button. When it starts, people outside get a fright,
// give up whatever they were doing out there, and hurry home.
let rainOn=false,rain=0,rainT=rnd(150,300);
const RN=900,rPos=new Float32Array(RN*6);                                   // each drop is a short streak: two points
for(let i=0;i<RN;i++){const x=rnd(-16,16),y=rnd(0,12),z=rnd(-16,16);rPos.set([x,y,z,x+.03,y+.45,z],i*6);}
const rGeo=new THREE.BufferGeometry();rGeo.setAttribute('position',new THREE.BufferAttribute(rPos,3));
const rainPts=new THREE.LineSegments(rGeo,new THREE.LineBasicMaterial({color:0xbfd4e6,transparent:true,opacity:.4,depthWrite:false,fog:false}));
rainPts.frustumCulled=false;rainPts.visible=false;scene.add(rainPts);
function setRain(on){
  if(on===rainOn)return;rainOn=on;rainT=rnd(120,260);
  $('bRain').textContent='天氣：'+(on?'下雨':'晴天');
  say(on?'下雨了：在外面的人會嚇一跳，放下手邊的事，跑回家。':'雨停了。');
  if(on)for(const n of people)if(!n.hidden&&!roomAt(n.pos.x,n.pos.z))notify(n,'rain');
}
$('bRain').onclick=()=>setRain(!rainOn);
function updateWeather(dt){
  rainT-=dt;if(rainT<=0)setRain(!rainOn&&Math.random()<.6?true:false);
  rain+=((rainOn?1:0)-rain)*(1-Math.exp(-dt*.8));
  M.asphalt.roughness=.85-.5*rain;M.concrete.roughness=.9-.4*rain;               // wet ground shines
  rainPts.visible=rain>.03;if(!rainPts.visible)return;
  rainPts.material.opacity=.4*rain;rainPts.position.set(pos.x,0,pos.z);
  for(let i=0;i<RN;i++){const k=i*6;let x=rPos[k],y=rPos[k+1]-15*dt,z=rPos[k+2];
    if(y<0||(use.umbrella&&!ride&&y<2.4&&Math.hypot(x,z)<1.15)||(y<RH+.3&&roomAt(pos.x+x,pos.z+z))){x=rnd(-16,16);y=rnd(8,12);z=rnd(-16,16);}   // your umbrella and the roofs keep the rain out
    rPos[k]=x;rPos[k+1]=y;rPos[k+2]=z;rPos[k+3]=x+.03;rPos[k+4]=y+.45;rPos[k+5]=z;}
  rGeo.attributes.position.needsUpdate=true;
}
