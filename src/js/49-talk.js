/* ---------- talking, favours, money ---------- */
// Click a person to talk. You can say hello, ask what they are doing, offer help (they may give you a job),
// or give them a drink. Jobs pay money; being kind raises your name on the street, being a nuisance lowers it.
let cash=60,rep=0,drinks=0,stam=1,quest=null,talkN=null;
// heat: how much trouble you are in right now (0 to 3 stars). Each time you hit or scare someone it goes up;
// the patrol officer then comes after you, faster the more stars you have. Stay out of trouble for a while and it fades.
let heat=0,heatAt=0,saveNo=0;
function addRep(d){rep=Math.max(-9,Math.min(20,rep+d));if(d<0){heat=Math.min(3,heat+1);heatAt=performance.now();say('有人看到了！巡邏員會來找你。'+'★'.repeat(heat));}}
function fine(n){const amt=Math.min(cash,25*heat),h=heat;heat=0;cash-=amt;sfxBump();
  showTalk(n,'請注意安全，不要嚇到別人。'+(amt?'這次罰你 $'+amt+'。':'這次先警告你。'),[['對不起，我會小心',closeTalk]]);
  say('你被巡邏員攔下來了（'+'★'.repeat(h)+'）'+(amt?'，罰了 $'+amt+'。':'。'));}
const SAVE_KEY='sunset-street-save-1';
function saveGame(){if(noSave)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({clock,cash,rep,drinks,stam,bag,x:pos.x,z:pos.z,yaw,rides:rides.map(r=>[r.x,r.z,r.h,r.fuel]),third,outfit,day,fishBag,paintIdx,album,shells,gifted,iceCreams,fishGot,isleSeen,carUp,fares,daily,waves,homeOwned,decorOwn,starGot,raceBest,seaBest,paperDay,stats,busTrips,taxiTrips,fishCount,baskets,likes:Object.fromEntries(people.map(n=>[n.o.name,n.like]))}));}catch(e){}}
function loadGame(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!d||typeof d.cash!=='number')return false;
  clock=d.clock;cash=d.cash;rep=d.rep;drinks=d.drinks||0;stam=d.stam;Object.assign(bag,d.bag);pos.x=d.x;pos.z=d.z;yaw=d.yaw;
  for(const n of people)if(d.likes&&d.likes[n.o.name]!=null)n.like=d.likes[n.o.name];
  if(d.third)setView(true);if(d.outfit)wear(d.outfit);if(d.day)day=d.day;fishBag=d.fishBag||0;if(d.album)Object.assign(album,d.album);shells=d.shells||0;if(d.gifted)Object.assign(gifted,d.gifted);iceCreams=d.iceCreams||0;if(d.fishGot)Object.assign(fishGot,d.fishGot);isleSeen=!!d.isleSeen;if(d.carUp){Object.assign(carUp,d.carUp);applyTune();}fares=d.fares||0;if(d.daily&&d.daily.list)daily=d.daily;waves=d.waves||0;homeOwned=!!d.homeOwned;if(d.decorOwn){Object.assign(decorOwn,d.decorOwn);showDecor();}if(d.starGot)Object.assign(starGot,d.starGot);raceBest=d.raceBest||0;seaBest=d.seaBest||0;paperDay=d.paperDay||0;if(d.paintIdx)setPaint(d.paintIdx);if(d.stats)Object.assign(stats,d.stats);busTrips=d.busTrips||0;taxiTrips=d.taxiTrips||0;fishCount=d.fishCount||0;baskets=d.baskets||0;
  (d.rides||[]).forEach((q,i)=>{const r=rides[i];if(r){r.x=q[0];r.z=q[1];r.h=q[2];if(q[3]!=null)r.fuel=q[3];r.g.position.set(r.x,0,r.z);r.g.rotation.y=r.h;}});return true;}catch(e){return false;}}
let noSave=false;
// --- your record: how far you have gone and what you have done; reaching a mark earns a badge and a little money ---
const stats={walk:0,drive:0,jobs:0,earned:0,done:{}};let stLast=null,stCash=null,stQuest=null;
const BADGES=[['walk1',()=>stats.walk>=500,'小小散步家：走了 500 公尺',20],['walk2',()=>stats.walk>=3000,'健走高手：走了 3 公里',60],
  ['drive1',()=>stats.drive>=1000,'新手駕駛：開（騎）了 1 公里',20],['drive2',()=>stats.drive>=8000,'老司機：開（騎）了 8 公里',80],
  ['job1',()=>stats.jobs>=1,'熱心鄰居：完成第 1 個任務',10],['job5',()=>stats.jobs>=5,'街上的好幫手：完成 5 個任務',50],['job15',()=>stats.jobs>=15,'夕陽街之星：完成 15 個任務',150],
  ['cab',()=>fares>=3,'小黃司機：載了 3 位客人',40],
  ['bus',()=>busTrips>=1,'搭過公車了',5],['taxi',()=>taxiTrips>=1,'搭過計程車了',5],['fish',()=>fishCount>=5,'釣魚達人：釣到 5 次',30],['hoop',()=>baskets>=3,'神射手：投進 3 球',30],
  ['stars',()=>Object.keys(starGot).length>=5,'小小探險家：找到 5 顆星星',30],
  ['fish5',()=>Object.keys(fishGot).length>=5,'釣魚圖鑑收集一半（5 種）',40],
  ['ice',()=>iceCreams>=1,'吃到冰淇淋車的冰淇淋',5],
  ['isle',()=>isleSeen,'登上燈塔島',30],
  ['home',()=>homeOwned,'有自己的家了',0],
  ['rich',()=>cash>=500,'小富翁：身上有 $500',0],['photo',()=>Object.keys(album).length>=4,'小小攝影師：相簿收集 4 張',30],['shell',()=>shells>=15,'貝殼收藏家：撿了 15 個貝殼',30],['best',()=>Object.keys(gifted).length>=1,'有了第一個最好的朋友（♥♥♥♥♥）',0],['friend',()=>people.filter(n=>n.like>=3).length>=3,'好人緣：有 3 個好朋友（♥♥♥）',40]];
// --- three small goals a day, picked fresh each morning ---
let waves=0;
const DAILY=[['fish','釣到 2 條魚',()=>fishCount,2],['walk','走路 400 公尺',()=>stats.walk,400],['drive','開車或騎車 800 公尺',()=>stats.drive,800],['hoop','投進 2 球',()=>baskets,2],
  ['job','完成 2 個任務',()=>stats.jobs,2],['bus','搭 1 次公車或計程車',()=>busTrips+taxiTrips,1],['cab','開車載 1 位客人',()=>fares,1],['wave','跟 4 個人揮手打招呼',()=>waves,4],['shell','在沙灘撿 3 個貝殼',()=>shells,3],['earn','賺到 $100',()=>stats.earned,100]];
let daily={day:-1,list:[]};
function dailyStep(){
  if(daily.day!==day){const oldSnap=daily.snap;const pool=DAILY.slice().sort(()=>Math.random()-.5).slice(0,3);daily={day,list:pool.map(D=>({id:D[0],base:D[2](),done:false}))};
    if(saveNo>3){const d=day%7,ev=[];if(d===5||d===6||d===0)ev.push('晚上 6 點海邊有夜市');if(d===6||d===0)ev.push('晚上 8 點放煙火');if(!ev.length)ev.push('今天是平常日，大家白天去上班，街上比較安靜');
      const y=oldSnap||{jobs:stats.jobs,earned:stats.earned,fish:fishCount};const dj=stats.jobs-y.jobs,de=stats.earned-y.earned,df=fishCount-y.fish;
      say('📰 夕陽日報 · 週'+DOW[d]+'：'+ev.join('、')+'。'+(dj||de||df?'昨天你完成 '+dj+' 個任務、賺了 $'+de+(df?'、釣到 '+df+' 次':'')+'。':'')+'今天的挑戰：'+pool.map(D=>D[1]).join('、')+'（每個 $40）。');}
    daily.snap={jobs:stats.jobs,earned:stats.earned,fish:fishCount};}
  for(const d of daily.list){if(d.done)continue;const D=DAILY.find(q=>q[0]===d.id);if(!D)continue;if(D[2]()-d.base>=D[3]){d.done=true;cash+=40;stCash=cash;sfxCoin();
      const all=daily.list.every(q=>q.done);if(all){cash+=60;stCash=cash;}say('✅ 今日挑戰完成：'+D[1]+'！+$40'+(all?'。三個都完成了，再加 $60！':''));break;}}}
