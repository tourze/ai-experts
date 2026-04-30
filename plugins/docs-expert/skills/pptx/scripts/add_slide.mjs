#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SLIDE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</p:sld>`;

export function getNextSlideNumber(slidesDir) {
  const numbers = readdirSync(slidesDir)
    .map((name) => name.match(/^slide(\d+)\.xml$/))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

export function addToContentTypes(unpackedDir, dest) {
  const contentTypesPath = join(unpackedDir, "[Content_Types].xml");
  let contentTypes = readFileSync(contentTypesPath, "utf8");
  const newOverride = `<Override PartName="/ppt/slides/${dest}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;

  if (!contentTypes.includes(`/ppt/slides/${dest}`)) {
    contentTypes = contentTypes.replace("</Types>", `  ${newOverride}\n</Types>`);
    writeFileSync(contentTypesPath, contentTypes, "utf8");
  }
}

export function addToPresentationRels(unpackedDir, dest) {
  const presRelsPath = join(unpackedDir, "ppt", "_rels", "presentation.xml.rels");
  let presRels = readFileSync(presRelsPath, "utf8");
  const rids = [...presRels.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1]));
  const rid = `rId${rids.length ? Math.max(...rids) + 1 : 1}`;
  const newRel = `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/${dest}"/>`;

  if (!presRels.includes(`slides/${dest}`)) {
    presRels = presRels.replace("</Relationships>", `  ${newRel}\n</Relationships>`);
    writeFileSync(presRelsPath, presRels, "utf8");
  }
  return rid;
}

export function getNextSlideId(unpackedDir) {
  const presPath = join(unpackedDir, "ppt", "presentation.xml");
  const presContent = readFileSync(presPath, "utf8");
  const slideIds = [...presContent.matchAll(/<p:sldId[^>]*id="(\d+)"/g)].map((match) => Number(match[1]));
  return slideIds.length ? Math.max(...slideIds) + 1 : 256;
}

export function createSlideFromLayout(unpackedDir, layoutFile) {
  const slidesDir = join(unpackedDir, "ppt", "slides");
  const relsDir = join(slidesDir, "_rels");
  const layoutPath = join(unpackedDir, "ppt", "slideLayouts", layoutFile);

  if (!existsSync(layoutPath)) throw new Error(`${layoutPath} not found`);

  const nextNum = getNextSlideNumber(slidesDir);
  const dest = `slide${nextNum}.xml`;
  const destSlide = join(slidesDir, dest);
  const destRels = join(relsDir, `${dest}.rels`);

  writeFileSync(destSlide, SLIDE_XML, "utf8");
  mkdirSync(relsDir, { recursive: true });
  writeFileSync(
    destRels,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/${layoutFile}"/>
</Relationships>`,
    "utf8",
  );

  addToContentTypes(unpackedDir, dest);
  const rid = addToPresentationRels(unpackedDir, dest);
  const nextSlideId = getNextSlideId(unpackedDir);
  return { dest, source: layoutFile, rid, nextSlideId };
}

export function duplicateSlide(unpackedDir, source) {
  const slidesDir = join(unpackedDir, "ppt", "slides");
  const relsDir = join(slidesDir, "_rels");
  const sourceSlide = join(slidesDir, source);

  if (!existsSync(sourceSlide)) throw new Error(`${sourceSlide} not found`);

  const nextNum = getNextSlideNumber(slidesDir);
  const dest = `slide${nextNum}.xml`;
  const destSlide = join(slidesDir, dest);
  const sourceRels = join(relsDir, `${source}.rels`);
  const destRels = join(relsDir, `${dest}.rels`);

  copyFileSync(sourceSlide, destSlide);
  if (existsSync(sourceRels)) {
    copyFileSync(sourceRels, destRels);
    const cleaned = readFileSync(destRels, "utf8").replace(
      /\s*<Relationship[^>]*Type="[^"]*notesSlide"[^>]*\/>\s*/g,
      "\n",
    );
    writeFileSync(destRels, cleaned, "utf8");
  }

  addToContentTypes(unpackedDir, dest);
  const rid = addToPresentationRels(unpackedDir, dest);
  const nextSlideId = getNextSlideId(unpackedDir);
  return { dest, source, rid, nextSlideId };
}

export function parseSource(source) {
  if (source.startsWith("slideLayout") && source.endsWith(".xml")) {
    return { sourceType: "layout", layoutFile: source };
  }
  return { sourceType: "slide", layoutFile: null };
}

function writeUsage(stderr) {
  stderr.write("Usage: node add_slide.mjs <unpacked_dir> <source>\n\n");
  stderr.write("Source can be:\n");
  stderr.write("  slide2.xml        - duplicate an existing slide\n");
  stderr.write("  slideLayout2.xml  - create from a layout template\n\n");
  stderr.write("To see available layouts: ls <unpacked_dir>/ppt/slideLayouts/\n");
}

export function runCli(args = process.argv.slice(2), stdout = process.stdout, stderr = process.stderr) {
  if (args.length !== 2) {
    writeUsage(stderr);
    return 1;
  }

  const [unpackedDir, source] = args;
  if (!existsSync(unpackedDir)) {
    stderr.write(`Error: ${unpackedDir} not found\n`);
    return 1;
  }

  try {
    const { sourceType, layoutFile } = parseSource(source);
    const result = sourceType === "layout" ? createSlideFromLayout(unpackedDir, layoutFile) : duplicateSlide(unpackedDir, source);
    stdout.write(`Created ${result.dest} from ${result.source}\n`);
    stdout.write(`Add to presentation.xml <p:sldIdLst>: <p:sldId id="${result.nextSlideId}" r:id="${result.rid}"/>\n`);
    return 0;
  } catch (error) {
    stderr.write(`Error: ${error.message}\n`);
    return 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runCli();
}
