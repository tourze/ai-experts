# ruby-expert

Ruby 开发专家插件，覆盖 Ruby / Rails / RSpec / Bundler / Rake 工作流，以及 `Edit|Write` 后的语法、调试语句和文件预算守卫。

## 目录结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 与 2 个 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：Ruby 开发与 RSpec 测试技能文档。
- `tests/`：manifest、dispatch、hook、脚本文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `rails-service-patterns` | Rails service/command object、Active Record 查询与事务、bundle exec 工作流 |
| `rspec-testing` | RSpec service spec、request spec、时间控制与依赖隔离 |

## Agents

| Agent | 用途 |
|-------|------|
| `ruby-reviewer` | perform a Ruby-specific code review |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-ruby` | 对 `.rb` / `.rake` / `.gemspec` / `Gemfile` / `Rakefile` 等执行 `ruby -c` |
| PostToolUse Edit\|Write | `debug-statement-guard` | `binding.pry` / `binding.irb` / `byebug` / `debugger` / `puts` / `pp` 检测 |

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 验证命令

在仓库根目录执行：

```bash
python3 -m json.tool plugins/ruby-expert/hooks/hooks.json >/dev/null
find plugins/ruby-expert/hooks plugins/ruby-expert/tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test plugins/ruby-expert/tests/*.test.mjs
node plugins/ruby-expert/hooks/dispatch.mjs post-tool-use/edit-write </dev/null
printf '{not-json' | node plugins/ruby-expert/hooks/dispatch.mjs post-tool-use/edit-write
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/ruby-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install ruby-expert@ai-experts
claude plugin install ruby-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall ruby-expert
claude plugin uninstall ruby-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

运行时依赖：`node` 必需；`ruby` 用于 `syntax-ruby`。若本机缺少 Ruby 解释器，语法守卫会跳过，其他守卫仍可继续工作。