// --- shells on the beach: a few lie on the sand at any time; the sea leaves new ones, more after rain. Walk over one to pick it up ---
let shells=0,shellTold=false;
const SHELLS=[];{const g1=new THREE.SphereGeometry(.09,8,6),cols=[0xf6d7c8,0xf2e6d0,0xe8b9c4,0xd9c7e8];
  for(let i=0;i<7;i++){const m=new THREE.Mesh(g1,new THREE.MeshStandardMaterial({color:cols[i%4],roughness:.4}));m.scale.set(1.9,.8,1.6);m.visible=false;scene.add(m);SHELLS.push({m,on:false,t:rnd(2,30),pearl:false});}}
function shellStep(dt){const I=WORLD.isle;
  for(const s of SHELLS){if(!s.on){s.t-=dt*(wet>.3?2.5:1);if(s.t>0)continue;
      let x,z;if(Math.random()<.2){const a=rnd(0,6.28),r=I.r-rnd(.2,1.6);x=I.x+Math.cos(a)*r;z=I.z+Math.sin(a)*r;}else{x=rnd(-35,41);z=rnd(-12.2,-7.4);if(x>18.3&&x<22.1)x+=4.5;}
      if(blocked(x,z)){s.t=1;continue;}s.pearl=Math.random()<.06;s.m.material.color.setHex(s.pearl?0xffffff:[0xf6d7c8,0xf2e6d0,0xe8b9c4,0xd9c7e8][Math.floor(Math.random()*4)]);s.m.material.emissive.setHex(s.pearl?0x8899aa:0);
      s.m.position.set(x,.05,z);s.m.rotation.y=rnd(0,6);s.m.visible=true;s.on=true;continue;}
    if(ride||onBus||Math.hypot(s.m.position.x-pos.x,s.m.position.z-pos.z)>.9)continue;
    s.on=false;s.m.visible=false;s.t=rnd(35,90);shells++;const v=s.pearl?45:3+Math.floor(Math.random()*8);cash+=v;stCash=cash;tone(s.pearl?1568:1046,.12,.14,'triangle');
    say(s.pearl?'你撿到一顆珍珠！很少見，值 $45。':'你撿到一個貝殼（+$'+v+'）。'+(shellTold?'':'海浪會把新的貝殼沖上沙灘，下過雨之後特別多。燈塔島的沙灘上也有。'),!s.pearl);shellTold=true;}}
// --- best friends: when someone likes you as much as they can, they give you something the next time you are close ---
const gifted={};
const GIFTS=[['一罐自己醃的梅子',()=>{drinks+=2;},'（背包多了 2 罐飲料）'],['一個紅包',()=>{cash+=120;},'（$120）'],['一張手寫的感謝卡和 $60',()=>{cash+=60;addRep(2);},'（名聲也變好了）'],['親手烤的餅乾',()=>{stam=1;cash+=40;},'（體力全滿，還塞給你 $40）']];
function giftStep(){if(ride||onBus||talkN||quest&&quest.type==='race')return;
  for(const n of people){if(n.hidden||n.lie||n.react||n.like<4.6||gifted[n.o.name]||Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)>4.5)continue;
    gifted[n.o.name]=1;const G=GIFTS[Object.keys(gifted).length%GIFTS.length];G[1]();stCash=cash;actKey='';sfxCoin();sfxBell();n.react={say:'這個送你，謝謝你一直這麼照顧我！',t:3.5,pose:'wave'};
    say('🎁 '+n.o.name+'把你當成最好的朋友，送你'+G[0]+G[2]+'。');return;}}
function trackStats(){
  dailyStep();giftStep();shellStep(.25);
  if(stLast){const d=Math.hypot(pos.x-stLast[0],pos.z-stLast[1]);if(d<12){if(ride)stats.drive+=d;else if(!onBus)stats.walk+=d;}}stLast=[pos.x,pos.z];
  if(stCash!=null&&cash>stCash){stats.earned+=cash-stCash;if(stQuest&&!quest)stats.jobs++;}stCash=cash;stQuest=quest;
  for(const B of BADGES)if(!stats.done[B[0]]&&B[1]()){stats.done[B[0]]=1;cash+=B[3];stCash=cash;sfxCoin();say('🏅 成就：'+B[2]+(B[3]?'！獎金 $'+B[3]+'。':'！'));break;}}
function showStats(){const el=$('talk');el.hidden=false;el.textContent='';talkN=null;
  const h=document.createElement('strong');h.textContent='我的紀錄（第 '+day+' 天）';el.appendChild(h);
  const box=document.createElement('div');box.style.cssText='max-height:38vh;overflow:auto;margin:6px 0;flex:1 1 100%;width:100%';el.appendChild(box);
  const km=m=>m<1000?Math.round(m)+' 公尺':(m/1000).toFixed(1)+' 公里',n=BADGES.filter(B=>stats.done[B[0]]).length;
  for(const t of['走路：'+km(stats.walk),'開車和騎車：'+km(stats.drive),'完成任務：'+stats.jobs+' 個','總共賺到：$'+stats.earned,'搭公車 '+busTrips+' 次、計程車 '+taxiTrips+' 次','自己開車載客：'+fares+' 位','撿到的貝殼：'+shells+' 個','釣到 '+fishCount+' 次、投進 '+baskets+' 球','找到的星星：'+Object.keys(starGot).length+' / '+STARS.length,'— 今日挑戰（每個 $40，三個全過再 $60）—'].concat(daily.list.map(d=>{const D=DAILY.find(q=>q[0]===d.id);return(d.done?'✅ ':'⬜ ')+D[1]+(d.done?'':'（'+Math.min(D[3],Math.floor(D[2]()-d.base))+' / '+D[3]+'）');})).concat(['成就：'+n+' / '+BADGES.length])){const p=document.createElement('p');p.textContent=t;p.style.margin='2px 0';box.appendChild(p);}
  for(const B of BADGES){const p=document.createElement('p');p.textContent=(stats.done[B[0]]?'🏅 ':'⬜ ')+B[2];p.style.opacity=stats.done[B[0]]?1:.6;p.style.margin='2px 0';box.appendChild(p);}
  {const p=document.createElement('p');p.textContent='— 相簿（'+Object.keys(album).length+' / '+SHOTS.length+'，按 P 進拍照模式，每張 $25，全部 $250）—';p.style.margin='6px 0 2px';box.appendChild(p);
    const q=document.createElement('p');q.textContent=SHOTS.map(S=>(album[S[0]]?'📸':'⬜')+S[0]).join('　');q.style.margin='2px 0';box.appendChild(q);}
  {const p=document.createElement('p');p.textContent='— 釣魚圖鑑（'+Object.keys(fishGot).length+' / '+FISH.length+'，全部收集 $200）—';p.style.margin='6px 0 2px';box.appendChild(p);}
  for(const F of FISH){const p=document.createElement('p'),g2=fishGot[F[0]];p.textContent=g2?'🐟 '+F[0].replace(/^一[隻條]/,'')+' ×'+g2+(F[1]?'（$'+F[1]+'）':''):'❔ ？？？（線索：'+FISH_HINT[F[0]]+'）';p.style.opacity=g2?1:.6;p.style.margin='2px 0';box.appendChild(p);}
  const b=document.createElement('button');b.type='button';b.textContent='關閉';b.onclick=()=>{el.hidden=true;canvas.focus({preventScroll:true});};el.appendChild(b);}
