#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { mkdirSync, readFileSync, writeFileSync, realpathSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-visual-diff",
  entry: procedureEntry(import.meta.url),
  description:
    "比较两张截图之间的视觉差异：内置 PNG 解析，输出差值百分比、diff 图和并排对比图。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/visual_diff.mjs",
  runtime: "node",
  params: [
    {
      flag: "--output",
      type: "路径",
      description: "diff 产物输出目录",
      required: false,
    },
    {
      flag: "--threshold",
      type: "数字",
      description: "可接受的差值阈值（默认 0.01）",
      required: false,
    },
    {
      flag: "--details",
      type: "",
      description: "显示详细 JSON 输出，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["baseline.png", "current.png", "--threshold", "0.01"] },
});

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
export class VisualDiffer {
  threshold: any;
  constructor(threshold: any = 0.01) {
    this.threshold = threshold;
  }
  compare(baselinePath: any, currentPath: any): any {
    const baseline = readPng(baselinePath);
    const current = readPng(currentPath);
    return this.compareImages(baseline, current);
  }
  compareImages(baseline: any, current: any): any {
    if (
      baseline.width !== current.width ||
      baseline.height !== current.height
    ) {
      return {
        error: "Image dimensions do not match",
        baseline_size: [baseline.width, baseline.height],
        current_size: [current.width, current.height],
      };
    }
    const totalPixels = baseline.width * baseline.height;
    const differentPixels = countDifferentPixels(baseline.data, current.data);
    const differencePercentage = (differentPixels / totalPixels) * 100;
    const passed = differencePercentage <= this.threshold * 100;
    return {
      dimensions: [baseline.width, baseline.height],
      total_pixels: totalPixels,
      different_pixels: differentPixels,
      difference_percentage: Math.round(differencePercentage * 100) / 100,
      threshold_percentage: this.threshold * 100,
      passed,
      verdict: passed ? "PASS" : "FAIL",
    };
  }
  generateDiffImage(baselinePath: any, currentPath: any, outputPath: any): any {
    const baseline = readPng(baselinePath);
    const current = readPng(currentPath);
    writePng(outputPath, generateDiffImageData(baseline, current));
  }
  generateSideBySide(
    baselinePath: any,
    currentPath: any,
    outputPath: any,
  ): any {
    const baseline = readPng(baselinePath);
    const current = readPng(currentPath);
    writePng(outputPath, generateSideBySideData(baseline, current));
  }
}
export function countDifferentPixels(baselineData: any, currentData: any): any {
  let count = 0;
  for (let offset = 0; offset < baselineData.length; offset += 4) {
    const red = Math.abs(baselineData[offset] - currentData[offset]);
    const green = Math.abs(baselineData[offset + 1] - currentData[offset + 1]);
    const blue = Math.abs(baselineData[offset + 2] - currentData[offset + 2]);
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    if (luminance > 10) count += 1;
  }
  return count;
}
export function generateDiffImageData(baseline: any, current: any): any {
  assertSameDimensions(baseline, current);
  const data = Buffer.from(current.data);
  for (let offset = 0; offset < data.length; offset += 4) {
    const diff =
      Math.abs(baseline.data[offset] - current.data[offset]) +
      Math.abs(baseline.data[offset + 1] - current.data[offset + 1]) +
      Math.abs(baseline.data[offset + 2] - current.data[offset + 2]);
    if (diff > 30) {
      data[offset] = 255;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 255;
    }
  }
  return { width: baseline.width, height: baseline.height, data };
}
export function generateSideBySideData(baseline: any, current: any): any {
  const separator = 10;
  const width = baseline.width + separator + current.width;
  const height = Math.max(baseline.height, current.height);
  const data = Buffer.alloc(width * height * 4, 128);
  for (let offset = 3; offset < data.length; offset += 4) data[offset] = 255;
  blitImage(baseline, { width, height, data }, 0, 0);
  blitImage(current, { width, height, data }, baseline.width + separator, 0);
  return { width, height, data };
}
export function readPng(filePath: any): any {
  const buffer = readFileSync(filePath);
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE))
    throw new Error(`Not a PNG file: ${filePath}`);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks: any[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }
  if (bitDepth !== 8) throw new Error("Only 8-bit PNG files are supported");
  if (interlace !== 0)
    throw new Error("Interlaced PNG files are not supported");
  const channels = channelCount(colorType);
  const raw = inflateSync(Buffer.concat(idatChunks));
  const scanlineBytes = width * channels;
  const pixels = unfilterPng(raw, width, height, channels, scanlineBytes);
  return { width, height, data: toRgba(pixels, width, height, colorType) };
}
export function writePng(filePath: any, image: any): any {
  const scanlineBytes = image.width * 4;
  const raw = Buffer.alloc((scanlineBytes + 1) * image.height);
  for (let y = 0; y < image.height; y += 1) {
    const rawOffset = y * (scanlineBytes + 1);
    raw[rawOffset] = 0;
    image.data.copy(
      raw,
      rawOffset + 1,
      y * scanlineBytes,
      (y + 1) * scanlineBytes,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  writeFileSync(
    filePath,
    Buffer.concat([
      PNG_SIGNATURE,
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    baseline: null,
    current: null,
    output: ".",
    threshold: 0.01,
    details: false,
    help: false,
  };
  const positionals: any[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--details") args.details = true;
    else if (["--output", "--threshold"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--output") args.output = value;
      if (arg === "--threshold") args.threshold = Number.parseFloat(value);
    } else if (arg.startsWith("--")) {
      throw new Error(`unrecognized argument: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }
  if (!args.help && positionals.length !== 2)
    throw new Error("baseline and current image paths are required");
  if (!Number.isFinite(args.threshold))
    throw new Error("--threshold must be a number");
  [args.baseline, args.current] = positionals;
  return args;
}
export function usage(): any {
  return `Compare screenshots for visual differences.

Usage: node scripts/visual_diff.mjs <baseline.png> <current.png> [options]

Options:
  --output <dir>       Output directory for diff artifacts
  --threshold <value>  Acceptable difference threshold
  --details            Show detailed JSON output
  --help               Show this help
`;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  mkdirSync(args.output, { recursive: true });
  const differ = new VisualDiffer(args.threshold);
  let result;
  try {
    result = differ.compare(args.baseline, args.current);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
  if (result.error) {
    console.log(`Error: ${result.error}`);
    console.log(`Baseline: ${JSON.stringify(result.baseline_size)}`);
    console.log(`Current: ${JSON.stringify(result.current_size)}`);
    return 1;
  }
  const diffPath = join(args.output, "diff.png");
  const comparisonPath = join(args.output, "side-by-side.png");
  try {
    differ.generateDiffImage(args.baseline, args.current, diffPath);
    differ.generateSideBySide(args.baseline, args.current, comparisonPath);
  } catch (error: any) {
    console.log(`Warning: Could not generate images - ${error.message}`);
  }
  if (args.details) {
    console.log(
      JSON.stringify(
        {
          summary: {
            baseline: args.baseline,
            current: args.current,
            threshold: args.threshold,
            passed: result.passed,
          },
          results: result,
          artifacts: { diff_image: diffPath, comparison_image: comparisonPath },
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `Difference: ${result.difference_percentage}% (${result.verdict})`,
    );
    if (result.different_pixels > 0)
      console.log(
        `Changed pixels: ${result.different_pixels.toLocaleString()}`,
      );
    console.log(`Artifacts saved to: ${args.output}/`);
  }
  writeFileSync(
    join(args.output, "diff-report.json"),
    `${JSON.stringify(
      {
        baseline: basename(args.baseline),
        current: basename(args.current),
        results: result,
        artifacts: { diff: "diff.png", comparison: "side-by-side.png" },
      },
      null,
      2,
    )}\n`,
  );
  return result.passed ? 0 : 1;
}
function assertSameDimensions(baseline: any, current: any): any {
  if (baseline.width !== current.width || baseline.height !== current.height) {
    throw new Error("Image dimensions do not match");
  }
}
function channelCount(colorType: any): any {
  if (colorType === 0) return 1;
  if (colorType === 2) return 3;
  if (colorType === 4) return 2;
  if (colorType === 6) return 4;
  throw new Error(`Unsupported PNG color type: ${colorType}`);
}
function unfilterPng(
  raw: any,
  width: any,
  height: any,
  bytesPerPixel: any,
  scanlineBytes: any,
): any {
  const output = Buffer.alloc(width * height * bytesPerPixel);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (scanlineBytes + 1)];
    const rowStart = y * scanlineBytes;
    const rawStart = y * (scanlineBytes + 1) + 1;
    for (let x = 0; x < scanlineBytes; x += 1) {
      const rawValue = raw[rawStart + x];
      const left =
        x >= bytesPerPixel ? output[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? output[rowStart + x - scanlineBytes] : 0;
      const upLeft =
        y > 0 && x >= bytesPerPixel
          ? output[rowStart + x - scanlineBytes - bytesPerPixel]
          : 0;
      output[rowStart + x] =
        (rawValue + unfilterValue(filter, left, up, upLeft)) & 0xff;
    }
  }
  return output;
}
function unfilterValue(filter: any, left: any, up: any, upLeft: any): any {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paeth(left, up, upLeft);
  throw new Error(`Unsupported PNG filter: ${filter}`);
}
function paeth(left: any, up: any, upLeft: any): any {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}
function toRgba(pixels: any, width: any, height: any, colorType: any): any {
  const output = Buffer.alloc(width * height * 4);
  const inputChannels = channelCount(colorType);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const input = pixel * inputChannels;
    const outputOffset = pixel * 4;
    if (colorType === 0) {
      output[outputOffset] = pixels[input];
      output[outputOffset + 1] = pixels[input];
      output[outputOffset + 2] = pixels[input];
      output[outputOffset + 3] = 255;
    } else if (colorType === 2) {
      output[outputOffset] = pixels[input];
      output[outputOffset + 1] = pixels[input + 1];
      output[outputOffset + 2] = pixels[input + 2];
      output[outputOffset + 3] = 255;
    } else if (colorType === 4) {
      output[outputOffset] = pixels[input];
      output[outputOffset + 1] = pixels[input];
      output[outputOffset + 2] = pixels[input];
      output[outputOffset + 3] = pixels[input + 1];
    } else if (colorType === 6) {
      output[outputOffset] = pixels[input];
      output[outputOffset + 1] = pixels[input + 1];
      output[outputOffset + 2] = pixels[input + 2];
      output[outputOffset + 3] = pixels[input + 3];
    }
  }
  return output;
}
function blitImage(source: any, target: any, xOffset: any, yOffset: any): any {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceOffset = (y * source.width + x) * 4;
      const targetOffset = ((y + yOffset) * target.width + x + xOffset) * 4;
      source.data.copy(
        target.data,
        targetOffset,
        sourceOffset,
        sourceOffset + 4,
      );
    }
  }
}
function chunk(type: any, data: any): any {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}
const CRC_TABLE = Array.from({ length: 256 }, (_: any, index: any): any => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(buffer: any): any {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
