import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { phpXFeaturesSkill } from "../php-8x-features/index";
import { phpDesignPatternsSkill } from "../php-design-patterns/index";
import { phpTestingSkill } from "../php-testing/index";

export const phpTypeSafetySkill = defineSkill({
  id: "php-type-safety",
  fullName: "PHP 类型安全",
  description: "当用户要配置 PHPStan 或 Psalm、补 array shapes 和泛型标注、使用条件返回类型、做类型收窄或消除 mixed，以及新增、补写或重构 PHPDoc 时使用。",
  useCases: [
    "配置或提升 PHPStan / Psalm 的检查级别。",
    "为数组补 `array{key: type}` 结构或 `@template` 泛型标注。",
    "用条件返回类型、`@phpstan-assert` 或 `assert()` 做类型收窄。",
    "消除代码中的 `mixed`、`@var` 强转和 `@phpstan-ignore` 压制。",
    "为现有 PHP 代码补写或收敛 `/** */` 文档块。",
    "审查 PHPDoc 是否重复签名，或遗漏数组结构、异常、业务约束等关键信息。",
    "在框架代码、DTO、值对象、仓库与服务层中统一文档风格。",
  ],
  constraints: [
    "目标是 PHPStan level 9 / Psalm level 1；新项目直接拉到最高。",
    "数组必须标注元素类型：`array<string, int>`、`list<User>`、`array{id: int, name: string}`。",
    "`mixed` 只在真正无法确定类型时使用，不作为偷懒手段。",
    "`@var` 强转是最后手段；优先通过 assert、类型守卫或重构消除。",
    "`@phpstan-ignore` 每一处都要注释原因，禁止无理由压制。",
    "PHPDoc 默认先判断\"是否真的需要\"：签名已完整表达意图时省略。",
    "只记录类型系统无法表达的事实：数组元素类型、键约束、单位/范围、前置条件、副作用、异常原因。",
    "`@throws` 描述失败事实而不是模板句；优先写\"为什么会失败\"。",
    "`list<T>` 仅用于从 0 开始且连续的整数键，不任意收紧。",
  ],
  checklist: [
    "PHPStan / Psalm 配置文件存在且级别 ≥ 8。",
    "无裸 `array` 参数或返回值——都有结构或元素类型标注。",
    "所有 `@phpstan-ignore` 都附带原因注释。",
    "`mixed` 出现次数持续下降，每次审查都尝试消除。",
    "每个文档块都回答了\"签名之外新增了什么信息\"，删除冗余 PHPDoc。",
    "泛型/数组结构与实现一致，没有把普通数组误写成 `list<T>`。",
    "签名变化后同步清理陈旧注释。",
  ],
  relatedSkills: [
    {
      get id() {
        return phpDesignPatternsSkill.id;
      },
      reason: "需要把类型合同落实到 DTO、Repository、Service 或值对象边界时联动。",
    },
    {
      get id() {
        return phpTestingSkill.id;
      },
      reason: "类型守卫、断言、条件返回或复杂数组结构需要测试覆盖时联动。",
    },
    {
      get id() {
        return phpXFeaturesSkill.id;
      },
      reason: "PHP 8.x 原生类型、readonly、enum 或 attributes 可替代 PHPDoc 约束时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "@var 强转",
      pass: "assert 收窄",
    }),
    defineAntiPattern({
      fail: "无理由 ignore",
      pass: "标原因",
    }),
    defineAntiPattern({
      fail: "裸 array 返回",
      pass: "精确类型",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 PHPStan / Psalm 级别、裸 array / mixed 分布、公共 API 签名和框架类型约束。",
      "优先用原生签名表达参数、返回值和属性；PHPDoc 只补类型系统表达不了的信息。",
      "array shapes、list、泛型、条件返回和 assert 必须与实现和测试保持一致。",
      "常用标注速查读取 `type-annotation-cheatsheet`；基础模式读取 `patterns`；复杂泛型和条件返回读取 `advanced-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "静态分析级别、裸 array / mixed / ignore 风险和收敛顺序。",
      "array shape、list、泛型、assert、条件返回和 PHPDoc 改造建议。",
      "需要补的类型测试、CI 检查和陈旧注释清理。",
    ],
  }),
  references: [
    defineReference({
      id: "type-annotation-cheatsheet",
      source: new URL("./references/type-annotation-cheatsheet.md", import.meta.url),
      target: "references/type-annotation-cheatsheet.md",
      title: "PHP 类型标注速查",
      summary: "array shapes、list、泛型集合、条件返回和 phpstan assert 标注速查表。",
      loadWhen: "需要快速选择 PHPStan / Psalm PHPDoc 标注形式时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "PHP 类型安全高级模式，包括泛型标注、条件返回类型、类型收窄等进阶用法。",
      loadWhen: "需要处理 PHPStan/Psalm 高级类型标注或复杂类型收窄场景时读取。",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "PHP 类型标注基础模式，包括 array shapes、PHPDoc 规范、类型守卫等。",
      loadWhen: "需要查阅 PHP 类型标注的基础规范和常用模式时读取。",
    }),
  ],
});
