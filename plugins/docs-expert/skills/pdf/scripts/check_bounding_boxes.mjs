#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

function rectsIntersect(left, right) {
  const disjointHorizontal = left[0] >= right[2] || left[2] <= right[0];
  const disjointVertical = left[1] >= right[3] || left[3] <= right[1];
  return !(disjointHorizontal || disjointVertical);
}

export function getBoundingBoxMessages(fields) {
  const messages = [];
  const formFields = fields.form_fields ?? [];
  messages.push(`Read ${formFields.length} fields`);

  const rectsAndFields = [];
  for (const field of formFields) {
    rectsAndFields.push({
      rect: field.label_bounding_box,
      rectType: "label",
      field,
    });
    rectsAndFields.push({
      rect: field.entry_bounding_box,
      rectType: "entry",
      field,
    });
  }

  let hasError = false;
  for (let i = 0; i < rectsAndFields.length; i += 1) {
    const left = rectsAndFields[i];

    for (let j = i + 1; j < rectsAndFields.length; j += 1) {
      const right = rectsAndFields[j];
      if (left.field.page_number !== right.field.page_number) {
        continue;
      }
      if (!rectsIntersect(left.rect, right.rect)) {
        continue;
      }

      hasError = true;
      if (left.field === right.field) {
        messages.push(
          `FAILURE: intersection between label and entry bounding boxes for \`${left.field.description}\` (${left.rect}, ${right.rect})`,
        );
      } else {
        messages.push(
          `FAILURE: intersection between ${left.rectType} bounding box for \`${left.field.description}\` (${left.rect}) and ${right.rectType} bounding box for \`${right.field.description}\` (${right.rect})`,
        );
      }

      if (messages.length >= 20) {
        messages.push("Aborting further checks; fix bounding boxes and try again");
        return messages;
      }
    }

    if (left.rectType !== "entry" || !left.field.entry_text) {
      continue;
    }

    const fontSize = left.field.entry_text.font_size ?? 14;
    const entryHeight = left.rect[3] - left.rect[1];
    if (entryHeight < fontSize) {
      hasError = true;
      messages.push(
        `FAILURE: entry bounding box height (${entryHeight}) for \`${left.field.description}\` is too short for the text content (font size: ${fontSize}). Increase the box height or decrease the font size.`,
      );
      if (messages.length >= 20) {
        messages.push("Aborting further checks; fix bounding boxes and try again");
        return messages;
      }
    }
  }

  if (!hasError) {
    messages.push("SUCCESS: All bounding boxes are valid");
  }
  return messages;
}

export async function loadBoundingBoxMessages(fieldsJsonPath) {
  const fields = JSON.parse(await readFile(fieldsJsonPath, "utf-8"));
  return getBoundingBoxMessages(fields);
}

async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    console.log("Usage: check_bounding_boxes.mjs [fields.json]");
    return 1;
  }

  const messages = await loadBoundingBoxMessages(argv[0]);
  for (const message of messages) {
    console.log(message);
  }
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
