import {methodOwner} from "./document-methods.mjs";
const scope="ffd20-expanded-bestiary",clock="forceFieldClock",receipt=Symbol("field consumption"),queue=new WeakMap();
const inertReceipt=Symbol("inertial barrier use");
const inertialKeys={pneumaflayer:[30,"Inertial Barrier","spell"],"cie-th-ispusteke":[60,"Inertial Barrier II","feat"],"cie-th-raktavija":[100,"Inertial Barrier III","feat"]};
const key=a=>a?.flags?.["ffd20-bestiary-builder"]?.review046;
const mist=a=>a?.flags?.["ffd20-bestiary-builder"]?.review046==="vampire"&&a.items.some(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&i.flags?.[scope]?.gaseous046);
function inertial(a){
 const profile=inertialKeys[key(a)];if(!profile)return;
 return a.items.find(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&i.flags?.[scope]?.inertialCapacity046===profile[0]);
}
const fieldKeys={ganymede:[85,13],io:[90,18],"pluto-armor":[100,20],"killing-machine":[100,20],deathmask:[240,24],
 "obliterator-mk-i":[100,20],"obliterator-mk-ii":[100,20],gamma:[140,28]};
const limits=a=>{
 const key=a?.flags?.["ffd20-bestiary-builder"]?.review046;
 if(key==="deathmask"&&a.system?.attributes?.hd?.total>0)return [10*a.system.attributes.hd.total,24];
 return fieldKeys[key];
};
function field(a){
 const cap=limits(a)?.[0];if(!cap)return;
 const extreme=a.flags["ffd20-bestiary-builder"].review046==="deathmask";
 const tags=extreme?["extreme-force-field","extremeforcefield"]:["force-field","forcefield"];
 return [...a.items].find(i=>i.type==="feat"&&!i.system.disabled&&tags.includes(i.system.tag)&&
   (extreme?i.system.uses?.maxFormula==="10 * @attributes.hd.total":Number(i.system.uses?.maxFormula)===cap));
}
function snapshot(a,i){
 const [cap,rate]=limits(a);const existing=Number(i.system.uses.value),last=i.getFlag(scope,clock)??{},now=game.time.worldTime;
 const combat=game.combat?.started&&game.combat.combatants.some(c=>c.actor?.uuid===a.uuid)?game.combat:null;
 const stamp={at:now,combat:combat?.id??null,round:combat?.round??0};
 if(!Number.isFinite(now))return {value:existing,stamp:last};
 if(last.offlineUntil>now)return {value:0,stamp:last};
 if(last.offlineUntil&&last.offlineUntil<=now)return {value:cap,stamp};
 if(!existing||existing>=cap||!Number.isFinite(last.at))return {value:existing,stamp};
 const seconds=CONFIG.time?.roundTime||6,byTime=Math.floor(Math.max(0,now-last.at)/seconds);
 const rounds=Math.max(byTime,combat?.id&&last.combat===combat.id?Math.max(0,combat.round-last.round):0);
 if(!rounds)return {value:existing,stamp:last};
 return {value:Math.min(cap,existing+rounds*rate),stamp:{...stamp,at:byTime>=rounds?last.at+rounds*seconds:now}};
}
const bypass=o=>{const i=o.action?.item;return /\b(?:laser rifle|laser pistol)\b/i.test(i?.name??"")||
 (i?.name==="Integrated Rifle"&&["obliterator-mk-i","obliterator-mk-ii"].includes(key(i.actor)));};
