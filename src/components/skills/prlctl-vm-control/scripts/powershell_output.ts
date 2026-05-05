import { TextDecoder } from "node:util";

const POWERSHELL_MARKERS = Object.freeze({
  stdoutBegin: "__PRLCTL_HELPER_STDOUT_B64_BEGIN__",
  stdoutEnd: "__PRLCTL_HELPER_STDOUT_B64_END__",
  stderrBegin: "__PRLCTL_HELPER_STDERR_B64_BEGIN__",
  stderrEnd: "__PRLCTL_HELPER_STDERR_B64_END__",
  exit: "__PRLCTL_HELPER_EXIT__:",
});

function looksLikeUtf16Le(buffer) {
  const sampleLength = Math.min(buffer.length, 4096);
  if (sampleLength < 8) return false;

  let pairs = 0;
  let oddNulls = 0;
  let evenNulls = 0;
  for (let index = 0; index + 1 < sampleLength; index += 2) {
    pairs += 1;
    if (buffer[index] === 0) evenNulls += 1;
    if (buffer[index + 1] === 0) oddNulls += 1;
  }

  return pairs > 0 && oddNulls / pairs > 0.3 && evenNulls / pairs < 0.1;
}

export function decodeBytes(buffer) {
  if (!buffer || buffer.length === 0) return "";
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le", { fatal: false }).decode(buffer.subarray(2));
  }
  if (looksLikeUtf16Le(buffer)) {
    return new TextDecoder("utf-16le", { fatal: false }).decode(buffer);
  }

  const encodings = [
    "utf-8",
    process.stdout.encoding,
    process.stderr.encoding,
    process.env.PYTHONIOENCODING?.split(":")[0],
    "gb18030",
    "windows-1252",
  ].filter(Boolean);
  const seen = new Set();

  for (const encoding of encodings) {
    const normalized = String(encoding).toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    try {
      return new TextDecoder(normalized, { fatal: true }).decode(buffer);
    } catch {
      // Try the next decoder.
    }
  }

  return buffer.toString("utf8");
}

function encodeUtf16LeBase64(value) {
  return Buffer.from(value, "utf16le").toString("base64");
}

function buildPowerShellEnvelopeScript(command) {
  const userScript = encodeUtf16LeBase64(command);
  return [
    "$e=New-Object Text.UTF8Encoding $false",
    `$u=[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${userScript}'))`,
    "$p=[IO.Path]::GetTempFileName()",
    "try{",
    "$o=&([scriptblock]::Create($u)) 2>$p|Out-String -Width 4096",
    "$s=$?",
    "$c=0",
    "if($global:LASTEXITCODE -is [int]){$c=$global:LASTEXITCODE}elseif(-not $s){$c=1}",
    "$r=''",
    "if(Test-Path -LiteralPath $p){$r=Get-Content -LiteralPath $p -Raw -EA SilentlyContinue;if($null -eq $r){$r=''}}",
    `'${POWERSHELL_MARKERS.stdoutBegin}'`,
    "[Convert]::ToBase64String($e.GetBytes([string]$o))",
    `'${POWERSHELL_MARKERS.stdoutEnd}'`,
    `'${POWERSHELL_MARKERS.stderrBegin}'`,
    "[Convert]::ToBase64String($e.GetBytes([string]$r))",
    `'${POWERSHELL_MARKERS.stderrEnd}'`,
    `'${POWERSHELL_MARKERS.exit}'+$c`,
    "}catch{",
    `'${POWERSHELL_MARKERS.stdoutBegin}'`,
    "''",
    `'${POWERSHELL_MARKERS.stdoutEnd}'`,
    `'${POWERSHELL_MARKERS.stderrBegin}'`,
    "[Convert]::ToBase64String($e.GetBytes([string]($_|Out-String)))",
    `'${POWERSHELL_MARKERS.stderrEnd}'`,
    `'${POWERSHELL_MARKERS.exit}1'`,
    "}finally{",
    "if($p){Remove-Item -LiteralPath $p -Force -EA SilentlyContinue}",
    "}",
  ].join(";");
}

export function buildPowerShellCommand(command) {
  return [
    "powershell.exe",
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    buildPowerShellEnvelopeScript(command),
  ];
}

function collectEnvelopeBlock(output, begin, end) {
  const lines = output.split(/\r?\n/);
  const chunks = [];
  let collecting = false;
  let foundBegin = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === begin) {
      collecting = true;
      foundBegin = true;
      continue;
    }
    if (trimmed === end) {
      return foundBegin ? chunks.join("") : null;
    }
    if (collecting) chunks.push(trimmed);
  }

  return null;
}

export function parsePowerShellEnvelope(result) {
  const stdoutBase64 = collectEnvelopeBlock(
    result.stdout,
    POWERSHELL_MARKERS.stdoutBegin,
    POWERSHELL_MARKERS.stdoutEnd,
  );
  const stderrBase64 = collectEnvelopeBlock(
    result.stdout,
    POWERSHELL_MARKERS.stderrBegin,
    POWERSHELL_MARKERS.stderrEnd,
  );
  const escapedExitMarker = POWERSHELL_MARKERS.exit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exitMatch = result.stdout.match(new RegExp(`^${escapedExitMarker}(\\d+)\\s*$`, "m"));

  if (stdoutBase64 === null && stderrBase64 === null && !exitMatch) return null;
  if (stdoutBase64 === null || stderrBase64 === null || !exitMatch) {
    return { error: "PowerShell 输出 envelope 不完整，无法可靠解码。" };
  }

  return {
    args: result.args,
    returncode: Number.parseInt(exitMatch[1], 10),
    stdout: decodeBytes(Buffer.from(stdoutBase64, "base64")),
    stderr: decodeBytes(Buffer.from(stderrBase64, "base64")),
  };
}