$('bStats').onclick=showStats;
// --- "what next?": a short list of things you have not done yet, most useful first ---
const getGuide=()=>[
  [()=>stats.jobs<1,'跟街上的人說話（點他），選「需要幫忙嗎？」接第一個任務賺錢。'],
  [()=>stats.drive<50,'黃色的車停在 1 號前面，走過去按 F 上車，W A S D 開車。'],
  [()=>!bag.flashlight||!bag.umbrella,'手電筒和雨傘放在每間房子的大門旁邊，走近按 E 撿起來。'],
  [()=>paperDay!==day&&clock>=9&&clock<20,'去夕陽商店櫃台（8 號）接今天的「送報紙」，最多賺 $100。'],
  [()=>!stats.done.bday,'夕陽商店櫃台有「小芳有事想拜託你…」，是第一個有故事的任務（$120）。'],
  [()=>stats.done.bday&&!stats.done.beach,'回商店櫃台接第二個故事「淨灘日」（$90）。'],
  [()=>stats.done.beach&&!stats.done.lunch,'回商店櫃台接第三個故事「愛心便當」（$150）。'],
  [()=>stats.done.lunch&&!stats.done.bottle,'回商店櫃台接第四個故事「漂流瓶」，要開船（$200）。'],
  [()=>busTrips+taxiTrips<1,'在公車站等公車停下來按 F 搭車（$5），或在大馬路邊按 T 招計程車。'],
  [()=>fishCount<1,'走到海邊或碼頭上按 G 釣魚，釣到的魚可以拿去商店賣。'],
  [()=>!isleSeen,'小船停在碼頭旁邊。開船往西北邊去，有一座燈塔島可以上去。'],
  [()=>!raceBest,'大馬路西邊有黑白格子旗，把車開過去按 B 可以比計時賽。'],
  [()=>!seaBest&&isleSeen,'碼頭盡頭外面的紅色浮標旁邊，開船按 B 可以比海上計時賽。'],
  [()=>!bag.board&&cash>=120,'你的錢夠買滑板了（商店 $120），溜起來比跑步快又不累。'],
  [()=>!homeOwned&&cash>=500,'你的錢夠買房子了！大馬路西南角黃色門的 14 號，點門就能買（$500）。'],
  [()=>!homeOwned&&cash<500,'存到 $500 可以買下 14 號當自己的家（現在有 $'+cash+'）。'],
  [()=>homeOwned&&Object.keys(decorOwn).length<3,'你有家了！商店現在多賣盆栽、掛畫、金魚缸，買來佈置客廳。'],
  [()=>carUp.eng<2&&cash>=160,'把車停在綠色加油機旁邊按 U，可以升級引擎讓車子更快。'],
  [()=>Object.keys(starGot).length<STARS.length,'地圖角落藏了 '+STARS.length+' 顆發亮的星星，你找到 '+Object.keys(starGot).length+' 顆了。兩顆要開船。'],
  [()=>Object.keys(fishGot).length<FISH.length,'釣魚圖鑑 '+Object.keys(fishGot).length+'/'+FISH.length+'。換地方、換白天晚上釣，會釣到不一樣的。'],
  [()=>daily.list.some(d=>!d.done),'今天的每日挑戰還沒做完，在「我的紀錄」可以看是哪三個。'],
  [()=>!isWeekend()&&day%7!==5,'週五、六、日晚上 6 點海邊有夜市；週六、日晚上 8 點有煙火。可以在設定把時間調快。'],
  [()=>Object.keys(album).length<4,'按 P 進拍照模式，再按 Enter 拍照。把燈塔、碼頭、商店這些景點拍下來可以收進相簿（每張 $25）。'],
  [()=>!bag.kite&&cash>=40,'商店有賣風箏（$40）。風大的時候到外面按 5 放風箏。'],
  [()=>shells<3,'沙灘上有小貝殼，走過去就能撿起來換錢。'],
  [()=>people.filter(n=>n.like>=3).length<3,'多跟同一個人聊天、幫他忙、請他喝飲料，他會變成你的好朋友（♥♥♥），之後會來你家作客。']];
function showGuide(){const el=$('talk');el.hidden=false;el.textContent='';talkN=null;
  const h=document.createElement('strong');h.textContent='接下來可以做什麼？';el.appendChild(h);
  const box=document.createElement('div');box.style.cssText='max-height:42vh;overflow:auto;margin:6px 0;flex:1 1 100%;width:100%';el.appendChild(box);
  const L=getGuide().filter(g=>{try{return g[0]();}catch(e){return false;}}).slice(0,6);
  if(!L.length){const p=document.createElement('p');p.textContent='你幾乎什麼都做過了！可以挑戰計時賽的金牌，或是到處逛逛，看看居民今天在忙什麼。';box.appendChild(p);}
  L.forEach((g,i)=>{const p=document.createElement('p');p.textContent=(i+1)+'. '+g[1];p.style.margin='5px 0';box.appendChild(p);});
  const b=document.createElement('button');b.type='button';b.textContent='關閉';b.onclick=()=>{el.hidden=true;canvas.focus({preventScroll:true});};el.appendChild(b);}
$('bGuide').onclick=showGuide;
// --- the full list of keys, grouped by what you are doing ---
const KEYS=[['走路','W A S D 走、Shift 跑、空白鍵 跳、V 換第一／第三人稱、滑鼠轉頭、Esc 放開滑鼠'],
  ['手上的東西','E 撿起／放下、點畫面 丟出去、1 手電筒、2 雨傘、3 喝飲料、4 滑板、5 風箏（要有風）、M 手機地圖'],
  ['表情動作','X 揮手（附近的人會回應）、J 跳舞（愛玩的人會跟你一起跳，動一下就停）'],
  ['坐和睡','Q 坐下／站起來、Z 躺下睡覺（時間會快轉）'],
  ['車子、機車、腳踏車、小船','F 上下車（船要靠岸才能下）、W 油門、S 煞車倒車、A D 轉彎、H 喇叭、R 收音機（只有車）'],
  ['開車載客','坐在車子裡按 K 接一位客人；開到他附近停好，他上車後載到目的地再停好'],
  ['加油機旁邊','C 加油、N 幫車子噴漆換顏色（$30）、U 改裝車子（升級引擎、省油裝置）'],
  ['計時賽','把車開到黑白格子旗旁邊按 B 開始，照順序穿過發亮的圈圈'],
  ['公車和計程車','公車停站時 F 上車（$5）、車上 F 按下車鈴或下車；T 招計程車，停在旁邊後 F 上車選目的地'],
  ['海邊','G 釣魚（岸邊，或船停著時）、咬了再按一次 G 拉起來'],
  ['跟人互動','點人 說話、接任務、請喝飲料；點門 開關、點球 踢、點電視和燈 開關、點衣櫃 換衣服、點櫃台 買東西和打工'],
  ['其他','P 拍照模式（裡面按 Enter 拍一張，拍到景點會收進相簿）；設定裡可以調時間、天氣、重力、聲音、音樂、畫質、小地圖、我的紀錄']];
function showKeys(){const el=$('talk');el.hidden=false;el.textContent='';talkN=null;
  const h=document.createElement('strong');h.textContent='操作說明'+(isTouch?'（手機：用右下角的按鈕，下面是鍵盤的按法）':'');el.appendChild(h);
  const box=document.createElement('div');box.style.cssText='max-height:42vh;overflow:auto;margin:6px 0;flex:1 1 100%;width:100%';el.appendChild(box);
  for(const K of KEYS){const p=document.createElement('p');const b=document.createElement('b');b.textContent=K[0]+'：';p.append(b,K[1]);p.style.margin='4px 0';box.appendChild(p);}
  const b=document.createElement('button');b.type='button';b.textContent='關閉';b.onclick=()=>{el.hidden=true;canvas.focus({preventScroll:true});};el.appendChild(b);}
