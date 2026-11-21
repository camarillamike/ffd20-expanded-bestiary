const scope="ffd20-expanded-bestiary",flag="domeExposures";
const domes={leanan:{name:"Lava Dome",element:"fire",penalty:10},"grief-witch":{name:"Aqua Dome",element:"water",penalty:5}};
const rule=actor=>domes[actor?.flags?.["ffd20-bestiary-builder"]?.review046];
const time=()=>game.time.worldTime;
const fight=actor=>game.combat?.started&&game.combat.combatants.some(c=>c.actor?.uuid===actor.uuid)?game.combat:null;
const live=(s,actor)=>s.until>time()&&(!s.combat||fight(actor)?.id!==s.combat||fight(actor).round<s.endRound);
const locks=new WeakSet();
export async function recordDome(caster,target,failed){
 const config=rule(caster);if(!config||!game.user.isGM||!target.isOwner||!caster.uuid||!target.uuid)throw Error("A GM and an owned recipient are required.");
 if(locks.has(target))throw Error("This recipient is already resolving a dome.");
 locks.add(target);
 try{
  const now=time(),rows=(target.getFlag(scope,flag)??[]).filter(s=>s.immuneUntil>now);
  if(rows.some(s=>s.caster===caster.uuid))return {immune:true};
  const rounds=failed?(await new Roll("1d4").evaluate()).total:0,combat=fight(target);
  await target.setFlag(scope,flag,[...rows,{caster:caster.uuid,element:config.element,penalty:config.penalty,until:now+(CONFIG.time?.roundTime??6)*rounds,
   combat:combat?.id??null,endRound:(combat?.round??0)+rounds,immuneUntil:now+86400}]);
  return {immune:false,rounds};
 }finally{locks.delete(target);}
}
async function resolve(caster){
 const config=rule(caster),targets=[...new Set([...game.user.targets].map(t=>t.actor).filter(Boolean))];
 if(!targets.length)return ui.notifications.warn("Target the recipients of "+config.name+" first.");
 for(const target of targets){
  const choice=await foundry.applications.api.DialogV2.wait({window:{title:config.name+": "+target.name},content:"Record this recipient's saving throw.",
   buttons:[{action:"failure",label:"Failed save"},{action:"success",label:"Successful save"},{action:"skip",label:"Skip",default:true}],rejectClose:false});
  if(!["success","failure"].includes(choice))continue;
  const result=await recordDome(caster,target,choice==="failure");
  ui.notifications.info(target.name+": "+(result.immune?"already immune to this caster.":result.rounds?config.element+" resistance reduced for "+result.rounds+" rounds; immune to this caster for 24 hours.":"immune to this caster for 24 hours."));
 }
}
function button(app,buttons,modern){
 const a=app.actor,config=rule(a);if(!config||!game.user.isGM||a.pack)return;
 const run=()=>resolve(a).catch(e=>ui.notifications.error(e.message));
 buttons.unshift(modern?{action:"resolveBestiaryDome",label:"Resolve "+config.name,icon:"fas fa-shield",onClick:run}:
  {class:"resolve-bestiary-dome",label:"Resolve "+config.name,icon:"fas fa-shield",onclick:run});
}
Hooks.on("getActorSheetPFHeaderButtons",(a,b)=>button(a,b,false));
Hooks.on("getHeaderControlsApplicationV2",(a,b)=>button(a,b,true));
Hooks.once("ready",()=>{
 if(game.system.id!=="ffd20")return;
 const p=ffd20.applications.ApplyDamage.prototype,process=p._processReductions;
 p._processReductions=function(target,instances,rows,dr){
  const exposures=target.actor.flags?.[scope]?.[flag];
  if(dr||!exposures?.length||this.isHealing||this.asManaDamage)return process.call(this,target,instances,rows,dr);
  const penalties=new Map();
  for(const s of exposures)if(live(s,target.actor)&&["fire","water"].includes(s.element))
   penalties.set(s.element,Math.max(penalties.get(s.element)??0,s.penalty));
  if(!penalties.size)return process.call(this,target,instances,rows,dr);
  // A dual-type resistance can still protect the other element at its full value.
  // Limit the portion of this row spendable on the affected element, sharing one original budget.
  let reduced=0;
  for(const row of rows){
   if(!row.active||!(row.value>0))continue;
   let spent=0;const used=new Map();
   for(const i of instances){
    if(i.total<=0||!this._isReducedBy(target,i,row,false))continue;
    const type=i.typeIds.size===1?[...i.typeIds][0]:null,loss=penalties.get(type)??0;
    const allowance=Math.min(row.value-spent,row.value-loss-(used.get(type)??0));
    if(allowance<=0)continue;
    const n=process.call(this,target,[i],[{...row,value:allowance}],false);
    spent+=n;used.set(type,(used.get(type)??0)+n);
   }
   reduced+=spent;
  }
  return reduced;
 };
});
