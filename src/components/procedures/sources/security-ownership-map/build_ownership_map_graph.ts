import { writeFileSync } from "node:fs";

function mapAdd(map: any, key: any, value: any): any {
  map.set(key, (map.get(key) || 0) + value);
}

function getNestedMap(root: any, key: any): any {
  if (!root.has(key)) root.set(key, new Map());
  return root.get(key);
}

export function computeCommunityOwners(
  communityFiles: any,
  people: any,
  filePeopleTouches: any,
  filePeopleRecency: any,
  filePeopleSensitive: any,
  topN: any,
): any {
  const touchesByPerson = new Map();
  const recencyByPerson = new Map();
  const sensitiveByPerson = new Map();
  for (const path of communityFiles) {
    for (const [person, touches] of getNestedMap(filePeopleTouches, path))
      mapAdd(touchesByPerson, person, touches);
    for (const [person, recency] of getNestedMap(filePeopleRecency, path))
      mapAdd(recencyByPerson, person, recency);
    for (const [person, weight] of getNestedMap(filePeopleSensitive, path))
      mapAdd(sensitiveByPerson, person, weight);
  }
  const totalTouches = [...touchesByPerson.values()].reduce(
    (sum: any, value: any) => sum + value,
    0,
  );
  const totalRecency = [...recencyByPerson.values()].reduce(
    (sum: any, value: any) => sum + value,
    0,
  );
  const totalSensitive = [...sensitiveByPerson.values()].reduce(
    (sum: any, value: any) => sum + value,
    0,
  );
  const topMaintainers = [...touchesByPerson.entries()]
    .sort((left: any, right: any) => right[1] - left[1])
    .slice(0, topN)
    .map(([personId, touches]: any) => {
      const person = people.get(personId) || {};
      const recency = recencyByPerson.get(personId) || 0;
      const sensitive = sensitiveByPerson.get(personId) || 0;
      return {
        person_id: personId,
        name: person.name || personId,
        touches,
        touch_share: totalTouches
          ? Number((touches / totalTouches).toFixed(4))
          : 0,
        recency_share: totalRecency
          ? Number((recency / totalRecency).toFixed(4))
          : 0,
        sensitive_share: totalSensitive
          ? Number((sensitive / totalSensitive).toFixed(4))
          : 0,
        primary_tz_offset: person.primary_tz_offset || "",
      };
    });
  return {
    bus_factor: touchesByPerson.size,
    owner_count: touchesByPerson.size,
    totals: {
      touches: totalTouches,
      recency_weight: Number(totalRecency.toFixed(6)),
      sensitive_weight: Number(totalSensitive.toFixed(2)),
    },
    top_maintainers: topMaintainers,
  };
}
export function connectedComponents(nodes: any, edgeRows: any): any {
  const adjacency = new Map<any, Set<any>>(
    nodes.map((node: any) => [node, new Set<any>()]),
  );
  for (const [fileA, fileB] of edgeRows.map((row: any) => [row[0], row[1]])) {
    if (!adjacency.has(fileA)) adjacency.set(fileA, new Set());
    if (!adjacency.has(fileB)) adjacency.set(fileB, new Set());
    const neighborsA = adjacency.get(fileA);
    const neighborsB = adjacency.get(fileB);
    if (neighborsA) neighborsA.add(fileB);
    if (neighborsB) neighborsB.add(fileA);
  }
  const seen = new Set();
  const components: any[] = [];
  for (const node of [...adjacency.keys()].sort()) {
    if (seen.has(node)) continue;
    const stack: any[] = [node];
    const component: any[] = [];
    seen.add(node);
    while (stack.length) {
      const current = stack.pop();
      if (current == null) continue;
      component.push(current);
      for (const next of adjacency.get(current) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    components.push(component.sort());
  }
  return components.sort(
    (left: any, right: any) =>
      right.length - left.length || left[0].localeCompare(right[0]),
  );
}
export function buildGraphJson(
  nodes: any,
  edges: any,
  communityIndex: any,
  communityMetadata: any,
): any {
  return {
    directed: false,
    multigraph: false,
    graph: { community_maintainers: communityMetadata },
    nodes: nodes.map((id: any) => ({
      id,
      community_id: communityIndex.get(id),
    })),
    edges,
  };
}
function xmlEscape(value: any): any {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
export function writeGraphml(path: any, nodes: any, edges: any): any {
  const lines: any[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
    '  <graph edgedefault="undirected">',
  ];
  for (const node of nodes) lines.push(`    <node id="${xmlEscape(node)}"/>`);
  edges.forEach((edge: any, index: any) => {
    lines.push(
      `    <edge id="e${index}" source="${xmlEscape(edge.source)}" target="${xmlEscape(edge.target)}"/>`,
    );
  });
  lines.push("  </graph>", "</graphml>");
  writeFileSync(path, lines.join("\n"), "utf8");
}