$('bHelp').onclick=()=>{showHint();showKeys();};
$('bReset').onclick=()=>{noSave=true;try{localStorage.removeItem(SAVE_KEY);}catch(e){}try{location.reload();}catch(e){}};
function hudStats(){$('cash').textContent='$'+cash+'　名聲 '+(rep>0?'+':'')+rep+'　體力 '+Math.round(stam*100)+(heat?'　'+'★'.repeat(heat):'');
  if(heat&&performance.now()-heatAt>45000){heat--;heatAt=performance.now();}              // 45 quiet seconds take one star away
  if(++saveNo%40===0)saveGame();                                                          // the game saves itself every 10 seconds or so
  const q=$('quest');q.hidden=!quest;if(quest)q.textContent=quest.type==='race'?quest.text:'任務：'+quest.text+'（做完給 $'+quest.reward+'）';
  rideQuest();parcelQuest();paperQuest();askFavor();storyQuest();dogQuest();waterQuest();trackStats();
  $('speed').hidden=!ride;if(ride)$('speed').textContent=Math.round(Math.abs(ride.v)*3.6)+' km/h'+(ride.S.tank?'　油 '+Math.round(ride.fuel*100)+'%'+(ride.fuel<=.15?' ⚠':''):'');
  if(talkN&&(talkN.hidden||talkN.lie||Math.hypot(talkN.pos.x-pos.x,talkN.pos.z-pos.z)>4.2))closeTalk();}
// running uses up your breath; walking, and especially sitting, brings it back
let swimNote=0;
function moveSpeed(dt,want){const wd=waterDepth();
  if(wd>.05){const deep=wd>1;stam=Math.max(0,Math.min(1,stam+(deep&&want>.1?-.035:.03)*dt));               // swimming is tiring; floating still is not
    if(deep&&performance.now()-swimNote>30000){swimNote=performance.now();say('你在游泳。游泳很累，體力快沒了就回岸邊。');}
    if(deep&&stam<=0){vel.z+=2.2*dt;if(performance.now()-swimNote>4000){swimNote=performance.now();say('太累了，海浪把你慢慢推回岸邊。');}}
    return 1.9*(1-.5*Math.min(1,wd/1.3));}
  if(boarding()){stam=Math.max(0,Math.min(1,stam+.04*dt));return 4.6;}                              // on the skateboard: quick, and your legs get a rest
  const run=(keys.ShiftLeft||keys.ShiftRight||runLock||Math.hypot(joy.x,joy.y)>.93)&&want>.1&&stam>0&&!ride&&!seat;
  stam=Math.max(0,Math.min(1,stam+(run?-.09:seat?.14:.05)*dt));return run?3.3:1.9;}
function buyDrink(){if(cash<20){say('飲料一罐 $20，你的錢不夠。幫鄰居做事可以賺錢。');return;}
  cash-=20;drinks++;sfxCoin();actKey='';say('你買了一罐飲料（剩 $'+cash+'）。按右下角「喝飲料」補體力，或在聊天時請別人喝。');}
function drinkUp(){if(!drinks)return;drinks--;stam=1;actKey='';say('咕嚕咕嚕。體力補滿了，可以繼續跑。');}
function describe(n){const g=n.goal,G=GOALS[g.id],pr=progress(n);
  let low='energy';for(const k in NEED_ZH)if(n.need[k]<n.need[low])low=k;
  const feel={food:'我肚子餓了。',energy:'我有點累了。',fun:'我好無聊。',fit:'我想動一動。',calm:'我想安靜一下。',care:'我還有家事沒做。'}[low];
  return(n.phase==='at'?'我在'+G.label+(pr>=0?'，做了 '+Math.round(pr*100)+'% 了。':'。'):'我正要去'+G.label+'。')+(n.need[low]<.35?feel:'其他都還好。');}
function offer(n){                                                          // think of something this person would like done
  const others=people.filter(m=>m!==n&&m.home>=0&&!m.hidden&&m.home!==n.home);     // only people with an address can get a letter
  if(others.length&&Math.random()<.3){const to=others[Math.floor(Math.random()*others.length)];
    return{type:'letter',from:n,to,reward:50,text:'把'+n.o.name+'的信拿給 '+houses[to.home].no+' 號的'+to.o.name,ask:'可以幫我把這封信拿給 '+houses[to.home].no+' 號的'+to.o.name+'嗎？'};}
  if(Math.random()<.5){const D=[['公園',19.5,11.3],['夕陽商店',36.5,11.3],['街的西邊',-30,7.8],['街的東邊',41,11.3]].filter(d=>Math.hypot(d[1]-n.pos.x,d[2]-n.pos.z)>14),d=D[Math.floor(Math.random()*D.length)];
    return{type:'ride',from:n,dest:d,reward:60,text:'開車載'+n.o.name+'去'+d[0]+'（他會走到你的黃色車旁邊等你，上車後他就會坐進來）',ask:'你有車對吧？可以載我去'+d[0]+'嗎？我走去你的車那邊等你。'};}
  const pl=Object.values(ACT).filter(A=>A.type==='plant'&&A.house===n.home).slice(0,2);
  if(pl.length&&Math.random()<.3)return{type:'water',from:n,plants:pl,done:0,t:0,last:0,reward:30+15*pl.length,text:'幫'+n.o.name+'家（'+houses[n.home].no+' 號）的 '+pl.length+' 盆盆栽澆水：走進屋子，站在盆栽旁邊等一下',
    ask:'我今天好忙，可以幫我家的盆栽澆水嗎？我家是 '+houses[n.home].no+' 號，有 '+pl.length+' 盆，站在旁邊澆一下就好。'};
  const dg=pets[0];
  if(dg&&dg.owner===n&&!dg.carry&&dark<.7&&Math.random()<.7){const S=LOST_AT.filter(d=>!blocked(d[1],d[2])&&Math.hypot(d[1]-dg.home[0],d[2]-dg.home[1])>14),d=S[Math.floor(Math.random()*S.length)];
    if(d)return{type:'dog',from:n,at:d,reward:70,text:'找走丟的小黃：有人看到牠在'+d[0]+'（找到牠，牠會跟著你走回來）',ask:'小黃跑不見了！有人說看到牠在'+d[0]+'。可以幫我把牠帶回來嗎？',
      start(){dg.x=d[1];dg.z=d[2];dg.path=[];dg.think=0;dg.lost=[d[1],d[2]];dg.lead=false;}};}
  if(Math.random()<.5){const S=LOST_AT.filter(d=>!blocked(d[1],d[2])&&Math.hypot(d[1]-n.pos.x,d[2]-n.pos.z)>8),d=S[Math.floor(Math.random()*S.length)],thing=['鑰匙','錢包','手錶'][Math.floor(Math.random()*3)];
    if(d)return{type:'find',from:n,at:d,thing,reward:55,text:'幫'+n.o.name+'找'+thing+'：好像掉在'+d[0]+'（走過去找會發亮的小東西）',ask:'我的'+thing+'不見了，好像掉在'+d[0]+'。可以幫我找嗎？'};}
  if(n.need.food<.6&&Math.random()<.6||Math.random()<.25)return{type:'drink',from:n,reward:45,text:'幫'+n.o.name+'買一罐飲料（販賣機或商店 $20），拿回來給他',ask:'我好渴，可是走不開。可以幫我買一罐飲料嗎？錢我會加倍還你。'};
  const kind=Math.random()<.5?'tennis':'basket',name=BALLS[kind][0];
  return{type:'ball',from:n,kind,reward:40,text:'拿一顆'+name+'給'+n.o.name,ask:'我想要一顆'+name+'，可以幫我拿一顆過來嗎？'};}
// --- a lost thing: it lies somewhere outside and glints; walk up to it to pick it up, then take it back ---
const LOST_AT=[['公園的長椅附近',20.6,17.6],['海邊的沙灘上',6,-9.4],['西邊的公車站附近',-20.2,4.9],['籃球架下面',19.2,21.9],['東邊的公車站附近',13.2,14.2],['商店門口',35.5,14.6]];
const lostG=new THREE.Group();lostG.visible=false;scene.add(lostG);
{const m=new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.09),new THREE.MeshStandardMaterial({color:0xd8a93a,metalness:.8,roughness:.3}));m.position.y=.04;m.castShadow=true;lostG.add(m);
 const sp=new THREE.Mesh(new THREE.OctahedronGeometry(.07),new THREE.MeshBasicMaterial({color:new THREE.Color(4,3.2,1.2)}));sp.position.y=.5;lostG.add(sp);lostG.userData.sp=sp;}
