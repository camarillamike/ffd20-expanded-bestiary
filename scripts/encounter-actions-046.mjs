const scope="ffd20-expanded-bestiary",mark="ffd20-bestiary-builder",pending=Symbol("record qualifying use"),picked=Symbol("confirmed recipients"),locks=new Map();
const key=a=>a?.flags?.[mark]?.review046,karma=a=>["paleberry","tonberry"].includes(key(a));
function stamp(a,includeRound=true){
 const c=game.combat;if(!c?.started||!c.combatants.some(t=>t.actor?.uuid===a.uuid))return "manual";
 return c.id+(includeRound?":"+c.round:"");
}
function history(a,n,round=true){
 const s=a.flags?.[scope]?.[n],t=stamp(a,round);return s?.stamp===t?s:{stamp:t,used:0,foes:[]};
}
const band=a=>{const h=a.system.attributes.hp;return h.max>0?Math.min(4,Math.max(0,Math.floor(4*(h.max-h.value)/h.max))):0;};
const active=(a,f)=>a?.items.find(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&i.flags?.[scope]?.[f]);
const natural=i=>i?.type==="attack"&&(i.system.subType==="natural"||/^unarmed strike$/i.test(i.name));
const fangPatched=new WeakSet();
function enableFang(i){
 const action=i.actions?.first?.()??[...(i.actions??[])][0];if(!action)return;
 let p=Object.getPrototypeOf(action);while(p&&!Object.hasOwn(p,"enhancementBonus"))p=Object.getPrototypeOf(p);
 if(!p||fangPatched.has(p))return;const d=Object.getOwnPropertyDescriptor(p,"enhancementBonus");if(!d.configurable||!d.get)return;
 Object.defineProperty(p,"enhancementBonus",{...d,get(){
  const original=d.get.call(this),w=this.item;if(!natural(w)||!w.actor)return original;
  const bonus=[...w.actor.items].reduce((value,b)=>{const f=b.flags?.[scope];return b.type==="buff"&&b.system.active&&!b.system.disabled&&(f?.bestialFang046===1||f?.bestialFang046===2&&f.weaponId===w.id)?Math.max(value,f.bestialFang046):value;},0);
  return bonus?Math.max(Number(original)||0,bonus):original;
 }});fangPatched.add(p);
}
const esuna=new Set("blind charmed cowering dazed dazzled deaf disease entangled exhausted fatigued frightened immobilized nauseated panicked paralyzed petrified poison sapped shaken sickened silenced sleep slow staggered".split(" "));
function extendible(a){
 return a?.appliedEffects?.filter(e=>!e.disabled&&[...e.statuses].length&&(e.duration?.seconds>0||e.duration?.rounds>0))??[];
}
Hooks.once("ready",()=>{
 if(game.system.id!=="ffd20")return;
 const p=CONFIG.Actor.documentClass.prototype,original=p.getRollData;p.getRollData=function(...args){
  const data=original.apply(this,args);if(karma(this))return {...data,bestiaryKarmaBonus:history(this,"karmaRound").used+1};return data;
 };
 const proto=CONFIG.Item.documentClass.prototype,use=proto.use;
 const prepare=p.prepareDerivedData;p.prepareDerivedData=function(...args){
  if(key(this)!=="vampire"||!active(this,"gaseous046"))return prepare.apply(this,args);
  const attr=this.system.attributes,prior=attr.naturalAC,armor=this.items.filter(i=>i.type==="equipment"&&i.system.equipped&&["armor","shield"].includes(i.system.equipmentType));
  // Ignore physical defenses only for native preparation. No document writes, and force bonuses still participate normally.
  try{attr.naturalAC=0;for(const i of armor)i.system.equipped=false;
   attr.speed.fly.maneuverability="perfect";return prepare.apply(this,args);
  }finally{attr.naturalAC=prior;for(const i of armor)i.system.equipped=true;}
 };
 proto.use=function(options={}){
  if(natural(this)&&this.actor&&active(this.actor,"bestialFang046"))enableFang(this);
  const power=this.system?.subType==="power"||/\bpower (?:staff|rod|bow)\b/i.test([this.name,...(this.system?.baseTypes??[])].join(" "));
  if(this.actor&&["attack","weapon"].includes(this.type)&&!power&&this.system?.abilityType!=="su"&&options.options?.fullAttack!==false&&active(this.actor,"haste046")&&options.options?.haste===undefined)
   options={...options,options:{...options.options,haste:true}};
  return use.call(this,options);
 };
});
Hooks.on("pf1PreActionUse",use=>{
 const a=use.actor,i=use.item,x=use.action;
 if(!a?.isOwner||i?.actor!==a)return;
 const stop=m=>{ui.notifications.warn(m);return false;};
 if(key(a)==="vampire"&&active(a,"gaseous046")){
  const c=i.system.components??{};
  if(["attack","weapon"].includes(i.type)||i.system.abilityType==="su"&&i.name!=="Gaseous Form"||i.type==="spell"&&(c.verbal||c.somatic||c.material||c.focus))return stop("This action is unavailable in gaseous form.");
 }
 if(key(a)==="cie-th-edimmu"&&i.flags?.[scope]?.remorse046)use[picked]=[...game.user.targets];
 if(key(a)==="ghidra"){
  const n=Number(a.items.find(i=>i.system.tag==="hydraHeads")?.system.uses?.value),held=a.items.filter(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&i.flags?.[scope]?.bulwark046),remaining=n-2*held.length;
  if(i.type==="feat"&&i.flags?.[scope]?.bulwark046&&(remaining<2||held.some(b=>b.flags[scope].bulwark046===i.flags[scope].bulwark046)))return stop("Two free heads are required for that bulwark.");
  if((i.type==="attack"&&i.name==="Bite x5"&&(use.shared?.fullAttack?1+(x.extraAttacks?.manual?.length??0):1)>remaining)||(/^Breath: /.test(i.name)&&remaining<1))return stop("Too few uncommitted heads; choose a smaller routine.");
 }
 const stash=(name,s)=>{const id=a.uuid+"/"+name,old=locks.get(id);if(old&&Date.now()-old<30000)return stop("Finish the previous use first.");locks.set(id,Date.now());use[pending]={name,s,id};};
 if(karma(a)&&i.flags?.[scope]?.karma046&&x.activation.type==="free"){
  const ids=[...game.user.targets].map(t=>t.document.uuid),s=history(a,"karmaRound");
  if(ids.length!==1)return stop("Target exactly the assailant that damaged this creature in this round.");
  if(s.foes.includes(ids[0])||s.used>=Math.max(0,a.system.abilities.dex.mod))return stop("Karma exhausted for this assailant or round.");
  return stash("karmaRound",{...s,used:s.used+1,foes:[...s.foes,ids[0]]});
 }
 if(key(a)==="calcabrina"&&i.flags?.[scope]?.dollhouse046){
  const s=history(a,"dollhouse",false);if(s.used>=band(a))return stop("No unused quarter-HP threshold has been reached.");
  return stash("dollhouse",{...s,used:s.used+1});
 }
});
Hooks.on("pf1PostActionUse",async use=>{
 const a=use.actor;if(!a?.isOwner||use.item?.actor!==a)return;
 const q=use[pending];if(q){try{await a.setFlag(scope,q.name,q.s);}finally{locks.delete(q.id);}return;}
 if(use.item.type==="buff"&&use.item.flags?.[scope]?.bestialFang046===2&&use.action.name==="Choose natural weapon or unarmed strike"){
  const items=a.items.filter(natural),opts=items.map(i=>{const el=document.createElement("option");el.value=i.id;el.textContent=i.name;return el.outerHTML;}).join("");
  if(!items.length){ui.notifications.warn("This recipient has no natural or unarmed attack items.");return;}
  const id=await foundry.applications.api.DialogV2.wait({window:{title:"Bestial Fang"},content:'<label>Enhanced attack <select name="weapon">'+opts+'</select></label>',
   buttons:[{action:"choose",label:"Choose",callback:(_e,b)=>b.form.elements.weapon.value},{action:"cancel",label:"Cancel",callback:()=>null}],rejectClose:false});
  if(items.some(i=>i.id===id))await use.item.setFlag(scope,"weaponId",id);
 }
 if(key(a)==="sidhe"&&use.item.flags?.[scope]?.esuna046){
  const before=[...a.statuses].filter(v=>esuna.has(v));
  for(const cond of before)await a.toggleStatusEffect(cond,{active:false});
  const removed=before.filter(s=>!a.statuses.has(s));
  if(!removed.length){
   const grant=a.items.find(i=>i.type==="buff"&&i.name==="Summer Breeze: recovery");
   const ok=await foundry.applications.api.DialogV2.confirm({window:{title:"Summer Breeze"},content:"No registered condition was removed. Confirm that Esuna did not remove any custom effect (including Deprotect, Deshell or Imperil) before starting three rounds of fast healing."});
   if(grant&&ok)await grant.update({"system.active":true,"system.duration.start":game.time.worldTime});
  }
 }
 if(key(a)==="cie-th-edimmu"&&use.item.flags?.[scope]?.remorse046&&use.action.name==="Extend confirmed recipient effect"){
  const targets=use[picked]??[],recipient=targets.length===1?targets[0].actor:null;
  if(!recipient?.isOwner){ui.notifications.warn("Select one recipient whose effects you can manage.");return;}
  const rows=extendible(recipient);if(!rows.length){ui.notifications.warn("No active timed status on this recipient.");return;}
  const options=rows.map((e,j)=>{const o=document.createElement("option");o.value=j;o.textContent=e.name;return o.outerHTML;}).join("");
  const j=await foundry.applications.api.DialogV2.wait({window:{title:"Tears of Remorse"},content:'<label>Confirm this edimmu inflicted this status <select name="status">'+options+'</select></label>',
   buttons:[{action:"extend",label:"Extend one round",callback:(_e,button)=>Number(button.form.elements.status.value)},{action:"cancel",label:"Cancel",callback:()=>null}],rejectClose:false});
  const e=Number.isInteger(j)&&rows[j];if(e&&!e.disabled){const d=e.duration,delta=d.rounds>0?{"duration.rounds":d.rounds+1}:{"duration.seconds":d.seconds+(CONFIG.time?.roundTime||6)};await e.update(delta);}
 }
 if(key(a)==="ghidra"&&use.item.type==="feat"&&use.item.flags?.[scope]?.bulwark046){
  const b=a.items.find(s=>s.type==="buff"&&s.flags?.[scope]?.bulwark046===use.item.flags[scope].bulwark046);
  if(b)await b.update({"system.active":true});
 }
 if(karma(a)&&use.item.flags?.[scope]?.karma046&&use.action.name==="New round outside combat"&&stamp(a)==="manual")await a.setFlag(scope,"karmaRound",{stamp:"manual",used:0,foes:[]});
 const b=use.item,f=b.flags?.[scope];if(b.type!=="buff"||!b.system.active||b.system.disabled||!f?.reraise046)return;
 if(f.temporaryFloatFeet===2&&use.action.name==="End Float after a fall"){await b.update({["flags."+scope+".floatEnded"]:true});return;}
 if(use.action.name!=="Resolve Reraise")return;
 if(f.reraiseSpent||!a.statuses.has("dead")){ui.notifications.warn("Reraise requires an eligible dead recipient and an unspent effect.");return;}
 await b.update({["flags."+scope+".reraiseSpent"]:true});await a.update({"system.attributes.hp.value":1});
 if(a.statuses.has("dead"))await a.toggleStatusEffect("dead",{active:false});
});
Hooks.on("updateItem",async(i,delta,_opts,user)=>{
 if(user!==game.user.id||!i.actor?.isOwner||i.type!=="buff"||!i.flags?.[scope]?.reraise046||delta.system?.active!==true)return;
 const reset={};for(const k of ["reraiseSpent","floatEnded"])if(i.flags[scope][k])reset["flags."+scope+"."+k]=false;
 if(Object.keys(reset).length)await i.update(reset);
});
Hooks.on("updateActor",async(a,d,_opts,user)=>{
 if(user!==game.user.id||key(a)!=="calcabrina"||!a.isOwner||!Number.isFinite(d.system?.attributes?.hp?.value)||stamp(a,false)!=="manual")return;
 if(!band(a)&&history(a,"dollhouse",false).used&&a.system.attributes.hp.value>=a.system.attributes.hp.max)await a.unsetFlag(scope,"dollhouse");
});
