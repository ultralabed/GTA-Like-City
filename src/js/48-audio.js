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
function sfxStep(){if(waterDepth()>.05){noise(.16,900,.6,.12);return;}noise(.06,roomAt(pos.x,pos.z)?520:300,1.2,.1);}   // splashing in the sea
function sfxHonk(x,z){const v=.22*hear(x,z,45);tone(392,.4,v,'square');tone(494,.4,v,'square');}
function sfxDoor(x,z){noise(.14,240,2,.3*hear(x,z,10));}
function sfxCoin(){tone(880,.08,.2,'triangle');setTimeout(()=>tone(1320,.16,.2,'triangle'),80);}
function sfxBell(){tone(1568,.5,.18,'sine');setTimeout(()=>tone(1245,.7,.16,'sine'),180);}
function sfxThunder(k){const v=Math.max(.15,k)*(roomAt(pos.x,pos.z)?.5:1);noise(2.6,110,.6,.7*v);noise(1.2,400,.5,.25*v);tone(48,2.2,.35*v,'sine',.6);}
function sfxBump(){noise(.18,140,.8,.4);tone(60,.2,.3,'sine',.5);}
function updateAudio(){
  if(!AC)return;const t=AC.currentTime;
  rainG.gain.setTargetAtTime(soundOn?rain*(roomAt(pos.x,pos.z)?.04:.15):0,t,.3);                     // quieter indoors
  let ev=0,ef=50;
  if(ride&&ride.kind!=='bike'){const m=ride.kind==='moto'?1.8:1;ev=.04+Math.min(.07,Math.abs(ride.v)*.006);ef=(48+Math.abs(ride.v)*11)*m;}   // a motorbike buzzes higher than a car
  else{let best=30,bc=null;for(const c of cars)if(c.on){const d=Math.hypot(c.x-pos.x,c.z-pos.z);if(d<best){best=d;bc=c;}}
    if(bc){ev=.055*(1-best/30)*(roomAt(pos.x,pos.z)?.3:1);ef=50+bc.v*9;}}                             // the nearest passing car
  engG.gain.setTargetAtTime(soundOn?ev:0,t,.12);engO.frequency.setTargetAtTime(ef,t,.12);
}
$('bSound').onclick=()=>{soundOn=!soundOn;$('bSound').textContent='聲音：'+(soundOn?'開':'關');if(soundOn)audioStart();};

