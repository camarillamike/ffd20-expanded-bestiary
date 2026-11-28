import {methodOwner} from "./document-methods.mjs";
const scope="ffd20-expanded-bestiary",builder="ffd20-bestiary-builder";
const elements=["earth","fire","light","ice","lightning","dark","water","wind"];
const marked=(i,k)=>i?.flags?.[scope]?.[k];
const compoundKeys=new Set(["chaos","exdeath-tree-form","the-light-emperor","the-dark-emperor"]);
export function group1DRRows(app,actor,rows){
 if(!compoundKeys.has(actor.flags?.[builder]?.review051))return rows;
 // Native ApplyDamage enriches from type0/type1 only. Restore the third
 // printed alignment on the same row: never charge DR once per qualifier.
 const rule=actor.system.traits.dr.value.find(d=>!d.operator&&d.types?.length===3);
 if(!rule)return rows;
 return rows.map(r=>{
  if(!r.isDR||r.operator||r.amount!==rule.amount||!r.typeIds?.has(rule.types[0])||!r.typeIds.has(rule.types[1]))return r;
  const needed=new Set(rule.types),common=new Set(app.materials??[]);if(app.isMagic)common.add("magic");
  const active=app.hasPhysical&&app.instances.some(i=>!rule.types.every(t=>common.has(t)||Array.from(i.types??[]).includes(t)));
  return {...r,types:[...needed],typeIds:needed,active,disabled:!active,label:r.amount+"/"+rule.types.join(" and ")};
 });
}
// Work on native per-recipient dialog rows, never persisted actor resistances.
// Each preview starts fresh from the unmodified native rows (including third-party changes).
export function group1ResistanceRows(app,actor,rows){
 const modifiers=Array.from(actor.items??[]).filter(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&marked(i,"group1ER051"));
 if(!modifiers.length)return rows;
 const out=rows.slice();
 for(const type of [...elements,"nonelemental"]){
  if(!app.instances.some(i=>Array.from(i.types??[]).includes(type)))continue;
  const ix=out.findIndex(r=>r.isER&&r.typeIds?.size===1&&r.typeIds.has(type));
  const base=ix<0?0:out[ix].amount;
  let bonus=0,floor=0,penalty=0;
  for(const i of modifiers){
   const f=marked(i,"group1ER051");if(!f.types.includes(type))continue;
   if(f.add)bonus+=f.add*(f.stacks?Math.max(0,Number(i.system.uses?.value)||0):1);
   if(f.minimum)floor=Math.max(floor,f.minimum);
   if(f.reduce)penalty=Math.max(penalty,f.reduce);
  }
  const amount=Math.max(0,Math.max(floor,base+bonus)-penalty);
  if(amount===base)continue;
  if(ix>=0)out[ix]={...out[ix],amount,value:amount};
  else if(amount>0){
   out.push({...actor._parseResistanceEntry({amount,types:[type],operator:true},"eres"),value:amount,active:true,visible:true,disabled:false,typeIds:new Set([type]),types:[type],hasGeneric:false});
   app.resistanceIds.add(type);
  }
 }
 return out;
}
const fieldClock="machineClock051",receipt=Symbol("Machine field"),ordinaryValue=Symbol("Machine ordinary damage");
const pending=new WeakMap();
function serial(actor,fn){
 const next=(pending.get(actor)??Promise.resolve()).catch(()=>{}).then(fn);pending.set(actor,next);
 return next.finally(()=>{if(pending.get(actor)===next)pending.delete(actor);});
}
function machineField(a){
 const items=Array.from(a?.items??[]);
 const normal=items.find(i=>i.type==="feat"&&i.system.tag==="force-field"&&!i.system.disabled&&marked(i,"machineField051")==="normal");
 if(!normal)return;
 return items.find(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&marked(i,"machineField051")==="barrier")??normal;
}
function now(a){
 const c=game.combat?.started&&game.combat.combatants.some(t=>t.actor?.uuid===a.uuid)?game.combat:null;
 return {at:game.time.worldTime,combat:c?.id??null,round:c?.round??0};
}
function fieldState(a,i){
 const barrier=i.type==="buff",cap=barrier?540:270,rate=cap/10,t=now(a),old=marked(i,fieldClock)??t;
 const existing=Math.min(cap,Math.max(0,Number(i.system.uses.value)||0));
 if(!barrier&&old.offlineUntil)return {cap,value:t.at>=old.offlineUntil?cap:0,stamp:t.at>=old.offlineUntil?t:old};
 const seconds=CONFIG.time?.roundTime||6,elapsed=Math.floor(Math.max(0,t.at-old.at)/seconds);
 const rounds=Math.max(elapsed,t.combat&&t.combat===old.combat?t.round-old.round:0);
 if((!barrier&&!existing)||!rounds||existing===cap)return {cap,value:existing,stamp:old};
 return {cap,value:Math.min(cap,existing+rounds*rate),stamp:{...t,at:elapsed>=rounds?old.at+rounds*seconds:t.at}};
}
const persist=(i,value,stamp)=>i.update({"system.uses.value":value,["flags."+scope+"."+fieldClock]:stamp});
function ordinary(o){
 if(!o||!(o.isCritical||o.critMult>1))return;
 const rolls=o.message?.systemRolls?.attacks?.[o.attackIndex]?.damage;
 if(!rolls?.length||!rolls.every(r=>Number.isFinite(r.total)&&r.damageType))return;
 return {value:rolls.reduce((n,r)=>n+r.total,0),instances:rolls.map(r=>Object.assign(new ffd20.models.action.DamagePartModel(r.damageType.toObject()),{value:r.total}))};
}
export function installMachineField(){
 const p=ffd20.applications.ApplyDamage.prototype,refresh=p._refreshTarget,options=p._getTargetDamageOptions;
 function preview(app,t){
  if(app.isHealing||app.asManaDamage)return;
  const i=machineField(t.actor);if(i&&fieldState(t.actor,i).value)return ordinary(app.options);
 }
 p._refreshTarget=function(id){
  const base=preview(this,this.targets.get(id));if(!base)return refresh.call(this,id);
  const saved=this.instances.slice(),v=this.value;
  try{this.instances.splice(0,this.instances.length,...base.instances);this.value=base.value;return refresh.call(this,id);}
  finally{this.instances.splice(0,this.instances.length,...saved);this.value=v;}
 };
 p._getTargetDamageOptions=function(t){
  if(machineField(t.actor))this._refreshTarget(t.uuid);
  const out=options.call(this,t),base=preview(this,t);
  if(base)out[ordinaryValue]=base.value+(this.bonus||0);
  return out;
 };
 const proto=methodOwner(CONFIG.Actor,"npc","applyDamage"),apply=proto.applyDamage;
 proto.applyDamage=function(value,opts={}){
  if(value<=0||opts.asManaDamage||!this.isOwner||!machineField(this))return apply.call(this,value,opts);
  return serial(this,async()=>{
   const i=machineField(this);if(!i)return apply.call(this,value,opts);
   const s=fieldState(this,i),r={available:s.value,used:0};
   if(s.value){
    const base=Number.isFinite(opts[ordinaryValue])?{value:opts[ordinaryValue]}:ordinary(opts);
    if(base){value=base.value;opts={...opts,...(base.instances?{instances:base.instances}:{}),isCritical:false,critMult:0};}
   }
   const result=await apply.call(this,value,{...opts,[receipt]:r});
   const left=s.value-r.used;
   if(r.used||left!==i.system.uses.value){
    const stamp=s.value===s.cap?now(this):{...s.stamp};
    if(!left&&i.type==="feat"&&r.used)stamp.offlineUntil=game.time.worldTime+86400;
    await persist(i,left,stamp);
   }
   return r.used?this:result;
  });
 };
 Hooks.on("pf1ApplyDamage",(a,o)=>{
  const r=o[receipt];if(!r||o.value<=0||o.asManaDamage)return;
  r.used=Math.min(r.available,Math.max(0,Math.floor(o.value*o.ratio)-o.reduction));o.reduction+=r.used;
 });
 Hooks.on("preUpdateItem",(i,change)=>{
  if(marked(i,"machineField051")!=="barrier"||i.system.active||!(change.system?.active??change["system.active"]))return;
  if(!machineField(i.actor)||i.actor.system.attributes.hp.value>=692){
   ui.notifications.warn("Machine can activate Barrier only below 692 HP.");return false;
  }
  foundry.utils.setProperty(change,"system.uses.value",540);
  foundry.utils.setProperty(change,"flags."+scope+"."+fieldClock,now(i.actor));
 });
 async function recover(actors){
  if(!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
  for(const a of new Set(actors)){if(!machineField(a))continue;
   await serial(a,async()=>{const i=machineField(a);if(!i)return;
    const s=fieldState(a,i);if(s.value!==i.system.uses.value)await persist(i,s.value,s.stamp);
   });
  }
 }
 Hooks.on("updateCombat",(c,d)=>{if("round" in d)return recover(Array.from(c.combatants,t=>t.actor));});
 Hooks.on("updateWorldTime",()=>recover([...game.actors,...(canvas.tokens?.placeables??[]).map(t=>t.actor)]));
}
if(globalThis.Hooks)Hooks.once("ready",()=>{
 if(game.system.id!=="ffd20")return;
 installMachineField();
 const p=ffd20.applications.ApplyDamage.prototype,original=p.getResistances;
 p.getResistances=function(actor,kind="dr"){const rows=original.call(this,actor,kind);return kind==="eres"?group1ResistanceRows(this,actor,rows):kind==="dr"?group1DRRows(this,actor,rows):rows;};
});