function findQuest(){const q=quest,st=!!q&&q.type==='story'&&q.i<q.steps.length,on=st||(!!q&&q.type==='find'&&!q.got);lostG.visible=on;if(!on)return;
  const box=lostG.children[0];
  if(st){const s2=q.steps[q.i],sp2=lostG.userData.sp;box.material.color.setHex(s2.col||0xd8a93a);box.scale.setScalar(s2.big||1.6);lostG.position.set(s2.at[0],0,s2.at[1]);sp2.position.y=.55+Math.sin(performance.now()/333)*.08;sp2.rotation.y=performance.now()/500;return;}   // the thing to pick up (or the spot to put it down) for this step of a story
  box.material.color.setHex(0xd8a93a);box.scale.setScalar(1);
  const t=performance.now()/1000,sp=lostG.userData.sp;lostG.position.set(q.at[1],0,q.at[2]);sp.position.y=.45+Math.sin(t*3)*.08;sp.rotation.y=t*2;
  if(!ride&&!onBus&&Math.hypot(pos.x-q.at[1],pos.z-q.at[2])<1.5){q.got=true;lostG.visible=false;sfxCoin();q.text='把'+q.thing+'拿回去給'+q.from.o.name;say('你找到'+q.from.o.name+'的'+q.thing+'了！拿回去給他。');}}
// --- the dog has run off: find him, he follows you, walk him back to his owner or his own front door ---
function dogQuest(){const q=quest;if(!q||q.type!=='dog')return;const d=pets[0],n=q.from;
  if(!q.got){if(!ride&&!onBus&&Math.hypot(pos.x-d.x,pos.z-d.z)<2.6){q.got=true;d.lost=null;d.lead=true;d.think=0;d.happy=2.5;bark(d);q.text='帶小黃回去找'+n.o.name+'（牠會跟著你；走到'+n.o.name+'旁邊或牠家門口）';say('你找到小黃了！牠搖著尾巴跟著你。帶牠回家吧。');}return;}
  const atOwner=!n.hidden&&Math.hypot(d.x-n.pos.x,d.z-n.pos.z)<3.5,atHome=Math.hypot(d.x-d.home[0],d.z-d.home[1])<3;
  if(atOwner||atHome){d.lead=false;d.happy=3;bark(d);
    if(atOwner)finishQuest(n,'小黃！你跑去哪裡了！謝謝你把牠帶回來！');else{quest=null;cash+=q.reward;addRep(2);n.like=Math.min(5,n.like+2);sfxCoin();say('小黃回到家門口了！任務完成，'+n.o.name+'留了 $'+q.reward+' 謝謝你。');}}}
// --- watering a neighbour's plants: stand beside each pot for a moment ---
function waterQuest(){const q=quest;if(!q||q.type!=='water')return;const now=performance.now()/1000,dt=Math.min(.6,now-(q.last||now));q.last=now;
  const A=q.plants[q.done],near=!ride&&Math.hypot(pos.x-A.ap[0],pos.z-A.ap[1])<1.5;
  if(!near){q.t=0;return;}
  if(q.t===0){say('你拿起澆水壺幫盆栽澆水… 站著不要走開。');noise(.5,1800,.5,.08);}
  q.t+=dt;if(q.t<2.5)return;
  q.t=0;q.done++;sfxCoin();
  if(q.done<q.plants.length){q.text='還有 '+(q.plants.length-q.done)+' 盆要澆（在同一間房子裡）';say('這一盆澆好了！植物喝了水才會長大。還有 '+(q.plants.length-q.done)+' 盆。');return;}
  const n=q.from;quest=null;cash+=q.reward;addRep(2);n.like=Math.min(5,n.like+2);n.mood=Math.min(1,n.mood+.15);n.need.care=Math.min(1,n.need.care+.5);
  say('盆栽都澆好了！任務完成，'+n.o.name+'把 $'+q.reward+' 放在桌上給你。');}
const STORIES=[
  {id:'bday',menu:'小芳有事想拜託你…',reward:120,who:()=>pets[0]&&pets[0].owner,name:'生日驚喜',
    intro:w=>'噓——今天是'+w.o.name+'的生日！我想給他一個驚喜，可是我要顧店走不開。你可以幫我跑三個地方嗎？做完我給你 $120。',
    steps:w=>{const H=houses[w.home],f=H.front;return[
      {at:[23.5,14.6],col:0xf6e7d0,big:2.4,text:'生日驚喜 1/3：去公園旁邊的小吃攤拿蛋糕',done:'老闆把蛋糕交給你：「小心拿，不要晃到喔！」'},
      {at:[2.6,-10.6],col:0xffc7d9,big:1,text:'生日驚喜 2/3：去海邊的釣竿架旁邊，撿一顆漂亮的貝殼當禮物',done:'你在沙灘上找到一顆會發亮的貝殼，放進口袋。'},
      {at:[f.x+f.dx*.9,f.z+f.dz*.9],text:'生日驚喜 3/3：把蛋糕和貝殼悄悄放在 '+H.no+' 號門口',done:'你把蛋糕和貝殼放在門口。現在去找'+w.o.name+'，跟他說話！'}];},
    ask:'生日快樂！門口有驚喜喔',thanks:'哇！蛋糕！還有貝殼！你們還記得我的生日…謝謝你，真的謝謝！',cheer:w=>'生日快樂，'+w.o.name+'！🎂',end:w=>w.o.name+'好開心。'},
  {id:'beach',menu:'小芳：海邊需要幫忙…',reward:90,who:()=>people.find(n=>n.guard),name:'淨灘日',
    intro:w=>'昨天風好大，沙灘上被吹來好多垃圾，海龜吃到會生病。'+w.o.name+'一個人撿不完。你可以去幫忙撿四個地方嗎？撿完去跟他說一聲，我請你 $90。',
    steps:w=>[[-13,-9.8,'一個塑膠袋'],[-3,-11.2,'兩個寶特瓶'],[9,-10,'一團釣魚線'],[17,-11,'一個破掉的保麗龍箱']].map((q,k)=>({at:[q[0],q[1]],col:[0xdfe9ef,0x7fc4e8,0x59d07a,0xf2f2f2][k],big:[1.8,1.6,1.2,3][k],text:'淨灘日 '+(k+1)+'/4：沿著沙灘走，撿起垃圾（小雷達橘點的位置）',done:'你撿起'+q[2]+'，放進袋子。'+(k<3?'':'沙灘乾淨了！去找'+w.o.name+'。')})),
    ask:'沙灘的垃圾我都撿好了',thanks:'太好了！沙灘乾淨，海裡的動物才安全。謝謝你這麼熱心。',cheer:()=>'謝謝你幫忙撿垃圾！',end:w=>'沙灘變乾淨了。'},
  {id:'lunch',menu:'小芳：想請你送便當…',reward:150,who:()=>people.find(n=>n.o.job),name:'愛心便當',
    intro:w=>'街上有三位鄰居今天不方便出門。小吃攤老闆做了三個熱便當要送給他們，可是沒有人手。你可以幫忙送嗎？有一家在第二條馬路那邊，比較遠，開車或騎車比較快。送完回來跟我說，我給你 $150。',
    steps:w=>{const door=no=>{const H=houses.find(h=>h.no===no),f=H.front;return[f.x+f.dx*.9,f.z+f.dz*.9];};return[
      {at:[23.5,14.6],col:0xf2b25a,big:2.6,text:'愛心便當 1/4：去公園旁邊的小吃攤拿三個便當',done:'老闆把三個熱騰騰的便當交給你：「趁熱送喔！」'},
      {at:door(7),col:0xf2b25a,big:1.6,text:'愛心便當 2/4：送到 7 號門口（大馬路最西邊）',done:'你把便當放在 7 號門口，按了門鈴。屋裡有人說：「謝謝你！」'},
      {at:door(2),col:0xf2b25a,big:1.6,text:'愛心便當 3/4：送到 2 號門口（大馬路南邊）',done:'2 號的便當送到了。還剩最後一個，在第二條馬路。'},
      {at:door(10),col:0xf2b25a,big:1.6,text:'愛心便當 4/4：送到 10 號門口（第二條馬路上）',done:'三個便當都送完了！回夕陽商店找'+w.o.name+'。'}];},
    ask:'便當都送到了',thanks:'太謝謝你了！他們剛剛都打電話來說便當好好吃。夕陽街有你真好。',cheer:()=>'謝謝你幫忙送便當！',end:w=>'三位鄰居都吃到熱便當了。'},
  {id:'bottle',menu:'小芳：海上好像有東西…',reward:200,who:()=>people.find(n=>n.guard),name:'漂流瓶',
    intro:w=>'今天早上有客人說，碼頭外面的海上漂著一個玻璃瓶，裡面好像有紙條！我好想知道寫什麼，可是我不會開船。你可以開船去撈回來嗎？船停在碼頭旁邊。找到什麼就拿去給'+w.o.name+'看，他最懂海上的事。做完我給你 $200。',
    steps:w=>[
      {at:[34,-40],r:6,col:0x9fe0c8,big:1.4,text:'漂流瓶 1/3：開船到碼頭東北邊的海上，撈起漂流瓶（靠近發亮的地方，慢下來）',done:'你撈起瓶子，裡面的紙條寫著：「往西北邊開，有一座燈塔島，島上有一個舊木箱，是我小時候藏的。」'},
      {at:[-52.5,-47],col:0x8a5a34,big:3.2,text:'漂流瓶 2/3：照紙條說的，往西北邊開到燈塔島，把船停在島邊，上島找舊木箱',done:'找到了！木箱裡有一張發黃的照片，是好多年前的夕陽街，還有一枚舊硬幣。'},
      {at:[20.2,-22.6],r:2.4,col:0xd8a93a,big:1.2,text:'漂流瓶 3/3：把船開回碼頭，下船走到碼頭盡頭',done:'你帶著瓶子和木箱回到碼頭。去找'+w.o.name+'，給他看。'}],
    ask:'你看我在海上找到什麼',thanks:'這…這是我小時候跟朋友一起藏的！我都忘了。照片上這個小孩就是我。謝謝你把它找回來，這枚硬幣送你當紀念。',cheer:()=>'哇，是好久以前的夕陽街！',end:w=>w.o.name+'看著老照片，眼睛紅紅的。'}];
