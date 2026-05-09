import { describe, expect, test } from "vitest";
import { parseArgs as parseMdToPdfSetupArgs } from "../../src/components/procedures/sources/md-to-pdf/setup.ts";
import { parseArgs as parseInstallSshpassArgs } from "../../src/components/procedures/sources/remote-ssh-command/install-sshpass.ts";

describe("local dependency installation procedures", () => {
  test("tracks explicit --yes state for sshpass installation", () => {
    expect(parseInstallSshpassArgs([])).toMatchObject({
      yes: false,
    });
    expect(parseInstallSshpassArgs(["--yes"])).toMatchObject({
      yes: true,
    });
  });

  test("tracks explicit --yes state for md-to-pdf dependency installation", () => {
    expect(parseMdToPdfSetupArgs(["--install"])).toMatchObject({
      install: true,
      yes: false,
    });
    expect(parseMdToPdfSetupArgs(["--install", "--yes"])).toMatchObject({
      install: true,
      yes: true,
    });
  });
});
