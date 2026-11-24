/* ---------- TV programme: an endless neon road ---------- */
function drawTV(d,t){
  const g=d.g,W=256,H=144,hz=78;
  let gr=g.createLinearGradient(0,0,0,hz);gr.addColorStop(0,'#1a0b3d');gr.addColorStop(1,'#ff4f9a');g.fillStyle=gr;g.fillRect(0,0,W,hz);
  g.fillStyle='#ffd36a';g.beginPath();g.arc(128,hz,34,Math.PI,0);g.fill();
  g.fillStyle='#ff4f9a';for(let i=0;i<4;i++)g.fillRect(90,hz-8-i*7,76,2+i*.5);
  g.fillStyle='#0a0420';g.fillRect(0,hz,W,H-hz);
  g.strokeStyle='#35e6ff';g.lineWidth=1;
  for(let i=-10;i<=10;i++){g.beginPath();g.moveTo(128+i*6,hz);g.lineTo(128+i*60,H);g.stroke();}
  for(let i=0;i<8;i++){const u=((i+t*.9)%8)/8,y=hz+u*u*(H-hz);g.globalAlpha=.3+u*.7;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  g.globalAlpha=1;d.tex.needsUpdate=true;
}
