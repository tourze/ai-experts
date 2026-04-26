#!/usr/bin/env node

import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const RESOURCE_DIRS = ["media", "embeddings", "charts", "diagrams", "tags", "drawings", "ink"];
const RESOURCE_RELS_DIRS = ["charts", "diagrams", "drawings"];

function toPackagePath(root, filePath) {
  return relative(resolve(root), resolve(filePath)).split(/[\\/]+/).join("/");
}

function listFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) {
    return [];
  }

  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(next, predicate));
    } else if (predicate(next)) {
      out.push(next);
    }
  }
  return out;
}

function immediateFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(dir, entry.name))
    .filter(predicate);
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([\w:.-]+)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function relationshipTags(xml) {
  return [...xml.matchAll(/<Relationship\b[^>]*\/>/g)].map((match) => ({
    raw: match[0],
    attrs: parseAttributes(match[0]),
  }));
}

function removeRelationshipTags(xml, shouldRemove) {
  let changed = false;
  const next = xml.replace(/<Relationship\b[^>]*\/>/g, (tag) => {
    if (!shouldRemove(parseAttributes(tag))) {
      return tag;
    }
    changed = true;
    return "";
  });
  return { xml: next, changed };
}

function removeOverrideTags(xml, removedFiles) {
  let changed = false;
  const next = xml.replace(/<Override\b[^>]*\/>/g, (tag) => {
    const partName = (parseAttributes(tag).PartName ?? "").replace(/^\/+/, "");
    if (!removedFiles.has(partName)) {
      return tag;
    }
    changed = true;
    return "";
  });
  return { xml: next, changed };
}

function relationshipTargetPath(root, relsFile, target) {
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
    return null;
  }
  const targetPath = resolve(dirname(dirname(relsFile)), target);
  const rootPath = resolve(root);
  if (!targetPath.startsWith(rootPath)) {
    return null;
  }
  return toPackagePath(root, targetPath);
}

export function getSlidesInSlideIdList(unpackedDir) {
  const presPath = join(unpackedDir, "ppt", "presentation.xml");
  const presRelsPath = join(unpackedDir, "ppt", "_rels", "presentation.xml.rels");

  if (!existsSync(presPath) || !existsSync(presRelsPath)) {
    return new Set();
  }

  const ridToSlide = new Map();
  const relsXml = readFileSync(presRelsPath, "utf-8");
  for (const { attrs } of relationshipTags(relsXml)) {
    const rid = attrs.Id;
    const target = attrs.Target;
    const relType = attrs.Type ?? "";
    if (rid && target?.startsWith("slides/") && relType.includes("slide")) {
      ridToSlide.set(rid, target.replace("slides/", ""));
    }
  }

  const presXml = readFileSync(presPath, "utf-8");
  const referencedRids = [...presXml.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)].map(
    (match) => match[1],
  );

  return new Set(referencedRids.map((rid) => ridToSlide.get(rid)).filter(Boolean));
}

export function removeOrphanedSlides(unpackedDir) {
  const slidesDir = join(unpackedDir, "ppt", "slides");
  const slidesRelsDir = join(slidesDir, "_rels");
  const presRelsPath = join(unpackedDir, "ppt", "_rels", "presentation.xml.rels");

  if (!existsSync(slidesDir)) {
    return [];
  }

  const referencedSlides = getSlidesInSlideIdList(unpackedDir);
  const removed = [];

  for (const slideFile of immediateFiles(slidesDir, (file) => /^slide.*\.xml$/.test(basename(file)))) {
    if (referencedSlides.has(basename(slideFile))) {
      continue;
    }

    rmSync(slideFile);
    removed.push(toPackagePath(unpackedDir, slideFile));

    const relsFile = join(slidesRelsDir, `${basename(slideFile)}.rels`);
    if (existsSync(relsFile)) {
      rmSync(relsFile);
      removed.push(toPackagePath(unpackedDir, relsFile));
    }
  }

  if (removed.length > 0 && existsSync(presRelsPath)) {
    const relsXml = readFileSync(presRelsPath, "utf-8");
    const result = removeRelationshipTags(relsXml, (attrs) => {
      const target = attrs.Target ?? "";
      if (!target.startsWith("slides/")) {
        return false;
      }
      return !referencedSlides.has(target.replace("slides/", ""));
    });

    if (result.changed) {
      writeFileSync(presRelsPath, result.xml, "utf-8");
    }
  }

  return removed;
}

export function removeTrashDirectory(unpackedDir) {
  const trashDir = join(unpackedDir, "[trash]");
  const removed = [];

  if (!existsSync(trashDir) || !lstatSync(trashDir).isDirectory()) {
    return removed;
  }

  for (const filePath of immediateFiles(trashDir)) {
    removed.push(toPackagePath(unpackedDir, filePath));
    rmSync(filePath);
  }

  if (readdirSync(trashDir).length === 0) {
    rmdirSync(trashDir);
  }
  return removed;
}

export function getSlideReferencedFiles(unpackedDir) {
  const referenced = new Set();
  const slidesRelsDir = join(unpackedDir, "ppt", "slides", "_rels");

  for (const relsFile of immediateFiles(slidesRelsDir, (file) => file.endsWith(".rels"))) {
    const relsXml = readFileSync(relsFile, "utf-8");
    for (const { attrs } of relationshipTags(relsXml)) {
      const targetPath = relationshipTargetPath(unpackedDir, relsFile, attrs.Target);
      if (targetPath) {
        referenced.add(targetPath);
      }
    }
  }

  return referenced;
}

