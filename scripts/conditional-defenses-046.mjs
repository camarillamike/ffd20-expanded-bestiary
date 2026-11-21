// Can be copied unchanged into the release module. No Node or builder dependencies.
const scope="ffd20-expanded-bestiary";
const installed=Symbol.for(scope+".conditional-defenses-046-11");
const special=Symbol("046 compound material rule");
const owns=(actor,key)=>actor?.flags?.["ffd20-bestiary-builder"]?.review046===key;
function marked(actor,name){return [...(actor?.items??[])].some(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&i.flags?.[scope]?.group046Defense===name);}
export function bypassesCompound(isMagic,materials,hitTypes=[]){
 const t=new Set([...materials,...hitTypes]);
 return (isMagic||t.has("magic"))&&(t.has("adamantine")||t.has("crystal"));
}
export function installGroupDefenses046(proto){
 if(!proto||proto[installed])return false;
 const {getResistances,_isReducedBy,_processReductions}=proto;
 if(![getResistances,_isReducedBy,_processReductions].every(f=>typeof f==="function"))throw Error("FFd20 damage calculator interface changed");
 Object.defineProperty(proto,installed,{value:true});
 proto.getResistances=function(actor,kind="dr"){
  const rows=getResistances.call(this,actor,kind),amount=actor.flags?.[scope]?.compoundMagicMaterialDR;
  if(kind==="dr"&&owns(actor,"judge-magister")&&![...(actor.items??[])].some(i=>i.type==="equipment"&&i.system.equipped&&!i.system.disabled&&["lightArmor","mediumArmor","heavyArmor"].includes(i.system.equipmentSubtype)))return rows.filter(row=>row.amount!==6||row.typeIds?.size!==0);
  if(kind!=="dr"||!(owns(actor,"cie-th-edimmu")&&amount===5||(owns(actor,"cie-th-taxim")||owns(actor,"cie-th-penanggalan")||owns(actor,"cie-th-vampire")||owns(actor,"cie-th-ispusteke"))&&amount===10))return rows;
  for(const row of rows){if(row.amount!==amount||!row.operator||row.typeIds?.size!==2||!row.typeIds.has("adamantine")||!row.typeIds.has("crystal"))continue;
   row[special]=true;row.label=amount+"/magic and (adamantine or crystal)";
   row.active=this.hasPhysical&&this.instances.some(i=>!bypassesCompound(this.isMagic,this.materials??[],i.types??[]));row.disabled=!row.active;
  }return rows;
 };
 proto._isReducedBy=function(target,instance,row,physical){
  if(!physical||!row[special])return _isReducedBy.call(this,target,instance,row,physical);
  if(!instance.isPhysical||instance.isEnergy)return false;
  return !bypassesCompound(this.isMagic,this.materials??[],instance.typeIds??[]);
 };
 proto._processReductions=function(target,instances,rows,physical){
  const before=_processReductions.call(this,target,instances,rows,physical);
  if(!physical||this.isHealing||this.damageOptions?.asManaDamage||!owns(target.actor,"calcabrina")||!marked(target.actor,"brace-half-physical"))return before;
  // Round once per physical hit, not once per damage die or part.
  const parts=instances.filter(i=>i.isPhysical&&!i.isEnergy&&i.total>0),half=Math.ceil(parts.reduce((sum,i)=>sum+i.total,0)/2);
  let rest=half;for(const i of parts){const v=Math.min(i.total,rest);i.total-=v;rest-=v;if(!rest)break;}return before+half;
 };
 return true;
}
if(globalThis.Hooks?.once)Hooks.once("ready",()=>{if(game.system.id==="ffd20")installGroupDefenses046(ffd20.applications.ApplyDamage.prototype);});
