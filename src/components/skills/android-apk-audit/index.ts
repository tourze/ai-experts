import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidApkAuditSkill = defineSkill({
  id: "android-apk-audit",
  fullName: "Android APK 安全审计专家",
  description:
    "当需要对 Android APK 做 Manifest 配置审查、Frida 动态分析、DEX dump 或 jadx/apktool 端到端安全审计时使用。",
  useCases: [
    "用户提供 APK、DEX、smali、JADX 输出或 APKTool 解包目录，需要做授权安全审计。",
    "用户要求 Android 移动渗透测试、APK 漏洞评估、OWASP MASVS/MASTG 映射或 CVSS 报告。",
    "用户需要串联 [apktool](references/apktool.md)、[jadx](references/jadx.md)、[frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 和 [dex-dumper](references/dex-dumper.md)。",
    "用户提到 exported component、Intent injection、deep link abuse、WebView、SSL pinning、root/RASP 检测、硬编码密钥或 APK 重打包。",
    "Manifest 配置下钻使用 [android-manifest-security](references/android-manifest-security.md)；Intent/deep link 下钻使用 [intent-deeplink-abuse](../ethical-hacking-methodology/SKILL.md)；Frida 脚本选型使用 [android-frida-script-catalog](references/android-frida-script-catalog.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "android-frida-script-catalog",
      source: new URL(
        "./references/android-frida-script-catalog.md",
        import.meta.url,
      ),
      target: "references/android-frida-script-catalog.md",
      title: "android-frida-script-catalog.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "android-manifest-security",
      source: new URL(
        "./references/android-manifest-security.md",
        import.meta.url,
      ),
      target: "references/android-manifest-security.md",
      title: "android-manifest-security.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "apktool",
      source: new URL("./references/apktool.md", import.meta.url),
      target: "references/apktool.md",
      title: "apktool.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dex-dumper",
      source: new URL("./references/dex-dumper.md", import.meta.url),
      target: "references/dex-dumper.md",
      title: "dex-dumper.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "jadx",
      source: new URL("./references/jadx.md", import.meta.url),
      target: "references/jadx.md",
      title: "jadx.md",
      summary: "Reference material for android-apk-audit.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
