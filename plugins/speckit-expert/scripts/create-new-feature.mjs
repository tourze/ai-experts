#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { printHelpAndExit, printErrorAndExit } from './common.mjs';

function slugFromText(text) {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const parts = normalized ? normalized.split('-').filter(Boolean).slice(0, 4) : [];
  if (parts.length > 0) {
    return parts.join('-');
  }

  const hash = crypto.createHash('sha1').update(text, 'utf8').digest('hex').slice(0, 8);
  return `feature-${hash}`;
}

function parseArgs(argv) {
  let jsonMode = false;
  let shortName = '';
  const descriptionParts = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--json') {
      jsonMode = true;
      continue;
    }

    if (arg === '--short-name') {
      const value = argv[i + 1] ?? '';
      if (!value) {
        printErrorAndExit('Error: --short-name requires a value');
      }
      shortName = value;
      i += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelpAndExit('Usage: node create-new-feature.mjs [--json] [--short-name <slug>] <feature description>');
    }

    if (arg.startsWith('-')) {
      printErrorAndExit(`Error: unknown option '${arg}'`);
    }

    descriptionParts.push(arg);
  }

  const featureDescription = descriptionParts.join(' ').trim();
  if (!featureDescription) {
    printErrorAndExit('Error: feature description is required');
  }

  return { jsonMode, shortName, featureDescription };
}

function main() {
  const { jsonMode, shortName, featureDescription } = parseArgs(process.argv.slice(2));

  let slug = shortName ? slugFromText(shortName) : slugFromText(featureDescription);
  if (!slug) {
    slug = 'feature';
  }

  const repoRoot = process.cwd();
  const featureDir = path.join(repoRoot, '.specify', 'features', slug);
  const specFile = path.join(featureDir, 'spec.md');

  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(path.join(repoRoot, '.specify'), { recursive: true });

  const featureJsonPath = path.join(repoRoot, '.specify', 'feature.json');
  const featureJson = {
    feature_directory: `.specify/features/${slug}`
  };
  fs.writeFileSync(featureJsonPath, `${JSON.stringify(featureJson, null, 2)}\n`, 'utf8');

  const result = {
    FEATURE_DIR: featureDir,
    SPEC_FILE: specFile,
    SLUG: slug,
    BRANCH_CREATED: false
  };

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  process.stdout.write(`FEATURE_DIR: ${result.FEATURE_DIR}\n`);
  process.stdout.write(`SPEC_FILE: ${result.SPEC_FILE}\n`);
  process.stdout.write(`SLUG: ${result.SLUG}\n`);
  process.stdout.write('BRANCH_CREATED: false\n');
}

main();
