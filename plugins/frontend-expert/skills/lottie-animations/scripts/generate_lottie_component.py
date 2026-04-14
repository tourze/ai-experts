#!/usr/bin/env python3
"""
Lottie Component Generator

Generates React, Vue, or Svelte Lottie component boilerplate with common patterns.

Usage:
    ./generate_lottie_component.py                          # Interactive mode
    ./generate_lottie_component.py --framework react --type basic
    ./generate_lottie_component.py --framework react --type interactive
    ./generate_lottie_component.py --framework vue --type basic
"""

import argparse
import sys
from string import Template

TEMPLATES = {
    'react_basic': Template('''import React from 'react';
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
'''),
    'react_interactive': Template('''import React, { useState } from 'react';
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
'''),
    'vue_basic': Template('''<script setup>
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';
</script>

<template>
  <DotLottieVue
    src="$animation_src"
    :autoplay="true"
    :loop="true"
    :style="{ height: '${height}px', width: '${width}px' }"
  />
</template>
'''),
    'svelte_basic': Template('''<script lang="ts">
  import { DotLottieSvelte } from '@lottiefiles/dotlottie-svelte';
</script>

<DotLottieSvelte
  src="$animation_src"
  loop={true}
  autoplay={true}
  style="height: ${height}px; width: ${width}px;"
/>
''')
}

def generate_component(framework, component_type, component_name, animation_src, height, width):
    """Generate component code based on parameters."""
    if framework != 'react' and component_type != 'basic':
        print(f"Error: '{framework}' 仅支持 --type basic")
        sys.exit(1)

    key = f"{framework}_{component_type}"

    if key not in TEMPLATES:
        print(f"Error: Template '{key}' not found")
        sys.exit(1)

    template = TEMPLATES[key]
    code = template.substitute(
        component_name=component_name,
        animation_src=animation_src,
        height=height,
        width=width,
    )

    return code

def interactive_mode():
    """Run interactive mode to gather component parameters."""
    print("Lottie Component Generator")
    print("-" * 40)

    # Framework selection
    print("\nSelect framework:")
    print("1. React")
    print("2. Vue")
    print("3. Svelte")
    framework_choice = input("Enter choice (1-3): ").strip()

    framework_map = {'1': 'react', '2': 'vue', '3': 'svelte'}
    framework = framework_map.get(framework_choice, 'react')

    # Component type
    if framework == 'react':
        print("\nSelect component type:")
        print("1. Basic (just displays animation)")
        print("2. Interactive (with playback controls)")
        type_choice = input("Enter choice (1-2): ").strip()
        component_type = 'interactive' if type_choice == '2' else 'basic'
    else:
        component_type = 'basic'

    # Component details
    component_name = input("\nComponent name (e.g., HeroAnimation): ").strip() or "LottieAnimation"
    animation_src = input("Animation source URL or path: ").strip() or "/animations/animation.lottie"
    height = input("Height in pixels (default 400): ").strip() or "400"
    width = input("Width in pixels (default 400): ").strip() or "400"

    code = generate_component(framework, component_type, component_name, animation_src, height, width)

    # Output
    extensions = {'react': 'jsx', 'vue': 'vue', 'svelte': 'svelte'}
    filename = f"{component_name}.{extensions[framework]}"

    print(f"\nGenerated {filename}:")
    print("-" * 40)
    print(code)

    save = input("\nSave to file? (y/n): ").strip().lower()
    if save == 'y':
        with open(filename, 'w') as f:
            f.write(code)
        print(f"✅ Saved to {filename}")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Generate Lottie component boilerplate")
    parser.add_argument('--framework', choices=['react', 'vue', 'svelte'], help="Framework to use")
    parser.add_argument('--type', choices=['basic', 'interactive'], default='basic', help="Component type")
    parser.add_argument('--name', default='LottieAnimation', help="Component name")
    parser.add_argument('--src', default='/animations/animation.lottie', help="Animation source")
    parser.add_argument('--height', default='400', help="Height in pixels")
    parser.add_argument('--width', default='400', help="Width in pixels")
    parser.add_argument('--output', help="Output file path")

    args = parser.parse_args()

    # Interactive mode if no framework specified
    if not args.framework:
        interactive_mode()
        return

    code = generate_component(
        args.framework,
        args.type,
        args.name,
        args.src,
        args.height,
        args.width
    )

    if args.output:
        with open(args.output, 'w') as f:
            f.write(code)
        print(f"✅ Generated {args.output}")
    else:
        print(code)

if __name__ == '__main__':
    main()
