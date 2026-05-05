import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { ethicalHackingMethodologySkill } from "../ethical-hacking-methodology/index";
import { fridaDynamicAnalysisSkill } from "../frida-dynamic-analysis/index";

export const androidApkAuditSkill = defineSkill({
  id: "android-apk-audit",
  fullName: "Android APK 安全审计专家",
  description:
    "当需要对 Android APK 做 Manifest 配置审查、Frida 动态分析、DEX dump 或 jadx/apktool 端到端安全审计时使用。",
  useCases: [
    "用户提供 APK、DEX、smali、JADX 输出或 APKTool 解包目录，需要做授权安全审计。",
    "用户要求 Android 移动渗透测试、APK 漏洞评估、OWASP MASVS/MASTG 映射或 CVSS 报告。",
    "用户需要串联 [apktool](references/apktool.md)、[jadx](references/jadx.md)、`frida-dynamic-analysis` 和 [dex-dumper](references/dex-dumper.md)。",
    "用户提到 exported component、Intent injection、deep link abuse、WebView、SSL pinning、root/RASP 检测、硬编码密钥或 APK 重打包。",
    "Manifest 配置下钻使用 [android-manifest-security](references/android-manifest-security.md)；Intent/deep link 下钻使用 `intent-deeplink-abuse`；Frida 脚本选型使用 [android-frida-script-catalog](references/android-frida-script-catalog.md)。",
  ],
  constraints: [
    "只在用户确认授权的目标上执行测试；目标和包名不清时先收敛范围。",
    "保留原始 APK、签名、版本号和 SHA-256；所有输出写入独立工作目录。",
    "禁止把裸 grep 命中直接写成漏洞；必须回到调用链、组件入口或运行时证据。",
    "搜索优先限制在应用命名空间，第三方库命中只作为线索，避免库噪声误报。",
    "静态证据不闭合时标为“需要动态确认”，不要用业务侧猜测补齐证据。",
    "每个有效发现必须给出攻击入口、传播路径、危险 sink、PoC 和修复建议。",
  ],
  checklist: [
    "Manifest 与资源层审计是否覆盖 exported、permission、deep link、FileProvider、backup、debuggable、network security config。",
    "JADX 与 smali 是否交叉验证关键逻辑，避免反编译伪代码误导。",
    "所有 grep 命中是否回到调用链，第三方库噪声是否排除。",
    "动态脚本是否围绕静态假设编写，而不是盲跑通用 bypass。",
    "报告是否区分已确认、可能存在和需要动态确认。",
  ],
  relatedSkills: [
    {
      get id() {
        return fridaDynamicAnalysisSkill.id;
      },
      reason: "用户需要串联 apktool、jadx、`frida-dynamic-analysis` 和 dex-dumper。",
    },
    {
      get id() {
        return ethicalHackingMethodologySkill.id;
      },
      label: "intent-deeplink-abuse",
      reason: "Manifest 配置下钻使用 android-manifest-security；Intent/deep link 下钻使用 `intent-deeplink-abuse`；Frida 脚本选型使用 android-frida-script-catalog。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "字符串命中即报：问题：测试代码、第三方库、无效占位符和运行时未使用常量都会制造误报。",
      pass: "命中后闭合证据链：回到定义、条件分支、调用点和网络层使用位置；无法证明运行时使用时标为需要动态确认。",
    }),
    defineAntiPattern({
      fail: "盲跑通用 Frida 脚本：问题：脚本成功加载不等于 pinning 已绕过，也不能证明漏洞存在。",
      pass: "静态定位后精准 hook：确认具体类、方法签名和调用路径后再写 hook，并用代理流量或日志证明行为变化。",
    }),
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
      summary: "Frida 脚本模板与常用 hook 代码片段。",
      loadWhen:
        "需要使用 Frida 进行动态分析或编写 hook 脚本时读取。",
    }),
    defineReference({
      id: "android-manifest-security",
      source: new URL(
        "./references/android-manifest-security.md",
        import.meta.url,
      ),
      target: "references/android-manifest-security.md",
      title: "android-manifest-security.md",
      summary: "Android Manifest 权限、组件导出与安全配置审计要点。",
      loadWhen:
        "需要审计 AndroidManifest 安全配置或检查组件暴露面时读取。",
    }),
    defineReference({
      id: "apktool",
      source: new URL("./references/apktool.md", import.meta.url),
      target: "references/apktool.md",
      title: "apktool.md",
      summary: "Apktool 解包、重打包与资源反编译操作指南。",
      loadWhen:
        "需要反编译 APK 或修改资源文件时读取。",
    }),
    defineReference({
      id: "dex-dumper",
      source: new URL("./references/dex-dumper.md", import.meta.url),
      target: "references/dex-dumper.md",
      title: "dex-dumper.md",
      summary: "DEX 文件结构与脱壳工具使用指南。",
      loadWhen:
        "需要从内存中提取 DEX 或分析加壳保护时读取。",
    }),
    defineReference({
      id: "jadx",
      source: new URL("./references/jadx.md", import.meta.url),
      target: "references/jadx.md",
      title: "jadx.md",
      summary: "Jadx 反编译器使用技巧与反混淆策略。",
      loadWhen:
        "需要将 DEX/APK 反编译为可读 Java 源码时读取。",
    }),
  ],
});
