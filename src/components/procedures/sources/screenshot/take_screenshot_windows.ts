#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import fs, { realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "screenshot-take-screenshot-windows",
  entry: procedureEntry(import.meta.url),
  description:
    "Windows 平台截图：使用 PowerShell 屏幕捕获，支持 mode、path 和 region 参数。",
  owners: { skillIds: ["screenshot"] },
  target: "scripts/take_screenshot_windows.mjs",
  runtime: "node",
  params: [
    {
      flag: "--path",
      type: "路径",
      description: "输出文件路径或目录",
      required: false,
    },
    {
      flag: "--mode",
      type: "default|temp",
      description: "输出模式（默认 default）",
      required: false,
    },
    {
      flag: "--format",
      type: "png|jpg|jpeg|bmp",
      description: "输出图片格式（默认 png）",
      required: false,
    },
    {
      flag: "--region",
      type: "x,y,w,h",
      description: "截取指定像素区域",
      required: false,
    },
    {
      flag: "--active-window",
      type: "",
      description: "截取前台窗口，传此标志即启用",
      required: false,
    },
    {
      flag: "--window-handle",
      type: "数字",
      description: "截取指定原生窗口句柄",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的截图输出；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--path", "screenshot.png"] },
});

function showHelp(): any {
  console.log(`Windows screenshot helper

Usage:
  node scripts/take_screenshot_windows.mjs --mode temp
  node scripts/take_screenshot_windows.mjs --path C:\\Temp\\screen.png
  node scripts/take_screenshot_windows.mjs --region 100,200,800,600

Options:
  --path, -Path <path>                 Output path or directory
  --mode, -Mode default|temp           Output mode when path is omitted
  --format, -Format png|jpg|jpeg|bmp   Image format
  --region, -Region x,y,w,h            Capture a region
  --active-window, -ActiveWindow       Capture the foreground window
  --window-handle, -WindowHandle <id>  Capture a specific native window handle
  --overwrite                          Replace existing output after confirmation`);
}
export function parseArgs(argv: readonly string[]): any {
  const options: Record<string, any> = {
    path: "",
    mode: "default",
    format: "png",
    region: "",
    activeWindow: false,
    windowHandle: 0,
    overwrite: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (["--help", "-h", "-Help"].includes(arg)) {
      options.help = true;
    } else if (["--path", "-Path"].includes(arg)) {
      options.path = argv[++i] || "";
    } else if (["--mode", "-Mode"].includes(arg)) {
      options.mode = argv[++i] || "default";
    } else if (["--format", "-Format"].includes(arg)) {
      options.format = argv[++i] || "png";
    } else if (["--region", "-Region"].includes(arg)) {
      options.region = argv[++i] || "";
    } else if (["--active-window", "-ActiveWindow"].includes(arg)) {
      options.activeWindow = true;
    } else if (["--overwrite", "-Overwrite"].includes(arg)) {
      options.overwrite = true;
    } else if (["--window-handle", "-WindowHandle"].includes(arg)) {
      options.windowHandle = Number.parseInt(argv[++i] || "0", 10);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}
function validateOptions(options: any): any {
  if (!["default", "temp"].includes(options.mode)) {
    throw new Error("Mode must be default or temp");
  }
  if (!["png", "jpg", "jpeg", "bmp"].includes(options.format.toLowerCase())) {
    throw new Error(`Unsupported format: ${options.format}`);
  }
  if (options.region && options.activeWindow) {
    throw new Error("Choose either --region or --active-window");
  }
  if (options.region && options.windowHandle) {
    throw new Error("Choose either --region or --window-handle");
  }
  if (options.activeWindow && options.windowHandle) {
    throw new Error("Choose either --active-window or --window-handle");
  }
}
function findExecutable(command: any): any {
  const names = path.extname(command)
    ? [command]
    : (process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM")
        .split(";")
        .map((ext: any) => `${command}${ext}`);
  for (const dir of (process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean)) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      try {
        if (fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Keep scanning PATH.
      }
    }
  }
  return "";
}
function powershellScript(payload: any): any {
  return `
$ErrorActionPreference = "Stop"
$opts = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String("${payload}")) | ConvertFrom-Json

function Get-Timestamp {
  Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
}

function Get-DefaultDirectory {
  $home = [Environment]::GetFolderPath("UserProfile")
  $pictures = Join-Path $home "Pictures"
  $screenshots = Join-Path $pictures "Screenshots"
  if (Test-Path $screenshots) { return $screenshots }
  if (Test-Path $pictures) { return $pictures }
  return $home
}

function New-DefaultFilename {
  param([string]$Prefix)
  if (-not $Prefix) { $Prefix = "screenshot" }
  "$Prefix-$(Get-Timestamp).$($opts.format)"
}

function Resolve-OutputPath {
  if ($opts.path) {
    $expanded = [Environment]::ExpandEnvironmentVariables([string]$opts.path)
    $homeDir = [Environment]::GetFolderPath("UserProfile")
    if ($expanded -eq "~") {
      $expanded = $homeDir
    } elseif ($expanded.StartsWith("~/") -or $expanded.StartsWith("~\\")) {
      $expanded = Join-Path $homeDir $expanded.Substring(2)
    }
    $full = [System.IO.Path]::GetFullPath($expanded)
    if ((Test-Path $full) -and (Get-Item $full).PSIsContainer) {
      $full = Join-Path $full (New-DefaultFilename "")
    } elseif (($expanded.EndsWith("\\") -or $expanded.EndsWith("/")) -and -not (Test-Path $full)) {
      New-Item -ItemType Directory -Path $full -Force | Out-Null
      $full = Join-Path $full (New-DefaultFilename "")
    } elseif ([System.IO.Path]::GetExtension($full) -eq "") {
      $full = "$full.$($opts.format)"
    }
    $parent = Split-Path -Parent $full
    if ($parent) {
      New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    return $full
  }

  if ($opts.mode -eq "temp") {
    return Join-Path ([System.IO.Path]::GetTempPath()) (New-DefaultFilename "ai-experts-shot")
  }

  return Join-Path (Get-DefaultDirectory) (New-DefaultFilename "")
}

function Parse-Region {
  if (-not $opts.region) { return $null }
  $parts = ([string]$opts.region).Split(",") | ForEach-Object { $_.Trim() }
  if ($parts.Length -ne 4) { throw "Region must be x,y,w,h" }
  $values = $parts | ForEach-Object {
    $out = 0
    if (-not [int]::TryParse($_, [ref]$out)) { throw "Region values must be integers" }
    $out
  }
  if ($values[2] -le 0 -or $values[3] -le 0) { throw "Region width and height must be positive" }
  return $values
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$imageFormat = switch ($opts.format.ToLowerInvariant()) {
  "png" { [System.Drawing.Imaging.ImageFormat]::Png }
  "jpg" { [System.Drawing.Imaging.ImageFormat]::Jpeg }
  "jpeg" { [System.Drawing.Imaging.ImageFormat]::Jpeg }
  "bmp" { [System.Drawing.Imaging.ImageFormat]::Bmp }
  default { throw "Unsupported format: $($opts.format)" }
}

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class NativeMethods {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
}
"@

$regionValues = Parse-Region
$outputPath = Resolve-OutputPath
if ((Test-Path $outputPath) -and -not $opts.overwrite) {
  throw "output file already exists: $outputPath; pass --overwrite only after confirming it can be replaced"
}

if ($regionValues) {
  $bounds = New-Object System.Drawing.Rectangle($regionValues[0], $regionValues[1], $regionValues[2], $regionValues[3])
} elseif ($opts.activeWindow -or $opts.windowHandle) {
  $handle = if ($opts.windowHandle) { [IntPtr]([int]$opts.windowHandle) } else { [NativeMethods]::GetForegroundWindow() }
  $rect = New-Object NativeMethods+RECT
  if (-not [NativeMethods]::GetWindowRect($handle, [ref]$rect)) { throw "Failed to get window bounds" }
  $bounds = New-Object System.Drawing.Rectangle($rect.Left, $rect.Top, ($rect.Right - $rect.Left), ($rect.Bottom - $rect.Top))
} else {
  $vs = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bounds = New-Object System.Drawing.Rectangle($vs.Left, $vs.Top, $vs.Width, $vs.Height)
}

$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $source = New-Object System.Drawing.Point($bounds.Left, $bounds.Top)
  $target = [System.Drawing.Point]::Empty
  $size = New-Object System.Drawing.Size($bounds.Width, $bounds.Height)
  $graphics.CopyFromScreen($source, $target, $size)
  $bitmap.Save($outputPath, $imageFormat)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output $outputPath
`;
}
export function main(argv: readonly string[]): any {
  let options;
  try {
    options = parseArgs(argv);
    if (options.help) {
      showHelp();
      return 0;
    }
    validateOptions(options);
  } catch (error: any) {
    console.error(error.message);
    return 1;
  }
  if (process.platform !== "win32") {
    console.error("take_screenshot_windows.mjs only supports Windows");
    return 1;
  }
  const shell = findExecutable("powershell.exe") || findExecutable("pwsh.exe");
  if (!shell) {
    console.error("PowerShell is required for Windows screenshot capture");
    return 1;
  }
  const payload = Buffer.from(JSON.stringify(options), "utf8").toString(
    "base64",
  );
  const result = spawnSync(
    shell,
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      powershellScript(payload),
    ],
    {
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    process.stderr.write(
      result.stderr || result.stdout || "Windows screenshot capture failed\n",
    );
    return result.status ?? 1;
  }
  process.stdout.write(result.stdout);
  return 0;
}
