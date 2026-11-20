import {BOMB_FORMS,TIER_TWO_NAMES,TIER_THREE_NAMES} from "./bomb-forms.mjs";
import {createBombVariant} from "./create-bomb.mjs";

async function chooseForm(actor) {
  const names=({"bomb-t2":TIER_TWO_NAMES,"bomb-t3":TIER_THREE_NAMES})[actor.flags["ffd20-expanded-bestiary"].bombSource];
  const form = await foundry.applications.api.DialogV2.wait({
    window:{title:"Create Bomb Form"},
    content:'<label>New world actor <select name="form">'+Object.keys(BOMB_FORMS).map(s=>'<option value="'+s+'">'+(names?names[s]+" ("+s+")":s)+'</option>').join("")+'</select></label>',
    buttons:[{action:"create",label:"Create Actor",default:true,callback:(_event,button)=>button.form.elements.form.value}],
    rejectClose:false,
  });
  if (!form) return;
  try {
    const result = await createBombVariant(actor.flags["ffd20-expanded-bestiary"].bombSource, form);
    result.sheet.render(true);
  } catch (e) { ui.notifications.error(e.message); }
}
const eligible = app => game.user.isGM && app.actor?.flags?.["ffd20-expanded-bestiary"]?.bombSource;
// FFd20 uses legacy actor sheets; also support v13 ApplicationV2 actor sheets.
Hooks.on("getActorSheetPFHeaderButtons",(app,buttons)=>{
  if (eligible(app)) buttons.unshift({label:"Create Bomb Form",class:"bomb-form",icon:"fas fa-fire",onclick:()=>chooseForm(app.actor)});
});
Hooks.on("getHeaderControlsApplicationV2",(app,controls)=>{
  if (eligible(app)) controls.push({label:"Create Bomb Form",icon:"fas fa-fire",action:"bestiaryBombForm",onClick:()=>chooseForm(app.actor)});
});
