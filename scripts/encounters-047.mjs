import {methodOwner} from "./document-methods.mjs";
const scope="ffd20-expanded-bestiary", mark="ffd20-bestiary-builder";
const elements=["fire","ice","lightning","water","wind","earth","light","dark"];
const key=a=>a?.flags?.[mark]?.review047;
const find=(a,f)=>a?.items?.find(i=>i.type==="buff"&&i.flags?.[scope]?.[f]);
const active=i=>!!i?.system.active&&!i.system.disabled;
const round=a=>{const c=game.combat;return c?.started&&c.combatants.some(t=>t.actor?.uuid===a.uuid)?c.id+":"+c.round:null;};
const counter=u=>{const id=u.item?.flags?.[scope]?.counterSpell047;return !!id&&id===(u.action?.id??u.action?._id);};
const toggles={"adamantoise":["Turtle Shell","turtleShell047"],"belias-the-gigas":["Gigas Flame","gigasFlame047"],"viridian-head":["Chill","chill047"]};

Hooks.once("ready",()=>{
 if(game.system.id!=="ffd20")return;
 const rollOwner=methodOwner(CONFIG.Actor,"npc","getRollData"),roll=rollOwner.getRollData,p=methodOwner(CONFIG.Actor,"npc","prepareDerivedData"),prep=p.prepareDerivedData;
 rollOwner.getRollData=function(...args){const data=roll.apply(this,args);return key(this)==="belias-the-gigas"?{...data,bestiaryGigasFlame:Number(active(find(this,"gigasFlame047")))}:data;};
 p.prepareDerivedData=function(...args){
  if(key(this)==="cagnazzo"){const one=active(find(this,"drowned047")),two=active(find(this,"shell047")),gather=active(this.items.find(i=>i.flags?.[scope]?.barrierState?.group==="cagnazzo"));const b=find(this,"shellOverlap047");if(b)b.system.active=one&&two;
   if(gather){const traits=this.system.traits;traits.dv=traits.dv.filter(v=>v!=="ice");}
  }
  if(key(this)==="adamantoise"&&active(find(this,"turtleShell047"))){
   // Foundry resets prepared data from _source on each preparation. Preserve stronger existing resistances.
   const traits=this.system.traits,existing=traits.eres.value,rows=existing.filter(r=>r.types.length!==1||!elements.includes(r.types[0]));
   for(const e of elements)rows.push({amount:Math.max(15,...existing.filter(r=>r.types.length===1&&r.types[0]===e).map(r=>r.amount)),types:[e],operator:true});
   traits.eres.value=rows;traits.fastHealing=String(Math.max(10,Number(traits.fastHealing)||0));
  }
  return prep.apply(this,args);
 };
});
Hooks.on("pf1PreActionUse",u=>{
 const a=u.actor,i=u.item,k=key(a);if(!k||!a.isOwner||i?.actor!==a)return;
 const stop=msg=>{ui.notifications.warn(msg);return false;};
 if(k==="cagnazzo"){const sh=active(find(a,"shell047")),burst=active(find(a,"drowned047")),water=active(a.items.find(i=>i.flags?.[scope]?.barrierState?.group==="cagnazzo"));
  if(sh&&!["Shellbound: leave","Shellbound: recovery"].includes(i.name))return stop("Leave Shellbound to take another action.");
  if(!sh&&["Shellbound: leave","Shellbound: recovery"].includes(i.name))return stop("Cagnazzo is not retracted.");
  if(i.name.startsWith("Drowning Aura")&&!water)return stop("Gather Water first.");
  if((u.action?.name?.startsWith("Drowned King:")||i.name==="Drowning Aura: Drowned King damage")&&!burst)return stop("Drowned King is inactive.");
 }
 if(k==="carbuncle-lord-of-the-ruby"&&["Rainbow Ruby","Searing Light"].includes(i.name)&&a.system.attributes.hp.value*2>=a.system.attributes.hp.max)return stop("Requires less than half of maximum HP.");
 if(k==="adamantoise"){
  const b=find(a,"turtleShell047"),hp=a.system.attributes.hp;
  if(active(b)&&i!==b)return stop("End Turtle Shell before taking another action.");
  if(i===b&&!active(b))return stop("Shell recovery requires an active Turtle Shell.");
  if(i.name==="Turtle Shell"&&hp.value*2>=hp.max)return stop("Turtle Shell requires less than half of maximum HP.");
 }
 if(k==="viridian-head"&&i.name==="Bite"&&u.action&&active(find(a,"chill047"))!==(u.action.name==="Bite: Chill"))return stop("Select the bite mode matching the current Chill state.");
 if(k==="belias-the-gigas"&&i.name==="Flame Bolt"&&u.action&&active(find(a,"gigasFlame047"))!==u.action.name.includes("Gigas Flame"))return stop("Select the Flame Bolt mode matching the current Gigas Flame state.");
 if(k==="behemoth"&&counter(u)){
  if(a.statuses?.has("silenced")||a.system.attributes?.conditions?.silenced)return stop("Counter Magic cannot be used while silenced.");
  const stamp=round(a);if(stamp&&i.getFlag(scope,"counterRound047")===stamp)return stop("Counter Magic was already used this round.");
 }
});
Hooks.on("pf1PostActionUse",async u=>{
 const a=u.actor,i=u.item,k=key(a);if(!k||!a.isOwner||i?.actor!==a)return;
 if(k==="behemoth"&&counter(u)){const stamp=round(a);if(stamp)await i.setFlag(scope,"counterRound047",stamp);}
 if(k==="cagnazzo"){const b=i.name==="Gather Water"?a.items.find(i=>i.flags?.[scope]?.barrierState?.group==="cagnazzo"):i.name==="Drowned King"?find(a,"drowned047"):["Shellbound","Shellbound: leave"].includes(i.name)?find(a,"shell047"):null;if(b)await b.update({"system.active":i.name!=="Shellbound: leave"});}
 const t=toggles[k];if(t?.[0]===i.name){const b=find(a,t[1]);if(b&&!active(b))await b.update({"system.active":true});}
});
