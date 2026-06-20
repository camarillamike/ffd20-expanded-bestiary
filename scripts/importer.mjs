const MODULE_ID = "ffd20-expanded-bestiary";
const PACK_ID = `${MODULE_ID}.ffd20-expanded-bestiary`;
const COMPENDIUM_LOOKUP_TYPES = new Set(["feat", "buff", "class", "race", "spell"]);
const REPLACEABLE_GENERATED_FLAGS = [
  "generatedFeat",
  "generatedRawSpecialAbility",
];

async function fetchJson(path) {
  const response = await fetch(`modules/${MODULE_ID}/${path}`);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  return response.json();
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isReplaceableGeneratedItem(item) {
  const flags = item.flags?.["ffd20-bestiary-builder"] ?? {};
  return REPLACEABLE_GENERATED_FLAGS.some((flag) => flags[flag]);
}

async function buildItemLookup() {
  const lookup = new Map();
  const packs = game.packs.filter((pack) => pack.documentName === "Item");
  for (const pack of packs) {
    const metadata = pack.metadata ?? {};
    if (metadata.system && metadata.system !== "ffd20") continue;

    const index = await pack.getIndex({ fields: ["name", "type", "system.subType"] });
    for (const entry of index) {
      if (!COMPENDIUM_LOOKUP_TYPES.has(entry.type)) continue;
      const key = normalizeName(entry.name);
      if (!key || lookup.has(key)) continue;
      lookup.set(key, {
        pack,
        entry,
      });
    }
  }
  return lookup;
}

async function hydrateGeneratedItems(actor, lookup) {
  const hydrated = [];
  const report = [];

  for (const item of actor.items ?? []) {
    if (!isReplaceableGeneratedItem(item)) {
      hydrated.push(item);
      continue;
    }

    const match = lookup.get(normalizeName(item.name));
    if (!match) {
      hydrated.push(item);
      report.push({ actor: actor.name, item: item.name, status: "generated-fallback" });
      continue;
    }

    const source = (await match.pack.getDocument(match.entry._id)).toObject();
    source._id = item._id;
    source.name = item.name;
    source.flags = foundry.utils.mergeObject(source.flags ?? {}, item.flags ?? {}, { inplace: false });
    source.flags["ffd20-expanded-bestiary"] = {
      compendiumHydrated: true,
      sourcePack: match.pack.collection,
      sourceId: match.entry._id,
      generatedFallback: item,
    };

    hydrated.push(source);
    report.push({ actor: actor.name, item: item.name, status: "compendium", pack: match.pack.collection });
  }

  actor.items = hydrated;
  return report;
}

async function prepareActorsForImport(actors) {
  const lookup = await buildItemLookup();
  const report = [];
  for (const actor of actors) {
    report.push(...(await hydrateGeneratedItems(actor, lookup)));
  }
  console.log("FF D20 Expanded Bestiary | Compendium lookup report", report);
  return actors;
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
  await prepareActorsForImport(actors);

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
