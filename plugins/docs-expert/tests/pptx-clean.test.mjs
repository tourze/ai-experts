import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { cleanUnusedFiles } from "../skills/pptx/scripts/clean.mjs";

function writeFixture(root, relativePath, content = "") {
  const filePath = join(root, ...relativePath.split("/"));
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, content);
  return filePath;
}

test("clean.mjs removes orphaned slides, trash files, and content type overrides", () => {
  const root = mkdtempSync(join(tmpdir(), "docs-pptx-"));

  writeFixture(
    root,
    "ppt/presentation.xml",
    '<p:presentation><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>',
  );
  writeFixture(
    root,
    "ppt/_rels/presentation.xml.rels",
    [
      '<Relationships>',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>',
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>',
      "</Relationships>",
    ].join(""),
  );
  writeFixture(root, "ppt/slides/slide1.xml", "<slide/>");
  writeFixture(root, "ppt/slides/slide2.xml", "<slide/>");
  writeFixture(root, "ppt/slides/_rels/slide2.xml.rels", "<Relationships/>");
  writeFixture(root, "[trash]/unused.bin", "trash");
  writeFixture(
    root,
    "[Content_Types].xml",
    [
      '<Types>',
      '<Override PartName="/ppt/slides/slide1.xml" ContentType="slide"/>',
      '<Override PartName="/ppt/slides/slide2.xml" ContentType="slide"/>',
      '<Override PartName="/[trash]/unused.bin" ContentType="bin"/>',
      "</Types>",
    ].join(""),
  );

  const removed = cleanUnusedFiles(root);

  assert.deepEqual(
    removed.sort(),
    ["[trash]/unused.bin", "ppt/slides/_rels/slide2.xml.rels", "ppt/slides/slide2.xml"].sort(),
  );
  assert.equal(existsSync(join(root, "ppt", "slides", "slide1.xml")), true);
  assert.equal(existsSync(join(root, "ppt", "slides", "slide2.xml")), false);

  const rels = readFileSync(join(root, "ppt", "_rels", "presentation.xml.rels"), "utf-8");
  assert.doesNotMatch(rels, /slide2\.xml/);

  const contentTypes = readFileSync(join(root, "[Content_Types].xml"), "utf-8");
  assert.match(contentTypes, /slide1\.xml/);
  assert.doesNotMatch(contentTypes, /slide2\.xml/);
});
