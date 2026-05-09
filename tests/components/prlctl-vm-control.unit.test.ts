import { describe, expect, test } from "vitest";
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
});
