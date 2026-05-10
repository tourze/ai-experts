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

describe("component source conventions", () => {
  test("high-risk executable skills require explicit invocation", () => {
    const highRiskSkillIds = ["remote-ssh-command", "prlctl-vm-control"];
    const skillsById = new Map(registry.skills.map((skill) => [skill.id, skill]));

    for (const skillId of highRiskSkillIds) {
      assert.equal(
        skillsById.get(skillId)?.invocation,
        InvocationPolicy.ExplicitOnly,
        `${skillId} should not be implicitly invoked because it can affect remote hosts or virtual machines`,
      );
      const source = readFileSync(join(repoRoot, "src/components/skills", skillId, "index.ts"), "utf-8");
      assert.doesNotMatch(
        source,
        /不做二次确认/,
        `${skillId} should not tell the model to bypass confirmation for high-risk actions`,
      );
    }
  });

  test("destructive simulator procedures require explicit confirmation flags", () => {
    const iosSkillSource = readFileSync(
      join(repoRoot, "src/components/skills/ios-simulator-skill/index.ts"),
      "utf-8",
    );
    assert.match(iosSkillSource, /卸载或终止应用/u);
    assert.match(iosSkillSource, /只有用户明确确认目标和影响范围后才传 `--yes`/u);

    for (const sourceFile of ["simctl_delete.ts", "simctl_erase.ts", "simctl_shutdown.ts", "app_launcher.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/ios-simulator-skill", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--yes"/u, `${sourceFile} should expose an explicit confirmation bypass`);
      assert.match(source, /仅在用户已明确确认/u, `${sourceFile} should describe when --yes is allowed`);
      assert.match(source, /readConfirmation/u, `${sourceFile} should ask for confirmation when --yes is absent`);
    }
  });

  test("android device state-changing procedures require explicit confirmation flags", () => {
    const androidSkillSource = readFileSync(
      join(repoRoot, "src/components/skills/android-device-automation/index.ts"),
      "utf-8",
    );
    assert.match(androidSkillSource, /强停应用或清空 logcat/u);
    assert.match(androidSkillSource, /只有用户明确确认包名、serial 和影响范围后才传 `--yes`，清空 logcat 还必须显式传 `--clear`/u);
    assert.match(androidSkillSource, /diagnose-app 默认不会覆盖输出目录内已存在的诊断文件/u);
    assert.match(androidSkillSource, /仅对明确支持 JSON 的 procedure 传 `--json`/u);

    for (const sourceFile of ["app_launcher.ts", "diagnose_app.ts", "emulator_manage.ts", "log_monitor.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/android-device-automation", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--yes"/u, `${sourceFile} should expose an explicit confirmation bypass`);
      assert.match(source, /仅在用户已明确确认/u, `${sourceFile} should describe when --yes is allowed`);
      assert.match(source, /readConfirmation/u, `${sourceFile} should ask for confirmation when --yes is absent`);
    }

    for (const sourceFile of ["app_launcher.ts", "build_and_test.ts", "emulator_manage.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/android-device-automation", sourceFile),
        "utf-8",
      );
      assert.equal(source.includes(["Reserved for future", "structured output"].join(" ")), false);
      assert.doesNotMatch(
        source,
        /flag:\s+"--json"/u,
        `${sourceFile} should not advertise JSON output until it is implemented`,
      );
    }

    const diagnoseSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/android-device-automation/diagnose_app.ts"),
      "utf-8",
    );
    assert.match(diagnoseSource, /flag:\s+"--overwrite"/u);
    assert.match(diagnoseSource, /plannedDiagnosisOutputFiles/u);
    assert.match(diagnoseSource, /output file already exists/u);
    assert.doesNotMatch(
      diagnoseSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
      "android diagnose examples should not teach overwrite bypasses",
    );
  });

  test("local installation procedures require explicit confirmation flags", () => {
    const skillExpectations = [
      {
        skill: "remote-ssh-command",
        pattern: /安装 `sshpass` 会修改本机环境；只有用户明确确认安装方式和影响范围后才传 `--yes`/u,
      },
      {
        skill: "md-to-pdf",
        pattern: /`md-to-pdf-setup --install` 会修改本机或运行时依赖环境；只有用户明确确认安装方式和影响范围后才传 `--yes`/u,
      },
    ];

    for (const { skill, pattern } of skillExpectations) {
      const source = readFileSync(join(repoRoot, "src/components/skills", skill, "index.ts"), "utf-8");
      assert.match(source, pattern);
    }

    const procedureExpectations = [
      "src/components/procedures/sources/remote-ssh-command/install-sshpass.ts",
      "src/components/procedures/sources/md-to-pdf/setup.ts",
    ];

    for (const sourcePath of procedureExpectations) {
      const source = readFileSync(join(repoRoot, sourcePath), "utf-8");
      assert.match(source, /flag:\s+"--yes"/u, `${sourcePath} should expose an explicit confirmation bypass`);
      assert.match(source, /仅在用户已明确确认/u, `${sourcePath} should describe when --yes is allowed`);
      assert.match(source, /confirmation required/u, `${sourcePath} should fail closed when confirmation is absent`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--yes"/u,
        `${sourcePath} examples should not teach confirmation bypasses`,
      );
    }
  });

  test("prlctl high-risk power actions require explicit confirmation flags", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/prlctl-vm-control/index.ts"),
      "utf-8",
    );
    assert.match(
      skillSource,
      /只有用户明确确认虚拟机、动作和影响范围后才传 `--yes`/u,
    );
    assert.match(skillSource, /默认拒绝覆盖本地或客体目标文件/u);
    assert.match(skillSource, /确认目标可替换后才传 `--overwrite`/u);

    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/prlctl-vm-control/prlctl_helper.ts"),
      "utf-8",
    );
    assert.match(procedureSource, /flag:\s+"--yes"/u);
    assert.match(procedureSource, /flag:\s+"--overwrite"/u);
    assert.match(procedureSource, /仅在用户已明确确认虚拟机和动作后使用/u);
    assert.match(procedureSource, /isHighRiskPowerAction/u);
    assert.match(procedureSource, /Power action cancelled: confirmation required/u);
    assert.match(procedureSource, /startsWith\("--option="\)/u);
    assert.doesNotMatch(
      procedureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--yes"/u,
      "prlctl examples should not teach confirmation bypasses",
    );
    assert.doesNotMatch(
      procedureSource,
      /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
      "prlctl examples should not teach overwrite bypasses",
    );

    const fileTransferSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/prlctl-vm-control/file_transfer.ts"),
      "utf-8",
    );
    assert.match(fileTransferSource, /parseFileTransferArgs/u);
    assert.match(fileTransferSource, /assertLocalDownloadWritable/u);
    assert.match(fileTransferSource, /assertGuestUploadWritable/u);
    assert.match(fileTransferSource, /output file already exists/u);
    assert.match(fileTransferSource, /guest file already exists/u);
  });

  test("ios simulator optional brew installs require user confirmation wording", () => {
    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/ios-simulator-skill/sim_health_check.ts"),
      "utf-8",
    );
    assert.match(procedureSource, /confirm the Homebrew change first/u);
    assert.doesNotMatch(procedureSource, /Recommended:\s*brew tap/u);
  });

  test("ios simulator output procedures require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/ios-simulator-skill/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的报告、截图或 diff 产物/u);
    assert.match(skillSource, /确认目标可替换后才传 `--overwrite`/u);

    for (const sourceFile of [
      "accessibility_audit.ts",
      "app_state_capture.ts",
      "log_monitor.ts",
      "test_recorder.ts",
      "visual_diff.ts",
    ]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/ios-simulator-skill", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /parseArgs/u, `${sourceFile} should parse overwrite-aware argv`);
      assert.match(source, /assertOutput(?:Files)?Writable/u, `${sourceFile} should guard existing output files`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const visualDiffSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/ios-simulator-skill/visual_diff.ts"),
      "utf-8",
    );
    assert.match(visualDiffSource, /plannedVisualDiffOutputFiles/u);

    const plannedOutputSources = [
      ["app_state_capture.ts", /plannedAppStateCaptureDir/u],
      ["log_monitor.ts", /plannedLogOutputFiles/u],
      ["test_recorder.ts", /plannedTestRecorderOutputDir/u],
    ] as const;
    for (const [sourceFile, pattern] of plannedOutputSources) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/ios-simulator-skill", sourceFile),
        "utf-8",
      );
      assert.match(source, pattern);
    }

    const guardSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/ios-simulator-skill/output_guard.ts"),
      "utf-8",
    );
    assert.match(guardSource, /output file already exists/u);
    assert.match(guardSource, /pass --overwrite only after confirming/u);
  });

  test("android redex installation reference keeps system installs behind confirmation", () => {
    const referenceSource = readFileSync(
      join(repoRoot, "src/components/skills/android-redex/references/installation.md"),
      "utf-8",
    );
    assert.match(referenceSource, /只有用户明确确认目标机器、安装方式和影响范围后/u);
    assert.doesNotMatch(referenceSource, /apt-get install -y/u);
  });

  test("markitdown format reference keeps optional system installs behind confirmation", () => {
    const referenceSource = readFileSync(
      join(repoRoot, "src/components/skills/markitdown/references/file_formats.md"),
      "utf-8",
    );
    assert.match(referenceSource, /Python extra 优先安装到项目虚拟环境/u);
    assert.match(referenceSource, /用户确认 Homebrew 变更后执行/u);
    assert.match(referenceSource, /用户确认 apt\/sudo 变更后执行/u);
  });

  test("markitdown conversions require explicit overwrite for existing outputs", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/markitdown/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 Markdown、`INDEX\.md` 或 `catalog\.json` 输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    for (const sourceFile of ["batch_convert.ts", "convert_with_ai.ts", "convert_literature.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/markitdown", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /output file already exists/u, `${sourceFile} should refuse silent overwrites`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const literatureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/markitdown/convert_literature.ts"),
      "utf-8",
    );
    assert.match(literatureSource, /INDEX\.md/u);
    assert.match(literatureSource, /catalog\.json/u);
    assert.match(literatureSource, /assertIndexOutputsWritable/u);
  });

  test("pdf output procedures require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/pdf/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 PDF、JSON 或 PNG 输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    const sourceFiles = [
      "convert_pdf_to_images.ts",
      "create_validation_image.ts",
      "extract_form_field_info.ts",
      "extract_form_structure.ts",
      "fill_fillable_fields.ts",
      "fill_pdf_form_with_annotations.ts",
    ];

    for (const sourceFile of sourceFiles) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/pdf", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /parseArgs/u, `${sourceFile} should parse overwrite-aware argv`);
      assert.match(source, /assertOutput(?:Files)?Writable/u, `${sourceFile} should guard existing output files`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const guardSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/pdf/output_guard.ts"),
      "utf-8",
    );
    assert.match(guardSource, /output file already exists/u);
    assert.match(guardSource, /pass --overwrite only after confirming/u);
  });

  test("md-to-pdf output procedures require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/md-to-pdf/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖已存在的 PDF 或 HTML 输出/u);
    assert.match(skillSource, /确认目标文件可替换后才传 `--overwrite`/u);

    for (const sourceFile of ["md_to_pdf.ts", "katex_render.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/md-to-pdf", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.match(source, /parseArgs/u, `${sourceFile} should parse overwrite-aware argv`);
      assert.match(source, /assertOutputWritable/u, `${sourceFile} should guard existing output files`);
      assert.match(source, /output file already exists/u, `${sourceFile} should refuse silent overwrites`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }
  });

  test("security ownership map outputs require explicit overwrite for existing files", () => {
    const skillSource = readFileSync(
      join(repoRoot, "src/components/skills/security-ownership-map/index.ts"),
      "utf-8",
    );
    assert.match(skillSource, /默认不会覆盖输出目录内已存在的 CSV\/JSON\/GraphML 产物/u);
    assert.match(skillSource, /确认目标可替换后才传 `--overwrite`/u);

    for (const sourceFile of ["build_ownership_map.ts", "run_ownership_map.ts"]) {
      const source = readFileSync(
        join(repoRoot, "src/components/procedures/sources/security-ownership-map", sourceFile),
        "utf-8",
      );
      assert.match(source, /flag:\s+"--overwrite"/u, `${sourceFile} should expose an explicit overwrite flag`);
      assert.doesNotMatch(
        source,
        /exampleArgs:\s*\{\s*args:\s*\[[^\]]*"--overwrite"/u,
        `${sourceFile} examples should not teach overwrite bypasses`,
      );
    }

    const buildSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/security-ownership-map/build_ownership_map.ts"),
      "utf-8",
    );
    assert.match(buildSource, /plannedOwnershipMapOutputFiles/u);
    assert.match(buildSource, /assertOutputFilesWritable/u);
    assert.match(buildSource, /output file already exists/u);

    const runSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/security-ownership-map/run_ownership_map.ts"),
      "utf-8",
    );
    assert.match(runSource, /commandArgs\.push\("--overwrite"\)/u);

    const communitySource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/security-ownership-map/community_maintainers.ts"),
      "utf-8",
    );
    const communityFlags = [...communitySource.matchAll(/flag:\s+"([^"]+)"/gu)]
      .map((match) => match[1]);
    assert.deepEqual(communityFlags, [
      "--data-dir",
      "--repo",
      "--file",
      "--community-id",
      "--since",
      "--until",
      "--identity",
      "--date-field",
      "--include-merges",
      "--top",
      "--bucket",
      "--touch-mode",
      "--window-days",
      "--weight",
      "--half-life-days",
      "--min-share",
      "--ignore-author-regex",
      "--min-touches",
    ]);
    for (const unsupportedFlag of ["--out", "--author-exclude-regex", "--sensitive-config", "--no-cochange", "--no-communities"]) {
      assert.doesNotMatch(
        communitySource,
        new RegExp(`flag:\\s+"${unsupportedFlag}"`, "u"),
        `community maintainers metadata should not advertise unsupported ${unsupportedFlag}`,
      );
    }
  });

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

    const procedureSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/data-analysis/analyze.ts"),
      "utf-8",
    );
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

  test("code review assess procedures document required targets", () => {
    const assessCodeSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/code-review/assess-code.ts"),
      "utf-8",
    );
    assert.match(assessCodeSource, /flag:\s+"\[target\]"/u);
    assert.match(assessCodeSource, /Usage: assess-code <file-or-directory>/u);

    const assessTestsSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/code-review/assess-tests.ts"),
      "utf-8",
    );
    assert.match(assessTestsSource, /flag:\s+"\[test-directory\]"/u);
    assert.match(assessTestsSource, /Usage: assess-tests <test-directory>/u);
  });

  test("positional input procedures document their argv", () => {
    const expectations = [
      {
        file: "src/components/procedures/sources/icon-retrieval/search.ts",
        flags: ['flag: "[search_query]"', 'flag: "[topK]"'],
      },
      {
        file: "src/components/procedures/sources/architecture-reviewer/scan_codebase.ts",
        flags: ['flag: "[codebase]"'],
      },
      {
        file: "src/components/procedures/sources/web-performance-diagnosis/analyze.ts",
        flags: ['flag: "[file-or-directory]"'],
      },
      {
        file: "src/components/procedures/sources/i18n-localization/i18n_checker.ts",
        flags: ['flag: "[target]"'],
      },
      {
        file: "src/components/procedures/sources/model-first-reasoning/validate-model.ts",
        flags: ['flag: "[model_path]"'],
      },
      {
        file: "src/components/procedures/sources/agile-product-owner/user_story_generator.ts",
        flags: ['flag: "[mode]"', 'flag: "[capacity]"'],
      },
      {
        file: "src/components/procedures/sources/helm-chart-scaffolding/validate-chart.ts",
        flags: ['flag: "[chart_dir]"'],
      },
      {
        file: "src/components/procedures/sources/skills-prune-and-sync-readme/curate_skills.ts",
        flags: [
          'flag: "[command]"',
          'flag: "--repo-root"',
          'flag: "--format"',
          'flag: "--skills"',
          'flag: "--yes"',
          'flag: "--write"',
          'flag: "--check"',
        ],
      },
    ];

    for (const expectation of expectations) {
      const source = readFileSync(join(repoRoot, expectation.file), "utf-8");
      for (const flag of expectation.flags) {
        assert.match(source, new RegExp(flag.replaceAll("[", "\\[").replaceAll("]", "\\]"), "u"));
      }
    }
  });

  test("procedures with non-empty example argv declare params", () => {
    const procedureFiles = collectFiles(join(repoRoot, "src/components/procedures/sources"), (file) =>
      file.endsWith(".ts"),
    );
    const offenders: string[] = [];

    for (const file of procedureFiles) {
      const source = readFileSync(file, "utf-8");
      if (!source.includes("defineCliProcedure")) continue;

      const exampleMatch = /exampleArgs:\s*\{\s*args:\s*\[([\s\S]*?)\]/u.exec(source);
      const hasNonEmptyExampleArgs = Boolean(exampleMatch && exampleMatch[1].trim().length > 0);
      const hasParams = /\n\s*params:\s*\[/u.test(source);
      if (hasNonEmptyExampleArgs && !hasParams) {
        offenders.push(relative(repoRoot, file));
      }
    }

    assert.deepEqual(offenders, []);
  });

  test("skill display names are user-facing labels", () => {
    const rawDisplayNames = registry.skills
      .filter((skill) => /^[a-z0-9]+(?:-[a-z0-9]+)+$/u.test(skill.fullName))
      .map((skill) => `${skill.id}: ${skill.fullName}`);

    assert.deepEqual(rawDisplayNames, [], "skill fullName should not be a raw kebab-case id");
  });

  test("root platform memory files stay linked to README", () => {
    for (const fileName of ["AGENTS.md", "CLAUDE.md"]) {
      const filePath = join(repoRoot, fileName);
      assert.equal(lstatSync(filePath).isSymbolicLink(), true, `${fileName} should be a symlink`);
      assert.equal(readlinkSync(filePath), "README.md", `${fileName} should point at README.md`);
      assert.equal(
        readFileSync(filePath, "utf-8"),
        readFileSync(join(repoRoot, "README.md"), "utf-8"),
        `${fileName} content should match README.md`,
      );
    }
  });

  test("README documents current component counts and procedure runtime", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf-8");
    const componentSurface = validateRegistry(registry);
    const currentCounts =
      `${registry.skills.length} 个 skill、${registry.agents.length} 个 agent、` +
      `${registry.hooks.length} 个 hook、${registry.procedures.length} 个 procedure`;
    const claudeHookCount = registry.hooks.filter((hook) => hook.platforms.includes(Platform.Claude)).length;
    const codexHookCount = registry.hooks.filter((hook) => hook.platforms.includes(Platform.Codex)).length;
    const claudeSkillCount = registry.skills.filter((skill) => skill.platforms.includes(Platform.Claude)).length;
    const codexSkillCount = registry.skills.filter((skill) => skill.platforms.includes(Platform.Codex)).length;
    const claudeProcedureCount = collectPlatformProcedures(componentSurface, Platform.Claude).length;
    const codexProcedureCount = collectPlatformProcedures(componentSurface, Platform.Codex).length;
    const gateSummary =
      `- \`dist/claude\` 生成 ${claudeSkillCount} 个 skill、${registry.agents.length} 个 agent、${claudeHookCount} 个 hook 和 ${claudeProcedureCount} 个 procedure；` +
      `\`dist/codex\` 生成 ${codexSkillCount} 个 skill、${registry.agents.length} 个 agent、${codexHookCount} 个 hook 和 ${codexProcedureCount} 个 procedure`;

    assert.equal(
      readme.includes(`当前组件规模：${currentCounts}。`),
      true,
      "README component summary should match the registered component surface",
    );
    assert.equal(
      readme.includes(gateSummary),
      true,
      "README quality-gate summary should match generated dist manifests",
    );
    assert.equal(
      readme.includes("两端都生成 `procedures.js` bundle"),
      true,
      "README quality-gate summary should include procedure runtime count",
    );
    assert.match(readme, /不要把整个 `~\/\.codex` symlink 到 `dist\/codex`/);
    assert.match(readme, /不要把整个 `~\/\.agents\/skills` symlink 到 `dist\/codex\/skills`/);
    assert.match(readme, /`installation_id` 和 `~\/\.agents\/skills\/\.system\/`/);
    assert.match(readme, /Codex dist 不输出与 Codex `\.system` 内置 skill 同名的用户级 skill/);
    assert.match(readme, /例如 `skill-creator`/);
    assert.match(readme, /`manifest\.json` 当前使用 schema 5/);
    assert.match(readme, /`install` 字段是安装器的一等事实源/);
    assert.match(readme, /`skillEntries` 从 `skillSourceRoot` 映射到 `skillRoot`/);
    assert.match(readme, /`forbiddenRootEntries` 与 `forbiddenSkillEntries`/);
    assert.match(readme, /Codex 的 `configRoot` 是 `~\/\.codex`、`skillRoot` 是 `~\/\.agents\/skills`/);
    assert.match(readme, /Codex 的 `rootEntries` 不包含 `skills\/`/);
    assert.match(readme, /需要 Node\.js >= 20\.19\.0/);
    assert.doesNotMatch(readme, /^\s+rules\/$/m);
    assert.match(readme, /procedureUse\(procedureDefinition\)/);
    assert.match(readme, /构建器会生成 `## 检查清单`，并放在生成的 `## 反模式` 之后/);
    assert.match(readme, /Agent 不再使用 `AGENT\.body\.md`/);
    assert.match(readme, /sourceDir: new URL\("\.\/", import\.meta\.url\)/);
    assert.doesNotMatch(readme, /SKILL\.body\.md|body: new URL\("\.\/SKILL\.body\.md"/);
    assert.match(readme, /`InvocationPolicy\.ModelOnly` 只用于 Claude-only skill/);
    assert.match(readme, /`procedureUse\(procedureDefinition, \{ platforms: \[\.\.\.\] \}\)`/);
    assert.match(readme, /仅单平台可用的关系使用 `platforms` 收窄/);
    assert.match(readme, /每个 skill 必须声明 `workflow: defineWorkflow/);
    assert.match(readme, /Agent 必须声明 `workflow: defineWorkflow/);
    assert.match(readme, /defineWorkflow\(\{/);
    assert.match(
      readme,
      /defineAntiPattern,\n  defineReference,\n  defineSkill,\n  defineWorkflow,\n  defineWorkflowGate,\n  defineWorkflowRoute,\n  defineWorkflowStep,\n  InvocationPolicy,\n  KnownTool,\n  Platform,\n\} from "\.\.\/\.\.\/sdk"/,
    );
    assert.match(readme, /defineAgent,\n  defineWorkflow,\n  defineWorkflowStep,\n  KnownTool,\n  Platform,\n  SkillUseMode,\n\} from "\.\.\/\.\.\/sdk"/);
    assert.match(readme, /type NormalizedHookPayload,\n  type NormalizedHookResult,\n\} from "\.\.\/\.\.\/sdk"/);
    assert.match(readme, /from "\.\.\/\.\.\/skills\/typescript-type-safety\/index"/);
    assert.doesNotMatch(readme, /from "\.\.\/skills\//);
    assert.doesNotMatch(readme, /body: new URL\("\.\/AGENT\.body\.md"|agent body/);
    assert.doesNotMatch(readme, /338 个 skill|scripts\/manifest\.json|defineSkillScript\(\)|skill script registry/);
    assert.doesNotMatch(readme, /优先插入到 `## 反模式`/);
  });

  test("README local markdown links resolve", () => {
    const readmePath = join(repoRoot, "README.md");
    const readme = stripMarkdownCode(readFileSync(readmePath, "utf-8"));
    const brokenLocalLinks: string[] = [];

    const collectBrokenLink = (destination: string): void => {
      if (!isLikelyLocalDefinitionPath(destination)) return;
      const targetPath = localMarkdownPath(markdownDestination(destination));
      if (!targetPath) return;
      const resolvedTarget = resolve(dirname(readmePath), targetPath);
      if (!existsSync(resolvedTarget)) {
        brokenLocalLinks.push(targetPath);
      }
    };

    for (const match of readme.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
      collectBrokenLink(match[1] ?? "");
    }
    for (const match of readme.matchAll(/^\s*\[[^\]\n]+\]:\s+([^\n]+)$/gmu)) {
      collectBrokenLink(match[1] ?? "");
    }

    assert.deepEqual(
      brokenLocalLinks,
      [],
      "README local Markdown links should resolve from repository root",
    );
  });

  test("component check script runs every typecheck gate", () => {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
    const sourceTsconfigNames = [
      "tsconfig.build.json",
      "tsconfig.components.json",
      "tsconfig.hooks.json",
      "tsconfig.procedures.json",
    ];
    const scripts = packageJson.scripts as Record<string, string>;
    const checkComponents = scripts["check:components"] ?? "";
    const typecheckScripts = Object.keys(scripts)
      .filter((scriptName) => scriptName.startsWith("typecheck:"))
      .sort();
    const missingTypecheckScripts = typecheckScripts.filter(
      (scriptName) => !checkComponents.includes(`npm run ${scriptName}`),
    );

    assert.deepEqual(
      missingTypecheckScripts,
      [],
      "`check:components` should run every dedicated typecheck script",
    );
    assert.match(checkComponents, /tsx src\/build\.ts --check/);
    assert.equal(existsSync(join(repoRoot, "tsconfig.src.strict.tmp.json")), false);
    for (const tsconfigName of sourceTsconfigNames) {
      const tsconfig = JSON.parse(readFileSync(join(repoRoot, tsconfigName), "utf-8"));
      assert.equal(
        Object.hasOwn(tsconfig.compilerOptions ?? {}, "allowImportingTsExtensions"),
        false,
        `${tsconfigName} should not opt source code back into .ts extension imports`,
      );
    }
  });

  test("component API exposes procedures through the single component layout", () => {
    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    const proceduresIndexSource = readFileSync(join(repoRoot, "src/components/procedures/index.ts"), "utf-8");
    const registrySource = readFileSync(join(repoRoot, "src/components/registry.ts"), "utf-8");
    const buildRoot = join(repoRoot, "src/build");
    const buildSources = collectFiles(buildRoot, (file) => file.endsWith(".ts"))
      .map((file) => readFileSync(file, "utf-8"))
      .join("\n");

    assert.doesNotMatch(
      sdkSource,
      /\b(?:ScriptDefinition|ScriptUseDefinition|SkillScriptRootDefinition|defineScript|defineScriptUse|defineSkillScriptRoot|scriptRoots\?:|scripts\?:)\b/,
    );
    assert.doesNotMatch(proceduresIndexSource, /\b(?:scriptUse|componentScripts)\b/);
    assert.doesNotMatch(registrySource, /\bscripts:/);
    assert.equal(existsSync(join(buildRoot, "scripts.ts")), false);
    assert.equal(existsSync(join(buildRoot, "script-uses.ts")), false);
    assert.doesNotMatch(readFileSync(join(buildRoot, "procedures.ts"), "utf-8"), /__aiExpertsScriptDir/);
    const canonicalSourceRootDeclarations = buildSources.match(
      /\bexport const sourceRoot = join\(repoRoot, "src\/components"\);/g,
    );
    assert.equal(
      canonicalSourceRootDeclarations?.length,
      1,
      "build code should expose exactly one canonical component source root",
    );
    const alternateSourceRootNames = buildSources.match(/\b(?:sourceRoots|componentSourceRoots)\b/g) ?? [];
    assert.deepEqual(
      alternateSourceRootNames,
      [],
      "build code should not expose alternate component source roots",
    );
    assert.doesNotMatch(
      buildSources,
      /ai-components-/,
      "build temp/runtime labels should use ai-experts naming instead of legacy ai-components prefixes",
    );
    assert.doesNotMatch(
      buildSources,
      /legacy lifecycle directory/,
      "build errors should describe canonical hook layout without exposing migration-era lifecycle wording",
    );
    assert.equal(
      existsSync(join(repoRoot, "plugins")),
      false,
      "component sources should only live under the canonical src/components root",
    );
  });

  test("component source directories match the registered component surface", () => {
    const skillDirs = readdirSync(join(repoRoot, "src/components/skills"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const agentDirs = readdirSync(join(repoRoot, "src/components/agents"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    assert.deepEqual(
      skillDirs,
      registry.skills.map((skill) => skill.id).sort(),
      "every skill source directory should be registered and every registered skill should have a source directory",
    );
    assert.deepEqual(
      agentDirs,
      registry.agents.map((agent) => agent.id).sort(),
      "every agent source directory should be registered and every registered agent should have a source directory",
    );
  });

  test("Codex-enabled skill sources do not carry Anthropic-only license terms", () => {
    const restrictedLicensePattern = /Anthropic[\s\S]+ADDITIONAL RESTRICTIONS[\s\S]+may not[\s\S]+Extract these materials from the Services/u;

    for (const skill of registry.skills) {
      if (!skill.platforms.includes(Platform.Codex)) continue;
      const licensePath = join(repoRoot, "src/components/skills", skill.id, "LICENSE.txt");
      if (!existsSync(licensePath)) continue;
      assert.doesNotMatch(
        readFileSync(licensePath, "utf-8"),
        restrictedLicensePattern,
        `${skill.id} is Codex-enabled but carries Anthropic-only license terms`,
      );
    }
  });

  test("skill source uses platform-neutral workspace output paths", () => {
    const platformSpecificDocPaths: string[] = [];
    for (const sourceFile of collectFiles(join(repoRoot, "src/components/skills"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/(?:^|[`"'\s])\.(?:claude|codex)\/docs\//.test(source)) {
        platformSpecificDocPaths.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificDocPaths,
      [],
      "cross-platform skills should write workspace docs under neutral paths such as docs/ai/, not .claude/docs/ or .codex/docs/",
    );
  });

  test("repository skill utilities use the canonical component skills root", () => {
    const curateSkillsSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/skills-prune-and-sync-readme/curate_skills.ts"),
      "utf-8",
    );
    const canonicalSkillRootUsages =
      curateSkillsSource.match(/\bpath\.join\(repoRoot, "src\/components\/skills"\)/g) ?? [];

    assert.equal(
      canonicalSkillRootUsages.length,
      1,
      "repository skill curation should read from the single canonical component skills root",
    );
    assert.doesNotMatch(
      curateSkillsSource,
      /\b(?:sourceRoots|componentSourceRoots)\b/,
      "repository skill curation should not declare alternate source roots",
    );
  });

  test("runtime sources do not reintroduce legacy plugin-root compatibility paths", () => {
    const legacyPluginRootMentions: string[] = [];
    const runtimeSourceFiles = [
      ...collectFiles(join(repoRoot, "src/build"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "src/components"), (file) => file.endsWith(".ts")),
    ];
    const legacyPattern =
      /\bisLegacyPluginsRoot\b|\blegacyPluginsRoot\b|~\/\.claude\/plugins\b|~\/\.codex\/plugins\b|~\/\.codex\/skills\b/u;

    for (const sourceFile of runtimeSourceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      if (legacyPattern.test(source)) {
        legacyPluginRootMentions.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      legacyPluginRootMentions,
      [],
      "runtime source code should only target canonical configRoot/skillRoot and must not keep legacy plugin-root or ~/.codex/skills compatibility branches",
    );
  });

  test("procedure YAML handling uses the shared yaml package", () => {
    const yamlProcedureSources = [
      join(repoRoot, "src/components/procedures/sources/skill-creator/quick_validate.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_eval.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/utils.ts"),
      join(repoRoot, "src/components/procedures/sources/skills-prune-and-sync-readme/curate_skills.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-activation-analyzer/cso_audit.ts"),
    ];
    const procedureBuilder = readFileSync(join(repoRoot, "src/build/procedures.ts"), "utf-8");

    for (const sourceFile of yamlProcedureSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.match(source, /from "yaml"/, `${sourceFile} should use the yaml package`);
      assert.doesNotMatch(
        source,
        /parseYamlScalar|不支持的 YAML 行|stripQuotes\(|nameMatch|descMatch|line\.startsWith\("name:"\)|line\.startsWith\("description:"\)/,
        `${sourceFile} should not maintain an ad hoc YAML/frontmatter parser`,
      );
    }
    assert.match(
      procedureBuilder,
      /id === "yaml" \|\| id\.startsWith\("yaml\/"\)/,
      "procedure runtime should bundle yaml instead of requiring user-level node_modules",
    );
  });

  test("runtime component sources do not leak maintainer-local absolute paths", () => {
    const localPathPattern = /(?:^|[\s"'`(])(?:\/Users\/[^\s"'`)]+|\/home\/[^\s"'`)]+|\/private\/var\/[^\s"'`)]+|\/var\/folders\/[^\s"'`)]+|[A-Za-z]:\\Users\\[^\s"'`)]+)/u;
    const leakedPaths: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (localPathPattern.test(source)) {
        leakedPaths.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(leakedPaths, [], "runtime component files should use portable paths, placeholders, or variables");
  });

  test("skill activation analyzer uses component terminology", () => {
    const activationAnalyzerSources = [
      join(repoRoot, "src/components/procedures/sources/skill-activation-analyzer/cso_audit.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-activation-analyzer/references")),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-activation-analyzer/evals")),
    ];

    for (const sourceFile of activationAnalyzerSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /插件|plugin|Claude 会|Claude 难|Claude 一次/u,
        `${sourceFile} should use platform-neutral component terminology`,
      );
    }
  });

  test("screenshot procedures use platform-neutral helper labels", () => {
    const screenshotSources = collectFiles(join(repoRoot, "src/components/procedures/sources/screenshot"));

    for (const sourceFile of screenshotSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /CODEX_SCREENSHOT|codex-shot|Codex if needed|Codex skills|Cross-platform screenshot helper for Codex/u,
        `${sourceFile} should not expose Codex-specific screenshot labels in cross-platform helpers`,
      );
    }
  });

  test("cross-platform hook source comments use platform-neutral rationale", () => {
    const platformSpecificRationale: string[] = [];
    const legacyHookRuntimeTerms: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (!/platforms:\s*\[Platform\.Claude,\s*Platform\.Codex\]/.test(source)) continue;
      if (/\bClaude Code\b|\bAnthropic\b/u.test(source)) {
        platformSpecificRationale.push(relative(repoRoot, sourceFile));
      }
      if (/(?:向|让|强制|要求)\s*Claude|帮助 Claude|Claude (?:在|判断|根本|收到|拿到|完成)|Claude 自觉|原 skills\/|原 skill 文件已删除|── 执行步骤 ──/u.test(source)) {
        legacyHookRuntimeTerms.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificRationale,
      [],
      "cross-platform hooks should justify behavior in platform-neutral terms",
    );
    assert.deepEqual(
      legacyHookRuntimeTerms,
      [],
      "cross-platform hooks should not expose Claude-only or migrated skill workflow wording in runtime guidance",
    );
  });

  test("component guidance only names registered skills as standalone skills", () => {
    const registeredSkillIds = new Set(registry.skills.map((skill) => skill.id));
    const unknownSkillMentions: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(/`([a-z0-9][a-z0-9-]+)`\s+skill\b/gu)) {
        const skillId = match[1] ?? "";
        if (!registeredSkillIds.has(skillId)) {
          unknownSkillMentions.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
        }
      }
    }

    assert.deepEqual(
      unknownSkillMentions,
      [],
      "standalone skill mentions should point to registered skill ids; references should be named as references or flows",
    );
  });

  test("skill creator viewer uses platform-neutral review wording", () => {
    const viewerSource = readFileSync(
      join(repoRoot, "src/components/skills/skill-creator/assets/eval-viewer/viewer.html"),
      "utf-8",
    );

    assert.doesNotMatch(viewerSource, /Claude Code|告诉 Claude|回到 Claude/u);
    assert.match(viewerSource, /回到当前 CLI 会话告诉代理/u);
  });

  test("skill author agent uses source component filenames for authoring", () => {
    const skillAuthorSource = readFileSync(join(repoRoot, "src/components/agents/skill-author/index.ts"), "utf-8");

    assert.match(skillAuthorSource, /index\.ts、references、assets、evals、Procedure 引用/);
    assert.match(skillAuthorSource, /registry\.generated\.ts/);
    assert.doesNotMatch(
      skillAuthorSource,
      /SKILL\.body\.md|src\/components\/skills\/<skill>\/` 下的 SKILL\.md|写 SKILL\.md 时|README 索引项|\[SKILL\.md \//u,
      "skill author should describe source component files instead of generated SKILL.md output",
    );
  });

  test("skill evaluator uses model-neutral knowledge wording", () => {
    const evaluatorSources = [
      join(repoRoot, "src/components/skills/skill-evaluator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evaluator/references")),
    ];

    for (const sourceFile of evaluatorSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude 已知|Claude 不具备|Claude 不知道|Claude 不会|向 Claude|为 Claude|Claude 肯定|Claude 确实/u,
        `${sourceFile} should use model-neutral skill evaluation wording`,
      );
    }
  });

  test("copied skill readmes do not self-identify as Claude-only skills", () => {
    const skillReadmes = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("README.md"),
    );

    for (const readmeFile of skillReadmes) {
      const source = readFileSync(readmeFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\bA Claude skill\b|\bClaude skill\b|目录内脚本的本地用法/u,
        `${readmeFile} should describe the component neutrally because README files are copied to both platforms`,
      );
      assert.doesNotMatch(
        source,
        /\bnode\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/u,
        `${readmeFile} should use platform-level procedures instead of skill-local scripts because README files are copied to dist`,
      );
    }
  });

  test("AI collaboration examples include Codex when listing Claude Code and Cursor", () => {
    const skillSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude Code\s*\/\s*Cursor(?![^()\n]*Codex)/u,
        `${sourceFile} should include Codex in cross-platform AI collaboration examples`,
      );
    }
  });

  test("copied skill markdown uses model-neutral actor wording", () => {
    const actorSpecificGuidance: string[] = [];
    const skillSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );
    const claudeActorPattern =
      /Claude 阅读|Claude 应|Claude 会|Claude 需要|向 Claude|让 Claude|告诉 Claude|为 Claude|\buse Claude for\b/iu;

    for (const sourceFile of skillSources) {
      const source = readFileSync(sourceFile, "utf-8");
      source.split("\n").forEach((line, index) => {
        if (claudeActorPattern.test(line)) {
          actorSpecificGuidance.push(`${relative(repoRoot, sourceFile)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    assert.deepEqual(
      actorSpecificGuidance,
      [],
      "copied skill Markdown should not use Claude as the runtime actor; use model-neutral wording",
    );
  });

  test("component workflow declarations use the shared workflow API", () => {
    const legacyWorkflowHelpers: string[] = [];
    const legacyWorkflowTableMentions: string[] = [];
    const legacyExecutionStepTerms: string[] = [];
    const componentSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".ts") && !file.endsWith("sdk.ts"),
    );
    const workflowGuidanceSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      /\.(?:ts|md)$/u.test(file) &&
      /[\\/]src[\\/]components[\\/](?:skills|agents)[\\/]/u.test(file) &&
      !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of componentSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/\bdefine(?:Agent|Skill)Workflow(?:Step|Gate|Route)?\b/u.test(source)) {
        legacyWorkflowHelpers.push(relative(repoRoot, sourceFile));
      }
      if (/门禁表|场景路由表|分场景路由/u.test(source)) {
        legacyWorkflowTableMentions.push(relative(repoRoot, sourceFile));
      }
    }

    for (const sourceFile of workflowGuidanceSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/执行步骤/u.test(source)) {
        legacyExecutionStepTerms.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      legacyWorkflowHelpers,
      [],
      "component sources should use defineWorkflow* helpers so skills and agents share one workflow model",
    );
    assert.deepEqual(
      legacyWorkflowTableMentions,
      [],
      "component sources should model gates and routes through workflow nodes instead of describing legacy tables",
    );
    assert.deepEqual(
      legacyExecutionStepTerms,
      [],
      "skill and agent structured metadata should use shared workflow terminology instead of legacy execution-step wording",
    );
  });

  test("component guidance uses current skill ids instead of legacy expert routes", () => {
    const legacyExpertRoutes: string[] = [];
    const componentGuidanceFiles = collectFiles(join(repoRoot, "src/components"), (file) =>
      /\.(?:ts|md|ya?ml)$/u.test(file) && !file.endsWith("registry.generated.ts"),
    );
    const legacyExpertRoutePattern =
      /\b(?:android|database|mysql|pgsql|speckit|skill)-expert(?::[a-z0-9-]+|\/[a-z0-9-]+)?\b/u;

    for (const sourceFile of componentGuidanceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      const match = source.match(legacyExpertRoutePattern);
      if (match) {
        legacyExpertRoutes.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyExpertRoutes,
      [],
      "component guidance should reference current skill ids instead of legacy expert route names",
    );
  });

  test("cross-platform skill guidance does not recommend Claude Code without Codex", () => {
    const platformBiasedAdvice: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components/skills"), (file) => file.endsWith(".md"))) {
      const source = readFileSync(sourceFile, "utf-8");
      source.split("\n").forEach((line, index) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith(">")) return;
        if (/\b(?:Use|使用|优先使用)\s+Claude Code\b/u.test(line) && !/\bCodex\b/u.test(line)) {
          platformBiasedAdvice.push(`${relative(repoRoot, sourceFile)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    assert.deepEqual(
      platformBiasedAdvice,
      [],
      "cross-platform skill Markdown may quote Claude Code, but operational advice should include Codex or use neutral wording",
    );
  });

  test("skill markdown sources do not use placeholder markdown links", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\(\{[^}\n]+\}\)/u,
        `${sourceFile} should render placeholder URLs as plain text instead of broken local markdown links`,
      );
    }
  });

  test("skill markdown sources avoid angle-bracket TODO placeholders", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /<TODO\b/iu,
        `${sourceFile} should avoid shipping raw <TODO ...> placeholders in runtime guidance`,
      );
    }
  });

  test("skill markdown sources avoid bare current-directory links", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\(\.\)/u,
        `${sourceFile} should avoid bare (.) links; use a concrete file path or plain text`,
      );
    }
  });

  test("component sources avoid references root directory links", () => {
    const componentRuntimeDocs = [
      ...collectFiles(
        join(repoRoot, "src/components/skills"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
      ...collectFiles(join(repoRoot, "src/components/agents"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts")),
    ];

    for (const sourceFile of componentRuntimeDocs) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\((?:\.\/)?references\/\)/u,
        `${sourceFile} should link concrete reference files instead of references/ directory roots`,
      );
    }
  });

  test("skill markdown sources define every used reference-style label", () => {
    const missingDefinitions: string[] = [];
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const definedLabels = new Set<string>();
      const usedLabels = new Set<string>();

      for (const match of source.matchAll(/^\s*\[([^\]\n]+)\]:\s+(\S+)/gmu)) {
        definedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
      }

      for (const match of source.matchAll(/(?<!!)\[[^\]\n]+\]\[([^\]\n]+)\]/gu)) {
        usedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
      }

      for (const match of source.matchAll(/(?<!!)\[([^\]\n]+)\]\[\]/gu)) {
        usedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
      }

      for (const label of usedLabels) {
        if (!label || label.startsWith("^")) continue;
        if (!definedLabels.has(label)) {
          missingDefinitions.push(`${relative(repoRoot, sourceFile)}: [${label}]`);
        }
      }
    }

    assert.deepEqual(
      missingDefinitions,
      [],
      "skill markdown reference-style links should define every used label",
    );
  });

  test("skill root readme/license links stay within skill root", () => {
    const skillRoot = join(repoRoot, "src/components/skills");
    const escapedRootLinks: string[] = [];
    const missingLocalLinks: string[] = [];

    for (const skillEntry of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const skillDir = join(skillRoot, skillEntry.name);
      for (const fileName of ["README.md", "LICENSE.txt"]) {
        const sourceFile = join(skillDir, fileName);
        if (!existsSync(sourceFile)) continue;
        const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
        for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
          if (match[1] === "!") continue;
          const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
          if (!targetPath || !/^\.\.?\//u.test(targetPath)) continue;
          const resolvedTarget = resolve(dirname(sourceFile), targetPath);
          if (!resolvedTarget.startsWith(`${skillDir}/`) && resolvedTarget !== skillDir) {
            escapedRootLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
            continue;
          }
          if (!existsSync(resolvedTarget)) {
            missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
          }
        }
        for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
          const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
          if (!targetPath || !/^\.\.?\//u.test(targetPath)) continue;
          const resolvedTarget = resolve(dirname(sourceFile), targetPath);
          if (!resolvedTarget.startsWith(`${skillDir}/`) && resolvedTarget !== skillDir) {
            escapedRootLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
            continue;
          }
          if (!existsSync(resolvedTarget)) {
            missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
          }
        }
      }
    }

    assert.deepEqual(
      escapedRootLinks,
      [],
      "skill root README/LICENSE local links should not escape the skill root; these docs are copied with the skill package",
    );
    assert.deepEqual(
      missingLocalLinks,
      [],
      "skill root README/LICENSE local links should point to files that exist in the same skill package",
    );
  });

  test("skill reference markdown links are relative to their file location", () => {
    const rootRelativeLinks: string[] = [];
    const referenceMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath) continue;
        if (
          /^(?:\.\/)?(?:references|assets)\//u.test(targetPath) ||
          /(?:^|\/)mermaid_diagrams\//u.test(targetPath)
        ) {
          rootRelativeLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
        if (!targetPath) continue;
        if (
          /^(?:\.\/)?(?:references|assets)\//u.test(targetPath) ||
          /(?:^|\/)mermaid_diagrams\//u.test(targetPath)
        ) {
          rootRelativeLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      rootRelativeLinks,
      [],
      "reference Markdown is copied into references/, so links to packaged references/assets must be relative from the current file",
    );
  });

  test("component markdown sources do not link local directories directly", () => {
    const directoryLinks: string[] = [];
    const markdownSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of markdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath) continue;
        const resolvedTarget = resolve(dirname(sourceFile), targetPath);
        if (existsSync(resolvedTarget) && lstatSync(resolvedTarget).isDirectory()) {
          directoryLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
        if (!targetPath) continue;
        const resolvedTarget = resolve(dirname(sourceFile), targetPath);
        if (existsSync(resolvedTarget) && lstatSync(resolvedTarget).isDirectory()) {
          directoryLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      directoryLinks,
      [],
      "component Markdown should link concrete files instead of local directories",
    );
  });

  test("component markdown local file links resolve in source tree", () => {
    const missingLocalLinks: string[] = [];
    const markdownSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    const isGeneratedSkillLink = (targetPath: string): boolean =>
      targetPath === "SKILL.md" || targetPath.endsWith("/SKILL.md");

    for (const sourceFile of markdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath || isGeneratedSkillLink(targetPath)) continue;
        if (!existsSync(resolve(dirname(sourceFile), targetPath))) {
          missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+([^\n]+)$/gmu)) {
        const destination = markdownDestination(match[1] ?? "");
        if (!isLikelyLocalDefinitionPath(destination)) continue;
        const targetPath = localMarkdownPath(destination);
        if (!targetPath || isGeneratedSkillLink(targetPath)) continue;
        if (!existsSync(resolve(dirname(sourceFile), targetPath))) {
          missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      missingLocalLinks,
      [],
      "component Markdown local file links should resolve from source files",
    );
  });

  test("skill reference markdown links to generated skills only for registered skill sources", () => {
    const missingSkillLinks: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const collectSkillLinkTarget = (targetPath: string | null): void => {
        if (!targetPath) return;
        if (targetPath !== "../SKILL.md" && targetPath !== "./SKILL.md" && !targetPath.endsWith("/SKILL.md")) {
          return;
        }

        const targetSkillDir = dirname(resolve(dirname(sourceFile), targetPath));
        const relativeSkillDir = relative(skillSourceRoot, targetSkillDir);
        if (relativeSkillDir === "" || relativeSkillDir.startsWith("..")) return;
        if (!existsSync(join(targetSkillDir, "index.ts"))) {
          missingSkillLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      };

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        collectSkillLinkTarget(localMarkdownPath(markdownDestination(match[2] ?? "")));
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        collectSkillLinkTarget(localMarkdownPath(markdownDestination(match[1] ?? "")));
      }
    }

    assert.deepEqual(
      missingSkillLinks,
      [],
      "reference Markdown should not link to legacy sub-skill/plugin SKILL.md paths; link the real reference file or use plain text",
    );
  });

  test("skill reference markdown links to packaged assets only when the asset is registered", () => {
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const missingAssetLinks: string[] = [];
    const unregisteredAssetLinks: string[] = [];
    const assetTargetsBySkill = new Map<string, Set<string>>();

    for (const skill of registry.skills) {
      const targets = new Set<string>();
      for (const asset of skill.assets ?? []) {
        const target = asset.target ?? `assets/${basename(asset.source instanceof URL ? fileURLToPath(asset.source) : asset.source)}`;
        targets.add(target);
      }
      assetTargetsBySkill.set(skill.id, targets);
    }

    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const relativeSourceFile = relative(repoRoot, sourceFile);
      const skillId = relative(skillSourceRoot, sourceFile).split(/[\\/]/)[0];
      const assetTargets = assetTargetsBySkill.get(skillId) ?? new Set<string>();
      const collectAssetLinkTarget = (targetPath: string | null): void => {
        if (!targetPath || !targetPath.startsWith("../assets/")) return;

        const absoluteTarget = resolve(dirname(sourceFile), targetPath);
        const packagedTarget = targetPath.replace(/^\.\.\/assets\//u, "assets/");
        if (!existsSync(absoluteTarget)) {
          missingAssetLinks.push(`${relativeSourceFile}: ${targetPath}`);
        }
        if (!assetTargets.has(packagedTarget)) {
          unregisteredAssetLinks.push(`${relativeSourceFile}: ${targetPath}`);
        }
      };

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        collectAssetLinkTarget(localMarkdownPath(markdownDestination(match[2] ?? "")));
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        collectAssetLinkTarget(localMarkdownPath(markdownDestination(match[1] ?? "")));
      }
    }

    assert.deepEqual(missingAssetLinks, [], "reference Markdown should not link to missing skill assets");
    assert.deepEqual(unregisteredAssetLinks, [], "linked skill assets must be registered through defineAsset");
  });

  test("skill markdown sources keep same-file heading anchors valid", () => {
    const brokenAnchors: string[] = [];
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      const headingSlugs = collectMarkdownAnchors(source);

      const sourceWithoutCodeFences = source.replace(/```[\s\S]*?```/gu, "");
      for (const match of sourceWithoutCodeFences.matchAll(/\[[^\]]+\]\((#[^)\s]+)\)/gu)) {
        const target = decodeMarkdownAnchor(match[1].slice(1)).toLowerCase();
        if (!headingSlugs.has(target)) {
          brokenAnchors.push(`${relative(repoRoot, sourceFile)}: missing #${target}`);
        }
      }
    }

    assert.deepEqual(
      brokenAnchors,
      [],
      "same-file markdown anchors should match generated heading slugs",
    );
  });

  test("skill markdown sources keep cross-file heading anchors valid", () => {
    const brokenAnchors: string[] = [];
    const anchorCache = new Map<string, Set<string>>();
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    const checkHref = (sourceFile: string, rawHref: string): void => {
      const href = markdownDestination(rawHref);
      if (!href.includes("#") || /^[a-z][a-z0-9+.-]*:/iu.test(href) || href.startsWith("#")) return;

      const hashIndex = href.indexOf("#");
      const anchor = href.slice(hashIndex + 1);
      const targetPath = localMarkdownPath(href);
      if (!targetPath || !anchor) return;

      const targetFile = resolve(dirname(sourceFile), targetPath);
      if (!existsSync(targetFile) || extname(targetFile) !== ".md") return;

      let targetAnchors = anchorCache.get(targetFile);
      if (!targetAnchors) {
        targetAnchors = collectMarkdownAnchors(readFileSync(targetFile, "utf-8"));
        anchorCache.set(targetFile, targetAnchors);
      }

      const target = decodeMarkdownAnchor(anchor).toLowerCase();
      if (!targetAnchors.has(target)) {
        brokenAnchors.push(`${relative(repoRoot, sourceFile)}: ${href} missing #${target}`);
      }
    };

    for (const sourceFile of skillMarkdownSources) {
      const sourceWithoutCodeFences = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of sourceWithoutCodeFences.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
        checkHref(sourceFile, match[1] as string);
      }
      for (const match of sourceWithoutCodeFences.matchAll(/^\s*\[([^\]\n]+)\]:\s+([^\n]+)$/gmu)) {
        const label = (match[1] ?? "").trim();
        if (label.startsWith("^")) continue;
        checkHref(sourceFile, match[2] as string);
      }
    }

    assert.deepEqual(
      brokenAnchors,
      [],
      "cross-file markdown anchors should match generated heading slugs or explicit HTML anchors",
    );
  });

  test("procedure references use generated command tables instead of pseudo shell syntax", () => {
    const componentRuntimeDocs = [
      ...collectFiles(
        join(repoRoot, "src/components/skills"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
      ...collectFiles(
        join(repoRoot, "src/components/agents"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
    ];
    const pseudoProcedureReferences: string[] = [];
    const pseudoProcedurePattern = /`procedure\s+[a-z0-9-]+(?:\s[^`]*)?`|\bprocedure\s+`[a-z0-9-]+`/g;

    for (const sourceFile of componentRuntimeDocs) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(pseudoProcedurePattern)) {
        pseudoProcedureReferences.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      pseudoProcedureReferences,
      [],
      "procedure ids should be referenced as `<id> procedure`; runnable commands come from generated Procedure 调用说明",
    );
  });

  test("source skill script commands are backed by registered procedure targets", () => {
    const proceduresBySkillAndTarget = new Set(
      registry.procedures.flatMap((procedure) =>
        (procedure.owners.skillIds ?? []).map((skillId) => `${skillId}:${procedure.target ?? ""}`)
      ),
    );
    const unmappedScriptCommands: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const scriptCommandPattern = /\bnode\s+(?:\.\/)?scripts\/([A-Za-z0-9._/-]+\.mjs)\b/gu;

    for (const sourceFile of collectFiles(
      skillSourceRoot,
      (file) => file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    )) {
      const relativeSource = relative(skillSourceRoot, sourceFile);
      const skillId = relativeSource.split(/[\\/]/)[0];
      if (!skillId) continue;
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(scriptCommandPattern)) {
        const target = `scripts/${match[1]}`;
        if (!proceduresBySkillAndTarget.has(`${skillId}:${target}`)) {
          unmappedScriptCommands.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
        }
      }
    }

    assert.deepEqual(
      unmappedScriptCommands,
      [],
      "source skill Markdown may use short node scripts commands only when emitSkill can rewrite them to owned procedures",
    );
  });

  test("skill authoring guidance does not reintroduce skill-local scripts directories", () => {
    const authoringSources = [
      join(repoRoot, "src/components/agents/skill-author/index.ts"),
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-creator/references"), (file) =>
        file.endsWith(".md"),
      ),
      join(repoRoot, "src/components/skills/skill-evolver/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evolver/references"), (file) =>
        file.endsWith(".md"),
      ),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evaluator/references"), (file) =>
        file.endsWith(".md"),
      ),
    ];
    const legacyAuthoringScriptRefs: string[] = [];
    const legacyScriptPackagePattern = /scripts\/\*|`scripts\/`|scripts\/、|references\/scripts|scripts\/references|scripts、|脚手架资产（scripts/u;

    for (const sourceFile of authoringSources) {
      const source = readFileSync(sourceFile, "utf-8");
      const match = source.match(legacyScriptPackagePattern);
      if (match) {
        legacyAuthoringScriptRefs.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyAuthoringScriptRefs,
      [],
      "skill authoring guidance should route reusable code through procedures instead of skill-local scripts/ directories",
    );
  });

  test("skill creator authoring guidance uses cases yaml eval files", () => {
    const skillCreatorSources = [
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-creator/references"), (file) =>
        file.endsWith(".md"),
      ),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_eval.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_loop.ts"),
    ];
    const staleEvalSetRefs: string[] = [];

    for (const sourceFile of skillCreatorSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/evals\/evals\.json|--eval-set evals\.json/u.test(source)) {
        staleEvalSetRefs.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(staleEvalSetRefs, [], "skill creator should default to evals/cases.yaml, not evals/evals.json");
    assert.match(
      readFileSync(join(repoRoot, "src/components/skills/skill-creator/index.ts"), "utf-8"),
      /evals\/cases\.yaml/,
    );
    assert.match(
      readFileSync(join(repoRoot, "src/components/skills/skill-creator/references/schemas.md"), "utf-8"),
      /cases:\n  - id:/,
    );
  });

  test("cross-platform source names project memory files neutrally", () => {
    const platformSpecificMemoryRefs: string[] = [];
    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/全局 CLAUDE\.md|仓库 `CLAUDE\.md`|记忆文件 \/ plan \/ CLAUDE\.md/.test(source)) {
        platformSpecificMemoryRefs.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificMemoryRefs,
      [],
      "cross-platform components should refer to project memory files neutrally, not only CLAUDE.md",
    );
  });

  test("hooks use the normalized payload contract", () => {
    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    const hookBuilderSource = readFileSync(join(repoRoot, "src/build/hooks.ts"), "utf-8");
    const hookSources = collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts"));

    assert.doesNotMatch(sdkSource, /\bLegacyHook(?:Payload|ToolInput)\b|payloadMode\?:/);
    assert.doesNotMatch(hookBuilderSource, /\btoLegacyClaudePayload\b|payloadMode|claude-raw/);
    for (const hookSource of hookSources) {
      const source = readFileSync(hookSource, "utf-8");
      assert.doesNotMatch(
        source,
        /\bLegacyHookPayload\b|payloadMode:\s*"claude-raw"|payload\?\.(?:tool_input|tool_name|transcript_path|session_id|stop_hook_active)/,
        `${hookSource} should consume NormalizedHookPayload directly`,
      );
    }
  });

  test("hook source modules are all registered", () => {
    const hookRoot = join(repoRoot, "src/components/hooks");
    const hookSourceFiles = collectFiles(
      hookRoot,
      (file) => file.endsWith(".ts") && !file.endsWith("/index.ts") && !file.includes(`${join("hooks", "_shared")}${"/"}`),
    );
    const hookFilesWithDefinitions = hookSourceFiles
      .filter((file) => /export\s+const\s+[A-Za-z0-9_$]+\s*=\s*defineHook\s*\(/.test(readFileSync(file, "utf-8")))
      .map((file) => relative(repoRoot, file))
      .sort();
    const registeredHookFiles = registry.hooks
      .map((hook) => relative(repoRoot, hook.entry instanceof URL ? fileURLToPath(hook.entry) : hook.entry))
      .sort();

    assert.deepEqual(
      registeredHookFiles,
      hookFilesWithDefinitions,
      "every hook source that defines a hook should be registered through src/components/hooks/index.ts",
    );
  });

  test("registered procedures export main and do not execute at module top level", () => {
    function procedurePath(entry: URL | string): string {
      return entry instanceof URL ? fileURLToPath(entry) : entry;
    }

    function exportsProcedure(sourceFile: ts.SourceFile): boolean {
      return sourceFile.statements.some((statement) =>
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
        statement.declarationList.declarations.some((declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "procedure" &&
          declaration.initializer !== undefined &&
          ts.isCallExpression(declaration.initializer) &&
          declaration.initializer.expression.getText(sourceFile) === "defineCliProcedure"
        )
      );
    }

    function sourceLocalProcedureEntry(sourceFile: ts.SourceFile): string | null {
      for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
          if (
            !ts.isIdentifier(declaration.name) ||
            declaration.name.text !== "procedure" ||
            !declaration.initializer ||
            !ts.isCallExpression(declaration.initializer)
          ) continue;
          const objectArg = declaration.initializer.arguments[0];
          if (!objectArg || !ts.isObjectLiteralExpression(objectArg)) continue;
          for (const property of objectArg.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === "entry"
            ) {
              if (
                ts.isCallExpression(property.initializer) &&
                property.initializer.expression.getText(sourceFile) === "procedureEntry" &&
                property.initializer.arguments[0]?.getText(sourceFile) === "import.meta.url"
              ) {
                return "__self__";
              }
              if (
                ts.isNewExpression(property.initializer) &&
                property.initializer.expression.getText(sourceFile) === "URL"
              ) {
                const [firstArg] = property.initializer.arguments ?? [];
                if (firstArg && ts.isStringLiteral(firstArg)) return firstArg.text;
              }
            }
          }
        }
      }
      return null;
    }

    function exportsMain(sourceFile: ts.SourceFile): boolean {
      return sourceFile.statements.some((statement) =>
        (ts.isFunctionDeclaration(statement) &&
          statement.name?.text === "main" &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) ||
        (ts.isVariableStatement(statement) &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
          statement.declarationList.declarations.some((declaration) =>
            ts.isIdentifier(declaration.name) && declaration.name.text === "main"
          ))
      );
    }

    const procedureRegistrySource = readFileSync(join(repoRoot, "src/components/procedures/registry.ts"), "utf-8");
    assert.doesNotMatch(
      procedureRegistrySource,
      /\bdefineCliProcedure\s*\(/,
      "procedure metadata should live beside the source implementation, not in the central registry",
    );

    const missingProcedureExport = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        return {
          id: procedure.id,
          path,
          sourceFile,
        };
      })
      .filter(({ sourceFile }) => !exportsProcedure(sourceFile))
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      missingProcedureExport,
      [],
      "registered Procedure entries must export their defineCliProcedure metadata from the entry source module",
    );

    const mismatchedProcedureEntries = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const localEntry = sourceLocalProcedureEntry(sourceFile);
        const expected = resolve(path);
        const actual = localEntry === "__self__" ? expected : localEntry ? resolve(dirname(path), localEntry) : null;
        return { id: procedure.id, path, expected, actual };
      })
      .filter(({ expected, actual }) => expected !== actual)
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      mismatchedProcedureEntries,
      [],
      "source-local Procedure metadata entry should point at its own source file",
    );

    function mainFunctionProblem(sourceFile: ts.SourceFile): string | null {
      for (const statement of sourceFile.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === "main") {
          const argvParam = statement.parameters[0];
          if (!argvParam) return "main does not accept argv";
          if (!ts.isIdentifier(argvParam.name) || argvParam.name.text !== "argv") return "first main parameter is not argv";
          if (argvParam.initializer) return "main argv parameter has a default value";
          if (argvParam.type?.getText(sourceFile) !== "readonly string[]") return "main argv is not typed as readonly string[]";
          if (statement.getText(sourceFile).includes("process.argv")) return "main reads process.argv";
        }
        if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === "main") {
              if (statement.getText(sourceFile).includes("process.argv")) return "main reads process.argv";
            }
          }
        }
      }
      return null;
    }

    function statementText(source: string, statement: ts.Statement): string {
      return source.slice(statement.getFullStart(), statement.getEnd());
    }

    function topLevelExecutionReason(source: string, statement: ts.Statement): string | null {
      const text = statementText(source, statement);
      if (ts.isExpressionStatement(statement)) return "top-level expression statement";
      if (ts.isIfStatement(statement)) return "top-level if statement";
      if (ts.isTryStatement(statement)) return "top-level try/catch statement";
      if (ts.isForStatement(statement) || ts.isForInStatement(statement) || ts.isForOfStatement(statement)) {
        return "top-level loop";
      }
      if (ts.isWhileStatement(statement) || ts.isDoStatement(statement)) return "top-level loop";
      if (ts.isThrowStatement(statement) || ts.isReturnStatement(statement)) return "top-level control flow";
      if (ts.isVariableStatement(statement) && /process\.argv|process\.exit|console\.|spawnSync\(|execFileSync\(|readFileSync\(0/.test(text)) {
        return "top-level runtime-dependent variable initializer";
      }
      return null;
    }

    const missingExportMain = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        return {
          id: procedure.id,
          path,
          sourceFile,
        };
      })
      .filter(({ sourceFile }) => !exportsMain(sourceFile))
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      missingExportMain,
      [],
      "registered Procedure entries must export main(); import-only helper modules should stay unregistered",
    );

    const invalidMainContracts = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        return {
          id: procedure.id,
          path,
          problem: mainFunctionProblem(sourceFile),
        };
      })
      .filter((item) => item.problem !== null)
      .map(({ id, path, problem }) => `${id}: ${relative(repoRoot, path)} (${problem})`);

    assert.deepEqual(
      invalidMainContracts,
      [],
      "registered Procedure main(argv) must accept runtime-provided args and must not read process.argv directly",
    );

    const topLevelExecution = registry.procedures.flatMap((procedure) => {
      const path = procedurePath(procedure.entry);
      const source = readFileSync(path, "utf-8");
      const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      return sourceFile.statements
        .map((statement) => topLevelExecutionReason(source, statement))
        .filter((reason): reason is string => reason !== null)
        .map((reason) => `${procedure.id}: ${relative(repoRoot, path)} (${reason})`);
    });

    assert.deepEqual(
      topLevelExecution,
      [],
      "registered Procedure modules must not execute logic at import time; put runtime work inside exported main()",
    );

    const sourceSideTestProcedures = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        return {
          id: procedure.id,
          path,
          source,
        };
      })
      .filter(({ path, source }) =>
        /\.test\.ts$/.test(path) ||
        /(?:^|\n)\s*\/\/\s*Smoke tests for\b/.test(source) ||
        /\bfrom\s+["']node:test["']/.test(source)
      )
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      sourceSideTestProcedures,
      [],
      "source-side smoke tests and test modules should stay out of the runtime Procedure manifest",
    );
  });

  test("procedure sources do not contain source-side test modules", () => {
    const sourceSideTestModules = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return /\.test\.ts$/.test(file) || /\bfrom\s+["']node:test["']/.test(source);
    }).map((file) => relative(repoRoot, file));

    assert.deepEqual(
      sourceSideTestModules,
      [],
      "procedure source tests should live under tests/ so they run with the project test suite",
    );
  });

  test("procedure runtime fixtures use argv passthrough directly", () => {
    const deprecatedTokens = [
      ["--request", "json"].join("-"),
      ["request", "Payload"].join(""),
    ];
    const checkedFiles = [
      ...collectFiles(join(repoRoot, "src"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "tests"), (file) => file.endsWith(".ts")),
    ].filter((file) => basename(file) !== "source-conventions.unit.test.ts");
    const offenders = checkedFiles.flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return deprecatedTokens
        .filter((token) => source.includes(token))
        .map((token) => `${relative(repoRoot, file)}: ${token}`);
    });

    assert.deepEqual(
      offenders,
      [],
      "procedure runtime and tests should pass argv args directly, not deprecated request JSON wrappers",
    );
  });

  test("procedure source modules are registered entries or imported helpers", () => {
    function procedurePath(entry: URL | string): string {
      return entry instanceof URL ? fileURLToPath(entry) : entry;
    }

    function resolveRelativeProcedureImport(fromFile: string, specifier: string): string | null {
      const base = resolve(dirname(fromFile), specifier);
      const candidates = [
        base,
        `${base}.ts`,
        join(base, "index.ts"),
      ];
      return candidates.find((candidate) => existsSync(candidate)) ?? null;
    }

    const procedureSourceRoot = join(repoRoot, "src/components/procedures/sources");
    const procedureSources = collectFiles(
      procedureSourceRoot,
      (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
    );
    const registeredEntries = new Set(registry.procedures.map((procedure) => procedurePath(procedure.entry)));
    const importedHelpers = new Set<string>();

    for (const sourceFile of procedureSources) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(
        /\bfrom\s+["'](\.[^"']+)["']|\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
      )) {
        const specifier = match[1] ?? match[2];
        if (!specifier) continue;
        const resolved = resolveRelativeProcedureImport(sourceFile, specifier);
        if (resolved?.startsWith(procedureSourceRoot)) {
          importedHelpers.add(resolved);
        }
      }
    }

    const orphanedProcedureSources = procedureSources
      .filter((sourceFile) => !registeredEntries.has(sourceFile) && !importedHelpers.has(sourceFile))
      .map((sourceFile) => relative(repoRoot, sourceFile));

    assert.deepEqual(
      orphanedProcedureSources,
      [],
      "procedure source modules should either be registered runtime entries or imported helper modules",
    );
  });

  test("procedure sources do not call sibling mjs helper files", () => {
    const physicalMjsHelperCalls = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return /join\([^\n]*(?:scriptDir|SCRIPT_DIR|__dirname)[^\n]*\.mjs/.test(source) ||
        /spawnSync\((?:process\.execPath|"node"),\s*\[[^\]]*\.mjs/.test(source) ||
        /process\.execPath,\s*\[[^\]]*\.mjs/.test(source);
    });

    assert.deepEqual(
      physicalMjsHelperCalls,
      [],
      "bundled procedure sources should import helper modules directly instead of spawning adjacent .mjs files",
    );
  });

  test("procedure sources do not suggest removed local script entrypoints", () => {
    const staleScriptSuggestions = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    ).flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return [...source.matchAll(/\bRun node scripts\/[A-Za-z0-9._/-]+\.mjs\b/g)].map((match) =>
        `${relative(repoRoot, file)}: ${match[0]}`
      );
    });

    assert.deepEqual(
      staleScriptSuggestions,
      [],
      "procedure sources should tell users to run a procedure id, not a removed repository-local script",
    );
  });

  test("agent runtime guidance names web access neutrally", () => {
    const agentSourceFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("index.ts"),
    );

    for (const agentSourceFile of agentSourceFiles) {
      const source = readFileSync(agentSourceFile, "utf-8");
      const toolsSource = extractPropertyArray(source, "tools");
      const runtimeSource = toolsSource ? source.replace(toolsSource, "") : source;
      assert.doesNotMatch(
        runtimeSource,
        /\bWebSearch\b|\bWebFetch\b/,
        `${agentSourceFile} should not expose platform-specific web tool names in runtime guidance`,
      );
    }
  });

  test("skill runtime guidance names web access neutrally", () => {
    const skillRuntimeFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) =>
        (file.endsWith(".md") || file.endsWith("index.ts")) &&
        !file.split(/[\\/]/).includes("evals"),
    );

    for (const skillRuntimeFile of skillRuntimeFiles) {
      const source = readFileSync(skillRuntimeFile, "utf-8");
      const toolsSource = skillRuntimeFile.endsWith("index.ts")
        ? extractPropertyArray(source, "tools")
        : null;
      const runtimeSource = toolsSource ? source.replace(toolsSource, "") : source;
      assert.doesNotMatch(
        runtimeSource,
        /\bWebSearch\b|\bWebFetch\b/,
        `${skillRuntimeFile} should not expose platform-specific web tool names in runtime guidance`,
      );
    }
  });

  test("skill runtime guidance avoids Claude-specific temporary paths", () => {
    const skillRuntimeFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) =>
        (file.endsWith(".md") || file.endsWith("index.ts")) &&
        !file.split(/[\\/]/).includes("evals"),
    );

    for (const skillRuntimeFile of skillRuntimeFiles) {
      const source = readFileSync(skillRuntimeFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude\s*\/\s*CLI|\/private\/tmp\/claude-|claude-\*\/\*\/tasks\/\*\.output/u,
        `${skillRuntimeFile} should describe temporary CLI artifacts without Claude-specific paths`,
      );
    }
  });

  test("agent source keeps structured fields", () => {
    const agentSource = readFileSync(
      join(repoRoot, "src/components/agents/typescript-reviewer/index.ts"),
      "utf-8",
    );
    assert.match(agentSource, /typescriptTypeSafetySkill\.id/);
    assert.doesNotMatch(agentSource, /id: "typescript-type-safety"/);

    const generatedRegistrySource = readFileSync(
      join(repoRoot, "src/components/registry.generated.ts"),
      "utf-8",
    );
    assert.doesNotMatch(
      generatedRegistrySource,
      /from\s+"\.\/hooks\//,
      "registry.generated.ts should not import hooks; hooks are registered through src/components/hooks/index.ts",
    );

    const removedLayer = ["migr", "ated"].join("");
    assert.equal(existsSync(join(repoRoot, "src/components", removedLayer)), false);
    assert.equal(
      existsSync(join(repoRoot, "src/components/profiles")),
      false,
      "profile layer should not be reintroduced; registry emits all registered components directly",
    );

    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    assert.doesNotMatch(sdkSource, /defineProfile|ProfileDefinition|ComponentKind\.Profile/);
    assert.doesNotMatch(
      sdkSource,
      /export type AgentDefinition = \{[\s\S]*?\n\s*body\?: ComponentFile;/,
      "AgentDefinition should not expose AGENT.body.md as a second body authoring path",
    );

    const agentBodyFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("AGENT.body.md"),
    );
    assert.deepEqual(agentBodyFiles, [], "agent Markdown bodies should be split into structured index.ts fields");

    let agentQualityStandardsCount = 0;
    let agentOutputFormatCount = 0;
    let agentWorkflowCount = 0;

    const agentSourceFiles = collectFiles(
      join(repoRoot, "src/components/agents"),
      (file) => file.endsWith("index.ts"),
    );
    for (const agentSourceFile of agentSourceFiles) {
      const source = readFileSync(agentSourceFile, "utf-8");
      const hasBashTool = /\bKnownTool\.Bash\b/.test(source);
      const hasBashBoundary = /\n\s*bashBoundary:\s*\[/.test(source);
      const hasQualityStandards = /\n\s*qualityStandards:\s*\[/.test(source);
      const hasOutputFormat = /\n\s*outputFormat:\s*defineAgentOutputFormat\(\{/.test(source);
      const hasWorkflow = /\n\s*workflow:\s*defineWorkflow\(\{/.test(source);

      assert.doesNotMatch(
        source,
        /\n\s*bodyText:\s*`/,
        `${agentSourceFile} should split body content into structured fields instead of bodyText`,
      );
      assert.doesNotMatch(
        source,
        /\n\s*tools:\s*\[\s*\]/,
        `${agentSourceFile} should omit tools or declare explicit tools instead of emitting an empty tools list`,
      );
      assert.doesNotMatch(
        source,
        /\n\s*skills:\s*\[\s*\]/,
        `${agentSourceFile} should omit skills instead of emitting an empty skills list`,
      );
      assert.doesNotMatch(
        source,
        /单个 plugin|未覆盖的 plugin/,
        `${agentSourceFile} should describe ai-experts audit scope with current component terms`,
      );
      assert.doesNotMatch(
        source,
        /\p{Script=Han}\s+时使用/u,
        `${agentSourceFile} should not put a space between Chinese text and 时使用 in user-facing descriptions`,
      );

      assert.equal(
        hasBashBoundary,
        hasBashTool,
        `${agentSourceFile} should define bashBoundary exactly when it declares KnownTool.Bash`,
      );

      if (hasBashBoundary) {
        const bashBoundarySource = extractPropertyArray(source, "bashBoundary");
        assert.notEqual(bashBoundarySource, null, `${agentSourceFile} should define bashBoundary as an array`);
        assert.match(
          bashBoundarySource as string,
          /["`][\s\S]*\S[\s\S]*["`]/,
          `${agentSourceFile} should define bashBoundary as a non-empty string array`,
        );
      }

      if (hasQualityStandards) {
        agentQualityStandardsCount += 1;
        const qualityStandardsSource = extractPropertyArray(source, "qualityStandards");
        assert.notEqual(
          qualityStandardsSource,
          null,
          `${agentSourceFile} should define qualityStandards as an array`,
        );
        assert.match(
          qualityStandardsSource as string,
          /["`][\s\S]*\S[\s\S]*["`]/,
          `${agentSourceFile} should define qualityStandards as a non-empty string array`,
        );
      }

      if (hasOutputFormat) {
        agentOutputFormatCount += 1;
        assert.doesNotMatch(
          source,
          /\n\s*outputFormat:\s*\[/,
          `${agentSourceFile} should define a single outputFormat object, not multiple formats`,
        );
        if (/kind:\s*"markdown"/.test(source)) {
          const sectionsSource = extractPropertyArray(source, "sections");
          assert.notEqual(sectionsSource, null, `${agentSourceFile} should define markdown output sections`);
          assert.match(
            sectionsSource as string,
            /defineAgentOutputSection\(\{/,
            `${agentSourceFile} should define each output section through defineAgentOutputSection`,
          );
          assert.doesNotMatch(
            sectionsSource as string,
            /(^|\n)\s*\{\s*\n\s*title:/,
            `${agentSourceFile} should not define bare output section objects`,
          );
        }
      }

      assert.equal(hasWorkflow, true, `${agentSourceFile} should define workflow through defineWorkflow`);
      if (hasWorkflow) {
        agentWorkflowCount += 1;
        assert.match(
          source,
          /defineWorkflow(?:Step|Gate|Route)\(\{/,
          `${agentSourceFile} should define workflow nodes through defineWorkflow* helpers`,
        );
        assert.doesNotMatch(
          source,
          /\n\s*workflow:\s*\[/,
          `${agentSourceFile} should define a single workflow object, not multiple workflows`,
        );
        if (/defineWorkflow(?:Gate|Route)\(\{/.test(source)) {
          assert.doesNotMatch(
            source,
            /\n\s*skill:\s*"[^"]+"/,
            `${agentSourceFile} should reference workflow skills through imported skill definitions`,
          );
          assert.match(
            source,
            /\n\s*skill:\s*\w+Skill\.id/,
            `${agentSourceFile} should reference workflow skills through .id`,
          );
        }
      }
    }

    assert.ok(agentQualityStandardsCount >= 60);
    assert.equal(agentOutputFormatCount, 62);
    assert.equal(agentWorkflowCount, agentSourceFiles.length);
  });

  test("hook source tree uses canonical directories and ids", () => {
    const allowedHookRoots = new Set([
      "_shared",
      "command-safety",
      "context-compaction",
      "edit-safety",
      "prompt-guidance",
      "session-bootstrap",
      "skill-routing",
      "index.ts",
    ]);

    for (const hookSourceFile of collectFiles(join(repoRoot, "src/components/hooks"))) {
      const relativeHookPath = hookSourceFile.slice(join(repoRoot, "src/components/hooks").length + 1);
      assert.equal(
        allowedHookRoots.has(relativeHookPath.split(/[\\/]/)[0]),
        true,
        `${hookSourceFile} should live directly under business hook directories`,
      );
      assert.equal(
        relativeHookPath.split(/[\\/]/).includes("module"),
        false,
        `${hookSourceFile} should not use the old nested module directory`,
      );
      assert.doesNotMatch(
        relativeHookPath,
        /(?:expert|plugin)/,
        `${hookSourceFile} should not keep expert/plugin naming in hook paths`,
      );

      if (hookSourceFile.endsWith(".ts")) {
        const source = readFileSync(hookSourceFile, "utf-8");
        assert.doesNotMatch(
          source,
          /\.ai-components/,
          `${hookSourceFile} should use ai-experts runtime state directories`,
        );
        const hookId = source.match(/\bid:\s*"([^"]+)"/)?.[1];
        if (hookId) {
          assert.doesNotMatch(
            hookId,
            /(?:expert|plugin)/,
            `${hookSourceFile} should not keep expert/plugin naming in hook ids`,
          );
        }
      }
    }
  });

  test("TypeScript source keeps extensionless relative imports", () => {
    const sourceFiles = [
      join(repoRoot, "src/build.ts"),
      ...collectFiles(join(repoRoot, "src/build"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "src/components"), (file) => file.endsWith(".ts")),
    ];
    for (const sourceFile of sourceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /from\s+["']\.[^"']+\.(?:ts|js|mjs|cjs)["']|import\s+["']\.[^"']+\.(?:ts|js|mjs|cjs)["']|import\(\s*["']\.[^"']+\.(?:ts|js|mjs|cjs)["']\s*\)/,
        `${sourceFile} should use extensionless relative imports`,
      );
    }
  });

  test("skill source does not use markdown body files", () => {
    const bodyFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("SKILL.body.md"),
    );
    assert.deepEqual(bodyFiles, [], "skill Markdown bodies should be split into structured index.ts fields");
  });

  test("skill source does not keep root package artifacts", () => {
    const skillRoot = join(repoRoot, "src/components/skills");
    const rootArtifacts = new Set([
      "AGENTS.md",
      "CLAUDE.md",
      "HOW_TO_USE.md",
      "reference.md",
      "references.md",
      "MODEL_TEMPLATE.json",
      "_meta.json",
      "metadata.json",
      "sample_input.json",
      "expected_output.json",
    ]);
    const reservedSkillRootEntries = new Set([
      "index.ts",
      "index.js",
      "scripts",
      "references",
      "assets",
      "evals",
      "tests",
      "README.md",
      "LICENSE.txt",
    ]);
    const legacySkillScriptFiles = collectFiles(skillRoot, (file) =>
      file.slice(skillRoot.length + 1).split(/[\\/]/).includes("scripts"),
    );
    const legacySkillRuntimeDirs = collectFiles(skillRoot, (file) => {
      const parts = file.slice(skillRoot.length + 1).split(/[\\/]/);
      const legacyRuntimeDirs = [
        "commands",
        "hooks",
        "schemas",
        "examples",
        "resources",
        "prompts",
        "eval-viewer",
        "quick-ref",
        "rules",
        "templates",
        "canvas-fonts",
      ];
      return legacyRuntimeDirs.includes(parts[1] ?? "");
    });
    const misplacedRootArtifacts = collectFiles(skillRoot, (file) => {
      const parts = file.slice(skillRoot.length + 1).split(/[\\/]/);
      return parts.length === 2 && rootArtifacts.has(parts[1]);
    });
    const unregisteredRootEntries: string[] = [];
    for (const skillEntry of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const skillDir = join(skillRoot, skillEntry.name);
      for (const entry of readdirSync(skillDir, { withFileTypes: true })) {
        if (reservedSkillRootEntries.has(entry.name)) continue;
        unregisteredRootEntries.push(`${skillEntry.name}/${entry.name}${entry.isDirectory() ? "/" : ""}`);
      }
    }

    assert.deepEqual(
      legacySkillScriptFiles,
      [],
      "skill-local scripts/ directories should move to src/components/procedures/sources/ and be referenced through procedures",
    );
    assert.deepEqual(
      legacySkillRuntimeDirs,
      [],
      "skill-local runtime/resource directories should move to first-class components, procedures, references, or assets",
    );
    assert.deepEqual(
      misplacedRootArtifacts,
      [],
      "root-level skill package artifacts and platform memory files should be split into references, assets, or evals before dist copy",
    );
    assert.deepEqual(
      unregisteredRootEntries.sort(),
      [],
      "skill root entries should be registered as references, assets, evals, procedures, or explicit README/LICENSE supplements",
    );
  });

  test("skill index metadata definitions stay normalized", () => {
    const skillIndexFiles = collectFiles(
      join(repoRoot, "src/components/skills"),
      (file) => file.endsWith("index.ts") && !file.split(/[\\/]/).includes("scripts"),
    );
    const goalDefinitionFiles: string[] = [];
    let complexSkillWorkflowCount = 0;

    for (const skillSourceFile of skillIndexFiles) {
      const source = readFileSync(skillSourceFile, "utf-8");
      const hasWorkflow = /\n\s*workflow:\s*defineWorkflow\(\{/.test(source);
      assert.match(source, /\n\s*useCases:\s*\[/, `${skillSourceFile} should define useCases`);
      assert.match(source, /\n\s*constraints:\s*\[/, `${skillSourceFile} should define constraints`);
      assert.doesNotMatch(source, /\n\s*tools:\s*\[\],/, `${skillSourceFile} should omit empty tools arrays`);
      if (/\bKnownTool\b/.test(source)) {
        assert.match(source, /KnownTool\./, `${skillSourceFile} should import KnownTool only when a tool is declared`);
      }
      const hasSourceDir = /\n\s*sourceDir:\s*new URL\("\.\/", import\.meta\.url\)/.test(source);
      assert.doesNotMatch(source, /\n\s*body:\s*new URL\("\.\/SKILL\.body\.md", import\.meta\.url\)/);
      assert.equal(hasSourceDir, true, `${skillSourceFile} should define sourceDir`);
      assert.equal(hasWorkflow, true, `${skillSourceFile} should define workflow through defineWorkflow`);
      assert.match(
        source,
        /\n\s*(?:(?:goal|outputs):\s*defineSkill(?:Goal|Outputs)|workflow:\s*defineWorkflow)\(\{/,
        `${skillSourceFile} should define structured skill content`,
      );
      if (hasWorkflow) {
        assert.match(
          source,
          /defineWorkflow(?:Step|Gate|Route)\(\{/,
          `${skillSourceFile} should define workflow nodes through shared defineWorkflow* helpers`,
        );
        assert.doesNotMatch(
          source,
          /\n\s*workflow:\s*\[/,
          `${skillSourceFile} should define a single workflow object, not multiple workflows`,
        );
        if (/defineWorkflow(?:Gate|Route)\(\{/.test(source)) {
          complexSkillWorkflowCount += 1;
          assert.doesNotMatch(
            source,
            /\n\s*skill:\s*"[^"]+"/,
            `${skillSourceFile} should reference workflow skills through imported skill definitions`,
          );
          assert.match(
            source,
            /\n\s*skill:\s*\w+Skill\.id/,
            `${skillSourceFile} should reference workflow skills through .id`,
          );
        }
      }
      if (/\n\s*goal:\s*defineSkillGoal\(\{/.test(source)) {
        goalDefinitionFiles.push(skillSourceFile);
        assert.doesNotMatch(
          source,
          /goal:\s*defineSkillGoal\(\{\s*body:/,
          `${skillSourceFile} goal should not be a default route-style body; move route text to description/useCases`,
        );
        assert.match(
          source,
          /goal:\s*defineSkillGoal\(\{\s*title:\s*["'`][^"'`]+["'`]/,
          `${skillSourceFile} goal must use a specific custom title such as 完成条件`,
        );
        assert.doesNotMatch(
          source,
          /goal:\s*defineSkillGoal\(\{\s*title:\s*(?:"目标"|'目标'|`目标`)/,
          `${skillSourceFile} goal title must not be the generic 目标 heading`,
        );
      }
      assert.doesNotMatch(
        source,
        /id:\s*"evals"|new URL\("\.\/evals(?:\/|")|target:\s*"references\/evals"|title:\s*"Eval Cases"/,
        `${skillSourceFile} should not register evals as references`,
      );
      assert.doesNotMatch(
        source,
        /\]\((?:\.\/)?evals\//,
        `${skillSourceFile} should not link runtime skill content to source-side evals`,
      );
      assert.doesNotMatch(
        source,
        /\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/,
        `${skillSourceFile} should not contain explicit cross-skill links; set relatedSkills instead`,
      );
      assert.doesNotMatch(
        source,
        /交叉引用：/,
        `${skillSourceFile} should move cross-skill routing text to relatedSkills`,
      );
      assert.doesNotMatch(
        source,
        /(?<![./\w-])\b[a-z0-9]+(?:-[a-z0-9]+)*-expert\/(?!index\b)[a-z0-9]+(?:-[a-z0-9]+)*\b/,
        `${skillSourceFile} should not use plugin namespace skill references`,
      );

      const relatedSkillsSource = extractPropertyArray(source, "relatedSkills");
      if (relatedSkillsSource) {
        assert.doesNotMatch(
          relatedSkillsSource,
          /\n\s*id:\s*["']/,
          `${skillSourceFile} should import related skills and read otherSkill.id instead of hard-coded ids`,
        );
        assert.match(
          relatedSkillsSource,
          /\n\s*get id\(\) \{\n\s*return \w+Skill\.id;\n\s*\}/,
          `${skillSourceFile} should resolve related skill ids through imported skill definitions`,
        );
        assert.doesNotMatch(
          relatedSkillsSource,
          /相关 skill：|\\\\n/,
          `${skillSourceFile} related skill reasons should be specific sentences, not copied route blobs`,
        );
        assert.doesNotMatch(
          relatedSkillsSource,
          /\n\s*label:/,
          `${skillSourceFile} related skills should use the canonical skill id as link text, not label aliases`,
        );
      }

      const checklistSource = extractPropertyArray(source, "checklist");
      if (checklistSource) {
        assert.match(
          checklistSource,
          /\n\s*"[^"]+"/,
          `${skillSourceFile} should define checklist as a non-empty string array`,
        );
        assert.doesNotMatch(
          checklistSource,
          /\[ \]/,
          `${skillSourceFile} checklist items should not contain "[ ]"; the build adds checkbox markers automatically`,
        );
      }

      const antiPatternsSource = extractPropertyArray(source, "antiPatterns");
      if (antiPatternsSource) {
        assert.match(
          antiPatternsSource,
          /defineAntiPattern\(\{\s*fail:\s*(?:"[^"]+"|'[^']+'|`[\s\S]+?`),\s*pass:\s*(?:"[^"]+"|'[^']+'|`[\s\S]+?`)/s,
          `${skillSourceFile} should define antiPatterns with defineAntiPattern({ fail, pass })`,
        );
        assert.doesNotMatch(
          antiPatternsSource,
          /\b(?:title|failTitle|passTitle|reason|severity)\s*:/,
          `${skillSourceFile} antiPatterns should only use fail and pass fields`,
        );
      }
    }

    assert.ok(
      goalDefinitionFiles.length <= 10,
      `goal is a rare field for non-routing completion contracts; found ${goalDefinitionFiles.length}: ${goalDefinitionFiles.join(", ")}`,
    );
    assert.ok(
      complexSkillWorkflowCount >= 3,
      "several production skills should exercise gates/routes so complex skill workflows stay covered",
    );
  });
});
