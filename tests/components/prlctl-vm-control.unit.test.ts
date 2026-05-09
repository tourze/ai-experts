import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  assertLocalDownloadWritable,
  downloadFile,
  parseFileTransferArgs,
  uploadFile,
} from "../../src/components/procedures/sources/prlctl-vm-control/file_transfer.ts";
import {
  isHighRiskPowerAction,
  parsePower,
} from "../../src/components/procedures/sources/prlctl-vm-control/prlctl_helper.ts";

describe("prlctl vm control procedure", () => {
  test("parses power --option=VALUE and explicit --yes state", () => {
    const args = parsePower(["Windows 11", "stop", "--option=--kill", "--yes"]);

    expect(args).toMatchObject({
      selector: "Windows 11",
      action: "stop",
      option: ["--kill"],
      yes: true,
      dryRun: false,
    });
  });

  test("marks reset and kill stop as high-risk power actions", () => {
    expect(isHighRiskPowerAction(parsePower(["vm", "reset"]))).toBe(true);
    expect(isHighRiskPowerAction(parsePower(["vm", "stop", "--option=--kill"]))).toBe(true);
    expect(isHighRiskPowerAction(parsePower(["vm", "stop"]))).toBe(false);
    expect(isHighRiskPowerAction(parsePower(["vm", "restart"]))).toBe(false);
  });

  test("tracks explicit overwrite state for file transfers", () => {
    expect(parseFileTransferArgs(["vm", "--", "local.txt", "guest.txt"], "upload", Error))
      .toMatchObject({
        overwrite: false,
        localPath: "local.txt",
        guestPath: "guest.txt",
      });
    expect(parseFileTransferArgs(["vm", "--overwrite", "--", "guest.txt", "local.txt"], "download", Error))
      .toMatchObject({
        overwrite: true,
        localPath: "local.txt",
        guestPath: "guest.txt",
      });
  });

  test("refuses local download overwrites unless explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-prlctl-download-"));
    try {
      const outputFile = join(workDir, "download.bin");
      writeFileSync(outputFile, "keep\n", "utf8");

      expect(() => assertLocalDownloadWritable(outputFile)).toThrow(/output file already exists/);

      const options = parseFileTransferArgs(
        ["vm", "--", "/guest/file.bin", outputFile],
        "download",
        Error,
      );
      const runners = {
        runGuestCommand: () => {
          throw new Error("should not read guest when local output exists");
        },
      };
      expect(() => downloadFile({ uuid: "vm-1" }, options, runners, Error)).toThrow(/output file already exists/);
      expect(readFileSync(outputFile, "utf8")).toBe("keep\n");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test("refuses guest upload overwrites unless explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-prlctl-upload-"));
    try {
      const localFile = join(workDir, "upload.bin");
      writeFileSync(localFile, "data", "utf8");
      const options = parseFileTransferArgs(
        ["vm", "--", localFile, "/guest/file.bin"],
        "upload",
        Error,
      );
      let rawCalls = 0;
      const runners = {
        runGuestCommand: () => ({ stdout: "1", returncode: 0 }),
        runGuestRawCommand: () => {
          rawCalls += 1;
          return { stdout: "", stderr: "", returncode: 0 };
        },
      };

      expect(() => uploadFile({ uuid: "vm-1" }, options, runners, Error)).toThrow(/guest file already exists/);
      expect(rawCalls).toBe(0);

      const overwriteOptions = { ...options, overwrite: true };
      expect(uploadFile({ uuid: "vm-1" }, overwriteOptions, runners, Error)).toMatchObject({
        action: "upload",
        bytes: 4,
      });
      expect(rawCalls).toBeGreaterThan(0);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
