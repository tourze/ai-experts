import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const memorySafetyPatternsSkill = defineSkill({
  id: "memory-safety-patterns",
  fullName: "Memory Safety Patterns",
  description: "在编写或评审 C/C++ 系统代码、梳理资源所有权或修复内存安全问题时使用。",
  useCases: [
    "你在 C/C++ 里申请或持有资源：`FILE*`、socket、锁、堆内存、线程句柄、`new` 出来的对象。",
    "你在改老代码，想把“谁负责释放”从口头约定变成编译期约束。",
    "你在排查泄漏、双重释放、悬空指针、异常路径资源遗失。",
    "你在设计 C API / C++ 封装边界，需要明确 owning pointer、observer pointer、borrowed view。",
    "你在评审代码，怀疑 `shared_ptr`、裸指针或 cleanup 路径已经失控。",
  ],
  constraints: [
    "一个资源只能有一个清晰 owner。`shared_ptr` 不是“想不清楚时的默认答案”。",
    "裸指针默认视为 observer，不承担释放责任；表达所有权时优先 `std::unique_ptr`。",
    "资源获取和释放必须同层封装。谁 `open/create/alloc`，谁定义对应的析构或 cleanup 语义。",
    "C++ 代码默认要求异常安全：构造成功即建立不变量，析构不抛异常。",
    "C 代码不能把 cleanup 分支散落在多个 `return`；统一走 `goto cleanup` 或单出口销毁函数。",
    "当一个接口只读不拥有数据时，传 `std::span` / `std::string_view` / `const T&`，不要传拥有型容器副本。",
  ],
  checklist: [
    "每个资源是否都能回答“谁创建、谁释放、何时释放”。",
    "是否优先使用了 `std::unique_ptr`、栈对象、`std::lock_guard` 这类单 owner 结构。",
    "`shared_ptr` 是否真的是多方长期持有，而不是为了省事。",
    "反向引用、观察者、缓存指针是否降成了 `weak_ptr`、裸指针或 `std::reference_wrapper`。",
    "接口签名是否把 ownership 和 borrowing 区分清楚了。",
    "C 代码是否只有一个 cleanup 出口，并覆盖所有失败分支。",
    "析构函数是否保证不抛异常；移动后对象是否仍处于可析构状态。",
    "是否避免返回指向局部对象、临时缓冲区或失效容器元素的指针 / 引用。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "shared_ptr 当默认答案",
      pass: "单 owner + observer",
    }),
    defineAntiPattern({
      fail: "值传递表达只读借用",
      pass: "span 表达借用",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先为每个资源回答谁创建、谁释放、何时释放，区分 owner、observer 和 borrowed view。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "C++ 资源优先用 RAII、栈对象、`std::unique_ptr`、`std::lock_guard`；`shared_ptr` 只用于真实多方长期持有。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "只读连续数据用 `std::span`、`std::string_view` 或 `const T&`，不要用拥有型容器副本表达借用。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "循环引用用 `weak_ptr` 或 observer 打断；缓存、回调和反向引用不能偷偷延长生命周期。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "C 代码统一 `goto cleanup` 或单出口销毁函数，覆盖所有失败分支。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要共享所有权、C cleanup、Rust 对照或异常安全完整示例时读取 advanced-patterns。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "资源 ownership 表：资源、owner、borrower、释放点、异常/失败路径和移动后状态。",
      "接口签名建议：unique_ptr/shared_ptr/weak_ptr/span/string_view/reference/裸指针的使用理由。",
      "RAII/C cleanup 修复方案、泄漏/双重释放/悬空指针风险和需要 reference 支撑的复杂模式。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "C/C++ 内存安全的高级模式，包括 RAII 实践、智能指针选择、异常安全保证和所有权传递策略。",
      loadWhen: "需要深入理解所有权语义、设计资源管理封装或评审复杂生命周期场景时读取。",
    }),
  ],
});
