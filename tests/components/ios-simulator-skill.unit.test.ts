import { describe, expect, test } from "vitest";
import { parseArgs } from "../../src/components/procedures/sources/ios-simulator-skill/simctl_erase.ts";

describe("ios simulator erase procedure", () => {
  test("requires explicit --yes state in parsed erase arguments", () => {
    expect(parseArgs(["--udid", "device-1"])).toMatchObject({
      udid: "device-1",
      yes: false,
    });
    expect(parseArgs(["--udid", "device-1", "--yes"])).toMatchObject({
      udid: "device-1",
      yes: true,
    });
    expect(parseArgs(["--all", "--yes"])).toMatchObject({
      all: true,
      yes: true,
    });
  });
});
