import {
  defineCliProcedure,
  defineProcedureOutput,
  runtimeProcedureOutput,
  type RuntimeProcedureResult,
  procedureEntry,
} from "../../definition";

export const procedure = defineCliProcedure({
  id: "debug-methodology-debug-checklist",
  entry: procedureEntry(import.meta.url),
  description: "根据问题标题生成六步调试检查清单骨架。",
  owners: { skillIds: ["debug-methodology"] },
  params: [
    {
      flag: "--title",
      type: "字符串",
      description: "问题标题",
      required: false,
    },
    {
      flag: "--symptom",
      type: "字符串",
      description: "问题现象描述",
      required: false,
    },
  ],
  output: defineProcedureOutput<RuntimeProcedureResult>({
    typeName: "MarkdownChecklist",
    fields: runtimeProcedureOutput.fields,
  }),

  exampleArgs: { args: ["--title", "fixture-checklist"] },
});

export function main(argv: readonly string[]): any {
  type ChecklistOptions = {
    title: string;
    symptom?: string;
  };
  function parseArgs(argv: readonly string[]): ChecklistOptions {
    const options: ChecklistOptions = { title: "未命名问题" };
    for (let index = 0; index < argv.length; index += 1) {
      const arg = argv[index];
      if ((arg === "--title" || arg === "-t") && argv[index + 1]) {
        options.title = argv[index + 1];
        index += 1;
      } else if ((arg === "--symptom" || arg === "-s") && argv[index + 1]) {
        options.symptom = argv[index + 1];
        index += 1;
      }
    }
    return options;
  }
  function renderChecklist(options: ChecklistOptions): string {
    const symptom = options.symptom ? `\n\n现象：${options.symptom}` : "";
    return `# Debug Checklist: ${options.title}${symptom}

## 1. 复现
- [ ] 复现命令：
- [ ] 期望行为：
- [ ] 实际行为：
- [ ] 环境差异：

## 2. 隔离
- [ ] 已确认最小输入：
- [ ] 已缩小模块/函数：
- [ ] 已排除无关变量：

## 3. 假设
- [ ] 假设 A：
- [ ] 假设 B：
- [ ] 假设 C：

## 4. 验证
- [ ] 每次只验证一个假设：
- [ ] 证据命令和输出摘要：

## 5. 修复
- [ ] 根因：
- [ ] 最小修复：
- [ ] 风险：

## 6. 回归测试
- [ ] 新增/更新测试：
- [ ] 已运行验证命令：
`;
  }
  console.log(renderChecklist(parseArgs(argv)));
}
