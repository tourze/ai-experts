#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { convertDocument } from "./markitdown_runtime.mjs";

export const PROMPTS = {
  scientific: `Analyze this scientific image or diagram. Provide:
1. Type of visualization (graph, chart, microscopy, diagram, etc.)
2. Key data points, trends, or patterns
3. Axes labels, legends, and scales
4. Notable features or findings
5. Scientific context and significance
Be precise, technical, and detailed.`,
  presentation: `Describe this presentation slide image. Include:
1. Main visual elements and their arrangement
2. Key points or messages conveyed
3. Data or information presented
4. Visual hierarchy and emphasis
Keep the description clear and informative.`,
  general: `Describe this image in detail. Include:
1. Main subjects and objects
2. Visual composition and layout
3. Text content (if any)
4. Notable details
5. Overall context and purpose
Be comprehensive and accurate.`,
  data_viz: `Analyze this data visualization. Provide:
1. Type of chart/graph (bar, line, scatter, pie, etc.)
2. Variables and axes
3. Data ranges and scales
4. Key patterns, trends, or outliers
5. Statistical insights
Focus on quantitative accuracy.`,
  medical: `Describe this medical image. Include:
1. Type of medical imaging (X-ray, MRI, CT, microscopy, etc.)
2. Anatomical structures visible
3. Notable findings or abnormalities
4. Image quality and contrast
5. Clinical relevance
Be professional and precise.`,
};

function usage() {
  console.log(`Usage: node convert_with_ai.mjs <input> <output> [options]

Options:
  --api-key, -k <key>       OpenRouter API key
  --model, -m <model>       Model to use
  --prompt-type, -t <type>  Prompt type: ${Object.keys(PROMPTS).join(", ")}
  --custom-prompt, -p <txt> Custom prompt
  --list-prompts, -l        List prompt types and exit`);
}

function parseArgs(argv) {
  const positional = [];
  const options = {
    model: "anthropic/claude-opus-4.5",
    promptType: "general",
    customPrompt: null,
    apiKey: null,
    listPrompts: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--list-prompts" || arg === "-l") {
      options.listPrompts = true;
    } else if (arg === "--api-key" || arg === "-k") {
      options.apiKey = argv[++index];
    } else if (arg === "--model" || arg === "-m") {
      options.model = argv[++index];
    } else if (arg === "--prompt-type" || arg === "-t") {
      options.promptType = argv[++index];
    } else if (arg === "--custom-prompt" || arg === "-p") {
      options.customPrompt = argv[++index];
    } else {
      positional.push(arg);
    }
  }

  if (options.listPrompts) {
    return options;
  }
  if (positional.length !== 2 || !PROMPTS[options.promptType]) {
    return { error: "Invalid arguments" };
  }
  return {
    input: positional[0],
    output: positional[1],
    ...options,
  };
}

function listPrompts() {
  console.log("Available prompt types:\n");
  for (const [name, prompt] of Object.entries(PROMPTS)) {
    console.log(`[${name}]`);
    console.log(prompt);
    console.log("\n============================================================\n");
  }
}

export async function convertWithAi(inputFile, outputFile, options) {
  const prompt = options.customPrompt || PROMPTS[options.promptType] || PROMPTS.general;

  console.log(`Using model: ${options.model}`);
  console.log(`Prompt type: ${options.customPrompt ? "custom" : options.promptType}`);
  console.log(`Converting: ${inputFile}`);

  const result = await convertDocument(inputFile, {
    llm: {
      apiKey: options.apiKey,
      model: options.model,
      prompt,
    },
  });

  const sourceName = basename(inputFile);
  const stem = sourceName.slice(0, sourceName.length - extname(sourceName).length);
  const content = [
    `# ${result.title || stem}`,
    "",
    `**Source**: ${sourceName}`,
    `**Format**: ${extname(sourceName)}`,
    `**AI Model**: ${options.model}`,
    `**Prompt Type**: ${options.customPrompt ? "custom" : options.promptType}`,
    "",
    "---",
    "",
    result.text_content,
  ].join("\n");

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, content, "utf-8");
  console.log(`Successfully converted to: ${outputFile}`);
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    usage();
    return 0;
  }
  if (args.listPrompts) {
    listPrompts();
    return 0;
  }
  if (args.error) {
    console.error(`Error: ${args.error}`);
    usage();
    return 1;
  }

  const apiKey = args.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("Error: OpenRouter API key required. Set OPENROUTER_API_KEY environment variable or use --api-key");
    console.error("Get your API key at: https://openrouter.ai/keys");
    return 1;
  }
  if (!existsSync(args.input)) {
    console.error(`Error: Input file '${args.input}' does not exist`);
    return 1;
  }

  try {
    await convertWithAi(args.input, args.output, {
      ...args,
      apiKey,
    });
    return 0;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    (status) => {
      process.exitCode = status;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    },
  );
}
