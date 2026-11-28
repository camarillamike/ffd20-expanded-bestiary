import {methodOwner} from "./document-methods.mjs";

const builder="ffd20-bestiary-builder",scope="ffd20-expanded-bestiary";
const diamond="diamond-weapon",ruby="ruby-weapon",ultimate="ultimate-weapon-ffvii",brown="wyrm-brown-dragon";
const elements=["earth","fire","ice","lightning","water","wind","light","dark"];
const key=a=>a?.flags?.[builder]?.review051;
const buff=(a,n)=>a.items.find(i=>i.type==="buff"&&i.name===n);
const active=b=>b?.system.active===true&&!b.system.disabled;
const wardItem=a=>a.items.find(i=>i.type==="buff"&&i.flags?.[builder]?.review046Semantic===brown+"/Earthen Ward: recipient");
const ward=a=>{const b=wardItem(a);return active(b)&&b.system.uses.value>0?b:null;};
const stacks=(a,t)=>{const b=buff(a,"Protector: "+t);return active(b)?Math.max(0,Number(b.system.level)||0):0;};
const state=a=>[ward(a)?.id,ward(a)?.system.uses.value,key(a)===diamond&&active(buff(a,"Diamond Flash: exposed")),...(key(a)===ultimate?elements.map(t=>stacks(a,t)):[])].join("/");
const stamp=new WeakMap(),pending=new WeakMap(),queues=new WeakMap(),ticket=Symbol("encounter receipt");
function serial(a,fn){
 const job=(queues.get(a)??Promise.resolve()).catch(()=>{}).then(fn);queues.set(a,job);
 return job.finally(()=>{if(queues.get(a)===job)queues.delete(a);});
}
export function rowsFor(app,a,kind,rows){
 if(app.isHealing||app.asManaDamage)return rows;
 const k=key(a),b=ward(a);
 if(!b&&k!==ultimate&&k!==diamond)return rows;
 let saved=stamp.get(app);if(!saved)stamp.set(app,saved=new Map());
 if(!saved.has(a))saved.set(a,state(a));
 if(kind==="dr"&&k===diamond&&active(buff(a,"Diamond Flash: exposed")))rows=rows.filter(r=>!(r.isDR&&r.hasGeneric&&r.amount===25));
 const row=(amount,type,active)=>({...a._parseResistanceEntry({amount,types:[type],operator:true},kind),amount,value:amount,types:[type],typeIds:new Set([type]),visible:true,active,disabled:!active,hasGeneric:false});
 if(kind==="dr"&&b){
  const t="adamantine",applies=!Array.from(app.materials??[]).includes(t)&&app.instances.some(i=>!Array.from(i.types).includes(t));
  app.resistanceIds.add(t);return [...rows,{...row(Math.min(10,b.system.uses.value),t,applies),ward051:true}];
 }
 if(kind!=="eres"||k!==ultimate)return rows;
 const out=rows.slice();
 for(const t of elements){
  const gain=10*stacks(a,t);if(!gain||!app.instances.some(i=>Array.from(i.types).includes(t)))continue;
  const ix=out.findIndex(r=>r.isER&&r.typeIds.size===1&&r.typeIds.has(t));
  if(ix<0){out.push(row(gain,t,true));app.resistanceIds.add(t);}
  else out[ix]={...out[ix],amount:out[ix].amount+gain,value:out[ix].value+gain};
 }
 return out;
}
export function physicalReduction(native,app,t,instances,rows){
 const w=rows.find(r=>r.ward051);
 if(!w)return native.call(app,t,instances,rows,true);
 const other=native.call(app,t,instances,rows.filter(r=>r!==w),true);
 // DR does not stack. Only the extra prevention beyond ordinary DR spends Stoneskin.
 const value=Math.max(0,Math.min(w.value,10-other,ward(t.actor)?.system.uses.value??0));
 const extra=native.call(app,t,instances,[{...w,value}],true);t.wardSpent051=extra;
 return other+extra;
}
export function hitTypes(instances,ratio){
 return ratio>0?[...new Set(instances.filter(i=>i.value>0).flatMap(i=>Array.from(i.types??[])).filter(t=>elements.includes(t)))]:[];
}
export async function settle(a,r){
 const b=ward(a),updates=[];
 if(r.spent&&b?.id===r.wardId){const left=Math.max(0,b.system.uses.value-r.spent);updates.push({_id:b.id,"system.uses.value":left,...(!left?{"system.active":false}:{})});}
 if(key(a)===ultimate)for(const t of r.types){
  const i=buff(a,"Protector: "+t);if(i&&!i.system.disabled)updates.push({_id:i.id,"system.active":true,"system.level":1+stacks(a,t)});
 }
 if(updates.length)await a.updateEmbeddedDocuments("Item",updates);
}
const reflectRound=(a,now,c)=>c?.started&&c.combatants?.some(t=>t.actor?.uuid===a.uuid)?c.id+":"+c.round:"world:"+Math.floor(now/(globalThis.CONFIG?.time?.roundTime||6));
export function rubyBlock(a,i,now,combat){
 if(key(a)!==ruby||i?.actor!==a)return;
 const exposed=active(buff(a,"Tentacles exposed")),driven=active(buff(a,"Ruby Drive: exposed tentacles"));
 if(exposed&&["Slam x2","Big Swing","Whirlsand","Exposed Tentacles"].includes(i.name))return "Unavailable while Ruby's tentacles are exposed.";
 if(i.name==="Ruby Drive: exposed fast healing"&&!(exposed&&driven)||i.name==="Fast Healing"&&exposed&&driven)return "Use the healing action for Ruby's current Drive.";
 if(i.name==="Ruby Drive: Auto-Reflect"){
  if(!exposed||!driven)return "Auto-Reflect requires the exposed Ruby Drive.";
  if(i.flags?.[scope]?.rubyReflect051===reflectRound(a,now,combat))return "Auto-Reflect has already been used this round.";
 }
 const lock=i.flags?.[scope]?.rubyRegrow051;
 if(i.name==="Exposed Tentacles"&&lock){
  const turn=combat?.turns?.findIndex(c=>c.id===lock.turnId)??-1;
  if(combat?.started&&combat.id===lock.combat?combat.round<lock.round||combat.round===lock.round&&combat.turn<turn:now<lock.until)return "Both tentacles are regrowing.";
 }
}
async function switchDrive(a,on,start){
 const pair=["Ruby Drive: active","Ruby Drive: exposed tentacles"].map(n=>buff(a,n));
 if(pair.some(b=>!b))return;
 await a.updateEmbeddedDocuments("Item",pair.map((b,j)=>({_id:b.id,"system.active":j===Number(on),...(j===Number(on)?{"system.duration.start":start}:{})})));
}
function inWardRange(from,to){
 const grid=canvas.grid;
 const centers=t=>{const offsets=!grid.isGridless&&t.getOccupiedGridSpaceOffsets?.();return offsets?.length?offsets.map(o=>grid.getCenterPoint(o)):[t.center];};
 return from?.center&&to?.center&&centers(from).some(p=>centers(to).some(q=>grid.measurePath([p,q]).distance<=30));
}
export async function postUse(u){
 const a=u.actor,i=u.item;if(!a?.isOwner||i?.actor!==a||i.type!=="feat")return;
 const now=game.time.worldTime;
 if(key(a)===diamond&&i.name==="Diamond Flash"&&u.action?.name==="Diamond Flash")await buff(a,"Diamond Flash: exposed")?.update({"system.active":true,"system.duration.start":now});
 if(key(a)===ruby&&i.name==="Exposed Tentacles")await buff(a,"Tentacles exposed")?.update({"system.active":true});
 if(key(a)===ruby&&i.name==="Ruby Drive")await switchDrive(a,active(buff(a,"Tentacles exposed")),now);
 if(key(a)===ruby&&i.name==="Ruby Drive: Auto-Reflect")await i.setFlag(scope,"rubyReflect051",reflectRound(a,now,game.combat));
 if(key(a)===brown&&i.name==="Earthen Ward"){
  const source=wardItem(a),seen=new Set(),caster=u.token?.object??u.token??a.getActiveTokens?.()[0];
  for(const token of game.user.targets){
   const target=token.actor;if(!source||!target||target.uuid===a.uuid||seen.has(target.uuid))continue;
   if(!target.isOwner||!inWardRange(caster,token)){
    ui.notifications.warn("Earthen Ward: check range/ownership for "+target.name+"; no ward applied.");continue;
   }
   seen.add(target.uuid);const b=wardItem(target),changes={"system.active":true,"system.uses.value":150,"system.duration.start":now};
   if(b)await b.update(changes);else{
    const doc=source.toObject();delete doc._id;doc.system.active=true;doc.system.uses.value=150;doc.system.duration.start=now;
    await target.createEmbeddedDocuments("Item",[doc]);
   }
  }
 }
}
if(globalThis.Hooks){
 Hooks.on("pf1PreActionUse",u=>{const err=rubyBlock(u.actor,u.item,game.time.worldTime,game.combat);if(err){ui.notifications.warn(err);return false;}});
 Hooks.on("pf1PostActionUse",postUse);
 Hooks.on("updateItem",async(i,d,_opts,user)=>{
  const a=i.actor,on=d.system?.active;if(user!==game.user.id||!a?.isOwner||key(a)!==ruby||i.name!=="Tentacles exposed"||typeof on!=="boolean")return;
  const previous=buff(a,on?"Ruby Drive: active":"Ruby Drive: exposed tentacles");
  if(active(previous))await switchDrive(a,on,previous.system.duration.start??game.time.worldTime);
  if(!on){
   const feat=a.items.find(i=>i.name==="Exposed Tentacles"&&i.type==="feat"),rounds=(await new Roll("1d2+1").evaluate()).total,c=game.combat;
   const inCombat=c?.started&&c.combatants?.some(t=>t.actor?.uuid===a.uuid);
   await feat.setFlag(scope,"rubyRegrow051",{combat:inCombat?c.id:null,turnId:inCombat?c.combatant?.id:null,round:(c?.round??0)+rounds,until:game.time.worldTime+rounds*(CONFIG.time.roundTime||6)});
  }
 });
 Hooks.once("ready",()=>{
  if(game.system.id!=="ffd20")return;
  const p=ffd20.applications.ApplyDamage.prototype,rows=p.getResistances,red=p._processReductions,refresh=p._refreshTarget;
  p.getResistances=function(a,k="dr"){return rowsFor(this,a,k,rows.call(this,a,k));};
  p._processReductions=function(t,instances,rs,dr){return dr?physicalReduction(red,this,t,instances,rs):red.call(this,t,instances,rs,dr);};
  p._refreshTarget=function(id){
   const result=refresh.call(this,id),t=this.targets.get(id),a=t.actor;
   const fingerprint=stamp.get(this)?.get(a);
   if(fingerprint!==undefined&&!this.isHealing&&!this.asManaDamage){
    const r={state:fingerprint,wardId:ward(a)?.id,spent:t.wardSpent051??0,types:hitTypes(t.instances,t.ratio??1)};
    t[ticket]=r;
    // Quick Apply builds the native dialog synchronously but never submits it.
    const q=pending.get(a);if(q&&q.message&&q.message===this.extraOptions.message&&q.attackIndex===this.extraOptions.attackIndex)q.receipt=r;
   }
   return result;
  };
  Hooks.on("pf1ApplyDamageTargetOptions",(_app,t,o)=>{if(t[ticket])o[ticket]=t[ticket];});
  const owner=methodOwner(CONFIG.Actor,"npc","applyDamage"),apply=owner.applyDamage;
  owner.applyDamage=function(value,o={}){
   if(!this.isOwner||value<=0||o.asManaDamage||(!ward(this)&&key(this)!==ultimate&&!o[ticket]))return apply.call(this,value,o);
   return serial(this,async()=>{
    const r=o[ticket];if(r&&state(this)!==r.state){ui.notifications.warn("Defenses changed. Reopen Apply Damage before applying this hit.");return false;}
    const q={message:o.message,attackIndex:o.attackIndex};if(!o.dialog)pending.set(this,q);
    try{
     const result=await apply.call(this,value,o),receipt=r??q.receipt;
     if(receipt){await settle(this,receipt);return result||((receipt.spent||receipt.types.length&&key(this)===ultimate)?this:result);}
     return result;
    }finally{if(pending.get(this)===q)pending.delete(this);}
   });
  };
 });
}
