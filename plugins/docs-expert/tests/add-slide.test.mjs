import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createSlideFromLayout,
  duplicateSlide,
  getNextSlideNumber,
  parseSource,
} from "../skills/pptx/scripts/add_slide.mjs";

const scriptPath = fileURLToPath(new URL("../skills/pptx/scripts/add_slide.mjs", import.meta.url));

function createUnpackedFixture() {
  const dir = mkdtempSync(join(tmpdir(), "pptx-add-slide-"));
  mkdirSync(join(dir, "ppt", "slides", "_rels"), { recursive: true });
  mkdirSync(join(dir, "ppt", "_rels"), { recursive: true });
  mkdirSync(join(dir, "ppt", "slideLayouts"), { recursive: true });
  writeFileSync(
    join(dir, "[Content_Types].xml"),
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
  );
  writeFileSync(
    join(dir, "ppt", "_rels", "presentation.xml.rels"),
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/></Relationships>',
  );
  writeFileSync(
    join(dir, "ppt", "presentation.xml"),
    '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>',
  );
  writeFileSync(join(dir, "ppt", "slides", "slide1.xml"), "<p:sld>source</p:sld>");
  writeFileSync(
    join(dir, "ppt", "slides", "_rels", "slide1.xml.rels"),
    '<Relationships><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/><Relationship Id="rId2" Type="image" Target="../media/image1.png"/></Relationships>',
  );
  writeFileSync(join(dir, "ppt", "slideLayouts", "slideLayout1.xml"), "<p:sldLayout/>");
  return dir;
}

test("parseSource routes layouts and normal slides", () => {
  assert.deepEqual(parseSource("slideLayout2.xml"), { sourceType: "layout", layoutFile: "slideLayout2.xml" });
  assert.deepEqual(parseSource("slide2.xml"), { sourceType: "slide", layoutFile: null });
});

test("duplicateSlide copies slide, removes notes relationship, and updates package metadata", () => {
  const dir = createUnpackedFixture();
  assert.equal(getNextSlideNumber(join(dir, "ppt", "slides")), 2);
  const result = duplicateSlide(dir, "slide1.xml");

  assert.deepEqual(result, { dest: "slide2.xml", source: "slide1.xml", rid: "rId2", nextSlideId: 257 });
  assert.equal(readFileSync(join(dir, "ppt", "slides", "slide2.xml"), "utf8"), "<p:sld>source</p:sld>");
  assert.ok(!readFileSync(join(dir, "ppt", "slides", "_rels", "slide2.xml.rels"), "utf8").includes("notesSlide"));
  assert.ok(readFileSync(join(dir, "[Content_Types].xml"), "utf8").includes("/ppt/slides/slide2.xml"));
  assert.ok(readFileSync(join(dir, "ppt", "_rels", "presentation.xml.rels"), "utf8").includes('Target="slides/slide2.xml"'));
});

test("createSlideFromLayout creates a blank slide with a slideLayout relationship", () => {
  const dir = createUnpackedFixture();
  const result = createSlideFromLayout(dir, "slideLayout1.xml");

  assert.deepEqual(result, { dest: "slide2.xml", source: "slideLayout1.xml", rid: "rId2", nextSlideId: 257 });
  assert.ok(readFileSync(join(dir, "ppt", "slides", "slide2.xml"), "utf8").includes("<p:sld"));
  assert.ok(readFileSync(join(dir, "ppt", "slides", "_rels", "slide2.xml.rels"), "utf8").includes("../slideLayouts/slideLayout1.xml"));
});

test("add_slide.mjs CLI duplicates a slide", () => {
  const dir = createUnpackedFixture();
  const result = spawnSync(process.execPath, [scriptPath, dir, "slide1.xml"], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Created slide2\.xml from slide1\.xml/);
  assert.ok(existsSync(join(dir, "ppt", "slides", "slide2.xml")));
});
