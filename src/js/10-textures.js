/* ---------- procedural textures ---------- */
const rnd=(a,b)=>a+Math.random()*(b-a);
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c,srgb,rx,ry){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
  if(srgb)t.encoding=THREE.sRGBEncoding;t.repeat.set(rx||1,ry||rx||1);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}

function woodTextures(){
  const S=1024,c=cv(S,S),b=cv(S,S),g=c.getContext('2d'),h=b.getContext('2d');
  h.fillStyle='#909090';h.fillRect(0,0,S,S);
  const rows=16,rh=S/rows;
  for(let r=0;r<rows;r++){
    let x=-rnd(0,400);
    while(x<S){
      const len=rnd(300,620),L=rnd(23,32),hue=rnd(24,31);
      g.fillStyle=`hsl(${hue},${rnd(28,38)}%,${L}%)`;g.fillRect(x,r*rh,len,rh);
      for(let i=0;i<46;i++){
        const y=r*rh+rnd(1,rh-1),a=rnd(.03,.11),dark=Math.random()<.6;
        g.strokeStyle=dark?`rgba(40,18,6,${a})`:`rgba(255,210,160,${a})`;g.lineWidth=rnd(.5,1.8);
        g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+len*.3,y+rnd(-3,3),x+len*.7,y+rnd(-3,3),x+len,y+rnd(-2,2));g.stroke();
        h.strokeStyle=`rgba(${dark?60:190},${dark?60:190},${dark?60:190},.08)`;h.lineWidth=1;
        h.beginPath();h.moveTo(x,y);h.lineTo(x+len,y);h.stroke();
      }
      g.fillStyle='rgba(15,6,2,.75)';g.fillRect(x+len-1.5,r*rh,3,rh);
      h.fillStyle='#1a1a1a';h.fillRect(x+len-1.5,r*rh,3,rh);
      x+=len;
    }
    g.fillStyle='rgba(15,6,2,.8)';g.fillRect(0,r*rh-1,S,2.5);
    h.fillStyle='#1a1a1a';h.fillRect(0,r*rh-1,S,2.5);
  }
  return [tex(c,true,.5),tex(b,false,.5)];
}
function noiseBump(size,dots,r0,r1,rep){
  const c=cv(size,size),g=c.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,size,size);
  for(let i=0;i<dots;i++){const v=Math.random()<.5?40:215;g.fillStyle=`rgba(${v},${v},${v},${rnd(.04,.14)})`;
    g.beginPath();g.arc(rnd(0,size),rnd(0,size),rnd(r0,r1),0,7);g.fill();}
  return tex(c,false,rep);
}
function weaveBump(rep){
  const c=cv(128,128),g=c.getContext('2d');g.fillStyle='#777';g.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=4){g.fillStyle=`rgba(255,255,255,${rnd(.15,.4)})`;g.fillRect(i,0,2,128);
    g.fillStyle=`rgba(0,0,0,${rnd(.15,.4)})`;g.fillRect(0,i,128,2);}
  return tex(c,false,rep);
}
function rugTexture(){
  const c=cv(512,640),g=c.getContext('2d');
  g.fillStyle='#d9c9b0';g.fillRect(0,0,512,640);
  const cols=['#b5533a','#1f5a5e','#e0a45c','#3b2a3f'];
  for(let i=0;i<5;i++){g.strokeStyle=cols[i%4];g.lineWidth=i===0?26:9;const m=24+i*34;g.strokeRect(m,m,512-2*m,640-2*m);}
  for(let i=0;i<7;i++){g.fillStyle=cols[i%4];g.save();g.translate(256,150+i*57);g.rotate(Math.PI/4);g.fillRect(-18,-18,36,36);g.restore();}
  for(let i=0;i<9000;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:240},200,.05)`;g.fillRect(rnd(0,512),rnd(0,640),2,2);}
  const t=tex(c,true);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;
}
function artTexture(seed){
  const c=cv(384,512),g=c.getContext('2d');
  const P=seed?['#f3e6d3','#e8527a','#1f5a5e','#ffb347','#2a1b5e']:['#f1e4cf','#1f5a5e','#ff9a4d','#3b2a3f','#e8527a'];
  g.fillStyle=P[0];g.fillRect(0,0,384,512);
  if(seed){g.fillStyle=P[3];g.beginPath();g.arc(192,230,120,Math.PI,0);g.fill();
    for(let i=0;i<6;i++){g.fillStyle=P[1+i%4];g.fillRect(40,250+i*36,304,18-i*2);}}
  else{g.fillStyle=P[1];g.fillRect(40,60,150,390);g.fillStyle=P[2];g.beginPath();g.arc(230,200,95,0,7);g.fill();
    g.fillStyle=P[3];g.fillRect(170,330,170,120);g.strokeStyle=P[4];g.lineWidth=7;g.beginPath();g.moveTo(40,470);g.lineTo(344,90);g.stroke();}
  const t=tex(c,true);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;
}
// far-away city for the horizon: one picture of plain shapes (tinted by the time of day), one of only the lit windows
function ringTextures(){
  const W=2048,H=256,a=cv(W,H),b=cv(W,H),g=a.getContext('2d'),w=b.getContext('2d');
  g.fillStyle='#fff';
  g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=16)g.lineTo(x,H-34-Math.sin(x/W*Math.PI*6)*14-Math.sin(x/W*Math.PI*22)*6);g.lineTo(W,H);g.fill();   // low hills
  let x=0;while(x<W-30){const bw=Math.min(rnd(40,110),W-x),bh=Math.random()<.12?rnd(150,230):rnd(45,125);g.fillRect(x,H-bh,bw,bh);
    for(let y=H-bh+8;y<H-44;y+=11)for(let k=x+6;k<x+bw-7;k+=10)if(Math.random()<.42){
      w.fillStyle=Math.random()<.2?'#7fe9ff':(Math.random()<.2?'#ff7ac0':'#ffd98a');w.fillRect(k,y,4,5);}
    x+=bw+rnd(0,26);}
  return[a,b].map(c=>{const t=tex(c,true,4,1);t.wrapT=THREE.ClampToEdgeWrapping;return t;});
}
// a flat colour with fine speckles: grass, asphalt, sand
function speckle(base,dots,strength,lines){
  const S=256,c=cv(S,S),g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,S,S);
  for(let i=0;i<dots;i++){const v=Math.random()<.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${rnd(.02,strength)})`;g.fillRect(rnd(0,S),rnd(0,S),rnd(1,4),rnd(1,4));}
  if(lines){g.strokeStyle='rgba(40,36,32,.55)';g.lineWidth=3;g.strokeRect(0,0,S,S);}                 // paving joints
  return tex(c,true,1);
}
function plateTexture(no){const c=cv(128,128),g=c.getContext('2d');g.fillStyle='#20242c';g.fillRect(0,0,128,128);g.strokeStyle='#d9c08a';g.lineWidth=6;g.strokeRect(6,6,116,116);
  g.fillStyle='#f6ecd8';g.font='bold 84px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(no),64,70);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
