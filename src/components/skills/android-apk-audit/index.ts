import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidApkAuditSkill = defineSkill({
  id: "android-apk-audit",
  fullName: "Android APK 安全审计",
  description: "当需要对 Android APK 做 Manifest 配置审查、Frida 动态分析、DEX dump 或 jadx/apktool 端到端安全审计时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "android-frida-script-catalog",
      source: new URL("./references/android-frida-script-catalog.md", import.meta.url),
      target: "references/android-frida-script-catalog.md",
      title: "android-frida-script-catalog.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "android-manifest-security",
      source: new URL("./references/android-manifest-security.md", import.meta.url),
      target: "references/android-manifest-security.md",
      title: "android-manifest-security.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "apktool",
      source: new URL("./references/apktool.md", import.meta.url),
      target: "references/apktool.md",
      title: "apktool.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dex-dumper",
      source: new URL("./references/dex-dumper.md", import.meta.url),
      target: "references/dex-dumper.md",
      title: "dex-dumper.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "jadx",
      source: new URL("./references/jadx.md", import.meta.url),
      target: "references/jadx.md",
      title: "jadx.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for android-apk-audit.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
