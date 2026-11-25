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
function saveGame(){if(noSave)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({clock,cash,rep,drinks,stam,bag,x:pos.x,z:pos.z,yaw,rides:rides.map(r=>[r.x,r.z,r.h])}));}catch(e){}}
function loadGame(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!d||typeof d.cash!=='number')return false;
  clock=d.clock;cash=d.cash;rep=d.rep;drinks=d.drinks||0;stam=d.stam;Object.assign(bag,d.bag);pos.x=d.x;pos.z=d.z;yaw=d.yaw;
  (d.rides||[]).forEach((q,i)=>{const r=rides[i];if(r){r.x=q[0];r.z=q[1];r.h=q[2];r.g.position.set(r.x,0,r.z);r.g.rotation.y=r.h;}});return true;}catch(e){return false;}}
let noSave=false;
$('bReset').onclick=()=>{noSave=true;try{localStorage.removeItem(SAVE_KEY);}catch(e){}try{location.reload();}catch(e){}};
function hudStats(){$('cash').textContent='$'+cash+'　名聲 '+(rep>0?'+':'')+rep+'　體力 '+Math.round(stam*100)+(heat?'　'+'★'.repeat(heat):'');
  if(heat&&performance.now()-heatAt>45000){heat--;heatAt=performance.now();}              // 45 quiet seconds take one star away
  if(++saveNo%40===0)saveGame();                                                          // the game saves itself every 10 seconds or so
  const q=$('quest');q.hidden=!quest;if(quest)q.textContent='任務：'+quest.text+'（做完給 $'+quest.reward+'）';
  if(talkN&&(talkN.hidden||talkN.lie||Math.hypot(talkN.pos.x-pos.x,talkN.pos.z-pos.z)>4.2))closeTalk();}
// running uses up your breath; walking, and especially sitting, brings it back
function moveSpeed(dt,want){const run=(keys.ShiftLeft||keys.ShiftRight)&&want>.1&&stam>0&&!ride&&!seat;
  stam=Math.max(0,Math.min(1,stam+(run?-.09:seat?.14:.05)*dt));return run?3.3:1.9;}
function buyDrink(){if(cash<20){say('飲料一罐 $20，你的錢不夠。幫鄰居做事可以賺錢。');return;}
  cash-=20;drinks++;sfxCoin();actKey='';say('你買了一罐飲料（剩 $'+cash+'）。按右下角「喝飲料」補體力，或在聊天時請別人喝。');}
function drinkUp(){if(!drinks)return;drinks--;stam=1;actKey='';say('咕嚕咕嚕。體力補滿了，可以繼續跑。');}
function describe(n){const g=n.goal,G=GOALS[g.id],pr=progress(n);
  let low='energy';for(const k in NEED_ZH)if(n.need[k]<n.need[low])low=k;
  const feel={energy:'我有點累了。',fun:'我好無聊。',fit:'我想動一動。',calm:'我想安靜一下。',care:'我還有家事沒做。'}[low];
  return(n.phase==='at'?'我在'+G.label+(pr>=0?'，做了 '+Math.round(pr*100)+'% 了。':'。'):'我正要去'+G.label+'。')+(n.need[low]<.35?feel:'其他都還好。');}
function offer(n){                                                          // think of something this person would like done
  const others=people.filter(m=>m!==n&&!m.visitor&&!m.hidden&&m.home!==n.home);
  if(others.length&&Math.random()<.55){const to=others[Math.floor(Math.random()*others.length)];
    return{type:'letter',from:n,to,reward:50,text:'把'+n.o.name+'的信拿給 '+houses[to.home].no+' 號的'+to.o.name,ask:'可以幫我把這封信拿給 '+houses[to.home].no+' 號的'+to.o.name+'嗎？'};}
  const kind=Math.random()<.5?'tennis':'basket',name=BALLS[kind][0];
  return{type:'ball',from:n,kind,reward:40,text:'拿一顆'+name+'給'+n.o.name,ask:'我想要一顆'+name+'，可以幫我拿一顆過來嗎？'};}
function ballFor(q){return bodies.find(b=>b.kind===q.kind&&(b===held||Math.hypot(b.p.x-q.from.pos.x,b.p.z-q.from.pos.z)<2.2));}
function finishQuest(n,line){const q=quest;quest=null;cash+=q.reward;addRep(2);n.mood=Math.min(1,n.mood+.2);sfxCoin();
  say('任務完成！你拿到 $'+q.reward+'，名聲變好了。');showTalk(n,line);}
function closeTalk(){if(talkN&&talkN.react&&talkN.react.talk)talkN.react.t=0;talkN=null;$('talk').hidden=true;}
function showTalk(n,line,opts){
  talkN=n;const el=$('talk');el.hidden=false;el.textContent='';
  const h=document.createElement('strong');h.textContent=n.o.name+' '+moodFace(n);const p=document.createElement('p');p.textContent=line;el.append(h,p);
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
  else if(!quest)add('需要幫忙嗎？',()=>{if(n.mood<.35){showTalk(n,'現在不用，謝謝。');return;}const q=offer(n);
    showTalk(n,q.ask,[['好，我幫你',()=>{quest=q;showTalk(n,'謝謝！做完我給你 $'+q.reward+'。');}],['下次吧',()=>showTalk(n,'沒關係。')]]);});
  if(drinks)add('請你喝飲料',()=>{if(!drinks){showTalk(n,'咦，你的飲料呢？');return;}drinks--;actKey='';n.mood=Math.min(1,n.mood+.2);n.need.fun=Math.min(1,n.need.fun+.2);addRep(1);showTalk(n,'哇，謝謝！你人真好。');});
  add('再見',closeTalk);
}
function talk(n){
  if(n.lie||ride||n.react&&!n.react.talk){notify(n,'greet');return;}          // asleep, or busy reacting to something: just a wave
  if(Math.hypot(n.pos.x-pos.x,n.pos.z-pos.z)>3.4){say('太遠了，走近一點再跟'+n.o.name+'說話。');return;}
  showTalk(n,rep<=-4?'我不想跟你說話。你最近太誇張了。':n.mood>.6?'嗨！有什麼事嗎？':n.mood>.38?'嗯？':'…什麼事？');
}
