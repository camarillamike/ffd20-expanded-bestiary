const MODULE_ID = "ffd20-expanded-bestiary";
const MODULE_VERSION = "0.1.31";
const AUTO_IMPORT_SETTING = "autoImportOnUpdate";
const IMPORTED_VERSION_SETTING = "importedSourceVersion";
const MANAGED_PACKS = {
  "ffd20-expanded-bestiary_aberrations": "FFD20 Expanded - Aberrations",
  "ffd20-expanded-bestiary_animals": "FFD20 Expanded - Animals",
  "ffd20-expanded-bestiary_bosses": "FFD20 Expanded - Bosses",
  "ffd20-expanded-bestiary_constructs": "FFD20 Expanded - Constructs",
  "ffd20-expanded-bestiary_dragons": "FFD20 Expanded - Dragons",
  "ffd20-expanded-bestiary_fey": "FFD20 Expanded - Fey",
  "ffd20-expanded-bestiary_humanoids": "FFD20 Expanded - Humanoids",
  "ffd20-expanded-bestiary_magical-beasts": "FFD20 Expanded - Magical Beasts",
  "ffd20-expanded-bestiary_monstrous-humanoids": "FFD20 Expanded - Monstrous Humanoids",
  "ffd20-expanded-bestiary_npcs": "FFD20 Expanded - NPCs",
  "ffd20-expanded-bestiary_oozes": "FFD20 Expanded - Oozes",
  "ffd20-expanded-bestiary_outsiders": "FFD20 Expanded - Outsiders",
  "ffd20-expanded-bestiary_plants": "FFD20 Expanded - Plants",
  "ffd20-expanded-bestiary_undead": "FFD20 Expanded - Undead",
  "ffd20-expanded-bestiary_vermin": "FFD20 Expanded - Vermin"
};
const COMPENDIUM_LOOKUP_TYPES = new Set(["feat", "buff", "class", "race", "spell", "weapon", "equipment", "consumable", "loot", "attack"]);
const REPLACEABLE_GENERATED_FLAGS = [
  "generatedRace",
  "generatedClassLevel",
  "generatedFeat",
  "generatedSpecialQuality",
  "generatedDefensiveAbility",
  "generatedSpellReference",
  "generatedInventoryItem",
];
const PACKAGE_PREFERENCE = ["ffd20-content", "pf-content-for-ffd20", "ffd20"];
const LOOKUP_ALIASES = {
  "water power staff": ["power staff"],
  "tiny butcher knife": ["fillet knife"],
  "lantern": ["hooded lantern"],
  "cure potion": ["potion of cure", "cure potion"],
  "bullets": ["sling bullet"],
  "bolts": ["crossbow bolt"],
  "arrows": ["arrow"],
};

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, AUTO_IMPORT_SETTING, {
    name: "Auto-import bestiary updates",
    hint: "Automatically refresh this module's managed compendium packs when the module source version changes.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, IMPORTED_VERSION_SETTING, {
    scope: "world",
    config: false,
    type: String,
    default: "",
  });
});

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

function generatedFlags(item) {
  return item.flags?.["ffd20-bestiary-builder"] ?? {};
}

function isReplaceableGeneratedItem(item) {
  const flags = generatedFlags(item);
  return REPLACEABLE_GENERATED_FLAGS.some((flag) => flags[flag]);
}

function lookupTypesForItem(item) {
  const flags = generatedFlags(item);
  if (Array.isArray(flags.lookupTypes) && flags.lookupTypes.length) return flags.lookupTypes;
  return item.type ? [item.type] : [];
}

function lookupSubTypesForItem(item) {
  const flags = generatedFlags(item);
  return Array.isArray(flags.lookupSubTypes) ? flags.lookupSubTypes : [];
}

function entrySubType(entry) {
  return foundry.utils.getProperty(entry, "system.subType") ?? foundry.utils.getProperty(entry, "system.classSubType") ?? "";
}

