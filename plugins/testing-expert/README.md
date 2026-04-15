# testing-expert

测试专家插件，覆盖 TDD 工作流、测试策略设计、预落地审查、Web 应用测试、测试用例头脑风暴和基准测试设计。

## Skills

| Skill | 用途 |
|-------|------|
| `test-driven-development` | TDD 工作流（Red-Green-Refactor） |
| `test-strategy` | 生产级测试策略（风险/覆盖率/质量门/资源权衡） |
| `testing-strategy` | 常规测试计划设计与分层建议 |
| `test-brainstorm` | Bug 发现后测试用例头脑风暴 |
| `six-thinking-hats` | 六顶思考帽多维测试方法论 |
| `pre-landing-review` | 代码变更落地前安全审计 |
| `webapp-testing` | Playwright Web 应用交互测试 |
| `benchmark-runner` | 算法/模型/实现基准测试设计 |
| `brutal-honesty-review` | 无糖衣代码/测试质量审查 |

## 结构

```text
testing-expert/
├── .claude-plugin/plugin.json
├── hooks/
│   ├── hooks.json
│   └── dispatch.mjs
└── skills/
```

## 校验

```bash
node --check hooks/dispatch.mjs
bash -n skills/brutal-honesty-review/scripts/assess-code.sh
bash -n skills/brutal-honesty-review/scripts/assess-tests.sh
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/testing-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install testing-expert@ai-experts
claude plugin install testing-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall testing-expert
claude plugin uninstall testing-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
