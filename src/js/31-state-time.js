/* ---------- state ---------- */
// every house has its own switches (H.S). The buttons at the top work the house you are in, or the nearest one.
const G={orb:false};
let exposure=1,exposureTarget=1,envDirty=true,envTimer=0,dark=0,activeHouse=houses[0];
const dyn=new THREE.Group();scene.add(dyn);            // everything that moves: people and balls
function curHouse(){let best=houses[0],bd=1e9;for(const H of houses){const d=houseDist(H,pos.x,pos.z);if(d<bd){bd=d;best=H;}}return best;}
const asHouse=H=>(H&&H.S)?H:curHouse();
const inHouse=(n,H)=>{const r=roomAt(n.pos.x,n.pos.z);return!n.hidden&&r&&r.house===H;};
function userLamp(H){H=asHouse(H);H.S.lamp=!H.S.lamp;applySwitches();if(!H.S.lamp)people.forEach(n=>inHouse(n,H)&&notify(n,'lampOff'));}
function userTv(H){H=asHouse(H);H.S.tv=!H.S.tv;applySwitches();if(!H.S.tv)people.forEach(n=>inHouse(n,H)&&notify(n,'tvOff'));}
function userNeon(H){H=asHouse(H);H.S.neon=!H.S.neon;applySwitches();}
function applySwitches(){
  for(const H of houses){const S=H.S,on=H===activeHouse;                 // only the nearest house has real lights; the others just glow
    for(const d of H.dev.lamps){d.light.visible=on;d.light.intensity=S.lamp?.5:0;d.shade.emissiveIntensity=S.lamp?1.6:0;d.bulb.setScalar(S.lamp?4:0);}
    for(const d of H.dev.tvs){d.light.visible=on;d.mat.color.setScalar(S.tv?1.5:.02);}
    const k=S.neon?1:0;for(const d of H.dev.neons){d.l1.visible=d.l2.visible=on;d.pink.color.setRGB(.08+k*3.2,.03+k*.35,.06+k*1.7);d.cyan.color.setRGB(.03+k*.25,.07+k*2.2,.08+k*2.9);}}
  orbMat.emissiveIntensity=G.orb?2.2:.15;
  const S=activeHouse.S;
  $('bLamp').setAttribute('aria-pressed',S.lamp);$('bTv').setAttribute('aria-pressed',S.tv);
  $('bNeon').setAttribute('aria-pressed',S.neon);$('bOrb').setAttribute('aria-pressed',G.orb);
  envDirty=true;envTimer=0;
}
$('bLamp').onclick=userLamp;
$('bTv').onclick=userTv;
$('bMind').onclick=()=>{const m=$('minds');m.hidden=!m.hidden;$('bMind').setAttribute('aria-pressed',!m.hidden);};
$('bNeon').onclick=userNeon;
$('bOrb').onclick=()=>{G.orb=!G.orb;applySwitches();
  say(G.orb?'引力球開了：它把別的球吸過來，別的球也用一樣大的力把它拉回去。':'引力球關了。');};

/* ---------- time: the clock runs, the sun and moon move, the light changes ---------- */
let day=5;                                                                // which day it is; day%7: 0 Sunday ... 5 Friday, 6 Saturday. The game starts on a Friday evening.
const DOW='日一二三四五六',isWeekend=()=>day%7===0||day%7===6;
let clock=WORLD.clock,speedIdx=1,sliding=false;
const SPEEDS=[[0,'暫停'],[2/60,'正常'],[15/60,'快轉']];   // game hours per real second
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cNight=new THREE.Color(0x5a6cff),cDusk=new THREE.Color(0xffc7a0),cDay=new THREE.Color(0xd4e6ff),
  cLow=new THREE.Color(0xff7a3a),cHigh=new THREE.Color(0xfff2dd),cMoon=new THREE.Color(0x7f9cff),sunDir=new THREE.Vector3();
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const SKY={top:[lin(0x02030a),lin(0x24184f),lin(0x1f5fc4)],mid:[lin(0x0a1034),lin(0xe3507a),lin(0x8cc4f0)],hor:[lin(0x2a1d55),lin(0xffb870),lin(0xdff0fb)],
  city:[lin(0x070515),lin(0x2a163f),lin(0x8fa2bf)],sea:[lin(0x0a1230),lin(0xb85a78),lin(0x2f7fb0)]};   // night, dusk, day
