import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { androidApkAuditSkill } from "../../skills/android-apk-audit/index.js";
import { binaryAnalysisPatternsSkill } from "../../skills/binary-analysis-patterns/index.js";
import { chipsecSkill } from "../../skills/chipsec/index.js";
import { fridaDynamicAnalysisSkill } from "../../skills/frida-dynamic-analysis/index.js";
import { idapythonScriptingSkill } from "../../skills/idapython-scripting/index.js";
import { iosBinaryAnalysisSkill } from "../../skills/ios-binary-analysis/index.js";
import { iosSecretScanSkill } from "../../skills/ios-secret-scan/index.js";
import { memoryForensicsSkill } from "../../skills/memory-forensics/index.js";
import { protocolReverseEngineeringSkill } from "../../skills/protocol-reverse-engineering/index.js";
import { unicornEmulationSkill } from "../../skills/unicorn-emulation/index.js";
import { wiresharkAnalysisSkill } from "../../skills/wireshark-analysis/index.js";
import { ethicalHackingMethodologySkill } from "../../skills/ethical-hacking-methodology/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const securityResearcherAgent = defineAgent({
  id: "security-researcher",
  description: "当需要对二进制、固件、移动应用或网络流量做深度安全研究时使用——覆盖静态反汇编、动态 hook、内存取证、协议逆向和模拟执行。只读分析，产出研究报告与漏洞证据。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: androidApkAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: binaryAnalysisPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: chipsecSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: fridaDynamicAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: idapythonScriptingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: iosBinaryAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: iosSecretScanSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: memoryForensicsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: protocolReverseEngineeringSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: unicornEmulationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: wiresharkAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: ethicalHackingMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
