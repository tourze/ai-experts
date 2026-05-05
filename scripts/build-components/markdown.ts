export function renderMarkdownBulletList(items) {
  return items.map((item) => {
    const lines = String(item).trim().split(/\r?\n/);
    return lines.map((line, index) => index === 0 ? `- ${line}` : `  ${line}`).join("\n");
  }).join("\n");
}

export function renderMarkdownTableCell(value) {
  return String(value).trim().replace(/\r?\n/g, "<br>").replaceAll("|", "\\|");
}

export function hasH2SectionMatching(source, predicate) {
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    const fence = /^\s*(?:```|~~~)/.test(line);
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading && predicate(heading[1].trim())) return true;
    if (fence) inFence = !inFence;
  }
  return false;
}

export function startsWithH2Section(source) {
  const firstLine = source.trimStart().split(/\r?\n/, 1)[0] ?? "";
  return /^##\s+\S/.test(firstLine);
}

export function insertSectionBeforeH2Matching(source, section, predicate) {
  if (!section) return source;
  const lines = source.split(/\r?\n/);
  let inFence = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = /^\s*(?:```|~~~)/.test(line);
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading && predicate(heading[1].trim())) {
      const before = lines.slice(0, index).join("\n").trimEnd();
      const after = lines.slice(index).join("\n").trimStart();
      return `${before}\n\n${section.trimEnd()}\n\n${after}`;
    }
    if (fence) inFence = !inFence;
  }
  return `${source.trimEnd()}\n\n${section.trimEnd()}`;
}
