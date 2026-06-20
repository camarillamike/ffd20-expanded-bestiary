const MODULE_ID = "ffd20-expanded-bestiary";
const PACK_ID = `${MODULE_ID}.ffd20-expanded-bestiary`;

async function fetchJson(path) {
  const response = await fetch(`modules/${MODULE_ID}/${path}`);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  return response.json();
}

async function unlockPack(pack) {
  if (pack.locked) await pack.configure({ locked: false });
}

async function clearPack(pack) {
  const index = await pack.getIndex({ fields: ["name"] });
  const ids = index.map((entry) => entry._id);
  if (ids.length) await Actor.deleteDocuments(ids, { pack: pack.collection });
  return ids.length;
}

export async function importActors({ clear = true } = {}) {
  if (game.system.id !== "ffd20") {
    throw new Error(`This importer expects the ffd20 system, but the active system is "${game.system.id}".`);
  }
  if (!game.user.isGM) throw new Error("Only a GM can import actors into a compendium.");

  const pack = game.packs.get(PACK_ID);
  if (!pack) throw new Error(`Compendium pack not found: ${PACK_ID}`);

  await unlockPack(pack);
  const manifest = await fetchJson("source/actors.json");
  const actors = [];
  for (const entry of manifest.actors) {
    actors.push(await fetchJson(`source/actors/${entry.file}`));
  }

  const removed = clear ? await clearPack(pack) : 0;
  const created = await Actor.createDocuments(actors, { pack: pack.collection });
  ui.notifications.info(`FFD20 Bestiary import complete: ${created.length} actor(s), ${removed} old actor(s) removed.`);
  console.log("FFD20 Bestiary Generated | Import complete", { created: created.length, removed, pack: pack.collection });
  return { created, removed, pack };
}

async function importActorsIfEmpty() {
  if (game.system.id !== "ffd20" || !game.user.isGM) return;

  const pack = game.packs.get(PACK_ID);
  if (!pack) {
    console.warn(`FF D20 Expanded Bestiary | Compendium pack not found: ${PACK_ID}`);
    return;
  }

  const index = await pack.getIndex({ fields: ["name"] });
  if (index.size > 0) {
    console.log("FF D20 Expanded Bestiary | Pack already contains actors; skipping automatic import.", {
      count: index.size,
      pack: pack.collection,
    });
    return;
  }

  try {
    await importActors({ clear: false });
  } catch (error) {
    console.error("FF D20 Expanded Bestiary | Automatic import failed", error);
    ui.notifications.error("FF D20 Expanded Bestiary automatic import failed. See console for details.");
  }
}

Hooks.once("ready", async () => {
  globalThis.ffd20ExpandedBestiary = {
    importActors,
    importActorsIfEmpty,
  };
  console.log("FF D20 Expanded Bestiary | Importer ready. Run: await ffd20ExpandedBestiary.importActors()");
  await importActorsIfEmpty();
});