const blend=(out,c,a,b)=>out.copy(c[0]).lerp(c[1],a).lerp(c[2],b);
function applyTime(){
  const h=clock,isDay=h>=6&&h<18,a=(isDay?h-6:(h-18+24)%24)/12*Math.PI;
  const e=Math.sin(a),se=Math.sin((h-6)/12*Math.PI);     // e: height of whichever is up, se: sun height (negative at night)
  sunDir.set(Math.cos(a)*.75,e*.62,-1).normalize();
  sun.target.position.set(Math.round(pos.x),0,Math.round(pos.z));        // the sun's shadow follows you
  sun.position.copy(sun.target.position).addScaledVector(sunDir,45);
  const up=ss(-.02,.15,e),hi=ss(.05,.5,e);
  if(isDay){sun.color.copy(cLow).lerp(cHigh,hi);sun.intensity=(2.3-1.1*hi)*up;}else{sun.color.copy(cMoon);sun.intensity=.14*up;}
  const duskW=ss(-.3,-.02,se),dayW=ss(.12,.5,se);dark=1-duskW;
  blend(skyU.cTop.value,SKY.top,duskW,dayW);blend(skyU.cMid.value,SKY.mid,duskW,dayW);blend(skyU.cHor.value,SKY.hor,duskW,dayW);skyU.stars.value=ss(.6,1,dark)*1.3;
  blend(ringMat.color,SKY.city,duskW,dayW);ringGlow.opacity=.25+.75*dark-.25*dayW;blend(M.water.color,SKY.sea,duskW,dayW);
  if(rain>.01){const gk=1-.55*rain;for(const u of[skyU.cTop,skyU.cMid,skyU.cHor]){const c=u.value,m=(c.r+c.g+c.b)/3;c.r=(c.r+(m-c.r)*.6*rain)*gk;c.g=(c.g+(m-c.g)*.6*rain)*gk;c.b=(c.b+(m-c.b)*.6*rain)*gk;}
    sun.intensity*=1-.75*rain;skyU.stars.value*=1-rain;}                  // rain clouds: greyer, darker, no stars
  scene.fog.color.copy(skyU.cHor.value).multiplyScalar(.8);scene.fog.density=.0045+.012*rain;
  skyMesh.position.set(pos.x,0,pos.z);ring.position.set(pos.x,0,pos.z);
  hemi.color.copy(cNight).lerp(cDusk,duskW).lerp(cDay,dayW);hemi.intensity=.02+.08*duskW+.1*dayW;
  exposureTarget=(1.15-.15*duskW)*(roomAt(pos.x,pos.z)?1:1-.22*dayW);    // outdoors in daylight is bright: squint a little
  disc.position.set(pos.x+sunDir.x*SUN_R,1.6+sunDir.y*SUN_R,pos.z+sunDir.z*SUN_R);disc.lookAt(pos.x,1.6,pos.z);
  glow.position.copy(disc.position).addScaledVector(sunDir,2);glow.quaternion.copy(disc.quaternion);
  if(isDay){disc.scale.setScalar(1);discMat.color.setRGB(5+hi,2.2+3.3*hi,.9+3.6*hi);glowMat.color.setRGB(1,.55+.4*hi,.3+.6*hi);glowMat.opacity=.9;}
  else{disc.scale.setScalar(.6);discMat.color.setRGB(1.7,1.8,2.1);glowMat.color.setRGB(.5,.6,.9);glowMat.opacity=.35;}
  dust.visible=isDay&&e>.03&&activeHouse===houses[0];
  const hh=Math.floor(h),mm=Math.floor((h-hh)*60);$('clk').textContent='週'+DOW[day%7]+' '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
}
const slider=$('time');slider.value=clock;
slider.addEventListener('input',()=>{clock=+slider.value;envDirty=true;envTimer=0;});
slider.addEventListener('pointerdown',()=>{sliding=true;});
addEventListener('pointerup',()=>{sliding=false;});
$('bSpeed').onclick=()=>{speedIdx=(speedIdx+1)%3;$('bSpeed').textContent='時間：'+SPEEDS[speedIdx][1];};
