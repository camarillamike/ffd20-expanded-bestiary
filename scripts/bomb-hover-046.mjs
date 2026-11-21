const scope="ffd20-expanded-bestiary",field="hoverOffset046",origin=t=>t.flags?.[scope]?.[field];
const isBomb=a=>a?.flags?.[scope]?.bombSource==="bomb-t4";
const halo=a=>a?.items?.find(i=>i.type==="buff"&&i.system.active&&!i.system.disabled&&i.flags?.[scope]?.temporaryFloatFeet===2&&!i.flags[scope].floatEnded);
const awake=a=>!["unconscious","dead"].some(k=>a.statuses?.has(k)||a.system?.attributes?.conditions?.[k]===true);
function desired(a,scene,previous){
 if(!a)return null;
 const grant=halo(a);if(!isBomb(a)&&!grant&&!previous)return null;
 const u=String(scene?.grid?.units??"").toLowerCase().trim(),factor=/^(?:ft\.?|foot|feet)$/.test(u)?1:/^(?:m|metres?|meters?)$/.test(u)?0.3048:null;
 if(factor===null)return null;
 const f=a.items?.find(i=>i.type==="feat"&&i.flags?.[scope]?.floatFeet===5);
 return awake(a)?(f?5:grant?2:0)*factor:0;
}
function adjustment(t,a){
 const old=Number(origin(t)??0),value=desired(a,t.parent,old),base=Number(t.elevation??0);
 if(value===null||!Number.isFinite(old)||!Number.isFinite(base)||value===old)return;
 return {elevation:base-old+value,["flags."+scope+"."+field]:value};
}
Hooks.on("preCreateToken",(t,data)=>{
 if(game.system.id!=="ffd20")return;
 const v=adjustment(t,t.actor??game.actors.get(data.actorId));if(v)t.updateSource(v);
});
const queues=new Map();
async function adjustActor(a,fromGrant=false){
 if(game.system.id!=="ffd20"||!a||(!isBomb(a)&&!halo(a)&&fromGrant!==true)||!game.user.isGM||game.users.activeGM?.id!==game.user.id)return;
 const tokens=a.isToken?[a.token]:game.scenes.contents.flatMap(s=>s.tokens.filter(t=>t.actorLink&&t.actorId===a.id));
 await Promise.all(tokens.filter(Boolean).map(t=>{
  const prev=queues.get(t.uuid)??Promise.resolve(),job=prev.catch(()=>{}).then(async()=>{
   const delta=adjustment(t,t.actor??a);if(delta)await t.update(delta);
  });queues.set(t.uuid,job);return job.finally(()=>{if(queues.get(t.uuid)===job)queues.delete(t.uuid);});
 }));
}
Hooks.on("updateActor",adjustActor);
for(const event of ["createActiveEffect","updateActiveEffect","deleteActiveEffect"])
 Hooks.on(event,e=>adjustActor(e.parent?.documentName==="Actor"?e.parent:e.parent?.actor));
for(const event of ["createItem","updateItem","deleteItem"])Hooks.on(event,i=>{if(i.flags?.[scope]?.temporaryFloatFeet===2)return adjustActor(i.actor,true);});
Hooks.on("updateItem",async(i,delta,_o,user)=>{
 const a=i.actor;if(!isBomb(a)||!a.isOwner||user!==game.user.id||delta.system?.active!==true||i.type!=="buff"||!i.flags?.[scope]?.bombGrowthStage)return;
 const others=a.items.filter(s=>s.id!==i.id&&s.type==="buff"&&s.flags?.[scope]?.bombGrowthStage&&s.system.active).map(s=>({_id:s.id,"system.active":false}));
 if(others.length)await a.updateEmbeddedDocuments("Item",others);
});
