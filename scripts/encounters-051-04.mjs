import {methodOwner} from "./document-methods.mjs";

const builder="ffd20-bestiary-builder",scope="ffd20-expanded-bestiary";
const omega="omega-weapon",kaiser="kaiser-dragon-dragon-s-den";
const key=a=>a?.flags?.[builder]?.review051;
const named=(a,n)=>a.items.find(i=>i.name===n);
const live=i=>i?.type==="buff"&&i.system.active&&!i.system.disabled;
const active=(a,n)=>live(named(a,n));
const burstNames=["Earthern Rage","Life Force","Heavenly Protection","Frostbite","Runic Guard","Phase Link","Deathly Presence","Reflective","Misty Advantage","Emperor's Will"];
function forms(a){return Array.from(a.items).filter(i=>live(i)&&i.name.startsWith("Barrier Shift: ")).map(i=>i.name==="Barrier Shift: Last Form"?"last":i.flags?.[scope]?.affinity051?.absorb?.[0]);}
function price(a,i){return i.flags?.[builder]?.mpCost051?(key(a)===kaiser&&active(a,"Deathly Presence: active")?1:i.flags[builder].mpCost051):0;}
export function prepareGroup4(a){
 if(key(a)!==omega||!active(a,"Diamond Flash: exposed"))return;
 const dr=a.system.traits.dr;
 dr.value=dr.value.map(r=>r.amount===25&&!r.types.length?{...r,amount:10}:r);
}
export function gateGroup4(u){
 const {actor:a,item:i}=u,k=key(a);
 if(![omega,kaiser].includes(k)||i?.actor!==a)return;
 const n=i.name,stage=i.flags?.[scope]?.stage051,mp=price(a,i),hp=a.system.attributes.hp;
 if(k===omega){
  const left=named(a,"Renewal")?.system.uses.value;
  if(n==="Renewal"&&!(left>0))return "Both Renewals have been spent.";
  if(stage&&stage!==3-left)return "Select an action from Omega's current life.";
  if(n.startsWith("Omega Drive")&&hp.value>=1352)return "Omega Drive requires fewer than 1352 HP.";
 }else{
  const selected=forms(a);
  if(stage||n==="Breath Weapon"){
   if(selected.length!==1)return "Activate one current Barrier Shift form (including Last Form for the fifth fight).";
   const form=selected[0],breath=u.action?.name?.split(" ")[0]?.toLowerCase();
   if(n==="Breath Weapon"&&form!=="last"&&breath!==form)return "Select the breath matching the current elemental form.";
   const inherited=form==="last"&&active(a,"Emperor's Will: active")&&burstNames.some(b=>n.startsWith(b+": ")&&active(a,b+": active"));
   if(stage&&stage!==form&&!inherited)return "This ability belongs to another Kaiser form.";
  }
  if(burstNames.includes(n)&&hp.value>=1120)return "This burst requires fewer than 1120 HP.";
 }
 if(mp>a.system.attributes.mp.value)return "Insufficient MP for this innate spell.";
}
const settled=new WeakSet();
export async function settleGroup4(u){
 const {actor:a,item:i}=u,k=key(a);
 if(![omega,kaiser].includes(k)||!a.isOwner||i?.actor!==a||settled.has(u))return;
 settled.add(u);
 const cost=price(a,i),n=i.name;
 if(cost)await a.update({"system.attributes.mp.value":Math.max(0,a.system.attributes.mp.value-cost)});
 if(k===omega&&n==="Renewal"){
  const left=i.system.uses.value;if(left<=0)return;
  await i.update({"system.uses.value":left-1});
  const attr=a.system.attributes;await a.update({"system.attributes.hp.value":attr.hp.max,"system.attributes.mp.value":attr.mp.max});
  const stale=Array.from(a.items).filter(b=>live(b)&&(/^(Omega Drive.*: active|Diamond Flash: exposed)$/.test(b.name)));
  if(stale.length)await a.updateEmbeddedDocuments("Item",stale.map(b=>({_id:b.id,"system.active":false})));
  return;
 }
 if(i.type!=="feat")return;
 const b=named(a,n==="Diamond Flash"?"Diamond Flash: exposed":n+": active");
 if(b?.type==="buff"&&!live(b))await b.update({"system.active":true});
}
if(globalThis.Hooks){
 Hooks.once("ready",()=>{
  if(game.system.id!=="ffd20")return;
  const owner=methodOwner(CONFIG.Actor,"npc","prepareDerivedData"),old=owner.prepareDerivedData;
  owner.prepareDerivedData=function(...args){prepareGroup4(this);return old.apply(this,args);};
 });
 Hooks.on("pf1PreActionUse",u=>{const why=gateGroup4(u);if(why){ui.notifications.warn(why);return false;}});
 Hooks.on("pf1PostActionUse",settleGroup4);
}
const ark="ark-the-aerodynamic-destiny",shieldName="Plasma Shield: active",clock="plasmaClock051",receipt=Symbol("arkShield"),queue=new WeakMap();
const pool=a=>key(a)===ark&&a.items.find(i=>i.type==="feat"&&i.system.tag==="plasma-shield"&&!i.system.disabled);
function serial(a,fn){
 const p=(queue.get(a)??Promise.resolve()).catch(()=>{}).then(fn);queue.set(a,p);
 return p.finally(()=>{if(queue.get(a)===p)queue.delete(a);});
}
function stamp(a){
 const c=game.combat,combat=c?.started&&c.combatants.some(t=>t.actor?.uuid===a.uuid)?c:null;
 return {at:game.time.worldTime,combat:combat?.id??null,round:combat?.round??0};
}
export function shieldSnapshot(hp,last,now,on,seconds=6){
 if(last.until>now.at)return {hp:0,last};
 if(last.until)return {hp:410,last:now};
 if(!on||hp<=0||hp>=410||!Number.isFinite(last.at))return {hp,last:now};
 const byTime=Math.floor(Math.max(0,now.at-last.at)/seconds);
 const sameCombat=now.combat&&now.combat===last.combat;
 const rounds=sameCombat?Math.max(0,now.round-last.round):byTime;
 if(!rounds)return {hp,last};
 return {hp:Math.min(410,hp+41*rounds),last:{...now,at:sameCombat?now.at:last.at+rounds*seconds}};
}
function state(a,i){return shieldSnapshot(Number(i.system.uses.value),i.getFlag(scope,clock)??{},stamp(a),active(a,shieldName),CONFIG.time?.roundTime||6);}
const persist=(i,hp,mark)=>i.update({"system.uses.value":hp,["flags."+scope+"."+clock]:mark});
const up=(a,i)=>i&&active(a,shieldName)&&state(a,i).hp>0;
export function shieldDamage(o,capacity){
 if(o.asManaDamage||o.value<=0)return 0;
 return Math.min(capacity,Math.max(0,Math.floor(o.value*o.ratio)-o.reduction));
}
function ordinary(o){
 if(!(o.isCritical||o.critMult>1))return;
 const rolls=o.message?.systemRolls?.attacks?.[o.attackIndex]?.damage;
 if(!rolls?.length||!rolls.every(r=>Number.isFinite(r.total)&&r.damageType))return;
 return {amount:rolls.reduce((sum,r)=>sum+r.total,0),parts:rolls.map(r=>Object.assign(new ffd20.models.action.DamagePartModel(r.damageType.toObject()),{value:r.total}))};
}
async function activate(a){
 const i=pool(a),b=named(a,shieldName);if(!i||!b)return;
 await serial(a,async()=>{const s=state(a,i);if(!s.hp||active(a,shieldName))return;
  await persist(i,s.hp,stamp(a));await b.update({"system.active":true});});
}
function wireShield(){
 const p=ffd20.applications.ApplyDamage.prototype,refresh=p._refreshTarget,options=p._getTargetDamageOptions;
 p._refreshTarget=function(id){
  const a=this.targets.get(id)?.actor,base=!this.isHealing&&!this.asManaDamage&&up(a,pool(a))&&ordinary(this.options);
  if(!base)return refresh.call(this,id);
  const parts=this.instances.slice(),value=this.value;
  try{this.instances.splice(0,this.instances.length,...base.parts);this.value=base.amount;return refresh.call(this,id);}
  finally{this.instances.splice(0,this.instances.length,...parts);this.value=value;}
 };
 p._getTargetDamageOptions=function(t){
  const on=!this.isHealing&&!this.asManaDamage&&up(t.actor,pool(t.actor));
  if(on)this._refreshTarget(t.uuid);
  const o=options.call(this,t),base=on&&ordinary(this.options);
  if(base)o.arkOrdinary051=base.amount+(this.bonus||0);
  return o;
 };
 const owner=methodOwner(CONFIG.Actor,"npc","applyDamage"),apply=owner.applyDamage;
 owner.applyDamage=function(value,opts={}){
  const i=pool(this);if(!i||!this.isOwner||value<=0||opts.asManaDamage)return apply.call(this,value,opts);
  return serial(this,async()=>{
   const s=state(this,i);if(!active(this,shieldName)||!s.hp)return apply.call(this,value,opts);
   const normal=!opts.dialog&&ordinary(opts);
   if(normal){value=normal.amount;opts={...opts,instances:normal.parts,isCritical:false,critMult:0};}
   else if(Number.isFinite(opts.arkOrdinary051))value=opts.arkOrdinary051;
   const r={cap:s.hp,used:0},result=await apply.call(this,value,{...opts,[receipt]:r});
   if(!r.used)return result;
   const left=s.hp-r.used,now=stamp(this);
   await persist(i,left,left?(s.hp===410?now:s.last):{...now,until:now.at+86400});
   if(!left)await named(this,shieldName).update({"system.active":false});
   return this;
  });
 };
 Hooks.on("pf1ApplyDamage",(_a,o)=>{const r=o[receipt];if(!r)return;r.used=shieldDamage(o,r.cap);o.reduction+=r.used;});
}
async function refreshShields(c){
 if(!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
 const actors=new Set(c?Array.from(c.combatants,x=>x.actor):[...game.actors,...(globalThis.canvas?.tokens?.placeables??[]).map(t=>t.actor)]);
 for(const a of actors){const i=pool(a);if(!i||i.system.uses.value>=410)continue;
  await serial(a,async()=>{const s=state(a,i);if(s.hp!==i.system.uses.value)await persist(i,s.hp,s.last);});}
}
if(globalThis.Hooks){
 Hooks.once("ready",()=>{if(game.system.id==="ffd20")wireShield();});
 Hooks.on("pf1PreActionUse",u=>{const a=u.actor,i=pool(a);if(i&&u.item===i&&!state(a,i).hp){ui.notifications.warn("Plasma Shield is offline.");return false;}});
 Hooks.on("pf1PostActionUse",u=>{if(key(u.actor)===ark&&u.actor.isOwner&&u.item?.actor===u.actor&&["Lapis Lazuli","Plasma Shield"].includes(u.item.name))return activate(u.actor);});
 Hooks.on("preUpdateItem",(b,d)=>{const a=b.actor,i=pool(a);if(i&&b.name===shieldName&&(d.system?.active??d["system.active"])===true&&!state(a,i).hp){ui.notifications.warn("Plasma Shield is offline.");return false;}});
 Hooks.on("updateCombat",(c,d)=>{if("round" in d)return refreshShields(c);});
 Hooks.on("updateItem",async(b,d,_options,user)=>{
  const a=b.actor,i=pool(a);if(!i||user!==game.user.id||!a.isOwner||b.name!==shieldName||(d.system?.active??d["system.active"])!==true)return;
  const mark=i.getFlag(scope,clock)??{},now=stamp(a);
  if(!mark.until||mark.until<=now.at)await persist(i,mark.until?410:i.system.uses.value,now);
 });
 Hooks.on("updateWorldTime",()=>refreshShields());
}

