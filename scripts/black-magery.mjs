const scope="ffd20-expanded-bestiary";

export function addBlackMageryDie(action,data,parts) {
  const item=action.item;
  const faces=item?.flags?.[scope]?.blackMageryDice?.[action.id];
  if(!Number.isInteger(faces) || item.type!=="spell" || !(item.system.level>=1) || item.spellbook?.class!=="blackMage") return;
  // FFd20 rolls critical damage as repeats in addition to the original damage roll.
  if(data.attackCount>0 || data.critCount>0 || data.critMult>1 || !parts[0]) return;
  const items=item.actor?.items;
  const ranks=items?.find(i=>i.type==="feat" && i.isActive && i.flags?.[scope]?.blackMageryRanks)?.flags[scope].blackMageryRanks;
  if(![1,2].includes(ranks) || !items.some(i=>i.type==="buff" && i.isActive && i.flags?.[scope]?.blackMageryToggle)) return;
  // Keep the die in the original typed instance, so resistance is not applied a second time.
  parts[0].extra.push(ranks+"d"+faces+"[Black Magery]");
}

Hooks.on("pf1PreDamageRoll",addBlackMageryDie);
