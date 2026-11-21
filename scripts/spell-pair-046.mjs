const scope="ffd20-expanded-bestiary";
export function choicesFor(actor){
 const out=[];
 for(const item of actor.items)if(item.type==="spell"&&!item.system.disabled)
  for(const action of item.actions??[])if(action.activation?.type==="standard"&&action.uses?.spellPointCost!=="0"&&!action.name?.startsWith("Following round"))
   out.push({item,action});
 return out;
}
export async function castPair(actor,rows,ids,shared={}){
 if(!actor.isOwner||ids.length!==2)return;
 for(const idx of ids){const c=rows[idx];if(!c||c.item.actor!==actor||c.item.system.disabled||c.action.activation?.type!=="standard")throw Error("Choose two owned standard-action spells.");
  const result=await c.item.use({actionId:c.action.id,skipDialog:false,token:shared.token,rollMode:shared.rollMode});
  if(!result)break;
 }
}
Hooks.on("pf1PostActionUse",async use=>{
 const a=use.actor,i=use.item,flag=i?.flags?.[scope]?.spellPair046;
 if(!flag||!a?.isOwner||i.actor!==a||i.type!=="feat"||a.flags?.["ffd20-bestiary-builder"]?.review046!==flag||use.action?.activation?.type!=="standard")return;
 const rows=choicesFor(a);
 if(!rows.length){ui.notifications.warn("No eligible owned standard-action spells.");return;}
 const opts=rows.map((c,j)=>{const el=document.createElement("option");el.value=j;el.textContent=c.item.name+" ("+c.action.name+")";return el.outerHTML;}).join("");
 const ids=await foundry.applications.api.DialogV2.wait({window:{title:i.name},content:["First spell","Second spell"].map((label,j)=>'<label>'+label+' <select name="spell'+j+'">'+opts+'</select></label>').join(""),
  buttons:[{action:"cast",label:"Cast pair",default:true,callback:(_e,button)=>[0,1].map(j=>Number(button.form.elements["spell"+j].value))},{action:"cancel",label:"Close",callback:()=>null}],rejectClose:false});
 if(Array.isArray(ids))await castPair(a,rows,ids,use.shared);
});
