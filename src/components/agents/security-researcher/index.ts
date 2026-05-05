import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { androidApkAuditSkill } from "../../skills/android-apk-audit/index";
import { binaryAnalysisPatternsSkill } from "../../skills/binary-analysis-patterns/index";
import { chipsecSkill } from "../../skills/chipsec/index";
import { fridaDynamicAnalysisSkill } from "../../skills/frida-dynamic-analysis/index";
import { idapythonScriptingSkill } from "../../skills/idapython-scripting/index";
import { iosBinaryAnalysisSkill } from "../../skills/ios-binary-analysis/index";
import { iosSecretScanSkill } from "../../skills/ios-secret-scan/index";
import { memoryForensicsSkill } from "../../skills/memory-forensics/index";
import { protocolReverseEngineeringSkill } from "../../skills/protocol-reverse-engineering/index";
import { unicornEmulationSkill } from "../../skills/unicorn-emulation/index";
import { wiresharkAnalysisSkill } from "../../skills/wireshark-analysis/index";
import { ethicalHackingMethodologySkill } from "../../skills/ethical-hacking-methodology/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const securityResearcherAgent = defineAgent({
  id: "security-researcher",
  description: "当需要对二进制、固件、移动应用或网络流量做深度安全研究时使用——覆盖静态反汇编、动态 hook、内存取证、协议逆向和模拟执行。只读分析，产出研究报告与漏洞证据。",
  role: `你是资深安全研究员。你只读取、搜索和分析目标文件、固件镜像、二进制产物和抓包数据，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: androidApkAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: androidApkAuditSkill.description,
    },
    {
      id: binaryAnalysisPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: binaryAnalysisPatternsSkill.description,
    },
    {
      id: chipsecSkill.id,
      mode: SkillUseMode.Preload,
      reason: chipsecSkill.description,
    },
    {
      id: fridaDynamicAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: fridaDynamicAnalysisSkill.description,
    },
    {
      id: idapythonScriptingSkill.id,
      mode: SkillUseMode.Preload,
      reason: idapythonScriptingSkill.description,
    },
    {
      id: iosBinaryAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: iosBinaryAnalysisSkill.description,
    },
    {
      id: iosSecretScanSkill.id,
      mode: SkillUseMode.Preload,
      reason: iosSecretScanSkill.description,
    },
    {
      id: memoryForensicsSkill.id,
      mode: SkillUseMode.Preload,
      reason: memoryForensicsSkill.description,
    },
    {
      id: protocolReverseEngineeringSkill.id,
      mode: SkillUseMode.Preload,
      reason: protocolReverseEngineeringSkill.description,
    },
    {
      id: unicornEmulationSkill.id,
      mode: SkillUseMode.Preload,
      reason: unicornEmulationSkill.description,
    },
    {
      id: wiresharkAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: wiresharkAnalysisSkill.description,
    },
    {
      id: ethicalHackingMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: ethicalHackingMethodologySkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
