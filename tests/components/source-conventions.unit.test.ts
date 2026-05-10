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


describe("component source safety conventions", () => {
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

    const buildSource = [
      "build_ownership_map.ts",
      "build_ownership_map_args.ts",
    ]
      .map((sourceFile) =>
        readFileSync(
          join(repoRoot, "src/components/procedures/sources/security-ownership-map", sourceFile),
          "utf-8",
        ),
      )
      .join("\n");
    assert.match(buildSource, /plannedOwnershipMapOutputFiles/u);
    assert.match(buildSource, /assertOutputFilesWritable/u);
    assert.match(buildSource, /output file already exists/u);

    const runSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/security-ownership-map/run_ownership_map.ts"),
      "utf-8",
    );
    assert.match(runSource, /commandArgs\.push\("--overwrite"\)/u);
    const runFlags = [...runSource.matchAll(/flag:\s+"([^"]+)"/gu)].map((match) => match[1]);
    for (const expectedFlag of [
      "--author-exclude-regex",
      "--cochange-max-files",
      "--cochange-min-count",
      "--cochange-min-jaccard",
      "--cochange-exclude",
      "--no-default-cochange-excludes",
      "--community-top-owners",
      "--bus-factor-threshold",
      "--stale-days",
      "--owner-threshold",
    ]) {
      assert.ok(runFlags.includes(expectedFlag), `run ownership metadata should expose ${expectedFlag}`);
    }

    const querySource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/security-ownership-map/query_ownership.ts"),
      "utf-8",
    );
    const queryFlags = [...querySource.matchAll(/flag:\s+"([^"]+)"/gu)].map((match) => match[1]);
    for (const expectedFlag of [
      "[command]",
      "--limit",
      "--sort",
      "--email-contains",
      "--min-touches",
      "--min-sensitive",
      "--path-contains",
      "--tag",
      "--bus-factor-max",
      "--sensitivity-min",
      "--person",
      "--file",
      "--min-jaccard",
      "--min-count",
      "--section",
      "--id",
      "--include-files",
      "--file-limit",
    ]) {
      assert.ok(queryFlags.includes(expectedFlag), `query ownership metadata should expose ${expectedFlag}`);
    }

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

});