function packageRank(pack) {
  const packageName = pack.collection?.split(".")[0] ?? pack.metadata?.packageName ?? "";
  const index = PACKAGE_PREFERENCE.indexOf(packageName);
  return index >= 0 ? index : PACKAGE_PREFERENCE.length;
}

async function buildItemLookup() {
  const lookup = new Map();
  const packs = game.packs.filter((pack) => pack.documentName === "Item");
  for (const pack of packs) {
    const metadata = pack.metadata ?? {};
    if (metadata.system && metadata.system !== "ffd20") continue;

    const index = await pack.getIndex({ fields: ["name", "type", "system.subType", "system.classSubType"] });
    for (const entry of index) {
      if (!COMPENDIUM_LOOKUP_TYPES.has(entry.type)) continue;
      const key = normalizeName(entry.name);
      if (!key) continue;
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key).push({ pack, entry });
    }
  }
  return lookup;
}

function genericMaceName(actor) {
  const attack = (actor.items ?? []).find((candidate) =>
    candidate.type === "attack" && normalizeName(candidate.name) === "mace"
  );
  const damage = normalizeName(generatedFlags(attack).generatedNaturalAttack?.damageFormula);
  const size = foundry.utils.getProperty(actor, "system.traits.size") ?? "med";
  const heavyDamageBySize = { fine: "1d2", dim: "1d3", tiny: "1d4", sm: "1d6", med: "1d8", lg: "2d6", huge: "3d6", grg: "4d6", col: "6d6" };
  return damage === heavyDamageBySize[size] ? "heavy mace" : "light mace";
}

function lookupNamesForItem(item, actor) {
  const flags = generatedFlags(item);
  const requested = normalizeName(flags.lookupName ?? item.name);
  const names = [requested, ...(LOOKUP_ALIASES[requested] ?? [])];
  if (requested === "mace") names.push(genericMaceName(actor));
  const parameterizedFeat = requested.match(/^(weapon focus|skill focus)\s*\(.+\)$/);
  if (parameterizedFeat) names.push(parameterizedFeat[1]);
  return [...new Set(names.map(normalizeName).filter(Boolean))];
}

function findLookupMatch(item, lookup, actor) {
  const requestedTypes = lookupTypesForItem(item);
  const requestedSubTypes = lookupSubTypesForItem(item);
  const candidates = lookupNamesForItem(item, actor).flatMap((name, aliasRank) =>
    (lookup.get(name) ?? []).map((candidate) => ({ ...candidate, aliasRank }))
  ).filter(({ entry }) => {
    if (requestedTypes.length && !requestedTypes.includes(entry.type)) return false;
    if (requestedSubTypes.length && !requestedSubTypes.includes(entrySubType(entry))) return false;
    return true;
  });
  if (!candidates.length) return null;
  return candidates
    .slice()
    .sort((a, b) => {
      const aliasDelta = a.aliasRank - b.aliasRank;
      if (aliasDelta !== 0) return aliasDelta;
      const packageDelta = packageRank(a.pack) - packageRank(b.pack);
      if (packageDelta !== 0) return packageDelta;
      return a.pack.collection.localeCompare(b.pack.collection);
    })[0];
}

