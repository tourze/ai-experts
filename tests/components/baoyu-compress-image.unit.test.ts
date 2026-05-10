import { describe, expect, test, vi } from "vitest";
import {
  getOutputPath,
  parseArgs,
  sharpInstallGuidance,
} from "../../src/components/procedures/sources/baoyu-compress-image/main.ts";

describe("baoyu compress image procedure args", () => {
  test("keeps originals and refuses overwrite by default", () => {
    const args = parseArgs(["input.png", "--format", "webp"]);

    expect(args).toMatchObject({
      input: "input.png",
      format: "webp",
      keep: true,
      deleteOriginal: false,
      overwrite: false,
    });
  });

  test("requires explicit deletion flag for destructive source removal", () => {
    expect(parseArgs(["input.png", "--delete-original"])).toMatchObject({
      keep: false,
      deleteOriginal: true,
    });
  });

  test("rejects conflicting keep and delete-original flags", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(parseArgs(["input.png", "--keep", "--delete-original"])).toBeNull();
    } finally {
      errorSpy.mockRestore();
    }
  });

  test("uses a compressed suffix when preserving same-format originals", () => {
    expect(getOutputPath("/tmp/photo.webp", "webp", true, undefined)).toBe("/tmp/photo-compressed.webp");
    expect(getOutputPath("/tmp/photo.png", "webp", true, undefined)).toBe("/tmp/photo.webp");
  });

  test("guides sharp installs to the runtime root", () => {
    expect(sharpInstallGuidance("~/.codex")).toContain("npm install --prefix ~/.codex sharp");
    expect(sharpInstallGuidance("~/.codex")).toContain("do not install it globally");
  });
});
