import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const screenshotSkill = defineSkill({
  id: "screenshot",
  description: "当用户要截桌面、截窗口、截指定区域或做系统级截图时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "ensure-macos-permissions",
      entry: new URL("./scripts/ensure_macos_permissions.mjs", import.meta.url),
      target: "scripts/ensure_macos_permissions.mjs",
      runtime: "node",
      bundle: false,
      description: "Script ensure_macos_permissions.mjs.",
    }),
    defineSkillScript({
      id: "macos-display-info",
      entry: new URL("./scripts/macos_display_info.mjs", import.meta.url),
      target: "scripts/macos_display_info.mjs",
      runtime: "node",
      bundle: false,
      description: "Script macos_display_info.mjs.",
    }),
    defineSkillScript({
      id: "macos-permissions",
      entry: new URL("./scripts/macos_permissions.mjs", import.meta.url),
      target: "scripts/macos_permissions.mjs",
      runtime: "node",
      bundle: false,
      description: "Script macos_permissions.mjs.",
    }),
    defineSkillScript({
      id: "macos-window-info",
      entry: new URL("./scripts/macos_window_info.mjs", import.meta.url),
      target: "scripts/macos_window_info.mjs",
      runtime: "node",
      bundle: false,
      description: "Script macos_window_info.mjs.",
    }),
    defineSkillScript({
      id: "take-screenshot",
      entry: new URL("./scripts/take_screenshot.mjs", import.meta.url),
      target: "scripts/take_screenshot.mjs",
      runtime: "node",
      bundle: false,
      description: "Script take_screenshot.mjs.",
    }),
    defineSkillScript({
      id: "take-screenshot-windows",
      entry: new URL("./scripts/take_screenshot_windows.mjs", import.meta.url),
      target: "scripts/take_screenshot_windows.mjs",
      runtime: "node",
      bundle: false,
      description: "Script take_screenshot_windows.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for screenshot.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "screenshot-small",
      source: new URL("./assets/screenshot-small.svg", import.meta.url),
      target: "assets/screenshot-small.svg",
    }),
    defineAsset({
      id: "screenshot",
      source: new URL("./assets/screenshot.png", import.meta.url),
      target: "assets/screenshot.png",
    })
  ],
});
