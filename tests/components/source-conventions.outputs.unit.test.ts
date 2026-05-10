import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, test } from "vitest";
import { validateRegistry } from "../../src/build/platform.ts";
import { collectPlatformProcedures } from "../../src/build/procedures.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform } from "../../src/components/sdk.ts";
import {
  collectFiles,
  extractPropertyArray,
  markdownDestination,
  repoRoot,
  stripMarkdownCode,
} from "./test-helpers";

function githubStyleHeadingSlug(text: string): string {
  return text
    .replace(/`[^`]*`/gu, "")
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/gu, "")
    .replace(/[\t\n\r ]+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\p{Connector_Punctuation}-]/gu, "");
}

function decodeMarkdownAnchor(anchor: string): string {
  try {
    return decodeURIComponent(anchor);
  } catch {
    return anchor;
  }
}

function normalizeMarkdownReferenceLabel(label: string): string {
  return label.trim().replace(/\s+/gu, " ").toLowerCase();
}

function isLikelyLocalDefinitionPath(href: string): boolean {
  if (href.includes("[") || href.includes("]")) return false;
  return href.startsWith("./")
    || href.startsWith("../")
    || href.includes("/")
    || /\.[A-Za-z0-9]+$/u.test(href);
}

function localMarkdownPath(destination: string): string | null {
  const path = destination.split("#", 1)[0] ?? "";
  if (!path || path.startsWith("//") || /^[a-z][a-z0-9+.-]*:/iu.test(path)) {
    return null;
  }
  return path.replace(/\\/gu, "/");
}

function collectMarkdownAnchors(source: string): Set<string> {
  const slugCounts = new Map<string, number>();
  const anchors = new Set<string>();

  for (const line of source.split(/\r?\n/u)) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
    if (heading) {
      const baseSlug = githubStyleHeadingSlug(heading[2]);
      if (baseSlug) {
        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
      }
    }

    for (const match of line.matchAll(/<a\s+[^>]*(?:id|name)=["']([^"']+)["'][^>]*>/giu)) {
      anchors.add(match[1].toLowerCase());
    }
  }

  return anchors;
}


describe("component source output conventions", () => {
  test("speckit baseline output procedures require explicit overwrite for existing outputs", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/speckit-baseline/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 `\.specify` wrapper\/template 文件/u);
    assert.match(skillSource, /默认不会替换已有的 `\.specify\/feature\.json` 当前 feature 指针/u);
    assert.match(skillSource, /默认不会覆盖已存在的 `plan\.md`/u);
    assert.match(skillSource, /确认目标可替换后才传 `--overwrite`/u);

    for (const sourceFile of ["bootstrap-specify.ts", "setup-plan.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/speckit-baseline", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u);
      assert.match(source, /parseArgs/u);
      assert.match(source, /assertOutputWritable/u);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `speckit ${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const bootstrapSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/speckit-baseline/bootstrap-specify.ts"),
      "utf-8",
    );
    assert.match(bootstrapSource, /plannedBootstrapOutputFiles/u);

    const createFeatureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/speckit-baseline/create-new-feature.ts"),
      "utf-8",
    );
    assert.match(createFeatureSource, /flag:\s+"--overwrite"/u);
    assert.match(createFeatureSource, /writeCurrentFeatureJson/u);
    assert.match(createFeatureSource, /assertOutputWritable/u);
    assert.doesNotMatch(
      createFeatureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
      "speckit create-new-feature examples should not teach overwrite bypasses",
    );

    const guardSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/speckit-baseline/output_guard.ts"),
      "utf-8",
    );
    assert.match(guardSource, /output file already exists/u);
    assert.match(guardSource, /pass --overwrite only after confirming/u);
  });

  test("skill creator report procedures require explicit overwrite for existing outputs", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 HTML、JSON、Markdown 或 \.skill 输出/u);
    assert.match(skillSource, /确认目标可替换后才传 `--overwrite`/u);

    for (const sourceFile of [
      "generate_report.ts",
      "aggregate_benchmark.ts",
      "generate_review.ts",
      "package_skill.ts",
      "run_loop.ts",
    ]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/skill-creator", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /parseArgs/u, `${sourceFile} should parse overwrite-aware argv`);
      assert.match(source, /assertOutput(?:Files)?Writable/u, `${sourceFile} should guard existing outputs`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const aggregateSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/skill-creator/aggregate_benchmark.ts"),
      "utf-8",
    );
    assert.match(aggregateSource, /plannedBenchmarkOutputFiles/u);

    const generateReviewSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/skill-creator/generate_review.ts"),
      "utf-8",
    );
    assert.match(generateReviewSource, /parseArgs\(\{\s*args:\s*\[\.\.\.argv\]/u);
    assert.match(generateReviewSource, /\[--previous-workspace path\]/u);
    assert.match(generateReviewSource, /\[--benchmark benchmark\.json\]/u);

    const guardSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/skill-creator/output_guard.ts"),
      "utf-8",
    );
    assert.match(guardSource, /output file already exists/u);
    assert.match(guardSource, /pass --overwrite only after confirming/u);
  });

  test("canvas output procedures require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/canvas-design/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 PNG、SVG、视频或 batch JSON 输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    const sourceFiles = [
      "baoyu-article-illustrator-build-batch.ts",
      "concept-to-image-render_to_image.ts",
      "concept-to-video-add_audio.ts",
      "concept-to-video-render_video.ts",
    ];

    for (const sourceFile of sourceFiles) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/canvas-design", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /assertOutputWritable/u, `${sourceFile} should guard existing output files`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const renderImageSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/canvas-design/concept-to-image-render_to_image.ts"),
      "utf-8",
    );
    assert.match(renderImageSource, /fallbackPath/u);
    assert.match(renderImageSource, /assertOutputWritable\(fallbackPath/u);

    const guardSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/canvas-design/output_guard.ts"),
      "utf-8",
    );
    assert.match(guardSource, /output file already exists/u);
  });

  test("modern web design output procedures require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/modern-web-design/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 HTML 或审计报告输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    for (const sourceFile of ["pattern_generator.ts", "design_audit.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/modern-web-design", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /assertOutputWritable/u, `${sourceFile} should guard existing output files`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const guardSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/modern-web-design/output_guard.ts"),
      "utf-8",
    );
    assert.match(guardSource, /output file already exists/u);
  });

  test("screenshot output procedures require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/screenshot/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的截图输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    for (const sourceFile of ["take_screenshot.ts", "take_screenshot_windows.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/screenshot", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /output file already exists/u, `${sourceFile} should refuse existing output files`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const mainSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/screenshot/take_screenshot.ts"),
      "utf-8",
    );
    assert.match(mainSource, /assertOutputPathsWritable/u);
    assert.match(mainSource, /cmd\.push\("--overwrite"\)/u);

    const windowsSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/screenshot/take_screenshot_windows.ts"),
      "utf-8",
    );
    assert.match(windowsSource, /\$opts\.overwrite/u);
  });

  test("prompt optimization output requires explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/prompt-engineering-patterns/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 JSON 输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/prompt-engineering-patterns/optimize-prompt.ts"),
      "utf-8",
    );
    assert.match(procedureSource, /flag:\s+"--output"/u);
    assert.match(procedureSource, /flag:\s+"--overwrite"/u);
    assert.match(procedureSource, /parseArgs/u);
    assert.match(procedureSource, /output file already exists/u);
    assert.match(procedureSource, /optimizer\.exportResults\(args\.output, args\.overwrite\)/u);
    assert.doesNotMatch(
      procedureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
      "prompt optimization examples should not teach overwrite bypasses",
    );
  });

  test("ios binary analysis brew install checklist requires confirmation wording", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/ios-binary-analysis/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /先让用户确认包源和本机环境影响/u);
    assert.match(skillSource, /brew install blacktop\/tap\/ipsw/u);
  });

  test("youtube analysis scaffold does not silently overwrite Markdown output", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/youtube-analysis/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 Markdown 输出/u);
    assert.match(skillSource, /确认目标文件可覆盖后才传 `--force`/u);

    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/youtube-analysis/analyze_video.ts"),
      "utf-8",
    );
    assert.match(procedureSource, /flag:\s+"--force"/u);
    assert.match(procedureSource, /existsSync\(outputPath\) && !args\.force/u);
    assert.match(procedureSource, /output file already exists/u);
    assert.doesNotMatch(
      procedureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--force"/u,
      "youtube analysis examples should not teach overwrite bypasses",
    );
  });

  test("system diagnostics cleanup references keep sampling scripts read-only", () => {
    const referenceSource = readFileSync(
      join(repoRoot, "src/components/skills/system-diagnostics/references/disk-cleanup.md"),
      "utf-8",
    );

    assert.match(referenceSource, /不要把清理命令写进诊断采样脚本/u);
    assert.match(referenceSource, /不要使用 `--noconfirm`/u);
    assert.doesNotMatch(referenceSource, /apt-get clean/u);
    assert.doesNotMatch(referenceSource, /dnf clean all/u);
    assert.doesNotMatch(referenceSource, /pacman -Sc --noconfirm/u);
  });

  test("runtime guidance does not teach global tool installs for guarded workflows", () => {
    const checkedFiles = [
      "src/components/skills/modern-web-design/references/accessibility_guide.md",
      "src/components/skills/md-to-pdf/README.md",
      "src/components/skills/openapi-spec-generation/references/code-first-and-tooling.md",
      "src/components/skills/pdf/references/forms.md",
    ];

    for (const sourcePath of checkedFiles) {
      const source = readFileSync(join(repoRoot, sourcePath), "utf-8");
      assert.doesNotMatch(source, /npm install -g/u, `${sourcePath} should avoid global npm install guidance`);
    }

    for (const sourcePath of collectFiles(
      join(repoRoot, "src/components"),
      (file) => file.endsWith(".ts") || file.endsWith(".md"),
    )) {
      const source = readFileSync(sourcePath, "utf-8");
      assert.doesNotMatch(source, /npm install -g/u, `${sourcePath} should avoid global npm install guidance`);
      assert.doesNotMatch(source, /--break-system-packages/u, `${sourcePath} should not bypass Python package manager safety`);
    }

    const accessibilityGuide = readFileSync(
      join(repoRoot, "src/components/skills/modern-web-design/references/accessibility_guide.md"),
      "utf-8",
    );
    assert.match(accessibilityGuide, /ask before adding project-local dev dependencies/u);

    const mdToPdfReadme = readFileSync(join(repoRoot, "src/components/skills/md-to-pdf/README.md"), "utf-8");
    assert.match(mdToPdfReadme, /Use `md-to-pdf-setup --install` and confirm/u);

    const openApiTooling = readFileSync(
      join(repoRoot, "src/components/skills/openapi-spec-generation/references/code-first-and-tooling.md"),
      "utf-8",
    );
    assert.match(openApiTooling, /ask before adding project-local dev dependencies/u);

    const pdfForms = readFileSync(join(repoRoot, "src/components/skills/pdf/references/forms.md"), "utf-8");
    assert.match(pdfForms, /安装到该 runtime root/u);

    for (const sourcePath of collectFiles(
      join(repoRoot, "src/components/procedures/sources/pdf"),
      (file) => file.endsWith(".ts"),
    )) {
      const source = readFileSync(sourcePath, "utf-8");
      assert.doesNotMatch(source, /npm install -g/u, `${sourcePath} should avoid global npm install guidance`);
      if (source.includes(" is not installed.")) {
        assert.match(source, /do not install it globally/u, `${sourcePath} should warn against global installs`);
      }
    }

    for (const sourcePath of collectFiles(
      join(repoRoot, "src/components/procedures/sources/md-to-pdf"),
      (file) => file.endsWith(".ts"),
    )) {
      const source = readFileSync(sourcePath, "utf-8");
      assert.doesNotMatch(source, /npm install -g/u, `${sourcePath} should avoid global npm install guidance`);
      assert.doesNotMatch(source, /npm",\s*\["install",\s*"-g"/u, `${sourcePath} should not run global npm installs`);
    }
  });

  test("remote ssh exec documents host config and stdin contract", () => {
    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/remote-ssh-command/ssh-exec.ts"),
      "utf-8",
    );
    assert.match(procedureSource, /flag:\s+"\[host-config\]"/u);
    assert.match(procedureSource, /flag:\s+"stdin"/u);
    assert.match(procedureSource, /readStdin/u);
    assert.match(procedureSource, /remote command must be provided on stdin/u);
    assert.match(procedureSource, /Host config must be stored under ~\/\.host\//u);
  });

  test("baoyu compress image defaults preserve originals and reject overwrites", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/baoyu-compress-image/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认保留源文件/u);
    assert.match(skillSource, /默认不会覆盖已存在的输出文件/u);
    assert.doesNotMatch(skillSource, /默认 `--keep=false`/u);

    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/baoyu-compress-image/main.ts"),
      "utf-8",
    );
    assert.match(procedureSource, /flag:\s+"--delete-original"/u);
    assert.match(procedureSource, /flag:\s+"--overwrite"/u);
    assert.match(procedureSource, /output file already exists/u);
    assert.doesNotMatch(
      procedureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--delete-original"/u,
      "baoyu compress examples should not teach source deletion bypasses",
    );
  });

  test("data analysis exports require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/data-analysis/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的导出文件/u);
    assert.match(skillSource, /确认目标可替换后才传 `--overwrite`/u);

    const procedureSource = ["analyze.ts", "analyze_output.ts"]
      .map((sourceFile) =>
        readFileSync(
          join(repoRoot, "src/components/procedures/sources/data-analysis", sourceFile),
          "utf-8",
        ),
      )
      .join("\n");
    assert.match(procedureSource, /flag:\s+"--overwrite"/u);
    assert.match(procedureSource, /output file already exists/u);
    assert.match(procedureSource, /existsSync\(target\) && !overwrite/u);
    assert.doesNotMatch(
      procedureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
      "data analysis examples should not teach overwrite bypasses",
    );
  });

  test("web content fetcher documents supported fetch argv", () => {
    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/web-content-fetcher/fetch.ts"),
      "utf-8",
    );
    for (const expected of [
      'flag: "[url]"',
      'flag: "[max_chars]"',
      'flag: "--stealth"',
      'flag: "--json"',
    ]) {
      assert.match(procedureSource, new RegExp(expected.replaceAll("[", "\\[").replaceAll("]", "\\]"), "u"));
    }
    assert.match(procedureSource, /if \(arg === "--stealth"\) stealth = true/u);
    assert.match(procedureSource, /else if \(arg === "--json"\) jsonOutput = true/u);
  });

});