/* ---------- music ---------- */
// A tiny band that plays itself. Each scene has its own tune, written as chords and patterns of 16 steps per bar.
// The tunes are made up for this game. When you walk into a different scene the old tune fades out and the new one fades in.
let musicOn=true,musBus=null,trkGain=null,trkName='',wantName='',wantSince=0,nextT=0,stepNo16=0;
const hz=n=>440*Math.pow(2,(n-69)/12);                                       // note number -> pitch
const CHORD={maj:[0,4,7],min:[0,3,7],maj7:[0,4,7,11],m7:[0,3,7,10],dom7:[0,4,7,10],m9:[0,3,7,10,14],sus:[0,5,7]};
const pat=s=>s.replace(/ /g,'').split('').map(c=>c==='.'?0:parseInt(c,36));    // '1..2' -> [1,0,0,2]
// prog: [root note, chord] per bar. bass: 1 = root, 2 = fifth. arp: which note of the chord (1,2,3… then up an octave).
const TRACKS={
  home:{name:'在家',bpm:72,swing:.16,prog:[[53,'maj7'],[52,'m7'],[50,'m7'],[48,'maj7']],pad:.045,padType:'triangle',cut:1300,
    bass:pat('1.....1. ..1.....'),arp:pat('..3.2.4. .3.2..5.'),arpVol:.05,arpType:'triangle',arpLen:.5,kick:pat('1.......1.1.....'),snare:pat('....1.......1...'),hat:pat('1.1.1.1.1.1.1.11'),drum:.45},
  day:{name:'白天的街',bpm:104,swing:.05,prog:[[48,'maj'],[55,'maj'],[57,'min'],[53,'maj']],pad:.03,padType:'triangle',cut:2200,
    bass:pat('1...1...1...1.2.'),arp:pat('1.3.5.3.4.3.2.3.'),arpVol:.045,arpType:'triangle',arpLen:.22,kick:pat('1.......1.......'),snare:pat('....1.......1...'),hat:pat('..1...1...1...1.'),drum:.4},
  dusk:{name:'黃昏',bpm:92,swing:0,prog:[[57,'min'],[53,'maj7'],[48,'maj'],[55,'maj']],pad:.05,padType:'sawtooth',cut:1500,
    bass:pat('1.1.1.1.1.1.1.2.'),arp:pat('1234 5432 1234 5654'),arpVol:.032,arpType:'square',arpLen:.16,kick:pat('1...1...1...1...'),snare:pat('....1.......1...'),hat:pat('1.1.1.1.1.1.1.1.'),drum:.5},
  night:{name:'深夜',bpm:58,swing:0,prog:[[50,'m9'],[46,'maj7'],[43,'m9'],[45,'sus']],pad:.06,padType:'sine',cut:900,
    bass:pat('1...............'),arp:pat('....5.......3...'),arpVol:.05,arpType:'sine',arpLen:1.6,kick:pat('................'),snare:pat('................'),hat:pat('................'),drum:0},
  rain:{name:'下雨天',bpm:66,swing:.1,prog:[[52,'m7'],[48,'maj7'],[55,'maj'],[50,'sus']],pad:.045,padType:'sine',cut:1100,
    bass:pat('1.......2.......'),arp:pat('1...3...2...5.4.'),arpVol:.06,arpType:'triangle',arpLen:.9,kick:pat('................'),snare:pat('................'),hat:pat('....1.......1...'),drum:.2},
  drive:{name:'兜風',bpm:118,swing:0,prog:[[52,'min'],[48,'maj'],[55,'maj'],[50,'maj']],pad:.035,padType:'sawtooth',cut:1800,
    bass:pat('1.1.1.1.1.1.2.1.'),arp:pat('5..5..4. 5..7..5.'),arpVol:.045,arpType:'sawtooth',arpLen:.2,kick:pat('1...1...1...1...'),snare:pat('....1.......1..1'),hat:pat('..1...1...1...1.'),drum:.6},
  shop:{name:'商店裡',bpm:96,swing:.12,prog:[[50,'m7'],[55,'dom7'],[48,'maj7'],[57,'dom7']],pad:0,padType:'triangle',cut:2000,
    bass:pat('1.....2.1...2...'),arp:pat('..C..C....C..C..'),arpVol:.035,arpType:'triangle',arpLen:.14,kick:pat('1.....1...1.....'),snare:pat('....1..1....1...'),hat:pat('1.1.1.1.1.1.1.1.'),drum:.3},
  beach:{name:'海邊',bpm:80,swing:.1,prog:[[48,'maj7'],[45,'m7'],[53,'maj7'],[55,'sus']],pad:.05,padType:'sine',cut:1600,
    bass:pat('1.....2...1.....'),arp:pat('1.3.5.7.5.3.4.2.'),arpVol:.045,arpType:'sine',arpLen:.7,kick:pat('1.........1.....'),snare:pat('................'),hat:pat('..1...1...1...1.'),drum:.25},
  chase:{name:'被巡邏員追',bpm:140,swing:0,prog:[[50,'min'],[50,'min'],[46,'maj'],[45,'maj']],pad:.03,padType:'sawtooth',cut:1200,
    bass:pat('1.11.11.1.11.112'),arp:pat('5.4.5.7.5.4.3.2.'),arpVol:.04,arpType:'square',arpLen:.1,kick:pat('1...1...1...1...'),snare:pat('....1.......1.11'),hat:pat('1111111111111111'),drum:.6}
};
function mNote(f,t,dur,vol,type,att,cut){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  if(cut){const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=cut;o.connect(lp);lp.connect(g);}else o.connect(g);
  g.connect(trkGain);o.start(t);o.stop(t+dur+.05);}
