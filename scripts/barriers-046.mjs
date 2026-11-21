const scope="ffd20-expanded-bestiary",az="ffd20-bestiary-builder",packet=Symbol("barrier HP receipt");
const key=a=>a?.flags?.[az]?.review046,eligible=a=>["dark-elemental","hell-house"].includes(key(a));
const states=a=>[...(a.items??[])].filter(i=>i.type==="buff"&&!i.system.disabled&&i.system.active===true&&i.flags?.[scope]?.barrierState?.group===key(a));
const element=i=>i.typeIds.size===1?[...i.typeIds][0]:null;
const godShell=a=>a.items?.find(i=>i.type==="buff"&&i.flags?.[az]?.review046Semantic==="hell-house/God House: active");
const phaseThree=a=>key(a)==="hell-house"&&a.flags?.[scope]?.housePhase===3;
function affinities(a){
 if(!eligible(a))return null;
 const phase=a.flags?.[scope]?.housePhase,one=states(a),s=one.length===1&&(key(a)!=="hell-house"||phase!==2)?one[0].flags[scope].barrierState:null;
 const dark=key(a)==="dark-elemental";
 return {absorb:[...(dark?["dark"]:[]),...(s?.absorb??[])],weak:[...(dark?["light"]:[]),...(s?.weakness??[])],half:s?.halfResistances??[]};
}
function noHeal(action){
 const i=action?.item,n=[i?.name,i?.flags?.[az]?.lookupName,i?.flags?.[scope]?.sourceName,action?.name].filter(Boolean).join(" ");
 return /\b(?:elemental|earth|wind|water|ice|fire|lightning|dark|holy|light|shadow) orb\b|\bpower (?:staff|rod|bow|weapon)\b/i.test(n);
}
function ordinary(app,type,total){
 if(!app.options.isCritical&&!app.critMult)return total;
 const base=app.extraOptions.message?.systemRolls?.attacks?.[app.extraOptions.attackIndex]?.damage;
 if(!Array.isArray(base)||!base.length)return app.critMult>1?Math.floor(total/app.critMult):total;
 return Math.min(total,base.filter(r=>[...(r.damageType?.types??[])].length===1&&[...r.damageType.types][0]===type)
  .reduce((sum,r)=>sum+r.total,0));
}
Hooks.once("ready",()=>{
 if(game.system.id!=="ffd20")return;
 const p=ffd20.applications.ApplyDamage.prototype,oldImm=p._processImmunities,oldRed=p._processReductions,oldRefresh=p._refreshTarget,oldOptions=p._getTargetDamageOptions;
 const actorClass=CONFIG.Actor.documentClass.prototype,apply=actorClass.applyDamage;
 p._processImmunities=function(t){
  const flags=this.options.action?.item?.flags?.[scope],pair=flags?.splitTypes046??(flags?.splitBombDamage?[flags.splitBombDamage,"bludgeoning"]:null);
  if(pair?.length===2)t.instances=t.instances.flatMap(i=>{
   if(i.typeIds.size!==2||!pair.every(k=>i.typeIds.has(k)))return i;
   const lo=Math.floor(i.total/2),base=Math.floor(i.value/2);
   return pair.map((k,j)=>{const def=ffd20.registry.damageTypes.get(k);
    return {...i,types:[k],typeIds:new Set([k]),total:j?i.total-lo:lo,value:j?i.value-base:base,
     isEnergy:!!def?.isEnergy,isPhysical:!!def?.isPhysical,isMixed:false,isUntyped:!def?.isEnergy&&!def?.isPhysical};});
  });
  const d=!this.isHealing&&!this.asManaDamage&&affinities(t.actor);
  if(key(t.actor)==="ghidra"&&!this.isHealing&&!this.asManaDamage){
   const active=t.actor.items.filter(i=>i.type==="buff"&&i.system.active&&!i.system.disabled).map(i=>i.flags?.[scope]?.bulwark046);
   const item=this.options.action?.item,magic=item?.type==="spell"||["sp","su"].includes(item?.system?.abilityType);
   let saved=0;for(const i of t.instances)if(i.total>0&&((active.includes("polar")&&i.isPhysical&&!i.isEnergy)||(active.includes("pyric")&&magic))){saved+=i.total;i.total=0;}
   return saved+oldImm.call(this,t);
  }
  delete t.bestiaryBarrier;
  if(!d)return oldImm.call(this,t);
  let healed=0,abs=0;const bonuses=new Map();
  for(const i of t.instances){
   const e=element(i);if(!e||i.total<=0)continue;
   if(d.absorb.includes(e)){
    if(!noHeal(this.extraOptions.action))healed+=i.total;
    abs+=i.total;i.total=0;continue;
   }
   if(d.weak.includes(e)||d.half.includes(e)){
    const base=ordinary(this,e,i.value)*(t.ratio??1);bonuses.set(i,Math.min(i.total,base));
    if(d.weak.includes(e))i.total+=Math.floor(Math.min(i.total,base)/2);
   }
  }
  t.bestiaryBarrier={healed,half:d.half,bonuses};
  return abs+oldImm.call(this,t);
 };
 p._processReductions=function(t,instances,rows,dr){
  const reduction=oldRed.call(this,t,instances,rows,dr),s=t.bestiaryBarrier;
  if(dr||!s?.half.length)return reduction;
  let saved=0;for(const i of instances)if(i.total>0&&s.half.includes(element(i))){
   const ordinary=Math.min(s.bonuses.get(i)??0,i.total),n=Math.min(i.total-1,Math.ceil(ordinary/2));saved+=n;i.total-=n;
  }
  return reduction+saved;
 };
 p._refreshTarget=function(id){const v=oldRefresh.call(this,id),t=this.targets.get(id),s=t?.bestiaryBarrier;
  if(s){let phys=0;if(phaseThree(t.actor))phys=t.instances.filter(i=>i.isPhysical&&!i.isMixed&&i.total>0).reduce((n,i)=>n+i.total,0);
   const shell=godShell(t.actor);s.shellPhysical=shell?.system.active&&!shell.system.disabled?phys:0;
   if(phys&&!s.shellPhysical)t.value-=phys-Math.max(1,Math.floor(phys/2));
   s.damage=t.value;t.total=t.value-s.healed;}return v;};
 p._getTargetDamageOptions=function(t){
  if(eligible(t.actor))this._refreshTarget(t.uuid);
  const o=oldOptions.call(this,t),s=t.bestiaryBarrier;
  if(s)o.bestiaryBarrier046={damage:s.damage,healed:s.healed,shellPhysical:s.shellPhysical};return o;
 };
 actorClass.applyDamage=async function(value,opts={}){
  if(!eligible(this)||!this.isOwner||value<=0||opts.asManaDamage)return apply.call(this,value,opts);
  const receipt={},shell=godShell(this);
  if(phaseThree(this)&&shell?.system.active&&!shell.system.disabled&&
   (opts.bestiaryBarrier046?.shellPhysical>0||(!opts.bestiaryBarrier046&&opts.interactive&&opts.element?.dataset?.action==="applyDamage"&&opts.instances?.some(i=>[...(i.types??[])].some(t=>ffd20.registry.damageTypes.get(t)?.isPhysical))))){
   const roll=await new Roll("1d4 + floor(@abilities.str.mod / 2)",this.getRollData()).evaluate();receipt.cap=Math.max(0,roll.total);
  }
  const result=await apply.call(this,value,{...opts,[packet]:receipt});
  if(receipt.healed>0)return (await apply.call(this,-receipt.healed,{interactive:false,dualHeal:false}))||result;
  return result;
 };
});
Hooks.on("pf1ApplyDamage",(a,o)=>{
 const r=o[packet],s=o.bestiaryBarrier046;if(!r||!s||!eligible(a)||!Number.isFinite(s.damage)||!Number.isFinite(s.healed))return;
 o.value=s.damage-(Number.isFinite(r.cap)?Math.max(0,(s.shellPhysical??0)-r.cap):0);o.ratio=1;o.reduction=0;r.healed=s.healed;
});
Hooks.on("updateItem",async(i,delta,opts,user)=>{
 if(user!==game.user.id||!i.actor?.isOwner||!eligible(i.actor)||delta.system?.active!==true||!i.flags?.[scope]?.barrierState)return;
 const siblings=states(i.actor).filter(s=>s.id!==i.id).map(s=>({_id:s.id,"system.active":false}));
 if(siblings.length)await i.actor.updateEmbeddedDocuments("Item",siblings);
});
Hooks.on("pf1PreActionUse",use=>{
 const a=use.actor;if(!eligible(a)||use.item?.actor!==a)return;
 const stop=msg=>{ui.notifications.warn(msg);return false;},i=use.item,n=i.name,x=use.action;
 if(key(a)==="dark-elemental"&&i.type==="spell"&&i.system.school==="ele"){
  const weak=states(a).map(b=>b.flags[scope].barrierState.spellElement),raw=x?.damage?.parts??[];
  const elements=[...new Set(raw.flatMap(p=>[...(p.types??[])].map(t=>String(t.id??t).toLowerCase())).filter(t=>["fire","ice","earth","lightning","water","wind"].includes(t)))];
  if(weak.length!==1||elements.length!==1||weak[0]!==elements[0])return stop("This elemental spell must match the Dark Elemental's active barrier weakness.");
 }
 if(key(a)!=="hell-house"||i.type!=="feat")return;
 const phase=a.flags?.[scope]?.housePhase??1,shell=godShell(a)?.system,enhanced=phase===3&&shell?.active&&!shell.disabled;
 if(n==="Barrier Shift"&&phase===2)return stop("Barrier Shift is unavailable during phase II.");
 const allowed={"Chair Salvo":["fire","dark"],"House Barrage":["ice","earth"],"House Charge":["lightning","light"]}[n];
 if(!allowed&&!["Hospitality","Rocket Charge"].includes(n))return;
 if(!x)return;
 if(allowed){
  const el=x.name?.split(": ").at(-1),barrier=states(a);
  if(phase===2||!allowed.includes(el)||barrier.length!==1||!barrier[0].flags[scope].barrierState.absorb.includes(el))
   return stop("Choose a mode matching Hell House's active barrier in phase I or III.");
 }else if(phase===1&&n==="Rocket Charge")return stop("Rocket Charge requires phase II or III.");
 const upgrade=/^(?:Deluxe:|Beam barrage:|Zip:|Renewed Hospitality|Double Rocket Charge)/i.test(x.name);
 if(Boolean(enhanced)!==upgrade)return stop(enhanced?"Use the God House upgrade for this action.":"The upgraded action requires active God House Mode.");
});
Hooks.on("pf1PostActionUse",async use=>{
 if(key(use.actor)!=="hell-house"||!use.actor.isOwner||use.item?.type!=="feat")return;
 const phase=({"Transform":2,"God House Mode":3})[use.item.name];if(!phase)return;
 await use.actor.setFlag(scope,"housePhase",phase);
 if(phase===3){const b=godShell(use.actor);if(b&&!b.system.active)await b.update({"system.active":true});}
 if(phase===2){const changes=states(use.actor).map(s=>({_id:s.id,"system.active":false}));if(changes.length)await use.actor.updateEmbeddedDocuments("Item",changes);}
});