function ordinary(o){
 const rolls=o.message?.systemRolls?.attacks?.[o.attackIndex]?.damage;
 if(!(o.isCritical||o.critMult>1)||!rolls?.length||!rolls.every(r=>Number.isFinite(r.total)&&r.damageType))return null;
 return {value:rolls.reduce((n,r)=>n+r.total,0),instances:rolls.map(r=>Object.assign(new ffd20.models.action.DamagePartModel(r.damageType.toObject()),{value:r.total}))};
}
function serial(a,fn){
 const work=(queue.get(a)??Promise.resolve()).catch(()=>{}).then(fn);queue.set(a,work);
 return work.finally(()=>{if(queue.get(a)===work)queue.delete(a);});
}
async function persist(i,n,stamp){await i.update({"system.uses.value":n,["flags."+scope+"."+clock]:stamp});}
Hooks.once("ready",()=>{
 if(game.system.id!=="ffd20")return;
 const p=ffd20.applications.ApplyDamage.prototype,refresh=p._refreshTarget,options=p._getTargetDamageOptions;
 p._refreshTarget=function(id){
  const t=this.targets.get(id),i=field(t.actor),o=this.options;
  if(this.isHealing||this.asManaDamage||(!mist(t.actor)&&(!i||bypass(o)||!snapshot(t.actor,i).value)))return refresh.call(this,id);
  const base=ordinary(o);if(!base)return refresh.call(this,id);
  // The dialog is shared by all recipients. Substitute only during this target's native calculation.
  const saved=this.instances.slice(),v=this.value;
  try{this.instances.splice(0,this.instances.length,...base.instances);this.value=base.value;
   return refresh.call(this,id);
  }finally{this.instances.splice(0,this.instances.length,...saved);this.value=v;}
 };
 p._getTargetDamageOptions=function(t){
  const i=field(t.actor),gas=mist(t.actor);if(i||gas)this._refreshTarget(t.uuid);
  const out=options.call(this,t);
  if(i&&!this.isHealing&&!this.asManaDamage&&!bypass(this.options)&&snapshot(t.actor,i).value){
   const base=ordinary(this.options);if(base)out.bestiaryFieldOrdinary=base.value+(this.bonus||0);
  }
  if(gas&&!this.isHealing&&!this.asManaDamage){const base=ordinary(this.options);if(base)out.bestiaryMistOrdinary=base.value+(this.bonus||0);}
  return out;
 };
 const proto=methodOwner(CONFIG.Actor,"npc","applyDamage"),apply=proto.applyDamage;
 proto.applyDamage=function(value,opts={}){
  if(mist(this)&&value>0&&!opts.asManaDamage){
   const base=!opts.dialog&&ordinary(opts);if(base){value=base.value;opts={...opts,instances:base.instances,isCritical:false,critMult:0};}
   else if(Number.isFinite(opts.bestiaryMistOrdinary))value=opts.bestiaryMistOrdinary;
  }
  if(inertial(this)&&this.isOwner&&value>0&&!opts.asManaDamage)return serial(this,async()=>{
   const pool=inertial(this),r={used:0};const result=await apply.call(this,value,{...opts,[inertReceipt]:r});
   if(r.used&&pool){const left=Math.max(0,Number(pool.system.uses.value)-r.used);
    await pool.update({"system.uses.value":left,...(!left?{"system.active":false}:{})});}
   return r.used?this:result;
  });
  const i=field(this);
  if(!i||!this.isOwner||value<=0||opts.asManaDamage||bypass(opts))return apply.call(this,value,opts);
  return serial(this,async()=>{
   const s=snapshot(this,i),r={used:0,available:s.value};
   const base=s.value&&!opts.dialog?ordinary(opts):null;
   if(base){value=base.value;opts={...opts,instances:base.instances,isCritical:false,critMult:0};}
   else if(s.value&&Number.isFinite(opts.bestiaryFieldOrdinary))value=opts.bestiaryFieldOrdinary;
   const res=await apply.call(this,value,{...opts,[receipt]:r});
   const left=s.value-r.used;
   if(r.used||left!==i.system.uses.value){
    const stamp=left?s.stamp:{...s.stamp,offlineUntil:game.time.worldTime+86400};
    if(left&&s.value===limits(this)[0])Object.assign(stamp,{at:game.time.worldTime});
    await persist(i,left,stamp);
   }
   return r.used?this:res;
  });
 };
 // Register after the module-load damage hooks: absorption, healing and native
 // reductions must have their final values before a shield spends capacity.
 Hooks.on("pf1ApplyDamage",spendShield);
});
function spendShield(a,o){
 const pool=inertial(a),energy=o.bestiaryInertialEnergy;
 if(pool&&o[inertReceipt]&&energy>0&&o.value>0&&!o.asManaDamage){
  const applied=Math.min(energy,Number(pool.system.uses.value),Math.max(0,Math.floor(o.value*o.ratio)-o.reduction));
  o[inertReceipt].used=applied;o.reduction+=applied;
 }
 const r=o[receipt];if(!r?.available||o.value<=0||o.asManaDamage)return;
 const hit=Math.max(0,Math.floor(o.value*o.ratio)-o.reduction);r.used=Math.min(r.available,hit);o.reduction+=r.used;
}
Hooks.on("pf1ApplyDamageTargetOptions",(app,t,o)=>{
 if(!app.isHealing&&!app.asManaDamage&&inertial(t.actor))o.bestiaryInertialEnergy=t.instances.filter(i=>i.isEnergy&&!i.isPhysical&&i.total>0).reduce((n,i)=>n+i.total,0);
});
Hooks.on("pf1PostActionUse",async use=>{
 const a=use.actor;
 const [cap,name,type]=inertialKeys[key(a)]??[];
 if(!cap||!a.isOwner||use.item?.name!==name||use.item.type!==type)return;
 const pool=a.items.find(i=>i.type==="buff"&&!i.system.disabled&&i.flags?.[scope]?.inertialCapacity046===cap);
 if(pool)await pool.update({"system.active":true,"system.uses.value":cap});
});
async function recover(combat){
 if(!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
 const actors=new Set(combat?.combatants?[...combat.combatants].map(c=>c.actor):[...game.actors,...(canvas.tokens?.placeables??[]).map(t=>t.actor)]);
 for(const a of actors){const i=field(a);if(i&&i.system.uses.value<limits(a)[0])await serial(a,async()=>{
  const s=snapshot(a,i);if(s.value!==i.system.uses.value)await persist(i,s.value,s.stamp);
 });}
}
Hooks.on("updateCombat",(combat,changes)=>{if("round" in changes)return recover(combat);});
Hooks.on("updateWorldTime",()=>recover());
