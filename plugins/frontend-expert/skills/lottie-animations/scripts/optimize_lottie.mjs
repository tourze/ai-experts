#!/usr/bin/env node

import { readFileSync, statSync, writeFileSync } from "node:fs";

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    precision: 2,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-o" || arg === "--output") {
      args.output = requireValue(argv, ++i, arg);
    } else if (arg === "-p" || arg === "--precision") {
      args.precision = Number.parseInt(requireValue(argv, ++i, arg), 10);
      if (!Number.isInteger(args.precision)) {
        throw new Error("--precision must be an integer");
      }
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (!args.input) {
      args.input = arg;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!args.input) {
    throw new Error("input file is required");
  }

  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  console.log("Usage: optimize_lottie.mjs animation.json [-o optimized.json] [-p precision]");
}

function roundNumber(value, precision) {
  if (typeof value !== "number" || Number.isInteger(value)) return value;

  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function optimizeObject(value, precision) {
  if (Array.isArray(value)) {
    return value.map((item) => optimizeObject(item, precision));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, optimizeObject(child, precision)]),
    );
  }
  return roundNumber(value, precision);
}

function optimizeLottie(inputPath, outputPath = null, precision = 2) {
  let data;
  try {
    data = JSON.parse(readFileSync(inputPath, "utf-8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File '${inputPath}' not found`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON - ${error.message}`);
    }
    throw error;
  }

  const optimized = optimizeObject(data, precision);
  const json = JSON.stringify(optimized);

  if (!outputPath) {
    console.log(json);
    return;
  }

  writeFileSync(outputPath, json, "utf-8");
  const originalSize = statSync(inputPath).size;
  const optimizedSize = statSync(outputPath).size;
  const reduction = originalSize === 0 ? 0 : ((originalSize - optimizedSize) / originalSize) * 100;

  console.log(`✅ Optimized: ${inputPath} → ${outputPath}`);
  console.log(`   Original: ${originalSize.toLocaleString("en-US")} bytes`);
  console.log(`   Optimized: ${optimizedSize.toLocaleString("en-US")} bytes`);
  console.log(`   Reduction: ${reduction.toFixed(1)}%`);
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    optimizeLottie(args.input, args.output, args.precision);
    return 0;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

process.exitCode = main();
