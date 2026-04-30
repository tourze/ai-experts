# windows-expert

Windows 专家能力，覆盖带安全边界的桌面自动化、Windows 内核分析，以及通过 Parallels Desktop 控制 Windows / Linux 客体。

## 结构

- `skills/`：Windows UIA、内核安全、Parallels `prlctl` 控制等技能目录。
- `tests/`：技能文档、脚本语法与 `prlctl_helper.mjs` 运行时回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `prlctl-vm-control` | 使用 `prlctl` 枚举、定位、控制 Parallels Desktop 虚拟机并在客体执行命令 |
| `windows-kernel-security` | Windows 内核对象、回调、VBS/HVCI、驱动边界与代码路径分析 |
| `windows-ui-automation` | 带权限分层与阻断策略的 UIA/Win32 桌面自动化 |

## Agents

| Agent | 用途 |
|-------|------|
| `windows-platform-reviewer` | 只读审查 Windows 平台代码，覆盖内核安全、UIA / Win32 桌面自动化与 Parallels VM 编排 |

## 运行时依赖

- 通用：`node`
- `prlctl-vm-control`：macOS + Parallels Desktop CLI `prlctl`
- `windows-ui-automation`：只在 Windows 环境真实执行 UIA / Win32 自动化代码

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证

```bash
node --check plugins/windows-expert/skills/prlctl-vm-control/scripts/prlctl_helper.mjs
node --test plugins/windows-expert/tests/*.test.mjs
```