// --- a little story in steps: go to each place in turn, then talk to the person it is all for ---
function storyQuest(){const q=quest;if(!q||q.type!=='story')return;
  if(q.i>=q.steps.length){q.text=q.S.name+'：去找'+q.who.o.name+'，跟他說話'+(q.who.hidden?'（他現在不在街上，可能去上班了，等他回來）':'');return;}
  const s=q.steps[q.i];
  if(ride&&Math.abs(ride.v)>(s.r?4:2)||onBus||Math.hypot(pos.x-s.at[0],pos.z-s.at[1])>(s.r||2.2))return;
  q.i++;sfxCoin();say(s.done);q.text=q.i<q.steps.length?q.steps[q.i].text:q.S.name+'：去找'+q.who.o.name+'，跟他說話';}
// --- ten hidden stars: tucked away at the edges of the map (two of them out at sea), to reward looking around ---
const STARS=[[-36,-9.5],[31,-10],[-36.9,-4],[40.5,21],[52.5,70],[21.5,24.5],[-21,3],[8,24],[72,-52],[-50.5,-58.5]],starGot={},starM=[];
{const geo=new THREE.OctahedronGeometry(.28),mat=new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,2.6,.6)});
  STARS.forEach((p,i)=>{const m=new THREE.Mesh(geo,mat);m.position.set(p[0],1.1,p[1]);m.scale.y=1.5;scene.add(m);starM.push(m);});}
function starStep(){const t=performance.now()/1000;let n=0;
  STARS.forEach((p,i)=>{const m=starM[i];if(starGot[i]){m.visible=false;n++;return;}
    const d=Math.hypot(pos.x-p[0],pos.z-p[1]);m.visible=d<70;if(!m.visible)return;m.rotation.y=t*1.6+i;m.position.y=1.1+Math.sin(t*2+i)*.12;
    if(d<1.7&&!onBus){starGot[i]=1;n++;m.visible=false;cash+=20;sfxCoin();tone(1320,.25,.2,'triangle');
      const all=Object.keys(starGot).length>=STARS.length;if(all){cash+=300;addRep(2);}
      say('⭐ 你找到一顆藏起來的星星！（'+Object.keys(starGot).length+'/'+STARS.length+'，+$20）'+(all?' 全部找齊了！大獎 $300！':p[1]<-20?' 這顆要開船才拿得到。':''));}});}
// --- things for your home, from the shop ---
const decorOwn={};
function showDecor(){for(const k in decorG)decorG[k].visible=!!decorOwn[k];}
// --- a home of your own: number 14 is for sale ---
let homeOwned=false;
function buyHome(H){if(Math.hypot(H.front.x-pos.x,H.front.z-pos.z)>4){say('走近一點才看得到門上的出售牌。');return;}
  if(cash<500){say(H.no+' 號在賣，要 $500。你現在有 $'+cash+'，還差 $'+(500-cash)+'。多做任務、送報紙、釣魚、比賽都可以賺錢。');return;}
  cash-=500;homeOwned=true;sfxCoin();sfxBell();saveGame();say('恭喜！你買下 '+H.no+' 號了，這裡是你的家。門可以開了；裡面有床可以睡、衣櫃可以換衣服。搭計程車也可以直接說「回家」。');}
// --- driving for hire: in your car, take a call; someone on the street wants a lift ---
let fares=0;
function startFare(){if(!ride||ride.kind!=='car'){say('要坐在車子裡才能接載客的工作。');return;}if(quest){say('你現在有別的任務，先做完。');return;}
  const D=[['公園',19.5,11.3],['夕陽商店',36.5,11.3],['街的西邊',-30,7.8],['街的東邊',41,11.3],['碼頭',20.2,-9.5]];
  const c=people.filter(n=>!n.hidden&&!n.lie&&!n.guard&&!n.o.job&&n.home>=0&&n.like>-2&&n.goal&&n.goal.id!=='work'&&n.goal.id!=='sleep'&&n.goal.id!=='lift');
  if(!c.length){say('現在沒有人要叫車。晚一點再試試。');return;}
  const n=c[Math.floor(Math.random()*c.length)],ds=D.filter(d=>Math.hypot(d[1]-n.pos.x,d[2]-n.pos.z)>16&&d[0]!=='碼頭'),d=ds[Math.floor(Math.random()*ds.length)]||D[0];
  const dist=Math.hypot(d[1]-n.pos.x,d[2]-n.pos.z);quest={type:'ride',from:n,dest:d,reward:Math.round(25+dist*.9),fare:true,text:'載客：去接'+n.o.name+'（他會走到你的車旁邊），載他去'+d[0]};
  sfxBell();actKey='';say('叮！'+n.o.name+'叫車，要去'+d[0]+'。把車開到他附近停好，他會自己走過來上車。車錢 $'+quest.reward+'。');}
// --- people who know you a little will call you over themselves when they need a hand ---
let favorAt=0;
function askFavor(){const now=performance.now()/1000;if(quest||talkN||ride||onBus||seat||emote||now<favorAt||!$('talk').hidden)return;favorAt=now+8;
  if(roomAt(pos.x,pos.z))return;
  for(const n of people){if(n.hidden||n.lie||n.react||n.guard||n.like<1||n.mood<.4||!n.goal||n.goal.id==='work'||n.goal.id==='sleep'||n.goal.id==='guest'||(n.askedAt&&n.askedAt>now-240))continue;
    if(Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)>5.5||roomAt(n.pos.x,n.pos.z)||Math.random()>.35)continue;
    n.askedAt=now;favorAt=now+75;const q=offer(n);sfxBell();
    showTalk(n,'欸，等一下！'+q.ask,[['好，我幫你',()=>{quest=q;if(q.start)q.start();showTalk(n,'太好了，謝謝！做完我給你 $'+q.reward+'。');}],['現在不行，抱歉',()=>{n.mood-=.03;showTalk(n,'沒關係，你忙。');}]]);
    say(n.o.name+'叫住你，好像有事想拜託你。');return;}}
