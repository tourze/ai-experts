#!/usr/bin/env node

import fs from 'node:fs';
import {
  checkFeatureBranch,
  getFeaturePaths,
  printErrorAndExit,
  printHelpAndExit,
  resolveTemplate
} from './common.mjs';

function parseArgs(argv) {
  let jsonMode = false;

  for (const arg of argv) {
    if (arg === '--json') {
      jsonMode = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelpAndExit('Usage: node setup-plan.mjs [--json]');
    }

    printErrorAndExit(`Error: unknown option '${arg}'. Use --help for usage information.`);
  }

  return { jsonMode };
}

function main() {
  const { jsonMode } = parseArgs(process.argv.slice(2));
  const paths = getFeaturePaths();

  if (!checkFeatureBranch(paths.CURRENT_BRANCH, paths.HAS_GIT === 'true', paths.REPO_ROOT)) {
    process.exit(1);
  }

  fs.mkdirSync(paths.FEATURE_DIR, { recursive: true });

  const template = resolveTemplate('plan-template', paths.REPO_ROOT);
  if (template && fs.existsSync(template)) {
    fs.copyFileSync(template, paths.IMPL_PLAN);
    const line = `Copied plan template to ${paths.IMPL_PLAN}`;
    if (jsonMode) {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  } else {
    const warning = 'Warning: Plan template not found';
    if (jsonMode) {
      process.stderr.write(`${warning}\n`);
    } else {
      process.stdout.write(`${warning}\n`);
    }
    fs.closeSync(fs.openSync(paths.IMPL_PLAN, 'a'));
  }

  const result = {
    FEATURE_SPEC: paths.FEATURE_SPEC,
    IMPL_PLAN: paths.IMPL_PLAN,
    SPECS_DIR: paths.FEATURE_DIR,
    BRANCH: paths.CURRENT_BRANCH,
    HAS_GIT: paths.HAS_GIT
  };

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  process.stdout.write(`FEATURE_SPEC: ${result.FEATURE_SPEC}\n`);
  process.stdout.write(`IMPL_PLAN: ${result.IMPL_PLAN}\n`);
  process.stdout.write(`SPECS_DIR: ${result.SPECS_DIR}\n`);
  process.stdout.write(`BRANCH: ${result.BRANCH}\n`);
  process.stdout.write(`HAS_GIT: ${result.HAS_GIT}\n`);
}

main();
