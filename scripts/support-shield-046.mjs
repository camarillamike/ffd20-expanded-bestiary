const scope = "ffd20-expanded-bestiary";
const shieldRow = Symbol("Support Droid shield damage choice");

function grants(actor) {
  const grants = new Map();
  for (const item of actor.items ?? []) {
    if (item.type !== "buff" || item.system.active !== true || item.system.disabled) continue;
    const grant = item.flags?.[scope]?.supportDroidShieldDR;
    const old = item.flags?.["ffd20-bestiary-builder"];
    // Already-transferred .45 buffs retain their authoring identity, not their original item ID.
    if (grant === 4 || (grant === undefined && old?.curatedBuff === true &&
        old.semantic045 === "kobold-engineer/state/Support Droid shield")) {
      grants.set("shield",{key:"shield",name:"Support Droid shield",amount:4,bypass:""});
    }
    const temp=item.flags?.[scope]?.temporaryDR;
    if (temp && Number.isInteger(temp.amount) && temp.amount>0 && ["","bludgeoning","magic"].includes(temp.bypass)) {
      const key=temp.amount+"/"+temp.bypass;
      grants.set(key,{key,name:item.name,amount:temp.amount,bypass:temp.bypass});
    }
  }
  return grants;
}

function applies(app) {
  return app.hasPhysical && !app.isHealing && !app.damageOptions.asManaDamage;
}

function choices(app,actor) {
  if(!applies(app))return [];
  return [...grants(actor).values()].map(({key,name,amount,bypass})=>{
    const types=bypass?[bypass]:[],row=actor._parseResistanceEntry({amount,types,operator:true},"dr");
    const out={...row,[shieldRow]:key,value:amount,active:true,visible:true,types,typeIds:new Set(types),
      hasGeneric:!bypass,label:row.label+" ("+name+"; does not stack)"};
    // The dialog-level instances still contain raw type sets, not per-target physical/energy booleans.
    out.active=bypass==="magic"?!app.isMagic:!bypass||app.instances.some(i=>![...i.types].includes(bypass));
    return out;
  });
}

Hooks.once("ready", () => {
  if (game.system.id !== "ffd20") return;
  const p = ffd20.applications.ApplyDamage.prototype;
  const {getResistances, _processReductions, _getTargetDamageOptions} = p;
  if (![getResistances, _processReductions, _getTargetDamageOptions].every(fn => typeof fn === "function")) {
    console.error("FFd20 Expanded Bestiary | Support Droid shield: incompatible damage calculator.");
    return;
  }

  p.getResistances = function(actor, kind = "dr") {
    const rows = getResistances.call(this, actor, kind);
    return kind==="dr"?[...rows,...choices(this,actor)]:rows;
  };

  p._processReductions = function(target, instances, rows, physical) {
    const temp=physical?rows.filter(r=>r[shieldRow]):[];
    if (!temp.length) return _processReductions.call(this, target, instances, rows, physical);
    const eligible = instances.filter(i => i.isPhysical && !i.isEnergy && i.total > 0);
    const live=grants(target.actor);let best=null,floor=0;
    for(const row of temp){
      if(!row.active||!live.has(row[shieldRow]))continue;
      const allowed=Math.min(row.value,eligible.reduce((sum,i)=>sum+(this._isReducedBy(target,i,row,true)?i.total:0),0));
      if(allowed>floor){floor=allowed;best=row;}
    }
    // FFd20 adds active DR rows. Resolve all original choices unchanged, then supply
    // only the missing portion of the shield's single allowance for this hit.
    const existing = _processReductions.call(this, target, instances, rows.filter(r=>!r[shieldRow]), true);
    if (!best || existing >= floor) return existing;
    return existing + _processReductions.call(this, target, eligible, [{...best, value:floor - existing}], true);
  };

  p._getTargetDamageOptions = function(target) {
    // The ally may lose or gain the buff while an adjustment dialog is open.
    const old=new Map(target.dr.filter(r=>r[shieldRow]).map(r=>[r[shieldRow],r]));
    const next=choices(this,target.actor);
    if (old.size!==next.length||next.some(r=>!old.has(r[shieldRow]))) {
      target.dr = target.dr.filter(r => !r[shieldRow]);
      for(const row of next)target.dr.push(old.get(row[shieldRow])??row);
      this._refreshTarget(target.uuid);
    }
    return _getTargetDamageOptions.call(this, target);
  };
});