// --- the paper round: once a day, five front doors in any order ---
let paperDay=0;
function paperQuest(){const q=quest;if(!q||q.type!=='papers')return;const left=Math.ceil((q.until-performance.now())/1000);
  for(const H of q.left){const f=H.front;if(Math.hypot(f.x+f.dx*.8-pos.x,f.z+f.dz*.8-pos.z)<2.6&&(!ride||Math.abs(ride.v)<3)&&!onBus){
    q.left=q.left.filter(h=>h!==H);q.got++;cash+=12;sfxCoin();noise(.12,500,1,.2);say('啪！報紙丟到 '+H.no+' 號門口了（+$12）。'+(q.left.length?'還剩 '+q.left.length+' 家。':''));break;}}
  if(!q.left.length){const bonus=left>0?40:0;quest=null;cash+=bonus;addRep(1);say(bonus?'報紙全部準時送完！再加獎金 $40。明天還可以再來送。':'報紙送完了，可是超過時間，沒有獎金。明天再試試看。');return;}
  if(left<-120){quest=null;say('報紙太晚送了，剩下的小芳自己送。今天的送報工作結束。');return;}
  q.text='送報紙到 '+q.left.map(h=>h.no).join('、')+' 號門口（已送 '+q.got+'/'+q.n+'）'+(left>0?'，獎金時間還剩 '+left+' 秒':'，已超過獎金時間');q.reward=q.left.length*12;}
function ballFor(q){return bodies.find(b=>b.kind===q.kind&&(b===held||Math.hypot(b.p.x-q.from.pos.x,b.p.z-q.from.pos.z)<2.2));}
function finishQuest(n,line){const q=quest;quest=null;q.from.like=Math.min(5,q.from.like+2);if(n!==q.from)n.like=Math.min(5,n.like+1);cash+=q.reward;addRep(2);n.mood=Math.min(1,n.mood+.2);sfxCoin();
  say('任務完成！你拿到 $'+q.reward+'，名聲變好了。');showTalk(n,line);}
function closeTalk(){if(talkN&&talkN.react&&talkN.react.talk)talkN.react.t=0;talkN=null;$('talk').hidden=true;}
function showTalk(n,line,opts){
  talkN=n;const el=$('talk');el.hidden=false;el.textContent='';
  const h=document.createElement('strong');h.textContent=n.o.name+' '+moodFace(n)+(n.like>0?' '+'♥'.repeat(Math.min(5,Math.round(n.like))):n.like<=-2?' （他不太喜歡你）':'');const p=document.createElement('p');p.textContent=line;el.append(h,p);
  if(!n.react||n.react.talk)n.react={say:'在跟你說話',t:45,pose:null,talk:true};       // they stop and face you while you talk
  const add=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.onclick=()=>{fn();canvas.focus({preventScroll:true});};el.appendChild(b);};
  if(opts){opts.forEach(o=>add(o[0],o[1]));return;}
  if(rep<=-4){add('好吧…',closeTalk);return;}
  add('嗨！',()=>{n.mood=Math.min(1,n.mood+.03);showTalk(n,n.mood>.6?['嗨！今天天氣不錯。','嗨！很高興看到你。','你好啊！'][Math.floor(Math.random()*3)]:n.mood>.38?'嗯，你好。':'…嗯。');});
  add('你在做什麼？',()=>showTalk(n,describe(n)));
  if(quest&&quest.type==='letter'&&quest.to===n)add('這是'+quest.from.o.name+'給你的信',()=>finishQuest(n,'啊，謝謝你特地送來！'));
  else if(quest&&quest.type==='ball'&&quest.from===n){const b=ballFor(quest);
    if(b)add('你要的'+b.name+'我拿來了',()=>{if(b===held)putDown();finishQuest(n,'太好了，謝謝你！');});
    else add('你要的東西是什麼？',()=>showTalk(n,'我想要一顆'+BALLS[quest.kind][0]+'。拿在手上或放在我旁邊都可以。'));}
  else if(quest&&quest.type==='find'&&quest.from===n){
    if(quest.got)add('你的'+quest.thing+'我找到了',()=>finishQuest(n,'你找到了！太感謝你了！'));
    else add('你的'+quest.thing+'掉在哪裡？',()=>showTalk(n,'好像掉在'+quest.at[0]+'。它會亮亮的，走近就看得到。'));}
  else if(quest&&quest.type==='drink'&&quest.from===n){
    if(drinks)add('你要的飲料買來了',()=>{drinks--;actKey='';n.need.food=Math.min(1,n.need.food+.25);finishQuest(n,'啊，好涼！謝謝你，這是飲料錢和跑腿費。');});
    else add('哪裡買得到飲料？',()=>showTalk(n,'公園旁邊有販賣機，夕陽商店也有賣，一罐 $20。'));}
  else if(quest&&quest.type==='story'&&quest.who===n){
    if(quest.i>=quest.steps.length)add(quest.S.ask,()=>{const q=quest,S=q.S;quest=null;stats.done[S.id]=1;cash+=q.reward;addRep(3);n.like=Math.min(5,n.like+3);n.mood=1;sfxCoin();
      for(const m of people)if(m!==n&&!m.hidden&&!m.lie&&Math.hypot(m.pos.x-n.pos.x,m.pos.z-n.pos.z)<25){m.react={say:S.cheer(n),t:3,pose:'wave'};m.like=Math.min(5,m.like+.5);}
      say('任務完成！'+S.end(n)+'小芳給你 $'+q.reward+'，附近的鄰居也都看到了。');showTalk(n,S.thanks);});
    else add('（事情還沒做完，等一下再說）',closeTalk);}
  else if(quest&&quest.type==='water'&&quest.from===n)add('盆栽在哪裡？',()=>showTalk(n,'在我家 '+houses[n.home].no+' 號裡面，綠綠的那幾盆。門沒鎖，直接進去就好。'));
  else if(quest&&quest.type==='dog'&&quest.from===n)add('小黃在哪裡？',()=>showTalk(n,quest.got?'牠不是跟著你嗎？帶牠過來就好。':'有人說看到牠在'+quest.at[0]+'。'));
  else if(!quest)add('需要幫忙嗎？',()=>{if(n.mood<.35||n.like<=-2){showTalk(n,'現在不用，謝謝。');return;}const q=offer(n);
    showTalk(n,q.ask,[['好，我幫你',()=>{quest=q;if(q.start)q.start();showTalk(n,'謝謝！做完我給你 $'+q.reward+'。');}],['下次吧',()=>showTalk(n,'沒關係。')]]);});
  if(drinks&&!(quest&&quest.type==='drink'&&quest.from===n))add('請你喝飲料',()=>{if(!drinks){showTalk(n,'咦，你的飲料呢？');return;}drinks--;actKey='';n.like=Math.min(5,n.like+2);n.mood=Math.min(1,n.mood+.2);n.need.fun=Math.min(1,n.need.fun+.2);addRep(1);showTalk(n,'哇，謝謝！你人真好。');});
  add('再見',closeTalk);
}
function talk(n){
  if(n.lie||ride||n.react&&!n.react.talk){notify(n,'greet');return;}          // asleep, or busy reacting to something: just a wave
  if(Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)>3.4){say('太遠了，走近一點再跟'+n.o.name+'說話。');return;}
  if(n.like<=-4){showTalk(n,'我不想跟你說話。你上次那樣對我。',[['對不起',()=>{n.like+=.5;showTalk(n,'…下次小心一點。',[['好',closeTalk]]);}],['走開',closeTalk]]);return;}
  n.like=Math.min(5,n.like+.15);                                            // just stopping to talk helps a little
  showTalk(n,rep<=-4?'我不想跟你說話。你最近太誇張了。':n.like>=3?'嗨，老朋友！今天好嗎？':n.mood>.6?'嗨！有什麼事嗎？':n.mood>.38?'嗯？':'…什麼事？');
}
// --- the shop ---
const shopOpen=()=>people.some(n=>!n.hidden&&ACT[n.act]&&ACT[n.act].type==='serve'&&n.phase==='at');
const GOODS=[['飲料',20,()=>{drinks++;}],['手電筒',60,()=>{bag.flashlight=true;},()=>bag.flashlight],['雨傘',50,()=>{bag.umbrella=true;},()=>bag.umbrella],['滑板',120,()=>{bag.board=true;},()=>bag.board],['好釣竿',90,()=>{bag.rod=true;},()=>bag.rod],['風箏',40,()=>{bag.kite=true;},()=>bag.kite],
  ['家裡的盆栽',40,()=>{decorOwn.plant=1;showDecor();},()=>!homeOwned||decorOwn.plant],['家裡的掛畫',60,()=>{decorOwn.art=1;showDecor();},()=>!homeOwned||decorOwn.art],['家裡的金魚缸',90,()=>{decorOwn.tank=1;showDecor();},()=>!homeOwned||decorOwn.tank]];
