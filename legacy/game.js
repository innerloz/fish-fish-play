/* A tiny, happy ocean. No accounts, downloads, or dependencies. */
(() => {
'use strict';
const A=window.FishArt, $=id=>document.getElementById(id);
const canvas=$('ocean'), ctx=canvas.getContext('2d'), dialog=$('fish-dialog');
const TAU=Math.PI*2, clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), rand=(a,b)=>a+Math.random()*(b-a), lerp=(a,b,n)=>a+(b-a)*n;
const saveKey='fish-fish-ocean-v1';
let saved={caught:0,points:0,counts:[0,0,0,0,0,0],treasures:0};
try { const d=JSON.parse(localStorage.getItem(saveKey)); if(d&&Number.isSafeInteger(d.caught)&&d.caught>=0&&Number.isSafeInteger(d.points)&&d.points>=0&&Array.isArray(d.counts)&&d.counts.length===6&&d.counts.every(n=>Number.isSafeInteger(n)&&n>=0)){saved={caught:d.caught,points:d.points,counts:d.counts,treasures:Number.isSafeInteger(d.treasures)&&d.treasures>=0?d.treasures:0};}} catch(_e){}
let W=1000,H=600,unit=1,surface=170,time=0,last=0,phase='idle',phaseTime=0,started=false,sound=true,audioCtx=null,toastUntil=0,hover=null;
let boat={x:500,target:500,y:170,scale:1},hook={x:500,y:220,targetX:500,targetY:400},targetFish=null,treasure=false,castCount=0,rewardFish=null;
let fishes=[],bubbles=[],particles=[],ripples=[],floatTexts=[],paused=false,sized=false,nonFinite=0,watchdog=0;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function persist(){try{localStorage.setItem(saveKey,JSON.stringify(saved));}catch(_e){}}
function soundEffect(kind){
 if(!sound)return;
 try{
  if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const now=audioCtx.currentTime;
  const notes=kind==='catch'?[523.25,659.25,783.99,1046.5]:kind==='treasure'?[523.25,659.25,783.99,1046.5,1318.5]:kind==='bite'?[660,880,660]:[380,210];
  notes.forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,now+i*.095);if(kind==='cast')o.frequency.exponentialRampToValueAtTime(freq*.6,now+i*.095+.15);g.gain.setValueAtTime(0,now+i*.095);g.gain.linearRampToValueAtTime(.06,now+i*.095+.015);g.gain.exponentialRampToValueAtTime(.001,now+i*.095+.23);o.connect(g);g.connect(audioCtx.destination);o.start(now+i*.095);o.stop(now+i*.095+.25);});
 }catch(_e){}
}
function setUI(){
 $('catch-count').textContent=saved.caught;$('points').textContent=saved.points;
 const found=saved.counts.filter(Boolean).length;$('collection-count').textContent=found+'/6';
 const progress=saved.caught%5;
 $('progress-fill').style.width=progress*20+'%';
 $('mission-number').innerHTML=progress+'<span>/5</span>';
 $('mission-title').textContent=saved.treasures?'Another treasure awaits':'A treasure awaits';
 $('mission-detail').textContent='Catch '+(5-progress)+' fish to find it!';
 if(saved.caught>=10){$('location-name').textContent='Rainbow Reef';$('scene-note').textContent='You’re a wonderful ocean explorer';}
}
function setPhase(next){
 phase=next;phaseTime=0;
 const labels={idle:'Cast your line',casting:'Here we go…',waiting:'Waiting for a nibble…',bite:'Reel it in!',reeling:'You’ve got a fish!',reward:'What a catch!'};
 $('cast-label').textContent=labels[next];$('cast').disabled=['casting','waiting','reeling','reward'].includes(next);
 $('cast').classList.toggle('biting',next==='bite');$('bite-prompt').classList.toggle('visible',next==='bite');$('bite-prompt').setAttribute('aria-hidden',next==='bite'?'false':'true');
 const messages={idle:[saved.caught?'There are more friends to find!':'Ready for a little adventure?','Tap a fish, or cast into the sea.'],casting:['Plop! Into the blue.','Something lovely is on its way…'],waiting:['Someone’s coming to say hello…','Watch your little red float.'],bite:['A nibble! Quick, reel it in!','Tap the big button or press Space.'],reeling:['Ooh, what did you catch?','Up, up, up it comes!'],reward:['A new little reason to smile.','Every catch belongs in your collection.']};
 $('status-title').textContent=messages[next][0];$('status-description').textContent=messages[next][1];
 if(next==='bite')$('announcer').textContent='A fish is biting! Press Space or Reel it in to catch it.';
}
function spawnFish(type,index){
 const depth=surface+(H-surface)*rand(.16,.77);
 return {type:type??(index%6),x:rand(35,W-35),y:depth,baseY:depth,size:rand(44,72)*unit,dir:Math.random()>.5?1:-1,speed:rand(12,32)*unit,seed:rand(0,TAU),hidden:false,fade:1};
}
// The rework's world unit: the view is 13 units wide in landscape and 9 in portrait (plan 3.1).
function worldUnit(){return W/(H>W?9:13);}
// Positions as fractions (0-1) of the last valid layout, so a new size never divides by an old one.
function normalised(){
 const depth=y=>(y-surface)/Math.max(1,H-surface);
 return {boat:boat.x/W,target:boat.target/W,hx:hook.x/W,hy:hook.y/H,tx:hook.targetX/W,ty:depth(hook.targetY),
  fish:fishes.map(f=>({x:f.x/W,d:depth(f.baseY),s:f.size/unit}))};
}
function resize(){
 const r=canvas.getBoundingClientRect();
 // A 0-size layout (a hidden iframe or a collapsed panel) changes nothing: the last valid size stays.
 if(!(r.width>=2&&r.height>=2))return;
 const before=sized?normalised():null;
 W=r.width;H=r.height;unit=clamp(W/1100,.65,1.15);surface=H*(W<600?.28:.285);
 const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 boat.scale=unit*1.05;boat.y=surface;
 if(before){
  boat.x=clamp(before.boat*W,W*.18,W*.82);boat.target=clamp(before.target*W,W*.18,W*.82);
  hook.x=before.hx*W;hook.y=before.hy*H;hook.targetX=clamp(before.tx*W,25,W-25);hook.targetY=clamp(surface+(H-surface)*before.ty,surface+50,H-70);
  fishes.forEach((f,i)=>{const n=before.fish[i];f.x=n.x*W;f.baseY=surface+(H-surface)*clamp(n.d,.12,.8);f.y=f.baseY;f.size=n.s*unit;});
 }else{
  boat.x=boat.target=W*.3;
  fishes=Array.from({length:W<600?12:18},(_,i)=>spawnFish(i%6,i));fishes[0].x=W*.33;fishes[0].baseY=surface+(H-surface)*.35;fishes[1].x=W*.68;
 }
 sized=true;
 bubbles=Array.from({length:W<600?15:28},()=>({x:rand(0,W),y:rand(surface+15,H),r:rand(1.5,4),speed:rand(8,20),phase:rand(0,TAU)}));
 sanitize();
}
// Per-frame guard: anything that is not a finite number is put back somewhere sensible (it must stay 0).
function finite(...v){return v.every(Number.isFinite);}
function sanitize(){
 let bad=0;
 if(!finite(boat.x,boat.target,boat.y,boat.scale)){boat.x=boat.target=W*.3;boat.y=surface;boat.scale=unit*1.05;bad++;}
 if(!finite(hook.x,hook.y,hook.targetX,hook.targetY)){hook.targetX=W*.6;hook.targetY=surface+(H-surface)*.4;hook.x=hook.targetX;hook.y=hook.targetY;bad++;}
 for(const f of fishes)if(!finite(f.x,f.y,f.baseY,f.size,f.speed)){Object.assign(f,spawnFish(f.type,0),{x:W*rand(.3,.7)});bad++;}
 nonFinite+=bad;
}
function cast(x,y){
 if(dialog.open)return;
 if(phase==='bite'){reel();return;}
 if(phase!=='idle')return;
 started=true;castCount++;$('tutorial').style.opacity=0;soundEffect('cast');
 // The boat stops 2.5 world units short of the cast point, so the float lands in plain view (the
 // rod points right, so the boat always sits left of the float).
 const gap=2.5*worldUnit();
 let hx=clamp(x??rand(W*.28,W*.72),30,W-30);
 const bx=clamp(hx-gap,W*.18,W*.82);
 if(hx-bx<gap)hx=Math.min(W-30,bx+gap);
 hook.targetX=hx;hook.targetY=clamp(y??surface+(H-surface)*rand(.25,.67),surface+52*unit,H-75*unit);
 boat.target=bx;
 hook.x=boat.x+58*boat.scale;hook.y=boat.y-95*boat.scale;
 treasure=(saved.caught+1)%5===0;
 // The fish nearest the cast bites; the old every-3rd-catch override of the pick is gone.
 const available=fishes.filter(f=>!f.hidden);
 targetFish=available.length?available.reduce((best,f)=>Math.hypot(f.x-hook.targetX,f.y-hook.targetY)<Math.hypot(best.x-hook.targetX,best.y-hook.targetY)?f:best,available[0]):null;
 rewardFish=null;setPhase('casting');
}
function reel(){if(phase!=='bite')return;setPhase('reeling');soundEffect('cast');if(targetFish)targetFish.hidden=true;rewardFish=targetFish?{type:targetFish.type,size:targetFish.size}:null;}
function splash(x,y,n=12){
 ripples.push({x,y,age:0});
 for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-90,90)*unit,vy:rand(-160,-45)*unit,age:0,life:rand(.5,.9),size:rand(2,5)*unit,color:'#c9f6e7',gravity:230});
}
function confetti(x,y){
 if(reduceMotion)return;
 const colors=['#f6d673','#ef977c','#b3ddaf','#fff6dc','#89d4c8'];
 for(let i=0;i<36;i++)particles.push({x,y,vx:rand(-180,180)*unit,vy:rand(-220,-50)*unit,age:0,life:rand(1,1.9),size:rand(3,6)*unit,color:colors[i%5],gravity:160,confetti:true,rotation:rand(0,TAU)});
}
function award(){
 saved.caught++;
 const type=targetFish?.type??0,species=A.species[type],isNew=saved.counts[type]===0;
 saved.counts[type]++;saved.points+=species.points;
 let bonus=0;if(treasure){saved.treasures++;bonus=100;saved.points+=bonus;}
 persist();setUI();soundEffect(treasure?'treasure':'catch');
 $('toast-label').textContent=treasure?'A fish AND a treasure!':isNew?'A new ocean friend!':'A lovely little catch!';
 $('toast-name').textContent=treasure?'Treasure splash!':species.name;
 $('toast-points').textContent=treasure?'★ +'+(species.points+100)+' points · You found treasure!':'★ +'+species.points+' points'+(isNew?' · Added to your collection':' · Hello again, little friend!');
 $('catch-toast').classList.add('visible');toastUntil=time+3.1;
 $('announcer').textContent='You caught '+species.name+'! '+(treasure?'And a treasure chest! ':'')+saved.counts.filter(Boolean).length+' of 6 fish discovered.';
 floatTexts.push({x:boat.x+65*boat.scale,y:surface-35,text:'+'+(species.points+bonus),age:0});
 confetti(boat.x,surface-50);splash(boat.x+55*boat.scale,surface,20);
 if(targetFish){const f=targetFish;f.x=W*rand(.3,.7);f.baseY=surface+(H-surface)*rand(.3,.65);f.y=f.baseY;f.hidden=false;f.fade=0;}
 setPhase('reward');
 if(saved.counts.every(Boolean)&&isNew){$('toast-label').textContent='All 6 ocean friends found!';$('toast-name').textContent='Ocean explorer!';$('toast-points').textContent='Your little fish gallery is complete. Keep exploring!';toastUntil=time+4.5;}
 if(saved.caught===10){$('toast-label').textContent='A new corner of the ocean!';$('toast-name').textContent='Rainbow Reef';$('toast-points').textContent='A whole new sea of colour. Keep fishing!';}
}
function update(dt){
 time+=dt;phaseTime+=dt;
 // Watchdog: no phase can outlast its limit, so a catch always finishes.
 const limit={casting:2,waiting:4.5,bite:7.5,reeling:2,reward:3}[phase];
 if(limit&&phaseTime>limit){watchdog++;if(phase==='casting')setPhase('waiting');else if(phase==='waiting')setPhase('bite');else if(phase==='bite')reel();else if(phase==='reeling')award();else setPhase('idle');}
 boat.x=lerp(boat.x,boat.target,Math.min(1,dt*4));boat.y=surface+Math.sin(time*1.7)*2*unit;
 if(phase==='casting'){
  const p=clamp(phaseTime/.7,0,1),e=1-(1-p)**2;
  hook.x=lerp(boat.x+58*boat.scale,hook.targetX,e);hook.y=lerp(boat.y-95*boat.scale,hook.targetY,p);
  if(p>=1){splash(hook.x,surface);setPhase('waiting');}
 }else if(phase==='waiting'){
  hook.x=hook.targetX+Math.sin(time*2)*2;hook.y=hook.targetY+Math.sin(time*2.4)*3;
  if(targetFish){const dx=hook.x-targetFish.x,dy=hook.y-targetFish.y;targetFish.dir=dx>0?1:-1;targetFish.x+=dx*Math.min(1,dt*2.3);targetFish.y+=dy*Math.min(1,dt*2.3);if(phaseTime>1.1&&Math.hypot(dx,dy)<35*unit){setPhase('bite');soundEffect('bite');splash(hook.x,surface,6);}}
  else if(phaseTime>1.5){setPhase('bite');soundEffect('bite');}
 }else if(phase==='bite'){
  hook.x=hook.targetX+Math.sin(time*15)*4;hook.y=hook.targetY+Math.sin(time*12)*4;
  if(targetFish){targetFish.x=hook.x-12*targetFish.dir;targetFish.y=hook.y;}
  if(phaseTime>7)reel();
 }else if(phase==='reeling'){
  const p=clamp(phaseTime/.9,0,1);hook.x=lerp(hook.targetX,boat.x+52*boat.scale,p);hook.y=lerp(hook.targetY,boat.y-75*boat.scale,p*p);
  if(p>=1)award();
 }else if(phase==='reward'&&phaseTime>1.15){targetFish=null;rewardFish=null;treasure=false;setPhase('idle');}
 for(const f of fishes){
  if(f.hidden||f===targetFish&&['waiting','bite','reeling'].includes(phase))continue;
  f.x+=f.dir*f.speed*dt;f.y=f.baseY+Math.sin(time*.9+f.seed)*8*unit;f.fade=Math.min(1,(f.fade??1)+dt/.8);
  if(f.x>W+100)f.x=-90;if(f.x<-100)f.x=W+90;
 }
 for(const b of bubbles){b.y-=b.speed*dt;if(b.y<surface+12){b.y=H+5;b.x=rand(0,W);}}
 for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;}
 particles=particles.filter(p=>p.age<p.life);ripples.forEach(r=>r.age+=dt);ripples=ripples.filter(r=>r.age<1.3);floatTexts.forEach(f=>f.age+=dt);floatTexts=floatTexts.filter(f=>f.age<1.6);
 if(time>toastUntil)$('catch-toast').classList.remove('visible');
 sanitize();
}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function shape(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fill();}
function cloud(x,y,s,opacity=1){ctx.save();ctx.globalAlpha=opacity;ellipse(x,y,37*s,10*s,'#fffdf2');ellipse(x-17*s,y-6*s,20*s,12*s,'#fffdf2');ellipse(x+4*s,y-12*s,21*s,16*s,'#fffdf2');ellipse(x+25*s,y-4*s,17*s,10*s,'#fffdf2');ctx.restore();}
function island(x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 ellipse(0,3,103,7,'#5eac9877');shape([[-100,0],[-75,-15],[-30,-18],[14,-14],[61,-7],[89,0]],'#e5d6a0');
 shape([[-82,-10],[-59,-24],[-19,-26],[13,-16],[54,-9]],'#7caa82');
 // A tiny beach hut and palm tree.
 ctx.fillStyle='#cda476';ctx.fillRect(-34,-49,33,28);shape([[-42,-49],[-18,-67],[10,-49]],'#dc8661');ctx.fillStyle='#6e8d7c';ctx.fillRect(-27,-40,9,19);ctx.fillStyle='#f2dec0';ctx.fillRect(-13,-41,9,8);
 ctx.strokeStyle='#967953';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(39,-13);ctx.quadraticCurveTo(47,-48,39,-86);ctx.stroke();
 const leaves=[[-8,-101],[9,-116],[40,-111],[74,-103],[89,-82],[64,-77],[22,-81]];
 leaves.forEach(([a,b])=>{ctx.fillStyle='#548b70';ctx.beginPath();ctx.moveTo(39,-86);ctx.quadraticCurveTo((a+39)/2,b-13,a,b);ctx.quadraticCurveTo((a+39)/2,b+3,39,-86);ctx.fill();});
 ctx.restore();
}
function drawSky(){
 const sky=ctx.createLinearGradient(0,0,0,surface);sky.addColorStop(0,'#c9e8d9');sky.addColorStop(1,'#eef2d7');ctx.fillStyle=sky;ctx.fillRect(0,0,W,surface+2);
 const sunX=W*.76,sunY=surface*.42;
 ellipse(sunX,sunY,30*unit,30*unit,'#faf1be');ellipse(sunX,sunY,21*unit,21*unit,'#ffedac');
 cloud(W*.25+Math.sin(time*.03)*14,surface*.34,.9*unit,.75);cloud(W*.58+Math.sin(time*.035)*20,surface*.25,.65*unit,.55);cloud(W*.9,surface*.6,.6*unit,.45);
 // Distant, gently layered islands.
 ctx.fillStyle='#a6cbbb';ctx.beginPath();ctx.moveTo(0,surface-9);ctx.bezierCurveTo(W*.1,surface-12,W*.11,surface-40,W*.19,surface-26);ctx.bezierCurveTo(W*.25,surface-54,W*.28,surface-25,W*.39,surface-9);ctx.lineTo(W*.42,surface);ctx.lineTo(0,surface);ctx.fill();
 ctx.fillStyle='#b2d0bd';ctx.beginPath();ctx.moveTo(W*.74,surface);ctx.bezierCurveTo(W*.8,surface-13,W*.81,surface-37,W*.88,surface-23);ctx.bezierCurveTo(W*.94,surface-44,W*.95,surface-13,W,surface-10);ctx.lineTo(W,surface);ctx.fill();
 island(W*.13,surface-4,unit*.82);
 // Two birds, no urgency.
 ctx.strokeStyle='#739b8c';ctx.lineWidth=1.7;for(let i=0;i<3;i++){const bx=W*(.39+i*.06)+Math.sin(time*.3+i)*8,by=surface*(.36+i*.1);ctx.beginPath();ctx.moveTo(bx-5,by);ctx.quadraticCurveTo(bx-2,by-4-Math.sin(time*2+i),bx,by);ctx.quadraticCurveTo(bx+3,by-4-Math.sin(time*2+i),bx+7,by+1);ctx.stroke();}
}
function drawWater(){
 const water=ctx.createLinearGradient(0,surface,0,H);water.addColorStop(0,'#68c5bb');water.addColorStop(.1,'#55bbb3');water.addColorStop(.55,'#278e92');water.addColorStop(1,'#226c78');ctx.fillStyle=water;ctx.fillRect(0,surface,W,H-surface);
 // Sunbeams from the surface.
 ctx.save();ctx.beginPath();ctx.rect(0,surface,W,H-surface);ctx.clip();
 for(let i=0;i<6;i++){const x=W*(i*.22-.08)+Math.sin(time*.1+i)*10;const g=ctx.createLinearGradient(0,surface,0,H);g.addColorStop(0,'#e1f7b71d');g.addColorStop(1,'#ecfac900');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,surface);ctx.lineTo(x+W*.03,surface);ctx.lineTo(x+W*.23,H);ctx.lineTo(x+W*.06,H);ctx.fill();}
 ctx.strokeStyle='#bcecdc44';ctx.lineWidth=1.1;
 for(let row=0;row<4;row++){let y=surface+5+row*11;for(let x=-40;x<W;x+=100){const offset=Math.sin(time*.5+row)*13;ctx.beginPath();ctx.moveTo(x+offset,y);ctx.bezierCurveTo(x+14+offset,y-3,x+28+offset,y+3,x+52+offset,y);ctx.stroke();}}
 ctx.strokeStyle='#d7f2d4';ctx.globalAlpha=.45;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,surface);for(let x=0;x<=W+8;x+=8)ctx.lineTo(x,surface+Math.sin(x/40+time)*1.8);ctx.stroke();ctx.restore();
}
function drawReef(){
 const sandY=H-29*unit;
 ctx.fillStyle='#8bc6a137';ctx.beginPath();ctx.moveTo(0,sandY-15);ctx.bezierCurveTo(W*.25,sandY-38,W*.3,sandY+10,W*.5,sandY-8);ctx.bezierCurveTo(W*.72,sandY-35,W*.89,sandY-18,W,sandY-39);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
 const plantScale=unit*.8,reef=saved.caught>=10;
 A.drawSeaweed(ctx,W*.025,H-14,plantScale*1.25,time,'#388f83');A.drawSeaweed(ctx,W*.07,H-8,plantScale*.8,time+2,'#65a68f');
 A.drawSeaweed(ctx,W*.17,H-18,plantScale*.7,time+4,'#3e9581');A.drawSeaweed(ctx,W*.81,H-16,plantScale*.9,time+3,'#429d8f');A.drawSeaweed(ctx,W*.98,H,plantScale*1.5,time+1,'#398e80');
 A.drawCoral(ctx,W*.09,H-16,plantScale*.7,reef?'#ec9a9e':'#da9d8d');A.drawCoral(ctx,W*.89,H-16,plantScale*.95,reef?'#e499b3':'#c8ad8a');
 A.drawCoral(ctx,W*.95,H-20,plantScale*.5,'#d4c4a0');
 for(let i=0;i<11;i++){const x=(i*.141%1)*W,y=H-10-(i%3)*5*unit;ellipse(x,y,(7+i%4*3)*unit,3*unit,'#72b8a1');}
 drawStarfish(W*.33,H-15,8*unit,'#dba18d');drawStarfish(W*.69,H-12,6*unit,'#d1ba8b');
}
function drawStarfish(x,y,size,color){ctx.save();ctx.translate(x,y);ctx.rotate(.2);ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?size*.43:size,a=i*TAU/10-TAU/4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.restore();}
function drawChest(x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.rotate(Math.sin(time*3)*.08);
 const glow=ctx.createRadialGradient(0,0,5,0,0,53);glow.addColorStop(0,'#ffe4a766');glow.addColorStop(1,'#ffe4a700');ctx.fillStyle=glow;ctx.fillRect(-53,-53,106,106);
 ctx.fillStyle='#dca65f';ctx.strokeStyle='#946d3b';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-22,-15,44,33,5);ctx.fill();ctx.stroke();ctx.fillStyle='#bd8149';ctx.fillRect(-22,0,44,16);ctx.strokeStyle='#ffdc83';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12,-14);ctx.lineTo(-12,16);ctx.moveTo(12,-14);ctx.lineTo(12,16);ctx.stroke();ctx.fillStyle='#ffe5a0';ctx.fillRect(-5,-3,10,12);ctx.fillStyle='#91632f';ctx.fillRect(-1,1,3,5);
 for(let i=0;i<3;i++){const a=time+i*2;drawStarfish(Math.cos(a)*34,Math.sin(a)*29,4,'#ffe5a0');}ctx.restore();
}
function drawLine(){
 if(!['casting','waiting','bite','reeling'].includes(phase))return;
 const rodX=boat.x+58*boat.scale,rodY=boat.y-95*boat.scale;
 ctx.strokeStyle='#f8edd4bb';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(rodX,rodY);ctx.quadraticCurveTo((rodX+hook.x)/2,rodY+8,hook.x,hook.y);ctx.stroke();
 if(hook.y>surface){const ratio=(surface-rodY)/(hook.y-rodY),floatX=lerp(rodX,hook.x,ratio);ellipse(floatX,surface+3+Math.sin(time*3)*1.7,5*unit,3*unit,'#f3e8ce');ellipse(floatX,surface+Math.sin(time*3)*1.7,4*unit,5*unit,'#e47657');}
 ctx.strokeStyle='#e6d4ac';ctx.lineWidth=2*unit;ctx.beginPath();ctx.moveTo(hook.x,hook.y-4);ctx.lineTo(hook.x,hook.y+5);ctx.arc(hook.x-4*unit,hook.y+5,4*unit,0,Math.PI);ctx.stroke();
 if(phase==='reeling'&&rewardFish){A.drawFish(ctx,rewardFish.type,hook.x-13*unit,hook.y+13*unit,rewardFish.size,1,time,{glow:true});if(treasure)drawChest(hook.x+31*unit,hook.y+31*unit,.65*unit);}
}
function draw(){
 ctx.clearRect(0,0,W,H);drawSky();drawWater();
 // Soft little schools in the distance.
 ctx.save();ctx.globalAlpha=.17;for(let i=0;i<12;i++){let x=((i*113+time*(8+i%3*2))%(W+50))-25,y=surface+(H-surface)*(.15+(i%4)*.17);ellipse(x,y,7*unit,2.8*unit,'#d2f4de');shape([[x-5*unit,y],[x-13*unit,y-4*unit],[x-13*unit,y+4*unit]],'#d2f4de');}ctx.restore();
 drawReef();
 ctx.save();ctx.beginPath();ctx.rect(0,surface+10,W,H-surface-10);ctx.clip();
 for(const f of fishes){if(!f.hidden)A.drawFish(ctx,f.type,f.x,f.y,f.size,f.dir,time+f.seed,{alpha:(f.y>H-80?.83:1)*(f.fade??1)});}
 for(const b of bubbles){ctx.strokeStyle='#c1efe545';ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x+Math.sin(time+b.phase)*5,b.y,b.r*unit,0,TAU);ctx.stroke();ellipse(b.x+Math.sin(time+b.phase)*5-b.r*.25,b.y-b.r*.3,.8,.8,'#d9f5e477');}
 ctx.restore();
 if(hover&&phase==='idle'&&hover.y>surface+30){ctx.save();ctx.setLineDash([2,5]);ctx.strokeStyle='#eaffdf66';ctx.lineWidth=1;ctx.beginPath();ctx.arc(hover.x,hover.y,17+Math.sin(time*2)*2,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
 // Boat casts a little oval shadow and bobs on the surface.
 ellipse(boat.x,boat.y+14*unit,61*unit,6*unit,'#206f7022');A.drawBoat(ctx,boat.x,boat.y,boat.scale,time);drawLine();
 for(const r of ripples){ctx.strokeStyle=`rgba(224,255,221,${(1-r.age/1.3)*.6})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(r.x,r.y,10+r.age*45,2+r.age*9,0,0,TAU);ctx.stroke();}
 for(const p of particles){ctx.save();ctx.globalAlpha=clamp(1-p.age/p.life,0,1);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);if(p.confetti){ctx.rotate(p.rotation+p.age*3);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);}else{ctx.beginPath();ctx.ellipse(0,0,p.size*.65,p.size,0,0,TAU);ctx.fill();}ctx.restore();}
 for(const f of floatTexts){ctx.save();ctx.globalAlpha=clamp(1-f.age/1.6,0,1);ctx.font='700 '+(25*unit)+'px Georgia';ctx.textAlign='center';ctx.fillStyle='#fff4b9';ctx.fillText(f.text,f.x,f.y-f.age*35);ctx.restore();}
}
function loop(stamp){const dt=last?Math.min((stamp-last)/1000,.05):.016;last=stamp;if(!paused&&!document.hidden){update(dt);draw();}requestAnimationFrame(loop);}
function showCollection(){
 $('fish-grid').replaceChildren();
 A.species.forEach((s,i)=>{
  const unlocked=saved.counts[i]>0,card=document.createElement('div');card.className='fish-card'+(unlocked?'':' locked');
  const frame=document.createElement('div');frame.className='fish-frame';
  const pic=document.createElement('canvas');pic.width=280;pic.height=210;pic.setAttribute('aria-label',unlocked?s.name:'An undiscovered fish');pic.setAttribute('role','img');
  const c=pic.getContext('2d');c.fillStyle='#f4f0e3';c.fillRect(0,0,280,210);
  A.drawFish(c,i,148,108,105,1,0,{alpha:unlocked?1:.15});
  if(!unlocked){c.fillStyle='#849b89';c.font='600 32px Georgia';c.textAlign='center';c.fillText('?',146,118);}
  frame.append(pic);const name=document.createElement('h3');name.textContent=unlocked?s.name:'Who’s this?';const detail=document.createElement('p');detail.textContent=unlocked?'CAUGHT '+saved.counts[i]+' '+(saved.counts[i]===1?'TIME':'TIMES'):'WAITING TO SAY HELLO';card.append(frame,name,detail);$('fish-grid').append(card);
 });
 const count=saved.counts.filter(Boolean).length;$('gallery-progress').textContent=count===6?'All 6 friends found. You’re an ocean explorer!':count+' of 6 little friends discovered.';
 paused=true;dialog.showModal();$('close-dialog').focus();
}
function closeCollection(){dialog.close();}
dialog.addEventListener('close',()=>{paused=false;last=0;$('collection').focus();});
$('close-dialog').addEventListener('click',closeCollection);$('back-to-sea').addEventListener('click',closeCollection);
$('collection').addEventListener('click',showCollection);$('mission').addEventListener('click',showCollection);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCollection();}});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=canvas.getBoundingClientRect();cast(e.clientX-r.left,e.clientY-r.top);});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();hover={x:e.clientX-r.left,y:e.clientY-r.top};});canvas.addEventListener('pointerleave',()=>hover=null);
$('cast').addEventListener('click',()=>cast());
document.addEventListener('keydown',e=>{if(dialog.open)return;if(e.code==='Space'||e.code==='Enter'){if(e.repeat)return;if(e.target.tagName==='BUTTON'&&e.target.id!=='cast')return;if(e.target.tagName==='A')return;e.preventDefault();cast();}});
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');if(sound)soundEffect('cast');if(!sound&&audioCtx)audioCtx.suspend();});
// Test hook, only with ?debug=1: state probes and a fixed-step clock for the browser smoke test.
if(/[?&]debug=1(&|$)/.test(location.search))window.__legacy={
 state:()=>({phase,phaseTime,caught:saved.caught,W,H,sized,fish:fishes.length,nonFinite,watchdog,
  finite:finite(boat.x,boat.y,hook.x,hook.y,...fishes.flatMap(f=>[f.x,f.y])),boatToFloat:Math.abs(hook.targetX-boat.target)/worldUnit()}),
 cast:(x,y)=>cast(x,y),reel:()=>reel(),advance:s=>{for(let i=0;i<Math.round(s*60);i++)update(1/60);draw();return phase;}};
new ResizeObserver(resize).observe(canvas);setUI();resize();requestAnimationFrame(loop);
})();
