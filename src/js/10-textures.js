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
function palm(g,x,base,ht,lean,col){
  g.strokeStyle=col;g.fillStyle=col;g.lineCap='round';
  const tx=x+lean,ty=base-ht;
  g.lineWidth=ht*.035;g.beginPath();g.moveTo(x,base);g.quadraticCurveTo(x+lean*.2,base-ht*.5,tx,ty);g.stroke();
  for(let i=0;i<11;i++){
    const a=-Math.PI*(.05+.9*i/10)+rnd(-.1,.1),L=ht*rnd(.34,.46);
    const ex=tx+Math.cos(a)*L,ey=ty+Math.sin(a)*L*.55+L*.38,cx=tx+Math.cos(a)*L*.55,cy=ty+Math.sin(a)*L*.75;
    g.lineWidth=ht*.012;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(cx,cy,ex,ey);g.stroke();
    for(let k=1;k<=12;k++){const t=k/13,px=(1-t)*(1-t)*tx+2*(1-t)*t*cx+t*t*ex,py=(1-t)*(1-t)*ty+2*(1-t)*t*cy+t*t*ey;
      g.lineWidth=ht*.007;g.beginPath();g.moveTo(px,py);g.lineTo(px+rnd(-4,4),py+ht*.07*(1-t*.5));g.stroke();}
  }
}
function skyTexture(mode){ // 0 dusk, 1 night, 2 day. The sun and moon are separate moving discs.
  const W=2048,Hh=1024,H=707,c=cv(W,Hh),g=c.getContext('2d'),night=mode===1;
  let gr=g.createLinearGradient(0,0,0,H);
  [[[0,'#24184f'],[.32,'#7a2c7c'],[.6,'#e3507a'],[.82,'#ff9450'],[1,'#ffd88a']],
   [[0,'#02030a'],[.55,'#0a1034'],[.88,'#231a55'],[1,'#4a2a6a']],
   [[0,'#1f5fc4'],[.5,'#5fa3e6'],[.85,'#b5dcf7'],[1,'#e6f4fb']]][mode].forEach(s=>gr.addColorStop(s[0],s[1]));
  g.fillStyle=gr;g.fillRect(0,0,W,H);
  if(night)for(let i=0;i<500;i++){g.fillStyle=`rgba(255,255,255,${rnd(.2,.9)})`;g.fillRect(rnd(0,W),rnd(0,H*.8),rnd(1,2.4),rnd(1,2.4));}
  const cl=[['255,190,150','255,170,140','120,50,110'],['60,50,110','70,55,120','20,15,50'],['255,255,255','255,255,255','210,225,240']][mode];
  for(let i=0;i<16;i++){
    const x=rnd(0,W),y=rnd(120,620),w=rnd(180,520),hh=rnd(8,mode===2?40:26);
    gr=g.createLinearGradient(0,y-hh,0,y+hh);
    gr.addColorStop(0,`rgba(${cl[0]},0)`);gr.addColorStop(.5,`rgba(${cl[1]},${mode===2?.8:.55})`);gr.addColorStop(1,`rgba(${cl[2]},0)`);
    g.fillStyle=gr;g.beginPath();g.ellipse(x,y,w,hh,0,0,7);g.fill();
  }
  gr=g.createLinearGradient(0,H,0,Hh);
  [[[0,'#ffb27a'],[.25,'#c2567c'],[1,'#2a1648']],[[0,'#2c1d55'],[.3,'#0d0f2c'],[1,'#03040c']],[[0,'#9fd0ee'],[.3,'#3f8fcb'],[1,'#134a86']]][mode]
    .forEach(s=>gr.addColorStop(s[0],s[1]));
  g.fillStyle=gr;g.fillRect(0,H,W,Hh-H);
  const gl=['255,236,180','210,220,255','255,255,255'][mode];
  for(let i=0;i<220;i++){const y=H+4+Math.pow(Math.random(),1.6)*(Hh-H-8);
    g.fillStyle=`rgba(${gl},${rnd(.1,night?.3:.6)})`;g.fillRect(rnd(0,W),y,rnd(14,70),rnd(1.5,3.5));}
  let x=0;while(x<W){
    const w=rnd(12,34),hh=Math.random()<.12?rnd(50,84):rnd(8,40);
    g.fillStyle=['#22123a','#070515','#6f84a6'][mode];g.fillRect(x,H-hh,w,hh+3);
    for(let wy=H-hh+3;wy<H-3;wy+=5)for(let wx=x+2;wx<x+w-3;wx+=4)if(Math.random()<[.15,.45,0][mode]){
      g.fillStyle=Math.random()<.2?'#7fe9ff':(Math.random()<.2?'#ff7ac0':'#ffd98a');g.fillRect(wx,wy,2,2.5);}
    x+=w+rnd(0,6);
  }
  const pc=['#0c0612','#06040c','#12301c'][mode];
  palm(g,330,Hh+20,520,60,pc);palm(g,560,Hh+30,400,-45,pc);palm(g,1700,Hh+20,560,-70,pc);palm(g,1880,Hh+30,380,40,pc);
  const t=tex(c,true);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;
}
