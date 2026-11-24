/* ---------- state ---------- */
const S={lamp:false,tv:true,neon:true,orb:false};
let exposure=1,exposureTarget=1,envDirty=true,envTimer=0,dark=0;
const dyn=new THREE.Group();scene.add(dyn);            // everything that moves: people and balls
function userLamp(){S.lamp=!S.lamp;applySwitches();if(!S.lamp)people.forEach(n=>notify(n,'lampOff'));}
function userTv(){S.tv=!S.tv;applySwitches();if(!S.tv)people.forEach(n=>notify(n,'tvOff'));}
function userNeon(){S.neon=!S.neon;applySwitches();}
function applySwitches(){
  for(const d of dev.lamps){d.light.intensity=S.lamp?.5:0;d.shade.emissiveIntensity=S.lamp?1.6:0;d.bulb.setScalar(S.lamp?4:0);}
  for(const d of dev.tvs)d.mat.color.setScalar(S.tv?1.5:.02);
  const k=S.neon?1:0;for(const d of dev.neons){d.pink.color.setRGB(.08+k*3.2,.03+k*.35,.06+k*1.7);d.cyan.color.setRGB(.03+k*.25,.07+k*2.2,.08+k*2.9);}
  orbMat.emissiveIntensity=S.orb?2.2:.15;
  $('bLamp').setAttribute('aria-pressed',S.lamp);$('bTv').setAttribute('aria-pressed',S.tv);
  $('bNeon').setAttribute('aria-pressed',S.neon);$('bOrb').setAttribute('aria-pressed',S.orb);
  envDirty=true;envTimer=0;
}
$('bLamp').onclick=userLamp;
$('bTv').onclick=userTv;
$('bMind').onclick=()=>{const m=$('minds');m.hidden=!m.hidden;$('bMind').setAttribute('aria-pressed',!m.hidden);};
$('bNeon').onclick=userNeon;
$('bOrb').onclick=()=>{S.orb=!S.orb;applySwitches();
  say(S.orb?'引力球開了：它把別的球吸過來，別的球也用一樣大的力把它拉回去。':'引力球關了。');};

/* ---------- time: the clock runs, the sun and moon move, the light changes ---------- */
let clock=HOUSE.clock,speedIdx=1,sliding=false;
const SPEEDS=[[0,'暫停'],[2/60,'正常'],[15/60,'快轉']];   // game hours per real second
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cNight=new THREE.Color(0x5a6cff),cDusk=new THREE.Color(0xffc7a0),cDay=new THREE.Color(0xd4e6ff),
  cLow=new THREE.Color(0xff7a3a),cHigh=new THREE.Color(0xfff2dd),cMoon=new THREE.Color(0x7f9cff),sunDir=new THREE.Vector3();
function applyTime(){
  const h=clock,isDay=h>=6&&h<18,a=(isDay?h-6:(h-18+24)%24)/12*Math.PI;
  const e=Math.sin(a),se=Math.sin((h-6)/12*Math.PI);     // e: height of whichever is up, se: sun height (negative at night)
  sunDir.set(Math.cos(a)*.75,e*.62,-1).normalize();
  sun.position.copy(sun.target.position).addScaledVector(sunDir,12);
  const up=ss(-.02,.15,e),hi=ss(.05,.5,e);
  if(isDay){sun.color.copy(cLow).lerp(cHigh,hi);sun.intensity=(2.3-.5*hi)*up;}else{sun.color.copy(cMoon);sun.intensity=.14*up;}
  const duskW=ss(-.3,-.02,se),dayW=ss(.12,.5,se);dark=1-duskW;
  skyDuskMat.opacity=duskW;skyDayMat.opacity=dayW;
  hemi.color.copy(cNight).lerp(cDusk,duskW).lerp(cDay,dayW);hemi.intensity=.02+.08*duskW+.1*dayW;
  exposureTarget=1.15-.15*duskW;
  const k=(SKY_R-.1)/Math.hypot(sunDir.x,sunDir.z);disc.position.set(HC.x+sunDir.x*k,1.4+sunDir.y*k,HC.z+sunDir.z*k);disc.lookAt(HC.x,disc.position.y,HC.z);
  glow.position.set(HC.x+sunDir.x*k*1.002,disc.position.y,HC.z+sunDir.z*k*1.002);glow.quaternion.copy(disc.quaternion);
  if(isDay){disc.scale.setScalar(1);discMat.color.setRGB(5+hi,2.2+3.3*hi,.9+3.6*hi);glowMat.color.setRGB(1,.55+.4*hi,.3+.6*hi);glowMat.opacity=.9;}
  else{disc.scale.setScalar(.6);discMat.color.setRGB(1.7,1.8,2.1);glowMat.color.setRGB(.5,.6,.9);glowMat.opacity=.35;}
  dust.visible=isDay&&e>.03;
  const hh=Math.floor(h),mm=Math.floor((h-hh)*60);$('clk').textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}
const slider=$('time');slider.value=clock;
slider.addEventListener('input',()=>{clock=+slider.value;envDirty=true;envTimer=0;});
slider.addEventListener('pointerdown',()=>{sliding=true;});
addEventListener('pointerup',()=>{sliding=false;});
$('bSpeed').onclick=()=>{speedIdx=(speedIdx+1)%3;$('bSpeed').textContent='時間：'+SPEEDS[speedIdx][1];};
