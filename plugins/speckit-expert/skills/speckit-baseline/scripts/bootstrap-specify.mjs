#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRepoRoot } from './common.mjs';

function resolveAbsolute(targetPath) {
  if (!targetPath) {
    return '';
  }
  return path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);
}

function copyDirectoryContents(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }

    if (path.resolve(sourcePath) === path.resolve(targetPath)) {
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const defaultPluginDir = path.resolve(scriptDir, '..');
  const repoRoot = getRepoRoot();
  const pluginDir = resolveAbsolute(process.argv[2] ?? defaultPluginDir);
  const targetDir = resolveAbsolute(process.argv[3] ?? path.join(repoRoot, '.specify'));

  const scriptsDir = path.join(pluginDir, 'scripts');
  const templatesDir = path.join(pluginDir, 'templates');

  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory() || !fs.existsSync(templatesDir) || !fs.statSync(templatesDir).isDirectory()) {
    process.stderr.write(`[error] 插件资源缺失：${scriptsDir} 或 ${templatesDir} 不存在\n`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  copyDirectoryContents(scriptsDir, path.join(targetDir, 'scripts'));
  copyDirectoryContents(templatesDir, path.join(targetDir, 'templates'));

  process.stdout.write(`[ok] 已初始化 .specify 资源：${targetDir}\n`);
  process.stdout.write(`[ok] scripts 来源：${scriptsDir}\n`);
  process.stdout.write(`[ok] templates 来源：${templatesDir}\n`);
}

main();
