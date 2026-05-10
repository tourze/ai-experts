import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parseArgs as parseBuildBatchArgs } from "../../src/components/procedures/sources/canvas-design/baoyu-article-illustrator-build-batch.ts";
import { parseArgs as parseAddAudioArgs } from "../../src/components/procedures/sources/canvas-design/concept-to-video-add_audio.ts";
import { parseArgs as parseRenderImageArgs } from "../../src/components/procedures/sources/canvas-design/concept-to-image-render_to_image.ts";
import { parseArgs as parseRenderVideoArgs } from "../../src/components/procedures/sources/canvas-design/concept-to-video-render_video.ts";
import { assertOutputWritable } from "../../src/components/procedures/sources/canvas-design/output_guard.ts";

describe("canvas output overwrite guards", () => {
  test("tracks explicit overwrite state for output-producing procedures", () => {
    expect(parseBuildBatchArgs(["--outline", "outline.md", "--prompts", "prompts", "--output", "batch.json"]))
      .toMatchObject({
        overwrite: false,
      });
    expect(
      parseBuildBatchArgs([
        "--outline",
        "outline.md",
        "--prompts",
        "prompts",
        "--output",
        "batch.json",
        "--overwrite",
      ]),
    ).toMatchObject({
      overwrite: true,
    });

    expect(parseRenderImageArgs(["input.html", "output.png"])).toMatchObject({
      overwrite: false,
    });
    expect(parseRenderImageArgs(["input.html", "output.png", "--overwrite"])).toMatchObject({
      overwrite: true,
    });

    expect(parseAddAudioArgs(["video.mp4", "audio.mp3", "--output", "final.mp4"]))
      .toMatchObject({
        overwrite: false,
      });
    expect(parseAddAudioArgs(["video.mp4", "audio.mp3", "--output", "final.mp4", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });

    expect(parseRenderVideoArgs(["scene.py", "Scene", "--output", "scene.mp4"])).toMatchObject({
      overwrite: false,
    });
    expect(parseRenderVideoArgs(["scene.py", "Scene", "--output", "scene.mp4", "--overwrite"]))
      .toMatchObject({
        overwrite: true,
      });
  });

  test("rejects batch option flags without values", () => {
    expect(() => parseBuildBatchArgs(["--outline", "--prompts"]))
      .toThrow(/--outline requires a value/);
    expect(() => parseBuildBatchArgs(["--outline", "outline.md", "--jobs", "--output"]))
      .toThrow(/--jobs requires a value/);
  });

  test("refuses existing output files unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-canvas-output-"));
    try {
      const outputFile = join(workDir, "output.png");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(outputFile)).toThrow(/output file already exists/);
      expect(() => assertOutputWritable(outputFile, true)).not.toThrow();
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
