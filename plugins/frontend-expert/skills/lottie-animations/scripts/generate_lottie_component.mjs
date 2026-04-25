#!/usr/bin/env node
/**
 * Lottie Component Generator
 *
 * Generates React, Vue, or Svelte Lottie component boilerplate with common
 * patterns.
 *
 * Usage:
 *   node generate_lottie_component.mjs --framework react --type basic
 *   node generate_lottie_component.mjs --framework react --type interactive
 *   node generate_lottie_component.mjs --framework vue --type basic
 */

import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const VALID_FRAMEWORKS = new Set(["react", "vue", "svelte"]);
const VALID_TYPES = new Set(["basic", "interactive"]);

const TEMPLATES = {
  react_basic: `import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const $component_name = () => {
  return (
    <DotLottieReact
      src="$animation_src"
      loop
      autoplay
      style={{ height: $height, width: $width }}
    />
  );
};
`,
  react_interactive: `import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const $component_name = () => {
  const [dotLottie, setDotLottie] = useState(null);

  const handlePlay = () => dotLottie?.play();
  const handlePause = () => dotLottie?.pause();
  const handleStop = () => dotLottie?.stop();

  return (
    <div>
      <DotLottieReact
        src="$animation_src"
        loop
        autoplay={false}
        dotLottieRefCallback={setDotLottie}
        style={{ height: $height, width: $width }}
      />
      <div style={{ marginTop: 16 }}>
        <button onClick={handlePlay}>Play</button>
        <button onClick={handlePause}>Pause</button>
        <button onClick={handleStop}>Stop</button>
      </div>
    </div>
  );
};
`,
  vue_basic: `<script setup>
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
</script>

<template>
  <DotLottieVue
    src="$animation_src"
    :autoplay="true"
    :loop="true"
    :style="{ height: '$heightpx', width: '$widthpx' }"
  />
</template>
`,
  svelte_basic: `<script lang="ts">
  import { DotLottieSvelte } from '@lottiefiles/dotlottie-svelte';
</script>

<DotLottieSvelte
  src="$animation_src"
  loop={true}
  autoplay={true}
  style="height: $heightpx; width: $widthpx;"
/>
`,
};

function renderTemplate(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.split(`$${key}`).join(String(value));
  }
  return result;
}

function generateComponent(framework, componentType, componentName, animationSrc, height, width) {
  if (framework !== "react" && componentType !== "basic") {
    console.log(`Error: '${framework}' 仅支持 --type basic`);
    process.exit(1);
  }

  const key = `${framework}_${componentType}`;
  const template = TEMPLATES[key];

  if (!template) {
    console.log(`Error: Template '${key}' not found`);
    process.exit(1);
  }

  return renderTemplate(template, {
    component_name: componentName,
    animation_src: animationSrc,
    height,
    width,
  });
}

async function interactiveMode() {
  const rl = createInterface({ input, output });

  try {
    console.log("Lottie Component Generator");
    console.log("-".repeat(40));

    console.log("\nSelect framework:");
    console.log("1. React");
    console.log("2. Vue");
    console.log("3. Svelte");
    const frameworkChoice = (await rl.question("Enter choice (1-3): ")).trim();

    const frameworkMap = { 1: "react", 2: "vue", 3: "svelte" };
    const framework = frameworkMap[frameworkChoice] ?? "react";

    let componentType = "basic";
    if (framework === "react") {
      console.log("\nSelect component type:");
      console.log("1. Basic (just displays animation)");
      console.log("2. Interactive (with playback controls)");
      const typeChoice = (await rl.question("Enter choice (1-2): ")).trim();
      componentType = typeChoice === "2" ? "interactive" : "basic";
    }

    const componentName = (await rl.question("\nComponent name (e.g., HeroAnimation): ")).trim() || "LottieAnimation";
    const animationSrc = (await rl.question("Animation source URL or path: ")).trim() || "/animations/animation.lottie";
    const height = (await rl.question("Height in pixels (default 400): ")).trim() || "400";
    const width = (await rl.question("Width in pixels (default 400): ")).trim() || "400";

    const code = generateComponent(framework, componentType, componentName, animationSrc, height, width);
    const extensions = { react: "jsx", vue: "vue", svelte: "svelte" };
    const filename = `${componentName}.${extensions[framework]}`;

    console.log(`\nGenerated ${filename}:`);
    console.log("-".repeat(40));
    console.log(code);

    const save = (await rl.question("\nSave to file? (y/n): ")).trim().toLowerCase();
    if (save === "y") {
      writeFileSync(filename, code, "utf8");
      console.log(`✅ Saved to ${filename}`);
    }
  } finally {
    rl.close();
  }
}

function parseArgs(argv) {
  const args = {
    framework: null,
    type: "basic",
    name: "LottieAnimation",
    src: "/animations/animation.lottie",
    height: "400",
    width: "400",
    output: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--framework") {
      args.framework = next;
      i += 1;
    } else if (arg === "--type") {
      args.type = next;
      i += 1;
    } else if (arg === "--name") {
      args.name = next;
      i += 1;
    } else if (arg === "--src") {
      args.src = next;
      i += 1;
    } else if (arg === "--height") {
      args.height = next;
      i += 1;
    } else if (arg === "--width") {
      args.width = next;
      i += 1;
    } else if (arg === "--output") {
      args.output = next;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node generate_lottie_component.mjs [--framework react|vue|svelte] [--type basic|interactive]");
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (args.framework && !VALID_FRAMEWORKS.has(args.framework)) {
    throw new Error(`Invalid --framework '${args.framework}'`);
  }
  if (!VALID_TYPES.has(args.type)) {
    throw new Error(`Invalid --type '${args.type}'`);
  }

  return args;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(2);
  }

  if (!args.framework) {
    await interactiveMode();
    return;
  }

  const code = generateComponent(args.framework, args.type, args.name, args.src, args.height, args.width);

  if (args.output) {
    writeFileSync(args.output, code, "utf8");
    console.log(`✅ Generated ${args.output}`);
  } else {
    console.log(code);
  }
}

await main();
