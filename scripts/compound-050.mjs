// FFd20's native resistance parser keeps only two types and spends each row separately.
const scope="ffd20-bestiary-builder", installed=Symbol.for("ffd20-expanded-bestiary.compound-050");
const marker=Symbol("compound DR 050");
const material=["adamantine","crystal"], magicMaterial=[["magic"],material];
const aligned=[["magic"],["good"],material], epicMaterial=[["epic"],["good"],material];
const neo=[["epic"],["good"],["chaotic"]];
const rules=new Map([
 ["cie-th-wladislaus",[15,aligned]],["cie-th-fomoire",[20,aligned]],["cie-th-yomi",[20,aligned]],
 ["cie-th-malebrache",[20,epicMaterial]],["cie-th-raktavija",[20,magicMaterial]]
]);
function activeBuff(actor,semantic,pool=false){
 return [...actor.items].some(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&
  i.flags?.[scope]?.review046Semantic===semantic&&(!pool||Number(i.system.uses?.value)>0));
}
function profile(actor){
 const key=actor?.flags?.[scope]?.review050;
 if(key==="neo-exdeath"){
  // Preserve the form's authored amount even when a GM renames the token/actor.
  const entry=actor.system.traits.dr.value.find(r=>[10,15,20].includes(r.amount)&&r.operator===false&&
   r.types.length===3&&neo.every(([t])=>r.types.includes(t)));
  if(entry)return {key,amount:entry.amount,groups:neo,base:entry.amount};
  return;
 }
 if(!rules.has(key))return;
 const [base,groups]=rules.get(key);
 const might=key==="cie-th-fomoire"&&activeBuff(actor,key+"/Murderous Might: active");
 const shield=key==="cie-th-raktavija"&&activeBuff(actor,key+"/Inertial Barrier III: shield",true);
 return {key,base,amount:might?15:base,groups:might||shield?null:groups};
}
function authored(row,{key,base}){
 const ids=row.typeIds;
 if(key==="cie-th-yomi"){
  if(row.custom)return row.type0?.name==="Nonstacking: bypass with good + magic + either material.";
  return row.amount===base&&row.operator===true&&aligned.some(g=>g.length===ids.size&&g.every(id=>ids.has(id)));
 }
 if(row.amount!==base)return false;
 if(key==="neo-exdeath")return !row.custom&&row.operator===false&&ids.has("epic")&&ids.has("good")&&
  [...ids].every(id=>neo.some(([t])=>t===id));
 const label=key==="cie-th-malebrache"?"adamantine and epic and good or crystal and epic and good":
  "magic AND "+(key==="cie-th-raktavija"?"":"good AND ")+"(adamantine OR crystal)";
 return row.custom&&row.type0?.name===label;
}
function applies(calc,part,groups){
 if(calc.isHealing||calc.damageOptions?.asManaDamage)return false;
 if(!groups)return true; // Replacement DR /-.
 const types=new Set([...(calc.materials??[]),...(part.typeIds??part.types??[])]);
 if(calc.isMagic)types.add("magic");
 return !groups.every(g=>g.some(t=>types.has(t)));
}
export function installCompound050(proto){
 if(!proto||proto[installed])return false;
 const {getResistances,_isReducedBy,_processReductions}=proto;
 if(![getResistances,_isReducedBy,_processReductions].every(f=>typeof f==="function"))throw Error("Unsupported FFd20 damage calculator");
 proto.getResistances=function(actor,kind="dr"){
  const rows=getResistances.call(this,actor,kind),p=kind==="dr"&&profile(actor);
  if(!p||!rows.some(r=>authored(r,p)))return rows;
  const types=p.groups?.flat()??[],label=p.groups?.map(g=>g.length===1?g[0]:"("+g.join(" or ")+")").join(" and ")??"-";
  for(const t of types)this.resistanceIds.add(t);
  const active=this.hasPhysical&&this.instances.some(i=>applies(this,i,p.groups)&&
   (i.standard?i.standard.some(t=>t.isPhysical):i.isPhysical!==false));
  return [...rows.filter(r=>!authored(r,p)),{[marker]:p,amount:p.amount,value:p.amount,label:p.amount+"/"+label,
   types,typeIds:new Set(types),isDR:true,isER:false,visible:true,active,disabled:!active,hasGeneric:!p.groups,operator:false}];
 };
 proto._isReducedBy=function(target,i,row,dr){
  if(!dr||!row[marker])return _isReducedBy.call(this,target,i,row,dr);
  return i.isPhysical&&!i.isEnergy&&applies(this,i,row[marker].groups);
 };
 proto._processReductions=function(target,parts,rows,dr){
  if(!dr||rows.length<2||!rows.some(r=>r[marker]))return _processReductions.call(this,target,parts,rows,dr);
  // Other native DR can coexist. Spend only the single most protective eligible pool for this hit.
  let best=null,max=0;
  for(const r of rows){
   if(!r.active||!(r.value>0))continue;
   const eligible=parts.reduce((sum,i)=>sum+(i.total>0&&this._isReducedBy(target,i,r,dr)?i.total:0),0);
   const prevented=Math.min(r.value,eligible);
   if(prevented>max){max=prevented;best=r;}
  }
  return _processReductions.call(this,target,parts,best?[best]:[],dr);
 };
 Object.defineProperty(proto,installed,{value:true});
 return true;
}
if(globalThis.Hooks?.once)Hooks.once("ready",()=>{if(game.system.id==="ffd20")installCompound050(ffd20.applications.ApplyDamage.prototype);});
