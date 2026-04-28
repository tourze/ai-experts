# webman-expert

Webman 框架专家插件，覆盖命名规范、自定义进程、WebSocket 和插件开发。

## Skills

| Skill | 用途 |
|-------|------|
| `webman-naming-conventions` | 目录大小写、接口后缀、Service 命名、命名空间对齐与 Repository 命名 |
| `webman-custom-processes` | 自定义进程声明、生命周期、Timer 定时器、Crontab 调度、事件循环与 crash-restart |
| `webman-websocket-patterns` | WebSocket 服务端/客户端、连接生命周期、心跳、频道广播与指数退避重连 |
| `webman-plugin-development` | 插件打包、Install.php、config 发布路径、Bootstrap 与插件进程声明 |

## Agents

| Agent | 用途 |
|-------|------|
| `webman-reviewer` | 只读审查 Webman 命名规范、自定义进程、WebSocket、插件机制以及 worker 长生命周期风险 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/webman-expert/hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/webman-expert/tests/*.test.mjs
```
