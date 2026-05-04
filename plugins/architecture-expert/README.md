# architecture-expert

面向架构设计、评审、重构和技术债治理的专家能力，提供一组架构分析技能与回归测试。

## 目录结构

- `skills/`：架构、设计、重构、计划与债务治理技能。
- `tests/`：架构分析回归测试。

## Agents

| Agent | 用途 |
|-------|------|
| `codebase-analyst` | 只读架构分析：模块边界映射、依赖图追踪、分层违规检测、结构健康评分 |
| `architecture-designer` | 当需要从零设计系统架构、服务接口、数据流和部署拓扑时使用——覆盖需求澄清、高层方案、协议版本化、跨平台适配和任务拆解。可以在用户指定目录下创建架构设计文档。 |
| `refactor-planner` | 既有代码重构计划：坏味识别、接缝定位、可独立验证步骤拆分与 PR 切片 |

## Skills

| Skill | 用途 |
|-------|------|
| `api-trace-reader` | 只读追踪接口、任务、事件与定时任务调用链 |
| `architecture-design-workflow` | 端到端架构设计三阶段工作流：需求澄清 → 方案设计（ADR + 假设管理） → 落地拆解 |
| `architecture-reviewer` | 评审架构、文档或代码库的设计质量 |
| `backend-to-frontend-handoff-docs` | 为前后端协作输出接口交接文档 |
| `cross-platform-adapter-patterns` | 设计跨平台抽象层、适配器接口与运行时分支 |
| `software-design` | 语言无关的通用设计原则与架构模式：分层、组合优于继承、构造注入、薄控制器、复杂度管理、深模块、信息隐藏 |
| `concurrency-patterns` | 语言无关的通用并发原则：不阻塞、限制并发、传播取消、不共享可变状态、超时 |
| `error-handling-patterns` | 语言无关的通用错误处理：三层模型、重试边界、部分失败、错误映射 |
| `feature-dev` | 处理跨文件实现且涉及架构取舍的功能开发 |
| `hierarchical-matching-systems` | 设计和评审层级匹配、实体解析与最优分配系统 |
| `plan-review` | 在编码前审查实现计划、RFC 与风险假设 |
| `pragmatic-programmer` | 用务实工程原则校准设计与协作方式 |
| `protocol-freezing-patterns` | 管理协议冻结、版本协商与向后兼容演进 |
| `refactor-planning-method` | 当需要为既有代码制定系统化重构计划时使用；提供基线建立、多视角问题验证、接缝识别和增量拆步的完整方法论。 |
| `refactoring-patterns` | 用命名化重构动作改善结构且不改行为 |
| `system-design` | 设计系统、服务、存储、接口与边界 |
| `task-decomposer` | 将需求拆成带依赖与测试策略的任务板 |
| `tech-debt` | 盘点代码健康状况并排序技术债 |
| `agent-orchestration` | 多 Agent 编排：system prompt 架构、fork/fresh 决策、状态管理、扩展点 |
| `brainstorming-before-coding` | 在任何创造性工作之前必须使用——创建功能、构建组件、添加新行为或修改架构。通过对话探索用户意图、需求和设计，在动手前达成共识。 |
| `codebase-architecture-analysis` | 系统化分析代码库模块边界、依赖图、分层违规与结构健康度，产出量化的优先改进路线图 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
python3 -m unittest tests/test_scan_codebase.py
```
