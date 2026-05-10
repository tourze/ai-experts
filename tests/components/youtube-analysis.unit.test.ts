import { describe, expect, test } from "vitest";
import { parseArgs as parseAnalyzeArgs } from "../../src/components/procedures/sources/youtube-analysis/analyze_video.ts";
import { parseArgs as parseFetchArgs } from "../../src/components/procedures/sources/youtube-analysis/fetch_transcript.ts";

describe("youtube analysis procedure", () => {
  test("tracks explicit --force state for Markdown scaffold overwrites", () => {
    expect(parseAnalyzeArgs(["https://youtu.be/dQw4w9WgXcQ"])).toMatchObject({
      force: false,
    });
    expect(parseAnalyzeArgs(["https://youtu.be/dQw4w9WgXcQ", "--force"])).toMatchObject({
      force: true,
    });
  });

  test("rejects unknown flags before treating a token as the video URL", () => {
    expect(() => parseAnalyzeArgs(["--unknown"]))
      .toThrow(/unrecognized argument: --unknown/);
    expect(() => parseFetchArgs(["--unknown"]))
      .toThrow(/unrecognized argument: --unknown/);
  });

  test("rejects option tokens where language values are required", () => {
    expect(() => parseAnalyzeArgs(["https://youtu.be/dQw4w9WgXcQ", "--lang", "-h"]))
      .toThrow(/--lang requires a value/);
    expect(() => parseFetchArgs(["https://youtu.be/dQw4w9WgXcQ", "--lang", "-h"]))
      .toThrow(/--lang requires a value/);
  });
});
