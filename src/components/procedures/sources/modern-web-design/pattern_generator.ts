#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { writeFileSync, realpathSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { assertOutputWritable } from "./output_guard";

export const procedure = defineCliProcedure({
  id: "modern-web-design-pattern-generator",
  entry: procedureEntry(import.meta.url),
  description:
    "生成现代 Web 设计模式（hero/card/navigation/form 等）的完整 HTML 代码。",
  owners: { skillIds: ["modern-web-design"] },
  target: "scripts/pattern_generator.mjs",
  runtime: "node",
  params: [
    {
      flag: "--list",
      type: "",
      description: "列出所有可用设计模式并退出",
      required: false,
    },
    {
      flag: "--pattern",
      type: "字符串",
      description: "设计模式名称",
      required: false,
    },
    {
      flag: "--output",
      type: "路径",
      description: "输出文件路径",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的 HTML 输出；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--pattern", "hero", "--output", "hero.html"] },
});

export const PATTERNS: Record<string, any> = {
  hero: {
    name: "Immersive Hero Section",
    description: "Full-viewport hero with animated background",
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hero Section</title>\n    <style>\n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n        }\n\n        .hero {\n            position: relative;\n            height: 100vh;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            overflow: hidden;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n        }\n\n        .hero__bg {\n            position: absolute;\n            inset: 0;\n            opacity: 0.3;\n        }\n\n        .hero__content {\n            position: relative;\n            z-index: 2;\n            text-align: center;\n            color: white;\n            max-width: 800px;\n            padding: 2rem;\n        }\n\n        .hero__title {\n            font-size: clamp(3rem, 8vw, 6rem);\n            font-weight: 700;\n            line-height: 0.95;\n            letter-spacing: -0.03em;\n            margin-bottom: 1.5rem;\n            animation: fadeInUp 0.8s ease;\n        }\n\n        .hero__subtitle {\n            font-size: clamp(1.25rem, 2.5vw, 1.75rem);\n            margin-bottom: 2rem;\n            opacity: 0.9;\n            animation: fadeInUp 0.8s ease 0.2s backwards;\n        }\n\n        .hero__cta {\n            display: inline-block;\n            padding: 1rem 2.5rem;\n            background: white;\n            color: #667eea;\n            text-decoration: none;\n            border-radius: 9999px;\n            font-weight: 600;\n            font-size: 1.125rem;\n            transition: transform 0.2s, box-shadow 0.2s;\n            animation: fadeInUp 0.8s ease 0.4s backwards;\n        }\n\n        .hero__cta:hover {\n            transform: translateY(-2px);\n            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);\n        }\n\n        .scroll-indicator {\n            position: absolute;\n            bottom: 2rem;\n            left: 50%;\n            transform: translateX(-50%);\n            color: white;\n            opacity: 0.7;\n            animation: bounce 2s infinite;\n        }\n\n        @keyframes fadeInUp {\n            from {\n                opacity: 0;\n                transform: translateY(30px);\n            }\n            to {\n                opacity: 1;\n                transform: translateY(0);\n            }\n        }\n\n        @keyframes bounce {\n            0%, 100% { transform: translateX(-50%) translateY(0); }\n            50% { transform: translateX(-50%) translateY(-10px); }\n        }\n\n        /* Respect reduced motion preference */\n        @media (prefers-reduced-motion: reduce) {\n            * {\n                animation-duration: 0.01ms !important;\n                transition-duration: 0.01ms !important;\n            }\n        }\n    </style>\n</head>\n<body>\n    <section class="hero">\n        <div class="hero__bg" id="bg"></div>\n        <div class="hero__content">\n            <h1 class="hero__title">Modern Design</h1>\n            <p class="hero__subtitle">Performance meets beauty in every pixel</p>\n            <a href="#content" class="hero__cta">Explore</a>\n        </div>\n        <div class="scroll-indicator">\n            <span>↓ Scroll</span>\n        </div>\n    </section>\n\n    <section id="content" style="padding: 4rem 2rem; text-align: center;">\n        <h2>Your content here</h2>\n    </section>\n</body>\n</html>',
  },
  card: {
    name: "Interactive Card Grid",
    description: "Responsive card grid with hover effects",
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Card Grid</title>\n    <style>\n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n            background: #f5f7fa;\n            padding: 4rem 2rem;\n        }\n\n        .container {\n            max-width: 1200px;\n            margin: 0 auto;\n        }\n\n        .card-grid {\n            display: grid;\n            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));\n            gap: 2rem;\n        }\n\n        .card {\n            background: white;\n            border-radius: 12px;\n            overflow: hidden;\n            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n            transition: transform 0.3s, box-shadow 0.3s;\n        }\n\n        .card:hover {\n            transform: translateY(-4px);\n            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);\n        }\n\n        .card__image {\n            width: 100%;\n            aspect-ratio: 16 / 9;\n            object-fit: cover;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n        }\n\n        .card__content {\n            padding: 1.5rem;\n        }\n\n        .card__title {\n            font-size: 1.5rem;\n            font-weight: 600;\n            margin-bottom: 0.75rem;\n            color: #1a1a1a;\n        }\n\n        .card__description {\n            color: #666;\n            line-height: 1.6;\n            margin-bottom: 1rem;\n        }\n\n        .card__link {\n            display: inline-flex;\n            align-items: center;\n            color: #667eea;\n            text-decoration: none;\n            font-weight: 500;\n            transition: transform 0.2s;\n        }\n\n        .card__link:hover {\n            transform: translateX(4px);\n        }\n\n        /* Accessibility */\n        .card:focus-within {\n            outline: 3px solid #667eea;\n            outline-offset: 2px;\n        }\n\n        @media (prefers-reduced-motion: reduce) {\n            * {\n                animation-duration: 0.01ms !important;\n                transition-duration: 0.01ms !important;\n            }\n        }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <h1 style="margin-bottom: 3rem; font-size: 2.5rem;">Featured Content</h1>\n\n        <div class="card-grid">\n            <article class="card">\n                <img class="card__image" src="" alt="Card image" aria-hidden="true">\n                <div class="card__content">\n                    <h2 class="card__title">Card Title 1</h2>\n                    <p class="card__description">\n                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n                        Sed do eiusmod tempor incididunt ut labore.\n                    </p>\n                    <a href="#" class="card__link">\n                        Learn more →\n                    </a>\n                </div>\n            </article>\n\n            <article class="card">\n                <img class="card__image" src="" alt="Card image" aria-hidden="true">\n                <div class="card__content">\n                    <h2 class="card__title">Card Title 2</h2>\n                    <p class="card__description">\n                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n                        Sed do eiusmod tempor incididunt ut labore.\n                    </p>\n                    <a href="#" class="card__link">\n                        Learn more →\n                    </a>\n                </div>\n            </article>\n\n            <article class="card">\n                <img class="card__image" src="" alt="Card image" aria-hidden="true">\n                <div class="card__content">\n                    <h2 class="card__title">Card Title 3</h2>\n                    <p class="card__description">\n                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n                        Sed do eiusmod tempor incididunt ut labore.\n                    </p>\n                    <a href="#" class="card__link">\n                        Learn more →\n                    </a>\n                </div>\n            </article>\n        </div>\n    </div>\n</body>\n</html>',
  },
  navigation: {
    name: "Responsive Navigation",
    description: "Mobile-friendly navigation with hamburger menu",
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Navigation</title>\n    <style>\n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n        }\n\n        .header {\n            position: fixed;\n            top: 0;\n            left: 0;\n            right: 0;\n            background: white;\n            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n            z-index: 100;\n        }\n\n        .nav {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            padding: 1rem 2rem;\n            max-width: 1200px;\n            margin: 0 auto;\n        }\n\n        .nav__logo {\n            font-size: 1.5rem;\n            font-weight: 700;\n            color: #667eea;\n            text-decoration: none;\n        }\n\n        .nav__toggle {\n            display: none;\n            background: none;\n            border: none;\n            cursor: pointer;\n            padding: 0.5rem;\n        }\n\n        .nav__toggle span {\n            display: block;\n            width: 25px;\n            height: 3px;\n            background: #333;\n            margin: 5px 0;\n            transition: transform 0.3s, opacity 0.3s;\n        }\n\n        .nav__toggle.active span:nth-child(1) {\n            transform: translateY(8px) rotate(45deg);\n        }\n\n        .nav__toggle.active span:nth-child(2) {\n            opacity: 0;\n        }\n\n        .nav__toggle.active span:nth-child(3) {\n            transform: translateY(-8px) rotate(-45deg);\n        }\n\n        .nav__menu {\n            display: flex;\n            list-style: none;\n            gap: 2rem;\n        }\n\n        .nav__link {\n            color: #333;\n            text-decoration: none;\n            font-weight: 500;\n            transition: color 0.2s;\n        }\n\n        .nav__link:hover {\n            color: #667eea;\n        }\n\n        .nav__link:focus-visible {\n            outline: 3px solid #667eea;\n            outline-offset: 4px;\n            border-radius: 4px;\n        }\n\n        @media (max-width: 768px) {\n            .nav__toggle {\n                display: block;\n            }\n\n            .nav__menu {\n                position: absolute;\n                top: 100%;\n                left: 0;\n                right: 0;\n                flex-direction: column;\n                background: white;\n                padding: 1rem;\n                gap: 0;\n                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);\n                transform: translateY(-100%);\n                opacity: 0;\n                pointer-events: none;\n                transition: transform 0.3s, opacity 0.3s;\n            }\n\n            .nav__menu.active {\n                transform: translateY(0);\n                opacity: 1;\n                pointer-events: all;\n            }\n\n            .nav__menu li {\n                border-bottom: 1px solid #eee;\n            }\n\n            .nav__menu li:last-child {\n                border-bottom: none;\n            }\n\n            .nav__link {\n                display: block;\n                padding: 1rem;\n            }\n        }\n\n        .main {\n            margin-top: 80px;\n            padding: 4rem 2rem;\n        }\n\n        @media (prefers-reduced-motion: reduce) {\n            * {\n                animation-duration: 0.01ms !important;\n                transition-duration: 0.01ms !important;\n            }\n        }\n    </style>\n</head>\n<body>\n    <header class="header">\n        <nav class="nav" role="navigation" aria-label="Main">\n            <a href="#" class="nav__logo">Logo</a>\n\n            <button class="nav__toggle" aria-label="Toggle navigation" aria-expanded="false">\n                <span></span>\n                <span></span>\n                <span></span>\n            </button>\n\n            <ul class="nav__menu" id="navMenu">\n                <li><a href="#" class="nav__link">Home</a></li>\n                <li><a href="#" class="nav__link">About</a></li>\n                <li><a href="#" class="nav__link">Services</a></li>\n                <li><a href="#" class="nav__link">Contact</a></li>\n            </ul>\n        </nav>\n    </header>\n\n    <main class="main">\n        <h1>Main Content</h1>\n        <p>Your content goes here...</p>\n    </main>\n\n    <script>\n        const toggle = document.querySelector(\'.nav__toggle\');\n        const menu = document.querySelector(\'.nav__menu\');\n\n        toggle.addEventListener(\'click\', () => {\n            const isExpanded = toggle.getAttribute(\'aria-expanded\') === \'true\';\n\n            toggle.classList.toggle(\'active\');\n            menu.classList.toggle(\'active\');\n            toggle.setAttribute(\'aria-expanded\', !isExpanded);\n        });\n\n        // Close menu on Escape key\n        document.addEventListener(\'keydown\', (e) => {\n            if (e.key === \'Escape\' && menu.classList.contains(\'active\')) {\n                toggle.classList.remove(\'active\');\n                menu.classList.remove(\'active\');\n                toggle.setAttribute(\'aria-expanded\', \'false\');\n                toggle.focus();\n            }\n        });\n    </script>\n</body>\n</html>',
  },
  form: {
    name: "Accessible Form",
    description: "Form with validation and accessibility features",
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Contact Form</title>\n    <style>\n        * {\n            margin: 0;\n            padding: 0;\n            box-sizing: border-box;\n        }\n\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n            background: #f5f7fa;\n            padding: 4rem 2rem;\n        }\n\n        .form-container {\n            max-width: 600px;\n            margin: 0 auto;\n            background: white;\n            padding: 3rem;\n            border-radius: 12px;\n            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n        }\n\n        h1 {\n            margin-bottom: 2rem;\n            color: #1a1a1a;\n        }\n\n        .form-group {\n            margin-bottom: 1.5rem;\n        }\n\n        label {\n            display: block;\n            margin-bottom: 0.5rem;\n            font-weight: 500;\n            color: #333;\n        }\n\n        .required {\n            color: #ef4444;\n            margin-left: 0.25rem;\n        }\n\n        input, textarea {\n            width: 100%;\n            padding: 0.75rem;\n            border: 2px solid #ddd;\n            border-radius: 6px;\n            font-size: 1rem;\n            font-family: inherit;\n            transition: border-color 0.2s;\n        }\n\n        input:focus, textarea:focus {\n            outline: none;\n            border-color: #667eea;\n            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);\n        }\n\n        input[aria-invalid="true"], textarea[aria-invalid="true"] {\n            border-color: #ef4444;\n        }\n\n        .help-text {\n            font-size: 0.875rem;\n            color: #666;\n            margin-top: 0.25rem;\n        }\n\n        .error-message {\n            color: #ef4444;\n            font-size: 0.875rem;\n            margin-top: 0.25rem;\n            display: none;\n        }\n\n        .error-message.visible {\n            display: block;\n        }\n\n        .success-message {\n            color: #10b981;\n            font-size: 0.875rem;\n            margin-top: 0.25rem;\n        }\n\n        button {\n            background: #667eea;\n            color: white;\n            padding: 0.875rem 2rem;\n            border: none;\n            border-radius: 6px;\n            font-size: 1rem;\n            font-weight: 600;\n            cursor: pointer;\n            transition: background 0.2s, transform 0.2s;\n            min-height: 44px;\n        }\n\n        button:hover {\n            background: #5568d3;\n            transform: translateY(-1px);\n        }\n\n        button:active {\n            transform: translateY(0);\n        }\n\n        button:focus-visible {\n            outline: 3px solid #667eea;\n            outline-offset: 2px;\n        }\n\n        @media (prefers-reduced-motion: reduce) {\n            * {\n                animation-duration: 0.01ms !important;\n                transition-duration: 0.01ms !important;\n            }\n        }\n    </style>\n</head>\n<body>\n    <div class="form-container">\n        <h1>Contact Us</h1>\n\n        <form id="contactForm" novalidate>\n            <div class="form-group">\n                <label for="name">\n                    Full Name\n                    <abbr class="required" title="required" aria-label="required">*</abbr>\n                </label>\n                <input\n                    type="text"\n                    id="name"\n                    name="name"\n                    required\n                    aria-required="true"\n                    aria-describedby="name-error"\n                >\n                <div id="name-error" class="error-message" role="alert">\n                    Please enter your name\n                </div>\n            </div>\n\n            <div class="form-group">\n                <label for="email">\n                    Email Address\n                    <abbr class="required" title="required" aria-label="required">*</abbr>\n                </label>\n                <input\n                    type="email"\n                    id="email"\n                    name="email"\n                    required\n                    aria-required="true"\n                    aria-describedby="email-help email-error"\n                >\n                <p id="email-help" class="help-text">\n                    We\'ll never share your email\n                </p>\n                <div id="email-error" class="error-message" role="alert">\n                    Please enter a valid email address\n                </div>\n            </div>\n\n            <div class="form-group">\n                <label for="message">\n                    Message\n                    <abbr class="required" title="required" aria-label="required">*</abbr>\n                </label>\n                <textarea\n                    id="message"\n                    name="message"\n                    rows="5"\n                    required\n                    aria-required="true"\n                    aria-describedby="message-error"\n                ></textarea>\n                <div id="message-error" class="error-message" role="alert">\n                    Please enter a message\n                </div>\n            </div>\n\n            <button type="submit">Send Message</button>\n        </form>\n    </div>\n\n    <script>\n        const form = document.getElementById(\'contactForm\');\n\n        form.addEventListener(\'submit\', (e) => {\n            e.preventDefault();\n\n            let isValid = true;\n\n            // Validate name\n            const name = document.getElementById(\'name\');\n            const nameError = document.getElementById(\'name-error\');\n            if (!name.value.trim()) {\n                nameError.classList.add(\'visible\');\n                name.setAttribute(\'aria-invalid\', \'true\');\n                isValid = false;\n            } else {\n                nameError.classList.remove(\'visible\');\n                name.setAttribute(\'aria-invalid\', \'false\');\n            }\n\n            // Validate email\n            const email = document.getElementById(\'email\');\n            const emailError = document.getElementById(\'email-error\');\n            const emailRegex = /^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/;\n            if (!emailRegex.test(email.value)) {\n                emailError.classList.add(\'visible\');\n                email.setAttribute(\'aria-invalid\', \'true\');\n                isValid = false;\n            } else {\n                emailError.classList.remove(\'visible\');\n                email.setAttribute(\'aria-invalid\', \'false\');\n            }\n\n            // Validate message\n            const message = document.getElementById(\'message\');\n            const messageError = document.getElementById(\'message-error\');\n            if (!message.value.trim()) {\n                messageError.classList.add(\'visible\');\n                message.setAttribute(\'aria-invalid\', \'true\');\n                isValid = false;\n            } else {\n                messageError.classList.remove(\'visible\');\n                message.setAttribute(\'aria-invalid\', \'false\');\n            }\n\n            if (isValid) {\n                alert(\'Form submitted successfully!\');\n                form.reset();\n            } else {\n                // Focus first invalid field\n                const firstInvalid = form.querySelector(\'[aria-invalid="true"]\');\n                if (firstInvalid) firstInvalid.focus();\n            }\n        });\n\n        // Real-time validation\n        [\'name\', \'email\', \'message\'].forEach(id => {\n            const field = document.getElementById(id);\n            field.addEventListener(\'blur\', () => {\n                // Trigger validation on blur\n                form.dispatchEvent(new Event(\'submit\'));\n            });\n        });\n    </script>\n</body>\n</html>',
  },
};
export function listPatterns(write: any = console.log): any {
  write("\nAvailable patterns:\n");
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    write(`  ${key.padEnd(15)} - ${pattern.name}`);
    write(`  ${"".padEnd(15)}   ${pattern.description}\n`);
  }
}
export function generatePattern(
  patternKey: any,
  outputFile: any = null,
  write: any = console.log,
  options: { overwrite?: boolean } = {},
): any {
  const pattern = PATTERNS[patternKey];
  if (!pattern) {
    write(`Error: Pattern '${patternKey}' not found.`);
    write("\nRun './pattern_generator.mjs --list' to see available patterns.");
    return 1;
  }
  if (outputFile) {
    assertOutputWritable(outputFile, Boolean(options.overwrite));
    writeFileSync(outputFile, pattern.html, "utf8");
    write(`✅ Generated '${pattern.name}' pattern`);
    write(`   Saved to: ${outputFile}`);
  } else {
    write(`\n${"=".repeat(60)}`);
    write(pattern.name);
    write(`${"=".repeat(60)}\n`);
    write(pattern.html);
  }
  return 0;
}
async function interactiveMode(): Promise<any> {
  console.log("\n" + "=".repeat(60));
  console.log("Modern Web Design Pattern Generator");
  console.log("=".repeat(60));
  listPatterns();
  const rl = createInterface({ input, output });
  try {
    const patternKey = (
      await rl.question("Select a pattern (or 'q' to quit): ")
    )
      .trim()
      .toLowerCase();
    if (patternKey === "q") {
      console.log("Goodbye!");
      return 0;
    }
    if (!PATTERNS[patternKey]) {
      console.log(`Error: '${patternKey}' is not a valid pattern.`);
      return 1;
    }
    const save = (await rl.question("\nSave to file? (y/n): "))
      .trim()
      .toLowerCase();
    if (save === "y") {
      let filename = (
        await rl.question("Enter filename (e.g., hero.html): ")
      ).trim();
      if (!filename) {
        filename = `${patternKey}.html`;
      }
      return generatePattern(patternKey, filename);
    }
    return generatePattern(patternKey);
  } finally {
    rl.close();
  }
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    pattern: null,
    output: null,
    overwrite: false,
    list: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--list") {
      args.list = true;
    } else if (arg === "--overwrite") {
      args.overwrite = true;
    } else if (arg === "--pattern" || arg === "--output") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === "--pattern") {
        args.pattern = value;
      } else {
        args.output = value;
      }
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return args;
}
export async function main(argv: readonly string[]): Promise<any> {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error: any) {
    console.error(`ERROR: ${error.message}`);
    return 1;
  }
  if (args.list) {
    listPatterns();
    return 0;
  }
  if (args.pattern) {
    return generatePattern(args.pattern, args.output, console.log, args);
  }
  return interactiveMode();
}
