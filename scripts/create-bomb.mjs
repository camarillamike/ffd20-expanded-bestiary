import {BOMB_FORMS} from "./bomb-forms.mjs";

export async function createBombVariant(slug,form) {
  if(!game.user.isGM || !["bombino","cherry-bomb","bomb-t1","bomb-t2","bomb-t3"].includes(slug) || !Object.hasOwn(BOMB_FORMS,form)) throw Error("Invalid bomb form request.");
  const path="modules/ffd20-expanded-bestiary/variants/"+slug+"-"+form.toLowerCase()+".json";
  const response=await fetch(foundry.utils.getRoute(path));
  if(!response.ok) throw Error("Could not load the packaged bomb form: "+form);
  const actor=await response.json();
  return Actor.create(actor);
}