function mDrum(kind,t,vol){
  if(kind==='kick'){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
    g.gain.setValueAtTime(vol*.5,t);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(trkGain);o.start(t);o.stop(t+.2);return;}
  const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter(),g=AC.createGain(),snare=kind==='snare';
  f.type=snare?'bandpass':'highpass';f.frequency.value=snare?1700:7000;g.gain.setValueAtTime(vol*(snare?.22:.07),t);g.gain.exponentialRampToValueAtTime(.0001,t+(snare?.14:.04));
  s.connect(f);f.connect(g);g.connect(trkGain);s.start(t,Math.random()*.5,.2);}
function playStep(T,n,t,d){
  const s=n%16,bar=Math.floor(n/16),ch=T.prog[bar%T.prog.length],root=ch[0],tones=CHORD[ch[1]];
  if(s===0&&T.pad)for(const k of tones){mNote(hz(root+k),t,d*16.5,T.pad,T.padType,.5,T.cut);if(T.padType==='sawtooth')mNote(hz(root+k)*1.006,t,d*16.5,T.pad*.7,T.padType,.5,T.cut);}   // a soft held chord
  if(T.bass[s])mNote(hz(root-12+(T.bass[s]===2?7:0)),t,d*1.8,.17,'triangle',.01,500);
  const a=T.arp[s];
  if(a===12)for(const k of tones)mNote(hz(root+12+k),t,T.arpLen,T.arpVol,T.arpType,.005,T.cut);        // C = the whole chord as a short stab
  else if(a){const i=a-1,note=root+12+tones[i%tones.length]+12*Math.floor(i/tones.length)+(bar%4===3&&s>11?2:0);mNote(hz(note),t,T.arpLen,T.arpVol,T.arpType,.005,T.cut*1.6);}
  if(T.drum){if(T.kick[s])mDrum('kick',t,T.drum);if(T.snare[s])mDrum('snare',t,T.drum);if(T.hat[s])mDrum('hat',t,T.drum);}
}
// which tune fits where you are and what is going on
function musicScene(){
  if(heat>0)return'chase';
  if(ride&&ride.kind==='car')return RADIO[radioIdx];
  if(onBus)return'drive';
  const r=roomAt(pos.x,pos.z);
  if(r)return r.id==='shop'?'shop':'home';
  if(rain>.4)return'rain';
  if(pos.z<-3.5&&dark<.75)return'beach';
  if(dark>.75)return'night';
  return clock>=16.5&&clock<19.6||clock>=5&&clock<7?'dusk':'day';
}
function updateMusic(){
  if(!AC)return;const t=AC.currentTime;
  if(!musBus){musBus=AC.createGain();musBus.gain.value=.55;musBus.connect(master);}
  const want=musicOn&&soundOn?musicScene():'';
  if(want!==wantName){wantName=want;wantSince=t;}
  if(wantName!==trkName&&(t-wantSince>1.2||!trkName)){                       // stay in a scene a moment before the band changes tune
    if(trkGain){const old=trkGain;old.gain.setTargetAtTime(0,t,.5);setTimeout(()=>old.disconnect(),4000);}
    trkName=wantName;trkGain=null;
    if(trkName){trkGain=AC.createGain();trkGain.gain.setValueAtTime(.0001,t);trkGain.gain.setTargetAtTime(1,t+.3,.8);trkGain.connect(musBus);nextT=t+.4;stepNo16=0;}
    $('bMusic').textContent='音樂：'+(musicOn?'開'+(trkName?'（'+TRACKS[trkName].name+'）':''):'關');
  }
  if(!trkName)return;
  const T=TRACKS[trkName],d=60/T.bpm/4;
  if(nextT<t-.3)nextT=t+.05;                                                 // the tab was asleep: do not try to catch up
  while(nextT<t+.45){playStep(T,stepNo16,nextT+(stepNo16%2?T.swing*d:0),d);nextT+=d;stepNo16++;}
}
setInterval(updateMusic,110);
$('bMusic').onclick=()=>{musicOn=!musicOn;audioStart();wantSince=-9;$('bMusic').textContent='音樂：'+(musicOn?'開':'關');};
