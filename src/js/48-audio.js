/* ---------- sound ---------- */
// Every sound is made on the spot from simple tones and hiss, so there are no sound files to load.
// Browsers only allow sound after you click or press a key, so it starts then.
let AC=null,master=null,soundOn=true,noiseBuf=null,rainG=null,engO=null,engG=null,stepNo=0,lastBounce=0;
function audioStart(){
  if(AC||!soundOn)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
  try{AC=new A();}catch(e){return;}
  master=AC.createGain();master.gain.value=.5;master.connect(AC.destination);
  noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=AC.createBufferSource();src.buffer=noiseBuf;src.loop=true;                               // rain: hiss that never stops, turned up when it rains
  const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=1700;rainG=AC.createGain();rainG.gain.value=0;src.connect(hp);hp.connect(rainG);rainG.connect(master);src.start();
  engO=AC.createOscillator();engO.type='sawtooth';engO.frequency.value=50;                           // engine: a low buzz whose pitch follows the speed
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320;engG=AC.createGain();engG.gain.value=0;engO.connect(lp);lp.connect(engG);engG.connect(master);engO.start();
}
addEventListener('pointerdown',audioStart);addEventListener('keydown',audioStart);
function noise(dur,freq,q,vol){if(!AC||!soundOn||vol<=.002)return;const s=AC.createBufferSource();s.buffer=noiseBuf;
  const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=AC.createGain(),t=AC.currentTime;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t,Math.random()*.5,dur+.03);}
function tone(freq,dur,vol,type,slide){if(!AC||!soundOn||vol<=.002)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
  o.type=type||'sine';o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(freq*slide,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.03);}
const hear=(x,z,far)=>Math.max(0,1-Math.hypot(x-pos.x,z-pos.z)/far);                                  // 1 right next to you, 0 too far to hear
function sfxBounce(b,J){const now=performance.now();if(now-lastBounce<60)return;const v=Math.min(1,J/b.m/6)*hear(b.p.x,b.p.z,14);if(v<=.02)return;lastBounce=now;
  tone(b.m>3?70:b.kind==='tennis'?420:b.kind==='beach'?240:160,.12,v*.5,'sine',.6);noise(.05,b.m>3?200:900,1,v*.3);}   // heavy balls thud, light ones pop
function sfxStep(){noise(.06,roomAt(pos.x,pos.z)?520:300,1.2,.1);}
function sfxHonk(x,z){const v=.22*hear(x,z,45);tone(392,.4,v,'square');tone(494,.4,v,'square');}
function sfxDoor(x,z){noise(.14,240,2,.3*hear(x,z,10));}
function sfxCoin(){tone(880,.08,.2,'triangle');setTimeout(()=>tone(1320,.16,.2,'triangle'),80);}
function sfxBump(){noise(.18,140,.8,.4);tone(60,.2,.3,'sine',.5);}
function updateAudio(){
  if(!AC)return;const t=AC.currentTime;
  rainG.gain.setTargetAtTime(soundOn?rain*(roomAt(pos.x,pos.z)?.04:.15):0,t,.3);                     // quieter indoors
  let ev=0,ef=50;
  if(ride&&ride.kind==='car'){ev=.04+Math.min(.07,Math.abs(ride.v)*.006);ef=48+Math.abs(ride.v)*11;}
  else{let best=30,bc=null;for(const c of cars)if(c.on){const d=Math.hypot(c.x-pos.x,c.z-pos.z);if(d<best){best=d;bc=c;}}
    if(bc){ev=.055*(1-best/30)*(roomAt(pos.x,pos.z)?.3:1);ef=50+bc.v*9;}}                             // the nearest passing car
  engG.gain.setTargetAtTime(soundOn?ev:0,t,.12);engO.frequency.setTargetAtTime(ef,t,.12);
}
$('bSound').onclick=()=>{soundOn=!soundOn;$('bSound').textContent='聲音：'+(soundOn?'開':'關');if(soundOn)audioStart();};
