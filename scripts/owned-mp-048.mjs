const scope="ffd20-bestiary-builder";
function cost(use){const a=use.actor,i=use.item;return a?.flags?.[scope]?.review048==="doomtrain-the-convoy-of-the-dead"&&i?.actor===a&&i.flags?.[scope]?.mpCost048===9&&i.name==="Saintly Beam"?9:0;}
Hooks.on("pf1PreActionUse",use=>{const mp=cost(use);if(mp&&Number(use.actor.system.attributes.mp.value)<mp){ui.notifications.warn("Saintly Beam requires 9 MP.");return false;}});
const paid=new WeakSet();
Hooks.on("pf1PostActionUse",async use=>{const mp=cost(use);if(!mp||!use.actor.isOwner||paid.has(use))return;paid.add(use);await use.actor.update({"system.attributes.mp.value":Math.max(0,Number(use.actor.system.attributes.mp.value)-mp)});});
