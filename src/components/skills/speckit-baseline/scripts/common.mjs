#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runGit(args, cwd = process.cwd()) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

export function findSpecifyRoot(startDir = process.cwd()) {
  let dir = path.resolve(startDir);

  while (true) {
    const specifyDir = path.join(dir, '.specify');
    if (fs.existsSync(specifyDir) && fs.statSync(specifyDir).isDirectory()) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return '';
    }
    dir = parent;
  }
}

export function getRepoRoot() {
  const specifyRoot = findSpecifyRoot();
  if (specifyRoot) {
    return specifyRoot;
  }

  const gitRoot = runGit(['rev-parse', '--show-toplevel']);
  if (gitRoot) {
    return path.resolve(gitRoot);
  }

  return process.cwd();
}

export function hasGit(repoRoot = getRepoRoot()) {
  const gitMarker = path.join(repoRoot, '.git');
  if (!fs.existsSync(gitMarker)) {
    return false;
  }
  return runGit(['-C', repoRoot, 'rev-parse', '--is-inside-work-tree']) === 'true';
}

export function getCurrentBranch(repoRoot = getRepoRoot()) {
  if (process.env.SPECIFY_FEATURE) {
    return process.env.SPECIFY_FEATURE;
  }

  if (hasGit(repoRoot)) {
    const branch = runGit(['-C', repoRoot, 'rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch) {
      return branch;
    }
  }

  const specsDir = path.join(repoRoot, 'specs');
  if (fs.existsSync(specsDir) && fs.statSync(specsDir).isDirectory()) {
    const entries = fs.readdirSync(specsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    let latestFeature = '';
    let latestTimestamp = '';
    let highestSeq = 0;

    for (const entry of entries) {
      const name = entry.name;
      const tsMatch = name.match(/^([0-9]{8}-[0-9]{6})-/);
      if (tsMatch) {
        const ts = tsMatch[1];
        if (ts > latestTimestamp) {
          latestTimestamp = ts;
          latestFeature = name;
        }
        continue;
      }

      const seqMatch = name.match(/^([0-9]{3,})-/);
      if (seqMatch) {
        const seq = Number.parseInt(seqMatch[1], 10);
        if (Number.isFinite(seq) && seq > highestSeq) {
          highestSeq = seq;
          if (!latestTimestamp) {
            latestFeature = name;
          }
        }
      }
    }

    if (latestFeature) {
      return latestFeature;
    }
  }

  return 'main';
}

export function specKitEffectiveBranchName(raw) {
  const match = raw.match(/^([^/]+)\/([^/]+)$/);
  if (match) {
    return match[2];
  }
  return raw;
}

export function isLegacyFeatureBranch(raw) {
  const branch = specKitEffectiveBranchName(raw);
  const malformedTimestamp = /^[0-9]{7}-[0-9]{6}-/.test(branch) || /^(?:[0-9]{7}|[0-9]{8})-[0-9]{6}$/.test(branch);
  return (/^[0-9]{3,}-/.test(branch) && !malformedTimestamp) || /^[0-9]{8}-[0-9]{6}-/.test(branch);
}

export function checkFeatureBranch(raw, hasGitRepo, repoRoot = getRepoRoot()) {
  const featureJson = path.join(repoRoot, '.specify', 'feature.json');
  if (fs.existsSync(featureJson)) {
    return true;
  }

  if (!hasGitRepo) {
    process.stderr.write('[specify] Warning: Git repository not detected; skipped branch validation\n');
    return true;
  }

  if (!isLegacyFeatureBranch(raw)) {
    process.stderr.write(`[specify] Warning: Current branch '${raw}' does not follow legacy feature naming.\n`);
    process.stderr.write('[specify] Continuing because an explicit current feature is configured.\n');
    return true;
  }

  return true;
}

export function findFeatureDirByPrefix(repoRoot, rawBranch) {
  const branchName = specKitEffectiveBranchName(rawBranch);
  const specsDir = path.join(repoRoot, 'specs');

  let prefix = '';
  const tsMatch = branchName.match(/^([0-9]{8}-[0-9]{6})-/);
  if (tsMatch) {
    prefix = tsMatch[1];
  } else {
    const seqMatch = branchName.match(/^([0-9]{3,})-/);
    if (seqMatch) {
      prefix = seqMatch[1];
    }
  }

  if (!prefix) {
    return path.join(specsDir, branchName);
  }

  if (!fs.existsSync(specsDir) || !fs.statSync(specsDir).isDirectory()) {
    return path.join(specsDir, branchName);
  }

  const matches = fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${prefix}-`))
    .map((entry) => entry.name);

  if (matches.length === 0) {
    return path.join(specsDir, branchName);
  }
  if (matches.length === 1) {
    return path.join(specsDir, matches[0]);
  }

  throw new Error(`Multiple spec directories found with prefix '${prefix}': ${matches.join(' ')}`);
}

function normalizeFeatureDir(repoRoot, featureDir) {
  if (path.isAbsolute(featureDir)) {
    return path.normalize(featureDir);
  }
  return path.join(repoRoot, featureDir);
}

function findSingleSpecifyFeatureDir(repoRoot) {
  const featuresDir = path.join(repoRoot, '.specify', 'features');
  if (!fs.existsSync(featuresDir) || !fs.statSync(featuresDir).isDirectory()) {
    return '';
  }

  const entries = fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (entries.length === 1) {
    return path.join(featuresDir, entries[0]);
  }

  if (entries.length > 1) {
    throw new Error('Multiple .specify/features entries found. Set .specify/feature.json or SPECIFY_FEATURE_DIRECTORY to select the current feature.');
  }

  return '';
}

function resolveCurrentFeatureDir(repoRoot, currentBranch) {
  const featureJsonPath = path.join(repoRoot, '.specify', 'feature.json');

  if (process.env.SPECIFY_FEATURE_DIRECTORY) {
    return normalizeFeatureDir(repoRoot, process.env.SPECIFY_FEATURE_DIRECTORY);
  }

  if (fs.existsSync(featureJsonPath)) {
    try {
      const raw = fs.readFileSync(featureJsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (typeof parsed.feature_directory === 'string' && parsed.feature_directory.trim()) {
        return normalizeFeatureDir(repoRoot, parsed.feature_directory.trim());
      }
    } catch (error) {
      throw new Error(`Failed to parse .specify/feature.json: ${error.message}`);
    }

    throw new Error('.specify/feature.json must contain a non-empty feature_directory string.');
  }

  if (isLegacyFeatureBranch(currentBranch)) {
    return findFeatureDirByPrefix(repoRoot, currentBranch);
  }

  const singleFeatureDir = findSingleSpecifyFeatureDir(repoRoot);
  if (singleFeatureDir) {
    return singleFeatureDir;
  }

  throw new Error('No current Spec Kit feature is configured. Run speckit-specify/baseline to create .specify/feature.json, or set SPECIFY_FEATURE_DIRECTORY.');
}

export function getFeaturePaths() {
  const repoRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(repoRoot);
  const hasGitRepo = hasGit(repoRoot);
  const featureDir = resolveCurrentFeatureDir(repoRoot, currentBranch);

  return {
    REPO_ROOT: repoRoot,
    CURRENT_BRANCH: currentBranch,
    HAS_GIT: hasGitRepo ? 'true' : 'false',
    FEATURE_DIR: featureDir,
    FEATURE_SPEC: path.join(featureDir, 'spec.md'),
    IMPL_PLAN: path.join(featureDir, 'plan.md'),
    TASKS: path.join(featureDir, 'tasks.md'),
    RESEARCH: path.join(featureDir, 'research.md'),
    DATA_MODEL: path.join(featureDir, 'data-model.md'),
    QUICKSTART: path.join(featureDir, 'quickstart.md'),
    CONTRACTS_DIR: path.join(featureDir, 'contracts')
  };
}

function getPresetIdsFromRegistry(registryPath) {
  try {
    const raw = fs.readFileSync(registryPath, 'utf8');
    const parsed = JSON.parse(raw);
    const presets = parsed?.presets ?? {};

    return Object.entries(presets)
      .filter(([, meta]) => meta && typeof meta === 'object' && meta.enabled !== false)
      .sort(([, a], [, b]) => {
        const aPriority = Number.isFinite(a.priority) ? a.priority : 10;
        const bPriority = Number.isFinite(b.priority) ? b.priority : 10;
        return aPriority - bPriority;
      })
      .map(([presetId]) => presetId);
  } catch {
    return [];
  }
}

export function resolveTemplate(templateName, repoRoot) {
  const base = path.join(repoRoot, '.specify', 'templates');

  const override = path.join(base, 'overrides', `${templateName}.md`);
  if (fs.existsSync(override) && fs.statSync(override).isFile()) {
    return override;
  }

  const presetsDir = path.join(repoRoot, '.specify', 'presets');
  if (fs.existsSync(presetsDir) && fs.statSync(presetsDir).isDirectory()) {
    const registryFile = path.join(presetsDir, '.registry');
    const fromRegistry = fs.existsSync(registryFile) ? getPresetIdsFromRegistry(registryFile) : [];

    if (fromRegistry.length > 0) {
      for (const presetId of fromRegistry) {
        const candidate = path.join(presetsDir, presetId, 'templates', `${templateName}.md`);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
    } else {
      const presetDirs = fs
        .readdirSync(presetsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

      for (const presetId of presetDirs) {
        const candidate = path.join(presetsDir, presetId, 'templates', `${templateName}.md`);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
    }
  }

  const extensionsDir = path.join(repoRoot, '.specify', 'extensions');
  if (fs.existsSync(extensionsDir) && fs.statSync(extensionsDir).isDirectory()) {
    const extDirs = fs
      .readdirSync(extensionsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const extId of extDirs) {
      const candidate = path.join(extensionsDir, extId, 'templates', `${templateName}.md`);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
  }

  const core = path.join(base, `${templateName}.md`);
  if (fs.existsSync(core) && fs.statSync(core).isFile()) {
    return core;
  }

  return null;
}

export function directoryHasEntries(dirPath) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return false;
  }
  return fs.readdirSync(dirPath).length > 0;
}

export function printHelpAndExit(helpText) {
  process.stdout.write(`${helpText}\n`);
  process.exit(0);
}

export function printErrorAndExit(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
