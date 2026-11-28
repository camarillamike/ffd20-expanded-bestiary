import {methodOwner} from "./document-methods.mjs";
const scope="ffd20-expanded-bestiary",builder="ffd20-bestiary-builder";
const [shin,ult,zod,neo,zero]=["shinryu","ultima-the-high-seraph","zodiark-keeper-of-precepts","neo-bahamut-the-hallowed-father","bahamut-zero-the-first-sire"];
const key=a=>a?.flags?.[builder]?.review051;
const flags=i=>i?.flags?.[scope]??{};
const active=i=>i.type==="buff"&&i.system.active===true&&!i.system.disabled;
const activeWith=(a,f)=>Array.from(a?.items??[]).filter(i=>active(i)&&flags(i)[f]);
const live=(a,n)=>a.items.some(i=>i.name===n&&active(i));
const rows=[["fire","water","ice"],["ice","fire","wind"],["lightning","earth","water"],["wind","ice","earth"],["earth","wind","lightning"],["water","lightning","fire"],["light","dark"],["dark","light"]];
const elements=rows.map(row=>row[0]);
const shiftLabel=new WeakMap();
export function orbAfterHit(hp,damage,element){
 if(!Number.isSafeInteger(hp)||hp<0||hp>250||!Number.isSafeInteger(damage)||damage<0||!["physical","untyped","nonelemental",...elements].includes(element))throw Error("Invalid orb hit");
 return Math.max(0,hp-Math.max(0,damage-(["physical","untyped"].includes(element)?0:25)));
}
export function phase(a){return Math.max(1,...activeWith(a,"g5Phase").map(i=>flags(i).g5Phase));}
export function group5Profile(a){
 const n=key(a);if(![shin,ult,zod,neo,zero].includes(n))return null;
 if(n===shin||n===ult)return {absorb:["light"],weak:n===ult?["dark"]:[],half:[],immune:[]};
 const p=phase(a),i=activeWith(a,"g5Barrier")[0],row=(p>1||n===zod)&&rows[flags(i).g5Barrier-1]||(n===zod?rows[7]:null);
 const half=activeWith(a,"g5Strong").length?[...elements,"physical"]:row?.[2]?[row[2]]:[];
 return {absorb:row?[row[0]]:[],weak:row&&!(n===zero&&p===4)?[row[1]]:[],half,immune:[]};
}
export function prepareGroup5(a){
 const n=key(a),loss=activeWith(a,"g5ER").map(i=>flags(i).g5ER);
 if(!loss.length&&![shin,ult,zod,neo,zero].includes(n))return;
 const tr=a.system.traits;if(!tr?.eres?.value)return;
 const profile=group5Profile(a),shift=activeWith(a,"g5Barrier").length>0,lord=n===shin&&activeWith(a,"g5Lord").length>0;
 // Each enabled override advertises the effective phase. This is independent
 // of item order when Greater Barrier overlaps a shift or Zero loses weakness.
 if(profile)for(const b of activeWith(a,"g5Barrier")){
  flags(b).affinity051={absorb:[...profile.absorb],weak:[...profile.weak],half:[...profile.half]};
 }
 let er=tr.eres.value.map(r=>({...r}));
 const set=(type,amount)=>{const prev=er.find(r=>r.types.length===1&&r.types[0]===type);if(prev)prev.amount=Math.max(amount,prev.amount);else er.push({amount,types:[type],operator:true});};
 if(lord){for(const t of [...elements,"nonelemental"])set(t,20);tr.fastHealing="35";}
 if(n===zod&&shift)for(const t of new Set(["dark","light",...(flags(a).g5PriorAffinities??[])]))set(t,20);
 // _prepareTraits builds the label getters over these Sets; never replace
 // the prepared trait or edit its base (the serialized source array).
 const standard=tr.dv?.standard;
 if(profile&&[zod,neo,zero].includes(n)&&standard instanceof Set){
  const previous=shiftLabel.get(standard);
  if(previous){standard.delete(previous);shiftLabel.delete(standard);}
  if(n===zod&&shift&&!profile.weak.includes("light"))standard.delete("light");
  for(const t of profile.weak)if(!standard.has(t)){standard.add(t);shiftLabel.set(standard,t);}
 }
 if(profile&&(shift||n===zod||n===ult)){
  er=er.filter(r=>!(r.types.length===1&&[...profile.absorb,...profile.weak].includes(r.types[0])));
 }
 for(const t of new Set(loss.map(v=>v.type))){
  const value=Math.max(...loss.filter(v=>v.type===t).map(v=>v.reduce));
  er=er.flatMap(r=>r.types.includes(t)?[...(r.types.length>1?[{...r,types:r.types.filter(e=>e!==t)}]:[]),{...r,types:[t],amount:Math.max(0,r.amount-value)}]:[r]);
 }
 tr.eres.value=er;
}
export function blocked(use,round){
 const a=use.actor,i=use.item,k=key(a);if(![shin,ult,zod,neo,zero].includes(k)||i?.actor!==a)return;
 const f=flags(i),mode=f.g5Modes?.[use.action?.name],p=phase(a),n=i.name;
 const next=transitions[k]?.[n],repeating=k===neo&&n==="Barrier Shift";
 if(next&&!repeating&&p>=next)return "That phase transition has already occurred.";
 if(next&&p<next-1)return "Resolve the preceding phase transition first.";
 const threshold=thresholds[k]?.[n],hp=a.system.attributes.hp;
 if(threshold&&(!repeating||p===1)&&Number.isFinite(hp?.value)&&hp.max>0){
  const allowed=n==="Enter phase III"?hp.value<=hp.max*threshold:hp.value<hp.max*threshold;
  if(!allowed)return "The published HP threshold has not been reached. A GM can set the encounter phase manually.";
 }
 if(mode?.phases&&!mode.phases.includes(p))return "Select the action for the current encounter phase.";
 if(mode?.requires&&!live(a,mode.requires))return "Activate "+mode.requires+" first.";
 const barrier=flags(activeWith(a,"g5Barrier")[0]).g5Barrier??(k===zod?8:null);
 if(mode?.barrier&&mode.barrier!==barrier)return "Select the action matching the active barrier.";
 if(k===zod&&i.type==="attack"&&/claw/i.test(i.name)&&p>1&&!mode?.barrier&&barrier)return "Use the claw mode for the current phase and barrier.";
 if(k===zero&&n==="Greater Impulse"&&!mode?.barrier&&activeWith(a,"g5Stance").some(b=>flags(b).g5Stance===p&&p>=3))return "Use Greater Impulse for the active stance and element.";
 if(n==="Fast Healing"&&k===shin&&activeWith(a,"g5Lord").length)return "Dragon Lord uses the 35 HP recovery.";
 if(k===neo&&f.g5MpCost&&Number(a.system.attributes.mp.value)<f.g5MpCost)return "Flare II requires 8 MP.";
 const orbs=activeWith(a,"g5Orb");
 if(k===neo&&n==="Energy Orb"&&orbs.length>=3)return "All three Energy Orbs are present.";
 if(n==="Energy Orb: absorb survivors"&&!orbs.length)return "There are no surviving orbs.";
 if(n==="Energy Orb: absorb survivors"&&orbs.length===3)return "At least one orb must be destroyed first.";
 if(["Energy Orb: absorb survivors","Nightmare Gigaflare"].includes(n)&&orbs.some(b=>!b.system.uses.value))return "Resolve destroyed orbs before counting or absorbing survivors.";
 if(f.g5OrbShot&&orbs.some(b=>flags(b).g5Orb===f.g5OrbShot&&!b.system.uses.value))return "This orb has no HP; resolve its destruction.";
 if(f.g5OrbShot||f.g5OrbDestroyed){
  const b=orbs.find(b=>flags(b).g5Orb===(f.g5OrbShot??f.g5OrbDestroyed)),start=flags(b).orbBorn;
  if(round&&start&&start.combat===round.split(":")[0]){
   const age=Math.min(4,Math.max(1,1+Number(round.split(":")[1])-start.round));
   if(Number.parseInt(use.action?.name?.slice(6))!==age)return "Select round "+age+" of this orb's own progression.";
  }
 }
 if(n==="Nightmare Gigaflare"){
  const count=orbs.length||Number(flags(a).g5Absorbed??0);
  if(count===3||Number.parseInt(use.action?.name)!==count)return "Select the correct orb count. Three orbs prevent Nightmare Gigaflare.";
 }
 if(n==="Battle Cry"&&flags(i).usedG5Phase===p)return "Battle Cry has already been used in this phase. Reset the encounter to use it again.";
 if(round&&k===zod&&n==="Barrier Shift"&&flags(i).usedG5Round===round)return "Barrier Shift was already used this round.";
 if(round&&k===zero&&n==="Counterstrike Stance: counter claw"&&flags(i).usedG5Round===round)return "Counterstrike was already used this round.";
 if(round&&k===neo&&n.includes(": Light Shoot")&&flags(i).usedG5Round===round)return "This orb has already fired this round.";
}
function stamp(a){const c=globalThis.game?.combat;return c?.started&&c.combatants.some(t=>t.actor?.uuid===a.uuid)?c.id+":"+c.round:null;}
const transitions={[shin]:{"Empowered Tidal Wave":2},[ult]:{Eschaton:2},[zod]:{"Greater Barrier":2,"Enter phase III":3},[neo]:{"Barrier Shift":2,Gigaflare:3},[zero]:{Megaflare:2,Gigaflare:3,Teraflare:4}};
const thresholds={[shin]:{"Dragon Lord":.5,"Empowered Tidal Wave":.5},[ult]:{"Divine Retribution":.5,Eschaton:.5},[zod]:{"Greater Barrier":.5,"Enter phase III":1/3},[neo]:{"Barrier Shift":.8,Gigaflare:.5},[zero]:{Megaflare:.8,Gigaflare:.5,Teraflare:.3}};
async function toggle(a,b,on=true){if(b&&b.system.active!==on)await b.update({"system.active":on});}
function named(a,n){return a.items.find(i=>i.type==="buff"&&i.name===n);}
const paid=new WeakSet();
if(globalThis.Hooks){
 Hooks.once("ready",()=>{
  if(game.system.id!=="ffd20")return;
  const owner=methodOwner(CONFIG.Actor,"npc","prepareDerivedData"),original=owner.prepareDerivedData;
  owner.prepareDerivedData=function(...args){prepareGroup5(this);return original.apply(this,args);};
 });
 Hooks.on("pf1PreActionUse",u=>{const err=blocked(u,stamp(u.actor));if(err){ui.notifications.warn(err);return false;}});
 Hooks.on("pf1PostActionUse",async u=>{
  const a=u.actor,i=u.item,n=i?.name,k=key(a);if(!transitions[k]||!a?.isOwner||i.actor!==a||paid.has(u))return;
  paid.add(u);
  const round=stamp(a),f=flags(i),next=transitions[k][n];
  if(next&&next>phase(a))await toggle(a,a.items.find(b=>flags(b).g5Phase===next));
  if(f.g5MpCost)await a.update({"system.attributes.mp.value":Math.max(0,a.system.attributes.mp.value-f.g5MpCost)});
  if(n==="Reset encounter state"){
   const bs=Array.from(a.items).filter(b=>b.type==="buff"&&(flags(b).g5Phase||flags(b).g5Barrier||flags(b).g5Stance||flags(b).g5Orb||flags(b).g5Strong||flags(b).g5Lord||b.name==="Divine Retribution: active"||b.name.startsWith("Battle Cry: phase ")));
   await a.updateEmbeddedDocuments("Item",bs.map(b=>({_id:b.id,"system.active":false})));
   await a.unsetFlag(scope,"g5Absorbed");await a.unsetFlag(scope,"g5PriorAffinities");
   const cry=a.items.find(i=>i.name==="Battle Cry");if(cry)await cry.unsetFlag(scope,"usedG5Phase");
  }
  if(n==="Battle Cry"){await i.setFlag(scope,"usedG5Phase",phase(a));await toggle(a,named(a,"Battle Cry: phase "+phase(a)));}
  if(round&&(k===zod&&n==="Barrier Shift"||k===neo&&n.includes(": Light Shoot")||k===zero&&n==="Counterstrike Stance: counter claw"))await i.setFlag(scope,"usedG5Round",round);
  if(n==="Energy Orb"){
   const b=a.items.find(b=>flags(b).g5Orb&&!active(b));
   if(b){await b.update({"system.active":true,"system.uses.value":250,["flags."+scope+".orbBorn"]:round?{combat:round.split(":")[0],round:Number(round.split(":")[1])}:null});await a.unsetFlag(scope,"g5Absorbed");}
  }
  if(f.g5OrbHit){
   const b=activeWith(a,"g5Orb").find(b=>flags(b).g5Orb===f.g5OrbHit);
   const opts=["physical","untyped",...elements,"nonelemental"].map(t=>"<option>"+t+"</option>").join("");
   const hit=await foundry.applications.api.DialogV2.wait({window:{title:n+" (AC 30, touch/flat-footed 20)"},content:'<label>Damage before resistance <input name="amount" type="number" min="0" step="1" required></label><label>Damage type <select name="element">'+opts+'</select></label>',
    buttons:[{action:"apply",label:"Apply hit",callback:(_e,button)=>[Number(button.form.elements.amount.value),button.form.elements.element.value]},{action:"cancel",label:"Cancel",callback:()=>null}],rejectClose:false});
   if(hit&&b&&active(b))await b.update({"system.uses.value":orbAfterHit(b.system.uses.value,...hit)});
  }
  if(f.g5OrbDestroyed){const b=activeWith(a,"g5Orb").find(b=>flags(b).g5Orb===f.g5OrbDestroyed);if(b)await b.update({"system.active":false,"system.uses.value":0});}
  if(n==="Energy Orb: absorb survivors"){
   const orbs=activeWith(a,"g5Orb");await a.setFlag(scope,"g5Absorbed",orbs.length);
   await a.updateEmbeddedDocuments("Item",orbs.map(b=>({_id:b.id,"system.active":false})));
  }
  if(n==="Nightmare Gigaflare"){
   const used=activeWith(a,"g5Orb");if(used.length)await a.updateEmbeddedDocuments("Item",used.map(b=>({_id:b.id,"system.active":false})));
   await a.unsetFlag(scope,"g5Absorbed");
  }
  const b=named(a,n+": active");if(b&&i.type==="feat")await toggle(a,b);
 });
 Hooks.on("updateItem",async(i,d,_o,user)=>{
  const a=i.actor;if(user!==game.user.id||!a?.isOwner||!transitions[key(a)]||d.system?.active!==true)return;
  const group=["g5Phase","g5Barrier","g5Stance"].find(f=>flags(i)[f]);if(!group)return;
  const siblings=activeWith(a,group).filter(b=>b.id!==i.id);
  if(group==="g5Barrier"&&key(a)===zod){
   const prior=new Set(flags(a).g5PriorAffinities??[]);
   for(const b of [i,...siblings])for(const t of rows[flags(b).g5Barrier-1].slice(0,2))prior.add(t);
   await a.setFlag(scope,"g5PriorAffinities",[...prior]);
  }
  if(group==="g5Barrier")return; // Shared affinity051 owns elemental exclusivity.
  if(group==="g5Phase")siblings.push(...activeWith(a,"g5Stance").filter(b=>flags(b).g5Stance!==flags(i).g5Phase));
  if(siblings.length)await a.updateEmbeddedDocuments("Item",siblings.map(b=>({_id:b.id,"system.active":false})));
 });
}
