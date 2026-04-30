#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function indirectObjectBody(pdfText, objectNumber, generationNumber) {
  const pattern = new RegExp(
    `${escapeRegExp(objectNumber)}\\s+${escapeRegExp(generationNumber)}\\s+obj([\\s\\S]*?)endobj`,
  );
  return pdfText.match(pattern)?.[1] ?? "";
}

function fieldArrayHasEntries(value) {
  return value.trim().length > 0;
}

export function hasFillableFields(pdfBuffer) {
  const pdfText = pdfBuffer.toString("latin1");
  const acroFormIndex = pdfText.search(/\/AcroForm\b/);
  if (acroFormIndex === -1) {
    return false;
  }

  const acroFormWindow = pdfText.slice(acroFormIndex, acroFormIndex + 12000);
  const inlineFields = acroFormWindow.match(/\/Fields\s*\[([\s\S]*?)\]/);
  if (inlineFields) {
    return fieldArrayHasEntries(inlineFields[1]);
  }

  const indirectFields = acroFormWindow.match(/\/Fields\s+(\d+)\s+(\d+)\s+R/);
  if (indirectFields) {
    const [, objectNumber, generationNumber] = indirectFields;
    const body = indirectObjectBody(pdfText, objectNumber, generationNumber);
    if (!body) {
      return true;
    }
    const referencedArray = body.match(/\[([\s\S]*?)\]/);
    return referencedArray ? fieldArrayHasEntries(referencedArray[1]) : true;
  }

  return /\/Fields\b/.test(acroFormWindow);
}

export async function pdfHasFillableFields(pdfPath) {
  return hasFillableFields(await readFile(pdfPath));
}

async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    console.log("Usage: check_fillable_fields.mjs <input.pdf>");
    return 1;
  }

  if (await pdfHasFillableFields(argv[0])) {
    console.log("This PDF has fillable form fields");
  } else {
    console.log(
      "This PDF does not have fillable form fields; you will need to visually determine where to enter data",
    );
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
