# architecture-expert

面向架构设计、评审、重构和技术债治理的插件，当前包含 22 个技能、1 套 hook 入口和 2 个回归测试。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：架构、设计、重构、计划与债务治理技能。
- `tests/`：脚本级回归测试，覆盖 `scan_codebase.sh` 与 `complexity_report.py`。

## Agents

| Agent | 用途 |
|-------|------|
| `codebase-analyst` | 只读架构分析：模块边界映射、依赖图追踪、分层违规检测、结构健康评分 |

## 核心能力

- 架构蓝图、架构图、架构评审、系统设计。
- 调用链追踪、穷举审计、接缝分析、层级匹配设计。
- 功能开发流程、计划评审、任务拆解、技术债治理。
- 代码精炼、重构模式、错误处理、设计哲学与务实工程原则。
- 跨平台适配器模式、协议冻结与演进策略。

## 安装

```bash
claude --plugin-dir /path/to/plugins/architecture-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install architecture-expert@ai-experts
claude plugin install architecture-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall architecture-expert
claude plugin uninstall architecture-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
node --check hooks/dispatch.mjs
python3 -m py_compile skills/code-refiner/scripts/complexity_report.py
bash -n skills/architecture-reviewer/scripts/scan_codebase.sh
python3 -m unittest tests/test_complexity_report.py tests/test_scan_codebase.py
```
