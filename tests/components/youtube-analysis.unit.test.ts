import { describe, expect, test } from "vitest";
import { parseArgs } from "../../src/components/procedures/sources/youtube-analysis/analyze_video.ts";

describe("youtube analysis procedure", () => {
  test("tracks explicit --force state for Markdown scaffold overwrites", () => {
    expect(parseArgs(["https://youtu.be/dQw4w9WgXcQ"])).toMatchObject({
      force: false,
    });
    expect(parseArgs(["https://youtu.be/dQw4w9WgXcQ", "--force"])).toMatchObject({
      force: true,
    });
  });
});