export function removeOrphanedRelsFiles(unpackedDir) {
  const removed = [];
  const slideReferenced = getSlideReferencedFiles(unpackedDir);

  for (const dirName of RESOURCE_RELS_DIRS) {
    const relsDir = join(unpackedDir, "ppt", dirName, "_rels");
    for (const relsFile of immediateFiles(relsDir, (file) => file.endsWith(".rels"))) {
      const resourceFile = join(dirname(relsDir), basename(relsFile).replace(/\.rels$/, ""));
      const resourceRelPath = toPackagePath(unpackedDir, resourceFile);

      if (!existsSync(resourceFile) || !slideReferenced.has(resourceRelPath)) {
        rmSync(relsFile);
        removed.push(toPackagePath(unpackedDir, relsFile));
      }
    }
  }

  return removed;
}

export function getReferencedFiles(unpackedDir) {
  const referenced = new Set();

  for (const relsFile of listFiles(unpackedDir, (file) => file.endsWith(".rels"))) {
    const relsXml = readFileSync(relsFile, "utf-8");
    for (const { attrs } of relationshipTags(relsXml)) {
      const targetPath = relationshipTargetPath(unpackedDir, relsFile, attrs.Target);
      if (targetPath) {
        referenced.add(targetPath);
      }
    }
  }

  return referenced;
}

export function removeOrphanedFiles(unpackedDir, referenced) {
  const removed = [];

  for (const dirName of RESOURCE_DIRS) {
    const dirPath = join(unpackedDir, "ppt", dirName);
    for (const filePath of immediateFiles(dirPath)) {
      const relPath = toPackagePath(unpackedDir, filePath);
      if (!referenced.has(relPath)) {
        rmSync(filePath);
        removed.push(relPath);
      }
    }
  }

  const themeDir = join(unpackedDir, "ppt", "theme");
  for (const filePath of immediateFiles(themeDir, (file) => /^theme.*\.xml$/.test(basename(file)))) {
    const relPath = toPackagePath(unpackedDir, filePath);
    if (!referenced.has(relPath)) {
      rmSync(filePath);
      removed.push(relPath);

      const themeRels = join(themeDir, "_rels", `${basename(filePath)}.rels`);
      if (existsSync(themeRels)) {
        rmSync(themeRels);
        removed.push(toPackagePath(unpackedDir, themeRels));
      }
    }
  }

  const notesDir = join(unpackedDir, "ppt", "notesSlides");
  for (const filePath of immediateFiles(notesDir, (file) => file.endsWith(".xml"))) {
    const relPath = toPackagePath(unpackedDir, filePath);
    if (!referenced.has(relPath)) {
      rmSync(filePath);
      removed.push(relPath);
    }
  }

  const notesRelsDir = join(notesDir, "_rels");
  for (const filePath of immediateFiles(notesRelsDir, (file) => file.endsWith(".rels"))) {
    const notesFile = join(notesDir, basename(filePath).replace(/\.rels$/, ""));
    if (!existsSync(notesFile)) {
      rmSync(filePath);
      removed.push(toPackagePath(unpackedDir, filePath));
    }
  }

  return removed;
}

export function updateContentTypes(unpackedDir, removedFiles) {
  const ctPath = join(unpackedDir, "[Content_Types].xml");
  if (!existsSync(ctPath)) {
    return;
  }

  const removedSet = new Set(removedFiles);
  const result = removeOverrideTags(readFileSync(ctPath, "utf-8"), removedSet);
  if (result.changed) {
    writeFileSync(ctPath, result.xml, "utf-8");
  }
}

export function cleanUnusedFiles(unpackedDir) {
  const allRemoved = [];

  allRemoved.push(...removeOrphanedSlides(unpackedDir));
  allRemoved.push(...removeTrashDirectory(unpackedDir));

  while (true) {
    const removedRels = removeOrphanedRelsFiles(unpackedDir);
    const referenced = getReferencedFiles(unpackedDir);
    const removedFiles = removeOrphanedFiles(unpackedDir, referenced);
    const totalRemoved = [...removedRels, ...removedFiles];

    if (totalRemoved.length === 0) {
      break;
    }

    allRemoved.push(...totalRemoved);
  }

  if (allRemoved.length > 0) {
    updateContentTypes(unpackedDir, allRemoved);
  }

  return allRemoved;
}

function usage() {
  console.error("Usage: node clean.mjs <unpacked_dir>");
  console.error("Example: node clean.mjs unpacked/");
}

async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    usage();
    return 1;
  }

  const unpackedDir = argv[0];
  if (!existsSync(unpackedDir)) {
    console.error(`Error: ${unpackedDir} not found`);
    return 1;
  }

  const removed = cleanUnusedFiles(unpackedDir);
  if (removed.length > 0) {
    console.log(`Removed ${removed.length} unreferenced files:`);
    for (const file of removed) {
      console.log(`  ${file}`);
    }
  } else {
    console.log("No unreferenced files found");
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (status) => {
      process.exitCode = status;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    },
  );
}
