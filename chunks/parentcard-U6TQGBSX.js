import{a as L}from"./chunk-5U3ZILAG.js";var q=`.parent { position: absolute; inset: 0; z-index: 9; display: grid; place-items: center; background: #24364F73; pointer-events: auto; }
.parent-card {
  box-sizing: border-box; width: min(420px, calc(100% - 24px)); max-height: calc(100% - 24px); overflow: auto; padding: 18px 20px;
  border-radius: 18px; background: var(--cream); color: var(--ui-ink); box-shadow: -6px 8px 0 var(--shadow);
  font: 16px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-user-select: text; user-select: text;
}
.parent-card h2 { margin: 0 0 8px; font: 22px "Titan One", system-ui, sans-serif; }
.pc-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; border-bottom: 1px solid #E9D9BC; }
.pc-row input[type=range] { width: 55%; height: 40px; accent-color: var(--coral); }
.pc-row select { min-height: 40px; font: inherit; border-radius: 8px; border: 1px solid #D9C7A6; background: #fff; color: inherit; }
.pc-check { justify-content: flex-start; }
.pc-check input { width: 24px; height: 24px; accent-color: var(--coral); }
.pc-note { margin: 12px 0; font-size: 13px; opacity: .8; }
#ui .pc-done { width: 100%; min-height: 48px; border-radius: 12px; background: var(--coral); color: var(--cream); font: 20px "Titan One", system-ui, sans-serif; }
@media (max-height: 560px) {
  .parent-card { width: min(760px, calc(100% - 24px)); padding: 12px 18px; }
  .parent-card h2 { margin: 0 0 2px; font-size: 20px; }
  .pc-rows { display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px; }
  .pc-row { min-height: 44px; }
  .pc-note { margin: 6px 0 8px; font-size: 12px; }
  #ui .pc-done { min-height: 44px; }
}

/* ---------------------------------------------------------------- the parent corner: voices and the saved game */
.pc-sec { margin: 10px 0 0; padding: 8px 0 4px; border-bottom: 1px solid #E9D9BC; }
.pc-sec > summary, .rec-group > summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 600; }
.pc-sec h3 { margin: 4px 0; font-size: 16px; }
.pc-small { margin: 4px 0 8px; font-size: 14px; opacity: .85; }
.pc-btns { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; }
#ui .pc-btn { min-height: 44px; padding: 0 14px; border-radius: 10px; background: #fff; box-shadow: inset 0 0 0 2px #D9C7A6; font: 600 15px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ui-ink); }
#ui .pc-btn:active { background: #FFF3C4; }
.pc-msg { min-height: 1.3em; margin: 4px 0; font-size: 14px; }
.rec-group { border-top: 1px solid #F1E4CB; }
.rec-row { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 6px; min-height: 48px; }
.rec-text { font-size: 15px; }
#ui .rec-row .pc-btn { padding: 0 10px; font-size: 14px; }
#ui .rec-row.recording .rec-go { background: var(--coral); color: var(--cream); box-shadow: none; animation: baitglow .667s ease-in-out infinite alternate; }
.rec-row.has .rec-text::after { content: ' \\2713'; color: #2FA77A; }
`;var T=[{k:"sfx",label:"Sounds",type:"range"},{k:"music",label:"Music",type:"range"},{k:"voice",label:"Voice",type:"range"},{k:"captions",label:"Captions (the words the voice says)",type:"check"},{k:"reducedMotion",label:"Motion",type:"motion"},{k:"haptics",label:"Vibration (Android; off with less motion)",type:"check"}];function j(z,{setSetting:F,preview:b,close:h,audio:m=null,getSave:c=null,importSave:y=null}){L("fish-card-css",q);let n=document.createElement("div");n.className="parent",n.hidden=!0,n.innerHTML=`<div class="parent-card" role="dialog" aria-modal="true" aria-labelledby="pc-title">
    <h2 id="pc-title">Grown-ups</h2>
    <div class="pc-rows"></div>
    <details class="pc-sec pc-voice"><summary>Record your own voice</summary><div class="pc-voice-body"></div></details>
    <div class="pc-sec pc-save"><h3>Saved game</h3>
      <p class="pc-small">Keep the fish safe in a file, or take them to another device. Loading a file adds its fish to this game: nothing is lost.</p>
      <div class="pc-btns"><button type="button" class="pc-btn" data-act="export">Save to a file</button><button type="button" class="pc-btn" data-act="import">Load from a file</button></div>
      <input type="file" class="pc-file" accept=".json,application/json" hidden>
      <div class="pc-confirm" hidden><p class="pc-small pc-what"></p>
        <div class="pc-btns"><button type="button" class="pc-btn pc-yes">Add these fish</button><button type="button" class="pc-btn pc-no">Cancel</button></div></div>
      <p class="pc-msg pc-save-msg" role="status" aria-live="polite"></p></div>
    <p class="pc-note">The odds: about 1 fish in 20 is golden (1 in 10 with the Star Cookie), about 1 in 10 is GIANT, about 1 in 60
    is a rainbow fish, and about 1 catch in 8 brings a hitchhiker. Nothing can be lost or failed, and nothing is timed.</p>
    <p class="pc-note">Fish, fish! has no ads, purchases, accounts or tracking. Recordings and the saved game stay on this device.
    The Titan One font is used under the SIL Open Font License.</p>
    <button type="button" class="pc-done">Done</button></div>`,z.appendChild(n);let f=n.querySelector(".pc-rows"),v={};for(let e of T){let t=document.createElement("label");t.className="pc-row";let a=document.createElement("span");a.textContent=e.label;let o;if(e.type==="range")o=document.createElement("input"),o.type="range",o.min="0",o.max="1",o.step="0.05";else if(e.type==="check")o=document.createElement("input"),o.type="checkbox";else{o=document.createElement("select");for(let[I,O]of[["auto","Like this device"],["less","Less motion"],["full","Full motion"]]){let g=document.createElement("option");g.value=I,g.textContent=O,o.appendChild(g)}}o.dataset.k=e.k,e.type==="check"?(t.append(o,a),t.classList.add("pc-check")):t.append(a,o),f.appendChild(t),v[e.k]=o}let k=e=>e.type==="range"?Math.round(+e.value*100)/100:e.type==="checkbox"?e.checked:e.value==="auto"?null:e.value==="less";f.addEventListener("input",e=>{let t=e.target;t.type==="range"&&b&&b(t.dataset.k,k(t))}),f.addEventListener("change",e=>{let t=e.target;t.dataset.k&&F(t.dataset.k,k(t))});let l=n.querySelector(".pc-voice"),w=n.querySelector(".pc-voice-body"),s=null,x=null;(!m||!m.clips)&&(l.hidden=!0),l.addEventListener("toggle",()=>{!l.open||x||(x=import("./recorder-FM5E6GEO.js").then(e=>{s=e.createRecorder(w,m)},()=>{w.textContent="Recording is not available here."}))});let r=n.querySelector(".pc-save-msg"),d=n.querySelector(".pc-file"),p=n.querySelector(".pc-confirm"),S=null,i=null,u=()=>S||(S=import("./saveio-3QVDJCZJ.js"));c||(n.querySelector(".pc-save").hidden=!0),n.querySelector("[data-act=export]").addEventListener("click",async()=>{let e=await u();try{let t=e.downloadSave(c());r.textContent=`Saved as ${t}: ${e.saveSummary(c())}.`}catch{r.textContent="The file could not be made in this browser."}}),n.querySelector("[data-act=import]").addEventListener("click",()=>{p.hidden=!0,i=null,d.value="",d.click()}),d.addEventListener("change",async()=>{let e=d.files&&d.files[0];if(!e)return;let t="";if(e.size>256*1024){r.textContent="The file is too big to be a saved game.",p.hidden=!0,i=null;return}try{t=await e.text()}catch{t=""}await C(t)});async function C(e){let t=await u(),a=t.readSaveText(e);return a.ok?(i=a.save,n.querySelector(".pc-what").textContent=`In the file: ${t.saveSummary(a.save)}. In this game now: ${t.saveSummary(c())}. Together, every fish of both is kept.`,p.hidden=!1,r.textContent="",n.querySelector(".pc-yes").focus({preventScroll:!0}),!0):(r.textContent=a.why,p.hidden=!0,i=null,!1)}n.querySelector(".pc-yes").addEventListener("click",async()=>{if(!i)return;let e=await u(),t=e.mergeSaves(c(),i);i=null,p.hidden=!0;let a=!1;try{a=y?!!await y(t):!1}catch{a=!1}r.textContent=a?`Loaded: ${e.saveSummary(t)}. The game starts again with all the fish.`:"Loading is not possible here (the game cannot keep a save in this browser)."}),n.querySelector(".pc-no").addEventListener("click",()=>{i=null,p.hidden=!0,r.textContent=""});let E={};function A(){for(let e of T){let t=v[e.k],a=E[e.k];e.type==="range"?t.value=String(typeof a=="number"?a:1):e.type==="check"?t.checked=a!==!1:t.value=a==null?"auto":a?"less":"full"}}function R(e){n.hidden=!e,e?(A(),n.querySelector(".pc-done").focus({preventScroll:!0}),s&&s.reload()):s&&s.close()}return n.addEventListener("pointerdown",e=>{e.stopPropagation(),e.target===n&&h()}),n.querySelector(".pc-done").addEventListener("click",()=>h()),n.addEventListener("keydown",e=>{e.key==="Escape"&&h()}),{el:n,setOpen:R,set settings(e){E=e||{}},debug:{saveText:async()=>(await u()).saveText(c()),offer:C,confirm:()=>n.querySelector(".pc-yes").click(),get recorder(){return s},openVoice:()=>(l.open=!0,l.dispatchEvent(new Event("toggle")),x)}}}export{j as createCard};
