import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";
import { fridaDynamicAnalysisSkill } from "../frida-dynamic-analysis/index";

export const unicornEmulationSkill = defineSkill({
  id: "unicorn-emulation",
  fullName: "Unicorn 模拟执行",
  description: "当需要用 Unicorn 引擎模拟执行特定函数、绕过环境依赖或离线调试加密/解密算法时使用。",
  useCases: [
    "需要在无完整运行环境下执行特定函数（解密、哈希、校验）。",
    "需要绕过 JNI、syscall、libc 等环境依赖做算法还原。",
    "需要先静态理解函数边界、调用约定和外部依赖，再离线模拟验证。",
    "需要在真机动态观察和离线模拟执行之间交叉确认。",
  ],
  constraints: [
    "先裸加载文件映射内存，不要解析 ELF/PE 头——只模拟目标函数，不是整个程序。",
    "先识别外部调用依赖（JNI/libc/syscall），用 hook 模拟返回值。",
    "优先用 `UC_HOOK_BLOCK` 做块级 trace，`UC_HOOK_CODE` 只用在小范围。",
    "崩溃时读 callback 输出诊断，不要盲目重跑。",
  ],
  relatedSkills: [
    {
      get skill() {
        return fridaDynamicAnalysisSkill;
      },
      reason: "需要用真机动态观察补齐参数、返回值、JNI 或系统调用行为时联动。",
    },
    {
      get skill() {
        return binaryAnalysisPatternsSkill;
      },
      reason: "需要先静态定位函数边界、调用约定、导入依赖和关键数据结构时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "解析完整 ELF 再映射所有段",
      pass: "裸加载 + 按需映射",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先静态确认架构、基址、目标函数范围、调用约定、参数位置、返回寄存器和外部依赖。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "裸加载目标代码并按需映射内存；不要试图完整解析和运行整个 ELF/PE。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "为 libc、JNI、syscall、C++ runtime 等外部调用写 stub 或 hook，返回最小可信值。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "用块级 trace 定位崩溃；未映射 fetch 补代码映射，未映射 read 补数据或 hook，命中 import stub 就补模拟实现。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "死循环加计数器和超时阈值；每轮记录 crash callback、修复点、输入、输出和剩余未模拟依赖。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "架构速查：UC_ARCH/模式、SP、LR/返回地址、参数寄存器、返回寄存器和 syscall 入口寄存器。",
      "映射计划、目标函数地址范围、输入内存布局、stub/hook 清单和 trace 策略。",
      "迭代调试记录：崩溃类型、修复动作、模拟输出、未覆盖环境依赖和需要 Frida/静态分析补证的点。",
    ],
  }),
});
