import {profile050, elements} from "./profiles-050.mjs";
import {group5Profile} from "./encounters-051-05.mjs";
import "./encounters-051-01.mjs";
const scope="ffd20-expanded-bestiary",builder="ffd20-bestiary-builder";
const unique=a=>[...new Set(a)];
const live=i=>i.type==="buff"&&i.system.active===true&&!i.system.disabled;
export function profile051(a){
 if(!a)return null;
 const previous=profile050(a),end=group5Profile(a);
 if(end)return end;
 const key=a.flags?.[builder]?.review051;
 const buffs=Array.from(a.items??[]).filter(i=>live(i)&&i.flags?.[scope]?.affinity051).map(i=>i.flags[scope].affinity051);
 const authored=key?a.flags?.[scope]:null;
 const dv=a.system?.traits?.dv;
 const base={absorb:authored?.absorbs??[],weak:key?Array.from(dv?.standard??dv??[]).filter(t=>elements.includes(t)):[],half:authored?.halfResistances??[]};
 if(!previous&&!buffs.length&&!Object.values(base).some(v=>v.length))return null;
 const values=[base,...buffs,...(previous?[previous]:[])];
 return Object.fromEntries(["absorb","weak","half","immune"].map(k=>[k,unique(values.flatMap(v=>v[k]??[]))]));
}
if(globalThis.Hooks)Hooks.on("updateItem",async(i,d,_opts,user)=>{
 const a=i.actor;
 if(user!==game.user.id||!a?.isOwner||d.system?.active!==true)return;
 const g5=!!i.flags?.[scope]?.g5Barrier;
 const isKaiserForm=b=>!!b.flags?.[scope]?.affinity051?.absorb||b.name==="Barrier Shift: Last Form";
 if(!g5&&(a.flags?.[builder]?.review051!=="kaiser-dragon-dragon-s-den"||!isKaiserForm(i)))return;
 const siblings=Array.from(a.items).filter(b=>b.id!==i.id&&live(b)&&(g5?b.flags?.[scope]?.g5Barrier:isKaiserForm(b)));
 if(siblings.length)await a.updateEmbeddedDocuments("Item",siblings.map(b=>({_id:b.id,"system.active":false})));
});

import "./encounters-051-02.mjs";
import "./encounters-051-04.mjs";
