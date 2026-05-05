# windows-expert

Windows 与 Microsoft 生态专家能力，覆盖带安全边界的桌面自动化、Windows 内核分析、Parallels Desktop 控制 Windows / Linux 客体，以及 Microsoft Learn 文档检索与 SDK API/签名校验。

## 结构

- `skills/`：Windows UIA、内核安全、Parallels `prlctl` 控制等技能目录。
- `tests/`：技能文档、工具语法与运行时回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `microsoft-docs` | 查概念、教程、配置、配额、限制、最佳实践，以及 SDK/API 代码参考（含 `references/code-reference.md`） |
| `prlctl-vm-control` | 使用 `prlctl` 枚举、定位、控制 Parallels Desktop 虚拟机并在客体执行命令 |
| `windows-kernel-security` | Windows 内核对象、回调、VBS/HVCI、驱动边界与代码路径分析 |
| `windows-ui-automation` | 带权限分层与阻断策略的 UIA/Win32 桌面自动化 |

## Agents

| Agent | 用途 |
|-------|------|
| `microsoft-stack-engineer` | 只读审查 .NET / Azure / Microsoft SDK 代码，校验 API 签名、官方文档 alignment、配额、retry 与异步模式 |
| `windows-platform-reviewer` | 只读审查 Windows 平台代码，覆盖内核安全、UIA / Win32 桌面自动化与 Parallels VM 编排 |

## 运行时依赖

- 通用：`node`
- `prlctl-vm-control`：macOS + Parallels Desktop CLI `prlctl`
- `windows-ui-automation`：只在 Windows 环境真实执行 UIA / Win32 自动化代码

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --test plugins/windows-expert/tests/*.test.mjs
```
