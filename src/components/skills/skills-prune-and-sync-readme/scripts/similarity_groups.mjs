const STOP_WORDS = new Set("a an and api app application best by code default for from guide help how in is it its must of on or skill skills task tasks the this to tool tools use used using when with workflow".split(" "));

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[`*_"]/g, " ")
    .replace(/[^0-9a-z\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const tokens = new Set(normalizeText(text).match(/[0-9a-z\u4e00-\u9fff]+/g) || []);
  return new Set([...tokens].filter((token) => !STOP_WORDS.has(token) && token.length > 1));
}

function jaccardSimilarity(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  const overlap = [...left].filter((token) => right.has(token)).length;
  return overlap / new Set([...left, ...right]).size;
}

function levenshteinRatio(left, right) {
  if (left === right) return 1;
  if (!left || !right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous.splice(0, previous.length, ...current);
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

export function buildSimilarityGroups(records) {
  const groups = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const left = records[index];
    for (const right of records.slice(index + 1)) {
      const leftPrefix = left.folder.split("-", 1)[0];
      const rightPrefix = right.folder.split("-", 1)[0];
      const nameOverlap = jaccardSimilarity(tokenize(left.folder), tokenize(right.folder));
      const descOverlap = jaccardSimilarity(tokenize(left.description), tokenize(right.description));
      const leftCollection = left.collection || "components";
      const rightCollection = right.collection || "components";
      const sameCollection = leftCollection === rightCollection;
      const crossCollection = leftCollection !== rightCollection;
      const sameFamily = leftPrefix === rightPrefix;
      const sharedPrefix = left.folder.startsWith(right.folder) || right.folder.startsWith(left.folder);
      const sameCollectionCandidate = sameCollection && (sameFamily || sharedPrefix || nameOverlap >= 0.35);
      const crossCollectionNear = crossCollection && nameOverlap >= 0.25 && descOverlap >= 0.24;
      if (!sameCollectionCandidate && !crossCollectionNear) continue;
      const descRatio = levenshteinRatio(normalizeText(left.description), normalizeText(right.description));
      const sameCollectionNear = sameCollectionCandidate && (descOverlap >= 0.16 || descRatio >= 0.42);
      if (!sameCollectionNear && !crossCollectionNear) continue;
      const scope = sameCollectionNear ? "same_component_family" : "cross_component_overlap";
      const groupKey = sameCollectionNear
        ? `${leftCollection}/${sameFamily ? leftPrefix : "mixed"}`
        : `cross-component/${[leftCollection, rightCollection].sort().join("+")}`;
      if (!groups.has(groupKey)) groups.set(groupKey, { group: groupKey, scope, skills: new Set(), pairs: [] });
      const group = groups.get(groupKey);
      group.skills.add(left.id);
      group.skills.add(right.id);
      group.pairs.push({
        skills: [left.id, right.id],
        score: Number(((nameOverlap + descOverlap + descRatio) / 3).toFixed(2)),
        reason: `desc_ratio=${descRatio.toFixed(2)}, name_overlap=${nameOverlap.toFixed(2)}, desc_overlap=${descOverlap.toFixed(2)}`,
      });
    }
  }
  return [...groups.values()]
    .map((group) => ({ ...group, skills: [...group.skills].sort(), pairs: group.pairs.sort((left, right) => right.score - left.score).slice(0, 8) }))
    .sort((left, right) => (right.pairs[0]?.score || 0) - (left.pairs[0]?.score || 0))
    .slice(0, 30);
}