function applyPlaceholderDetails(source, item) {
  const flags = generatedFlags(item);
  source._id = item._id;
  source.flags = foundry.utils.mergeObject(source.flags ?? {}, item.flags ?? {}, { inplace: false });
  source.flags[MODULE_ID] = {
    ...(source.flags[MODULE_ID] ?? {}),
    compendiumHydrated: true,
    generatedFallback: item,
  };

  if (flags.generatedInventoryItem && source.system && item.system?.quantity) {
    source.system.quantity = item.system.quantity;
  }
  if (flags.generatedInventoryItem && flags.broken && source.system) {
    source.system.broken = true;
  }
  if (flags.generatedInventoryItem && source.system) {
    const requested = normalizeName(flags.lookupName ?? flags.name ?? item.name);
    if (requested === "water power staff") {
      source.name = "Water Power Staff";
      source.system.tag = "water-power-staff";
      for (const action of source.system.actions ?? []) {
        for (const part of action.damage?.parts ?? []) part.types = ["water"];
      }
    } else if (requested === "tiny butcher knife") {
      source.name = "Tiny Butcher Knife";
      source.system.size = "tiny";
      for (const action of source.system.actions ?? []) {
        action.ability = foundry.utils.mergeObject(action.ability ?? {}, { attack: "dex", damage: "str", damageMult: 1, critRange: 18, critMult: 2 }, { inplace: false });
        for (const part of action.damage?.parts ?? []) part.types = ["slashing"];
      }
    } else if (requested === "lantern") {
      source.name = "Lantern";
    }
  }
  if (flags.generatedFeat && /^(weapon focus|skill focus)\s*\(.+\)$/i.test(item.name)) {
    source.name = item.name;
    if (source.system) {
      source.system.tag = normalizeName(item.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const selection = item.name.match(/\(([^)]+)\)/)?.[1];
      if (selection) {
        source.system.contextNotes ??= [];
        source.system.contextNotes.push({ target: "attack", text: `Selected option: ${selection}.` });
      }
    }
  }
  if (flags.configuredUses && source.system) {
    source.system.uses = foundry.utils.mergeObject(source.system.uses ?? {}, flags.configuredUses, { inplace: false });
  }
  if (flags.generatedClassLevel && source.system) {
    if (Number.isFinite(item.system?.level)) source.system.level = item.system.level;
    if (Number.isFinite(item.system?.hp)) source.system.hp = item.system.hp;
    if (item.system?.classCastingStat) source.system.classCastingStat = item.system.classCastingStat;
    if (item.system?.classBaseMPTypes) source.system.classBaseMPTypes = item.system.classBaseMPTypes;
    if (item.system?.classBaseMPauto) source.system.classBaseMPauto = item.system.classBaseMPauto;
    if (Number.isFinite(item.system?.mp)) source.system.mp = item.system.mp;
    if (item.system?.casting) source.system.casting = foundry.utils.mergeObject(source.system.casting ?? {}, item.system.casting, { inplace: false });
    source.system.changes = [...(source.system.changes ?? []), ...(item.system?.changes ?? [])];
    source.system.contextNotes = [...(source.system.contextNotes ?? []), ...(item.system?.contextNotes ?? [])];
  }
  if (flags.generatedRace && source.system) {
    if (item.system?.creatureTypes?.length) source.system.creatureTypes = item.system.creatureTypes;
    if (item.system?.creatureSubtypes?.length) source.system.creatureSubtypes = item.system.creatureSubtypes;
  }
  if (flags.generatedSpellReference && source.system) {
    if (item.system?.spellbook) source.system.spellbook = item.system.spellbook;
    if (Number.isFinite(item.system?.level)) source.system.level = item.system.level;
    if (item.system?.atWill) source.system.atWill = true;
    if (item.system?.preparation?.max) source.system.preparation = item.system.preparation;
    if (item.system?.uses?.per) source.system.uses = foundry.utils.mergeObject(source.system.uses ?? {}, item.system.uses, { inplace: false });
  }

  return source;
}

