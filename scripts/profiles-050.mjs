import {methodOwner} from "./document-methods.mjs";
const scope="ffd20-expanded-bestiary",builder="ffd20-bestiary-builder";
export const elements=["fire","ice","wind","earth","lightning","water","light","dark"];
const staticProfiles={
 "obliterator-mk-i":[["fire"]],"obliterator-mk-ii":[["fire"]],
 "red-dragon-phoenix-cave":[["fire"],["ice","water"]],
 "skull-dragon-kefka-s-tower":[["dark"],["fire","light"]],
 "storm-dragon-mt-zozo":[["wind"],["lightning"],["earth"]],
 ainsel:[["fire","ice","lightning","wind"],["earth"]],rubicante:[["fire"],["ice","water"]]
};
const key=a=>a?.flags?.[builder]?.review050;
const live=i=>i.type==="buff"&&i.system.active===true&&!i.system.disabled;
const modes=a=>(a?.items??[]).filter(i=>live(i)&&i.flags?.[scope]?.moabTemplate);
export function profile050(a){
 if(!a)return null;
 const name=key(a),base=staticProfiles[name];
 const prism=a.items?.some(i=>live(i)&&i.flags?.[scope]?.moabPrismaticAbsorption);
 const forms=name==="moab"?modes(a).map(i=>i.flags[scope]):[];
 if(!prism&&!base&&!forms.length)return null;
 const cloak=name==="rubicante"&&a.items.some(i=>i.name==="Cloak closed"&&live(i));
 const absorb=[...new Set([...(base?.[0]??[]),...(prism?elements:[]),...(cloak?["ice","water"]:[]),...forms.flatMap(f=>f.absorb)])];
 return {absorb,weak:cloak?[]:base?.[1]??[],half:[...new Set([...(base?.[2]??[]),...forms.flatMap(f=>f.halfResistances)])],immune:cloak?elements.filter(t=>!absorb.includes(t)):[]};
}
export function spellBlock050(use){
 const {actor:a,item:i}=use;if(!a||i?.actor!==a||i.type!=="spell"||key(a)!=="moab")return;
 const f=i.flags?.[builder];if(f?.referenceOnly050)return "No published spell rules were located for "+i.name+". This chart entry is reference only.";
 const followUp=["Retaliate on a melee hit","Later round: repeat save","Later round: continuing damage"].includes(use.action?.name);
 if(f?.moabTemplate&&!followUp&&!modes(a).some(b=>b.flags[scope].moabTemplate===f.moabTemplate))return "Activate the "+f.moabTemplate+" elemental template to cast "+i.name+".";
}
export function guardReferenceSpell(proto,warn){
 const use=proto.use;
 proto.use=function(...args){
  if(this.type==="spell"&&this.flags?.[builder]?.referenceOnly050&&key(this.actor)==="moab"){
   warn(spellBlock050({actor:this.actor,item:this}));return Promise.resolve();
  }
  return use.apply(this,args);
 };
}
export function addTemplateER(app,a,rows){
 if(key(a)!=="moab"||!modes(a).some(b=>b.flags[scope].resistAll===20))return rows;
 const next=rows.slice();
 for(const type of elements){
  if(!app.instances.some(i=>i.types.has?.(type)||Array.from(i.types).includes(type)))continue;
  const i=next.findIndex(r=>r.isER&&r.typeIds?.size===1&&r.typeIds.has(type));
  if(i>=0&&next[i].amount>=20)continue;
  const row={...a._parseResistanceEntry({amount:20,types:[type],operator:true},"eres"),value:20,types:[type],typeIds:new Set([type]),active:true,visible:true,disabled:false,hasGeneric:false};
  if(i<0)next.push(row);else next[i]=row;
  app.resistanceIds.add(type);
 }return next;
}
if(globalThis.Hooks){
 Hooks.on("pf1PreActionUse",use=>{const reason=spellBlock050(use);if(reason){ui.notifications.warn(reason);return false;}});
 Hooks.once("ready",()=>{if(game.system.id!=="ffd20")return;
  // Actionless spells use Item.use directly and can otherwise spend MP before a chat card.
  guardReferenceSpell(methodOwner(CONFIG.Item,"spell","use"),message=>ui.notifications.warn(message));
  const p=ffd20.applications.ApplyDamage.prototype,old=p.getResistances;
  p.getResistances=function(actor,kind="dr"){const rows=old.call(this,actor,kind);return kind==="eres"?addTemplateER(this,actor,rows):rows;};
 });
}
