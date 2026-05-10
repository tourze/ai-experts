import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  assertOutputPathsWritable,
  assertOutputWritable,
  escapeAppleScriptString,
  main as takeScreenshotMain,
  parseArgs as parseScreenshotArgs,
} from "../../src/components/procedures/sources/screenshot/take_screenshot.ts";
import { parseArgs as parseWindowsArgs } from "../../src/components/procedures/sources/screenshot/take_screenshot_windows.ts";

describe("screenshot output overwrite guards", () => {
  test("escapes app names before embedding them in AppleScript", () => {
    expect(escapeAppleScriptString('Foo "Bar" \\ Baz')).toBe('Foo \\"Bar\\" \\\\ Baz');
  });

  test("tracks explicit overwrite state", () => {
    expect(parseScreenshotArgs(["--mode", "temp"])).toMatchObject({
      overwrite: false,
    });
    expect(parseScreenshotArgs(["--mode", "temp", "--overwrite"])).toMatchObject({
      overwrite: true,
    });

    expect(parseWindowsArgs(["--path", "screen.png"])).toMatchObject({
      overwrite: false,
    });
    expect(parseWindowsArgs(["--path", "screen.png", "--overwrite"])).toMatchObject({
      overwrite: true,
    });
  });

  test("refuses existing screenshot outputs unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-screenshot-output-"));
    const previousTestMode = process.env.AI_EXPERTS_SCREENSHOT_TEST_MODE;
    const previousTestPlatform = process.env.AI_EXPERTS_SCREENSHOT_TEST_PLATFORM;
    try {
      const outputFile = join(workDir, "screen.png");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(outputFile)).toThrow(/output file already exists/);
      expect(() => assertOutputPathsWritable([outputFile])).toThrow(/output file already exists/);

      process.env.AI_EXPERTS_SCREENSHOT_TEST_MODE = "1";
      process.env.AI_EXPERTS_SCREENSHOT_TEST_PLATFORM = "Linux";
      expect(() => takeScreenshotMain(["--path", outputFile])).toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("keep\n");

      expect(takeScreenshotMain(["--path", outputFile, "--overwrite"])).toBe(0);
      expect(readFileSync(outputFile)).not.toEqual(Buffer.from("keep\n"));
    } finally {
      if (previousTestMode === undefined) {
        delete process.env.AI_EXPERTS_SCREENSHOT_TEST_MODE;
      } else {
        process.env.AI_EXPERTS_SCREENSHOT_TEST_MODE = previousTestMode;
      }
      if (previousTestPlatform === undefined) {
        delete process.env.AI_EXPERTS_SCREENSHOT_TEST_PLATFORM;
      } else {
        process.env.AI_EXPERTS_SCREENSHOT_TEST_PLATFORM = previousTestPlatform;
      }
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