async function hydrateGeneratedItems(actor, lookup) {
  const hydrated = [];
  const report = [];

  for (const item of actor.items ?? []) {
    if (!isReplaceableGeneratedItem(item)) {
      hydrated.push(item);
      continue;
    }

    const match = findLookupMatch(item, lookup, actor);
    if (!match) {
      hydrated.push(item);
      const flags = generatedFlags(item);
      const customGenerated = flags.generatedRace || flags.generatedSpecialQuality || flags.generatedDefensiveAbility;
      report.push({ actor: actor.name, item: item.name, type: item.type, status: customGenerated ? "custom-generated" : "generated-fallback" });
      continue;
    }

    const source = applyPlaceholderDetails((await match.pack.getDocument(match.entry._id)).toObject(), item);
    source.flags[MODULE_ID].sourcePack = match.pack.collection;
    source.flags[MODULE_ID].sourceId = match.entry._id;

    hydrated.push(source);
    report.push({ actor: actor.name, item: item.name, status: "compendium", type: match.entry.type, pack: match.pack.collection });
  }

  actor.items = hydrated;
  const classItem = hydrated.find((item) => generatedFlags(item).generatedClassLevel && item.type === "class");
  if (classItem?.system?.tag) {
    for (const book of Object.values(actor.system?.attributes?.spells?.spellbooks ?? {})) {
      if (!book?.inUse || book.class === "_hd") continue;
      book.class = classItem.system.tag;
      book.name = classItem.name;
      if (classItem.system.classCastingStat && classItem.system.classCastingStat !== "noncaster") {
        book.ability = classItem.system.classCastingStat;
      }
    }
  }
  return report;
}

async function prepareActorsForImport(actors) {
  const lookup = await buildItemLookup();
  const report = [];
  for (const actor of actors) {
    report.push(...(await hydrateGeneratedItems(actor, lookup)));
  }
  console.log("FF D20 Expanded Bestiary | Compendium lookup report", report);
  return report;
}

function packId(packName) {
  return `${MODULE_ID}.${packName}`;
}

function getManagedPack(packName) {
  const pack = game.packs.get(packId(packName));
  if (!pack) throw new Error(`Compendium pack not found: ${packId(packName)}`);
  return pack;
}

function packFolders(pack) {
  const folders = pack.folders;
  if (!folders) return [];
  if (Array.isArray(folders)) return folders;
  if (Array.isArray(folders.contents)) return folders.contents;
  if (typeof folders.values === "function") return Array.from(folders.values());
  return [];
}

