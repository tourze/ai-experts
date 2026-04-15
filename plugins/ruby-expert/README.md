# ruby-expert

Ruby 开发专家插件，覆盖 Ruby / Rails / RSpec / Bundler / Rake 工作流，以及 `Edit|Write` 后的语法、调试语句、编码和文件预算守卫。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 4 个 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：Ruby 开发与 RSpec 测试技能文档。
- `tests/`：manifest、dispatch、hook、脚本文档回归测试。

## Skills

| Skill | 用途 |
|-------|------|
| `ruby-expert` | Ruby / Rails 业务代码组织、事务边界、Bundler / Rake 工作流 |
| `rspec-testing` | RSpec service spec、request spec、时间控制与依赖隔离 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-ruby` | 对 `.rb` / `.rake` / `.gemspec` / `Gemfile` / `Rakefile` 等执行 `ruby -c` |
| PostToolUse Edit\|Write | `debug-statement-guard` | `binding.pry` / `binding.irb` / `byebug` / `debugger` / `puts` / `pp` 检测 |
| PostToolUse Edit\|Write | `encoding-guard` | 检查 Ruby 相关文本文件与点文件的 BOM / 非 UTF-8（含 `.ruby-version` / `Gemfile` / `Rakefile` 等） |
| PostToolUse Edit\|Write | `file-budget-guard` | Ruby 源文件与 `Rakefile` / `config.ru` 等命名文件的行数预算与棘轮治理 |

## 验证命令

在仓库根目录执行：

```bash
python3 -m json.tool plugins/ruby-expert/.claude-plugin/plugin.json >/dev/null
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
