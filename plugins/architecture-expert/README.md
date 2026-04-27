# architecture-expert

面向架构设计、评审、重构和技术债治理的插件，提供一组架构分析技能、插件级 hook 入口和回归测试。

## 目录结构

- `hooks/`：`hooks.json` 与 `dispatch.mjs`。
- `skills/`：架构、设计、重构、计划与债务治理技能。
- `tests/`：脚本级回归测试，覆盖 `scan_codebase.mjs`。

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
| `cross-platform-adapter-patterns` | 设计跨平台抽象层、适配器接口与运行时分支 |
| `ddia-systems` | 用 DDIA 思路设计数据系统 |
| `error-handling-patterns` | 设计异常传播、重试边界与错误分层 |
| `feature-dev` | 处理跨文件实现且涉及架构取舍的功能开发 |
| `hierarchical-matching-systems` | 设计和评审层级匹配、实体解析与最优分配系统 |
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
| `persistent-planning` | 在多轮、跨 session 的复杂任务中，把计划、发现和进度持久化到仓库文件而不是 TodoWrite 时使用。 |
| `agent-tool-design` | 设计 AI Agent 工具接口：安全元数据、双描述、延迟加载、结果预算与 token 经济 |
| `agent-permission-safety` | 设计 Agent 权限系统：三阶段管道、信任谱系、fail-closed、规则+AI 分类 |
| `agent-orchestration` | 多 Agent 编排：system prompt 架构、fork/fresh 决策、状态管理、扩展点 |
| `brainstorming-before-coding` | 在任何创造性工作之前必须使用——创建功能、构建组件、添加新行为或修改架构。通过对话探索用户意图、需求和设计，在动手前达成共识。 |

## 安装 / 卸载

由仓库根目录的 `./scripts/install.sh` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
node --check hooks/dispatch.mjs
node --check skills/architecture-reviewer/scripts/scan_codebase.mjs
python3 -m unittest tests/test_scan_codebase.py
```
