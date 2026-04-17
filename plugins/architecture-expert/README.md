# architecture-expert

面向架构设计、评审、重构和技术债治理的插件，提供一组架构分析技能、插件级 hook 入口和回归测试。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：架构、设计、重构、计划与债务治理技能。
- `tests/`：脚本级回归测试，覆盖 `scan_codebase.sh` 与 `complexity_report.py`。

## Agents

| Agent | 用途 |
|-------|------|
| `codebase-analyst` | 只读架构分析：模块边界映射、依赖图追踪、分层违规检测、结构健康评分 |

## Skills

| Skill | 用途 |
|-------|------|
| `api-trace-reader` | 只读追踪接口、任务、事件与定时任务调用链 |
| `architecture-blueprint-generator` | 从现有代码库生成可维护架构蓝图 |
| `architecture-diagram` | 生成自包含 HTML 架构图 |
| `architecture-reviewer` | 评审架构、文档或代码库的设计质量 |
| `backend-to-frontend-handoff-docs` | 为前后端协作输出接口交接文档 |
| `code-refiner` | 在不改行为前提下简化代码和复杂度 |
| `cross-platform-adapter-patterns` | 设计跨平台抽象层、适配器接口与运行时分支 |
| `ddia-systems` | 用 DDIA 思路设计数据系统 |
| `error-handling-patterns` | 设计异常传播、重试边界与错误分层 |
| `exhaustive-systems-analysis` | 对系统做穷举式拆解与问题审计 |
| `feature-dev` | 处理跨文件实现且涉及架构取舍的功能开发 |
| `hierarchical-matching-systems` | 设计和评审层级匹配、实体解析与最优分配系统 |
| `managing-tech-debt` | 制定技术债治理策略与改造路线图 |
| `plan-review` | 在编码前审查实现计划、RFC 与风险假设 |
| `pragmatic-programmer` | 用务实工程原则校准设计与协作方式 |
| `protocol-freezing-patterns` | 管理协议冻结、版本协商与向后兼容演进 |
| `refactoring-patterns` | 用命名化重构动作改善结构且不改行为 |
| `seam-ripper` | 审视模块接缝、接口边界与抽象泄漏 |
| `software-design-philosophy` | 从复杂度、深模块和信息隐藏角度评估设计 |
| `system-design` | 设计系统、服务、存储、接口与边界 |
| `task-decomposer` | 将需求拆成带依赖与测试策略的任务板 |
| `tech-debt` | 盘点代码健康状况并排序技术债 |
| `waterfall-elimination` | 消除请求瀑布流并行化数据获取与 Suspense 边界 |

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
