import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");

function writeExecutable(path, content) {
  writeFileSync(path, content, "utf-8");
  chmodSync(path, 0o755);
}

test("install.sh enables Codex plugins without jq", () => {
  const tmp = mkdtempSync(join(tmpdir(), "ai-experts-install-"));
  const binDir = join(tmp, "bin");
  const codexHome = join(tmp, "codex-home");

  try {
    mkdirSync(binDir);
    mkdirSync(codexHome);
    writeFileSync(join(codexHome, "config.toml"), "", "utf-8");

    symlinkSync(process.execPath, join(binDir, "node"));
    writeExecutable(join(binDir, "codex"), "#!/usr/bin/env bash\nexit 0\n");
    writeExecutable(join(binDir, "jq"), "#!/usr/bin/env bash\nexit 127\n");

    const output = execFileSync("/bin/bash", ["scripts/install.sh", "--install"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CODEX_HOME: codexHome,
        PATH: `${binDir}:/usr/bin:/bin`,
      },
      encoding: "utf-8",
      stdio: "pipe",
    });

    const config = readFileSync(join(codexHome, "config.toml"), "utf-8");
    assert.match(output, /Codex CLI: done/);
    assert.match(config, /\[plugins\."react-native-expert@ai-experts"\]/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
