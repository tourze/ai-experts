# ruby-expert

Ruby 开发专家能力，覆盖 Ruby / Rails / RSpec / Bundler / Rake 工作流，以及 `Edit|Write` 后的语法、调试语句和文件预算守卫。

## 目录结构

- `hooks/`：4 个 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：Ruby 开发与 RSpec 测试技能文档。
- `tests/`：hook 与文档回归测试。

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

通用 BOM / UTF-8 编码检查和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 验证命令

在仓库根目录执行：

```bash
find plugins/ruby-expert/hooks plugins/ruby-expert/tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test plugins/ruby-expert/tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。
