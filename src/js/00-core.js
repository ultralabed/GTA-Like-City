const $=id=>document.getElementById(id);
const canvas=$('view');
const isTouch=matchMedia('(pointer:coarse)').matches;
$('hint').innerHTML=isTouch
  ? '<b>左手</b>拖：走路　<b>右手</b>拖：轉頭　<b>點</b>門：開門　<b>點</b>球：踢　<b>點</b>人：打招呼　右下角的按鈕：跳、撿、坐、開車、騎車、手電筒、雨傘、地圖'
  : '<b>點畫面</b>鎖定滑鼠　<b>W A S D</b> 走路　<b>Shift</b> 跑　<b>空白鍵</b> 跳　<b>E</b> 撿起／放下　<b>F</b> 上下車　<b>Q</b> 坐下　<b>1</b> 手電筒　<b>2</b> 雨傘　<b>M</b> 地圖　<b>V</b> 換視角　<b>點人</b>：說話　<b>點</b>門、球、人　<b>Esc</b> 放開滑鼠';
function fail(msg){$('err').hidden=false;$('err').textContent=msg;}
if(!window.THREE){fail('3D 引擎沒有載入成功，請重新整理一次。');return;}

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){fail('這個裝置或瀏覽器沒有開 WebGL，所以畫不出 3D 房間。');return;}
let pr=Math.min(window.devicePixelRatio||1,2);
renderer.setPixelRatio(pr);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

// Safety net for every material: a single broken pixel (not-a-number, or brighter than the picture format can hold)
// would spread through the blur passes and turn the whole reflection black. So: broken becomes 0, too bright is capped.
THREE.ShaderChunk.output_fragment+='\nif(!(gl_FragColor.r>=0.0&&gl_FragColor.g>=0.0&&gl_FragColor.b>=0.0))gl_FragColor.rgb=vec3(0.0);\ngl_FragColor.rgb=min(gl_FragColor.rgb,vec3(64.0));\n';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05030a);
const camera=new THREE.PerspectiveCamera(68,1,0.08,800);
camera.rotation.order='YXZ';scene.add(camera);                           // in the scene so things can be held in front of it
// the help line shows for a while, then gets out of the way; "操作說明" in the settings brings it back
let hintTimer=0;function showHint(){$('hint').hidden=false;clearTimeout(hintTimer);hintTimer=setTimeout(()=>{$('hint').hidden=true;},14000);}
showHint();$('bHelp').onclick=showHint;
$('bSet').onclick=()=>{const p=$('panel');p.hidden=!p.hidden;$('bSet').setAttribute('aria-expanded',!p.hidden);};
