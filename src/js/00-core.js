const $=id=>document.getElementById(id);
const canvas=$('view');
const isTouch=matchMedia('(pointer:coarse)').matches;
$('hint').innerHTML=isTouch
  ? '<b>左手</b>拖：走路　<b>右手</b>拖：轉頭　<b>點</b>球：踢　<b>點</b>人：打招呼'
  : '<b>點畫面</b>鎖定滑鼠　<b>W A S D</b> 走路　<b>Shift</b> 跑　<b>點</b>球：踢　<b>點</b>人：打招呼　<b>Esc</b> 放開滑鼠';
function fail(msg){$('err').hidden=false;$('err').textContent=msg;}
if(!window.THREE){fail('3D 引擎沒有載入成功，請重新整理一次。');return;}

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){fail('這個裝置或瀏覽器沒有開 WebGL，所以畫不出 3D 房間。');return;}
let pr=Math.min(window.devicePixelRatio||1,2);
renderer.setPixelRatio(pr);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05030a);
const camera=new THREE.PerspectiveCamera(68,1,0.05,80);
camera.rotation.order='YXZ';
