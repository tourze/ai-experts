import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { getBoundingBoxMessages } from "../skills/pdf/scripts/check_bounding_boxes.mjs";
import { hasFillableFields } from "../skills/pdf/scripts/check_fillable_fields.mjs";

test("check_bounding_boxes.mjs reports valid fields", () => {
  const messages = getBoundingBoxMessages({
    form_fields: [
      {
        description: "Name",
        page_number: 1,
        label_bounding_box: [0, 0, 40, 10],
        entry_bounding_box: [50, 0, 120, 18],
        entry_text: { font_size: 12 },
      },
    ],
  });

  assert.deepEqual(messages, ["Read 1 fields", "SUCCESS: All bounding boxes are valid"]);
});

test("check_bounding_boxes.mjs reports overlaps and short entry boxes", () => {
  const messages = getBoundingBoxMessages({
    form_fields: [
      {
        description: "Email",
        page_number: 2,
        label_bounding_box: [0, 0, 40, 12],
        entry_bounding_box: [20, 0, 80, 8],
        entry_text: { font_size: 10 },
      },
    ],
  });

  assert.match(messages.join("\n"), /intersection between label and entry/);
  assert.match(messages.join("\n"), /too short for the text content/);
});

test("check_fillable_fields.mjs detects AcroForm field arrays", () => {
  assert.equal(
    hasFillableFields(Buffer.from("%PDF-1.7\n1 0 obj << /AcroForm << /Fields [2 0 R] >> >> endobj")),
    true,
  );
  assert.equal(
    hasFillableFields(Buffer.from("%PDF-1.7\n1 0 obj << /AcroForm << /Fields [] >> >> endobj")),
    false,
  );
  assert.equal(hasFillableFields(Buffer.from("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj")), false);
});

test("check_fillable_fields.mjs CLI prints the legacy fillable message", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "docs-pdf-"));
  const pdfPath = join(tempDir, "form.pdf");
  writeFileSync(pdfPath, "%PDF-1.7\n1 0 obj << /AcroForm << /Fields [2 0 R] >> >> endobj");

  const result = spawnSync("node", ["plugins/docs-expert/skills/pdf/scripts/check_fillable_fields.mjs", pdfPath], {
    cwd: process.cwd(),
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /This PDF has fillable form fields/);
});