function shopMenu(line){
  const el=$('talk');el.hidden=false;el.textContent='';talkN=null;
  const h=document.createElement('strong');h.textContent='夕陽商店';const p=document.createElement('p');el.append(h,p);
  const add=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.onclick=()=>{fn();canvas.focus({preventScroll:true});};el.appendChild(b);};
  if(!shopOpen()){p.textContent='店員不在，現在沒辦法結帳。小芳早上 9 點到晚上 8 點顧店。';add('好',()=>{el.hidden=true;});return;}
  p.textContent=line||'歡迎光臨！你有 $'+cash+'。想買什麼？';
  for(const G of GOODS){if(G[3]&&G[3]())continue;add(G[0]+' $'+G[1],()=>{if(cash<G[1]){shopMenu('錢不夠喔。'+G[0]+'要 $'+G[1]+'，你只有 $'+cash+'。');return;}
    cash-=G[1];G[2]();sfxCoin();actKey='';shopMenu('謝謝！'+G[0]+'給你。你還有 $'+cash+'。');});}
  for(const S of STORIES){if(quest||stats.done[S.id])continue;const who=S.who();if(!who)continue;add(S.menu,()=>{
    shopMenu(S.intro(who));const el2=$('talk');[...el2.querySelectorAll('button')].forEach(b=>b.remove());
    const mk=(t,f)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=f;el2.appendChild(b);};
    mk('好，交給我！',()=>{quest={type:'story',S,who,reward:S.reward,i:0,steps:S.steps(who)};quest.text=quest.steps[0].text;el2.hidden=true;say('任務開始：'+quest.text+'。小雷達的橘點會帶路。');});
    mk('現在沒空',()=>{el2.hidden=true;});});break;}                                   // one story on offer at a time
  if(!quest&&paperDay!==day)add('打工：送報紙（每天一次）',()=>{const hs=houses.filter(h=>h.front&&h.lot.tpl!=='shop').sort(()=>Math.random()-.5).slice(0,5);
    paperDay=day;quest={type:'papers',left:hs,n:hs.length,got:0,until:performance.now()+170000,reward:0,text:''};paperQuest();el.hidden=true;
    say('送報紙：把報紙送到 '+hs.map(h=>h.no).join('、')+' 號門口，順序隨便。每家 $12；170 秒內全部送完再加 $40。騎腳踏車或溜滑板比較快。');});
  if(!quest)add('打工：幫忙送貨',()=>{const hs=houses.filter(h=>h.front&&h.lot.tpl!=='shop'),H=hs[Math.floor(Math.random()*hs.length)];
    const far=Math.hypot(H.front.x-pos.x,H.front.z-pos.z),secs=Math.round(25+far*1.6);                 // enough time on a bike, tight on foot
    quest={type:'parcel',house:H,until:performance.now()+secs*1000,secs,reward:30,text:''};parcelQuest();el.hidden=true;
    say('小芳：「麻煩把這個包裹送到 '+H.no+' 號門口，'+secs+' 秒內送到有獎金！」');});
  if(fishBag)add('賣掉釣到的魚 +$'+fishBag,()=>{cash+=fishBag;const v=fishBag;fishBag=0;sfxCoin();shopMenu('這些魚很新鮮！$'+v+' 給你。你現在有 $'+cash+'。');});
  add('不買了',()=>{el.hidden=true;});
}
// --- giving someone a lift ---
// Park your car next to them and they get in; drive to the place and stop, and they get out and pay you.
function rideQuest(){const q=quest;if(!q||q.type!=='ride')return;const n=q.from,car=ride&&ride.kind==='car'?ride:null;
  if(!q.in){if(n.hidden&&!n.riding){quest=null;say(n.o.name+'等不及先走了，任務取消。');return;}
    if(car&&Math.abs(car.v)<.6&&Math.hypot(car.x-n.pos.x,car.z-n.pos.z)<3.6){q.in=true;n.riding=true;n.hidden=true;n.root.visible=false;n.react=null;closeTalk();sfxDoor(car.x,car.z);
      q.text='載'+n.o.name+'去'+q.dest[0]+'（到了就停車）';say(n.o.name+'上車了：「麻煩你了，去'+q.dest[0]+'。」');}
    return;}
  if(!car){n.riding=false;n.hidden=false;n.root.visible=true;n.phase='go';n.act=n.want;begin(n);quest=null;say('你下車了，'+n.o.name+'也下車自己走。任務取消。');return;}
  if(Math.abs(car.v)<.6&&Math.hypot(car.x-q.dest[1],car.z-q.dest[2])<5){
    const fx=Math.cos(car.h),fz=-Math.sin(car.h);n.riding=false;n.hidden=false;n.root.visible=true;n.pos.set(car.x-fz*1.8,0,car.z+fx*1.8);n.phase='go';n.act=n.want;begin(n);
    quest=null;cash+=q.reward;if(q.fare)fares++;addRep(q.fare?1:2);n.like=Math.min(5,n.like+(q.fare?.5:2));n.mood=Math.min(1,n.mood+.2);sfxCoin();sfxDoor(car.x,car.z);n.react={say:'到了，謝謝你！',t:2.5,pose:'wave'};
    say('任務完成！'+n.o.name+'下車了，給你 $'+q.reward+'。');}
}
function buySnack(){if(cash<15){say('點心一份 $15，你的錢不夠。');return;}cash-=15;stam=Math.min(1,stam+.6);sfxCoin();say('你買了一份點心吃掉了（剩 $'+cash+'）。體力恢復了一些。');}
// --- delivery work for the shop: get the parcel to a front door before the clock runs out ---
function parcelQuest(){const q=quest;if(!q||q.type!=='parcel')return;const left=Math.ceil((q.until-performance.now())/1000),f=q.house.front;
  q.text='把包裹送到 '+q.house.no+' 號門口，還剩 '+Math.max(0,left)+' 秒';
  if(Math.hypot(f.x+f.dx*.8-pos.x,f.z+f.dz*.8-pos.z)<2.4&&(!ride||Math.abs(ride.v)<1)){const bonus=left>0?Math.round(left/q.secs*40):0;quest=null;cash+=q.reward+bonus;addRep(1);sfxCoin();
    say(left>0?'準時送到！工資 $'+q.reward+'，加上獎金 $'+bonus+'。':'送到了，可是遲到了。只有工資 $'+q.reward+'，沒有獎金。');}
  else if(left<-60){quest=null;say('包裹太晚了，小芳找別人送了。任務取消。');}
}
// --- first-time tips: one at a time, so the big things you can do are not missed ---
const TIPS=['想跑步：按住 Shift，或按右下角的「跑」。','想開車：黃色的車就停在 1 號房子前面，走到旁邊按 F。粉紅色腳踏車在門的另一邊。','想睡覺：走進任何一間房子的臥室，在床邊按 Z。時間會快轉到早上。',
  '點一下人可以說話、接任務賺錢。點門可以開門。','按 V 可以看到自己。按 M 打開地圖。更多功能在左上角「設定」。'];
let tipNo=0;
function nextTip(){if(tipNo>=TIPS.length)return;if(!$('phys').hidden){setTimeout(nextTip,3000);return;}   // wait until the note area is free, so a tip never hides real news
  say('小提示 '+(tipNo+1)+'/'+TIPS.length+'：'+TIPS[tipNo]);tipNo++;setTimeout(nextTip,9000);}
setTimeout(nextTip,5000);