function actorFamily(actor) {
  return String(foundry.utils.getProperty(actor, `flags.${MODULE_ID}.parsed.family`) ?? "").trim();
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

async function clearPackFolders(pack) {
  const ids = packFolders(pack).map((folder) => folder.id ?? folder._id).filter(Boolean);
  if (ids.length) await Folder.deleteDocuments(ids, { pack: pack.collection });
  return ids.length;
}

async function assignFamilyFolders(pack, actors) {
  const familyNames = [...new Set(actors.map(actorFamily).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (!familyNames.length) return [];

  const existing = new Map(
    packFolders(pack)
      .filter((folder) => folder.type === "Actor")
      .map((folder) => [folder.name, folder])
  );
  const missing = familyNames.filter((familyName) => !existing.has(familyName));
  const created = missing.length
    ? await Folder.createDocuments(
        missing.map((familyName) => ({
          name: familyName,
          type: "Actor",
          color: "#777777",
          flags: {
            [MODULE_ID]: {
              generatedFamilyFolder: true,
            },
          },
        })),
        { pack: pack.collection }
      )
    : [];

  for (const folder of created) existing.set(folder.name, folder);
  for (const actor of actors) {
    const familyName = actorFamily(actor);
    if (!familyName) continue;
    const folder = existing.get(familyName);
    if (folder) actor.folder = folder.id ?? folder._id;
  }
  return familyNames;
}

export async function importActors({ clear = true } = {}) {
  if (game.system.id !== "ffd20") {
    throw new Error(`This importer expects the ffd20 system, but the active system is "${game.system.id}".`);
  }
  if (!game.user.isGM) throw new Error("Only a GM can import actors into a compendium.");

  const managedPackNames = Object.keys(MANAGED_PACKS);
  const packs = new Map(managedPackNames.map((name) => [name, getManagedPack(name)]));
  for (const pack of packs.values()) await unlockPack(pack);

  const manifest = await fetchJson("source/actors.json");
  const actorsByPack = new Map();
  const allActors = [];
  for (const entry of manifest.actors) {
    const actor = await fetchJson(`source/actors/${entry.file}`);
    const packName = entry.pack && packs.has(entry.pack) ? entry.pack : managedPackNames[0];
    if (!actorsByPack.has(packName)) actorsByPack.set(packName, []);
    actorsByPack.get(packName).push(actor);
    allActors.push(actor);
  }
  const hydrationReport = await prepareActorsForImport(allActors);
  const fallbacks = hydrationReport.filter((entry) => entry.status === "generated-fallback");
  if (fallbacks.length) {
    const names = [...new Set(fallbacks.map((entry) => entry.item))];
    ui.notifications.warn(
      "FFD20 Bestiary: " + fallbacks.length + " item lookup(s) used generated fallbacks. Check the console report. Missing: "
        + names.slice(0, 8).join(", ") + (names.length > 8 ? ", ..." : ""),
      { permanent: true }
    );
  }

  let removed = 0;
  if (clear) {
    for (const pack of packs.values()) {
      removed += await clearPack(pack);
      await clearPackFolders(pack);
    }
  }

  const created = [];
  const familyFolders = {};
  for (const [packName, actors] of actorsByPack) {
    const pack = packs.get(packName);
    familyFolders[packName] = await assignFamilyFolders(pack, actors);
    created.push(...(await Actor.createDocuments(actors, { pack: pack.collection })));
  }

  ui.notifications.info(`FFD20 Bestiary import complete: ${created.length} actor(s), ${removed} old actor(s) removed.`);
  console.log("FFD20 Bestiary Generated | Import complete", { created: created.length, removed, packs: [...actorsByPack.keys()], familyFolders });
  await game.settings.set(MODULE_ID, IMPORTED_VERSION_SETTING, MODULE_VERSION);
  return { created, removed, packs };
}

async function managedPackActorCount() {
  let total = 0;
  for (const packName of Object.keys(MANAGED_PACKS)) {
    const pack = getManagedPack(packName);
    const index = await pack.getIndex({ fields: ["name"] });
    total += index.size;
  }
  return total;
}

async function importActorsIfNeeded({ emptyOnly = false } = {}) {
  if (game.system.id !== "ffd20" || !game.user.isGM) return;
  if (!game.settings.get(MODULE_ID, AUTO_IMPORT_SETTING)) {
    console.log("FF D20 Expanded Bestiary | Automatic import disabled by setting.");
    return;
  }

  let total = 0;
  try {
    total = await managedPackActorCount();
  } catch (error) {
    console.warn("FF D20 Expanded Bestiary | Compendium pack check failed", error);
    return;
  }

  const importedVersion = game.settings.get(MODULE_ID, IMPORTED_VERSION_SETTING) ?? "";
  const shouldImport = total === 0 || (!emptyOnly && importedVersion !== MODULE_VERSION);

  if (!shouldImport) {
    console.log("FF D20 Expanded Bestiary | Managed packs already match packaged source; skipping automatic import.", {
      count: total,
      importedVersion,
      moduleVersion: MODULE_VERSION,
    });
    return;
  }

  try {
    const reason = total === 0 ? "empty-packs" : `source-version-changed:${importedVersion || "never"}->${MODULE_VERSION}`;
    console.log("FF D20 Expanded Bestiary | Automatic import starting.", { reason, count: total });
    await importActors({ clear: total > 0 });
  } catch (error) {
    console.error("FF D20 Expanded Bestiary | Automatic import failed", error);
    ui.notifications.error("FF D20 Expanded Bestiary automatic import failed. See console for details.");
  }
}

async function importActorsIfEmpty() {
  return importActorsIfNeeded({ emptyOnly: true });
}

Hooks.once("ready", async () => {
  globalThis.ffd20ExpandedBestiary = {
    importActors,
    importActorsIfEmpty,
    importActorsIfNeeded,
  };
  console.log("FF D20 Expanded Bestiary | Importer ready. Run: await ffd20ExpandedBestiary.importActors()");
  await importActorsIfNeeded();
});
