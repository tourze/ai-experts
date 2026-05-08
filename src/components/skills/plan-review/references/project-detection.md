# 项目检测参考

与框架无关的项目检测模式，用于识别测试命令、包管理器、版本策略、框架、monorepo 配置和 CI/CD 系统。

---

## 测试命令解析

按顺序检查以下文件来检测项目的测试命令：

| 检查 | 文件 | 条件 | 命令 |
| ----- | ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| 1 | `Makefile` | 有 `test:` 目标 | `make test` |
| 2 | `package.json` | 有 `scripts.test` | `{pkg-manager} run test` |
| 3 | `pyproject.toml` | 有 `[tool.pytest]` 或 `pytest` 依赖 | `uv run pytest`（如果有 `uv.lock`），`poetry run pytest`（如果有 `poetry.lock`），`pytest` |
| 4 | `Cargo.toml` | 存在 | `cargo test` |
| 5 | `go.mod` | 存在 | `go test ./...` |
| 6 | `Gemfile` + `Rakefile` | 有 `test` 任务 | `bundle exec rake test` |
| 7 | `mix.exs` | 存在 | `mix test` |
| 8 | `build.gradle` / `build.gradle.kts` | 存在 | `./gradlew test` |
| 9 | `pom.xml` | 存在 | `mvn test` |

如果多个匹配，优先选择排序靠前的。如果 `Makefile` 存在且包含 `test` 目标，则始终以它为准——项目使用 Makefile 来包装实际的测试命令。

---

## 包管理器检测

根据锁定文件检测（最具体的优先）：

| 锁定文件 | 包管理器 | 运行命令 |
| ------------------- | --------------- | ------------- |
| `pnpm-lock.yaml` | pnpm | `pnpm run` |
| `bun.lockb` | bun | `bun run` |
| `yarn.lock` | yarn | `yarn run` |
| `package-lock.json` | npm | `npm run` |
| `uv.lock` | uv | `uv run` |
| `poetry.lock` | poetry | `poetry run` |
| `Pipfile.lock` | pipenv | `pipenv run` |
| `Cargo.lock` | cargo | `cargo` |
| `go.sum` | go modules | `go` |
| `Gemfile.lock` | bundler | `bundle exec` |
| `mix.lock` | mix | `mix` |

如果没有锁定文件：回退到清单文件检测（`package.json` → npm，`pyproject.toml` → 检查 `[tool.poetry]` 或默认使用 uv）。

---

## 版本策略检测

按顺序检查：

| 策略 | 检测方式 | 读取 | 写入 |
| ---------------- | -------------------------------------------------- | -------------------------------- | -------------------------------------- |
| `VERSION` 文件 | 仓库根目录下名为 `VERSION` 的文件 | 读取内容 | 写入新版本 |
| `package.json` | 有 `version` 字段 | `jq -r .version package.json` | `jq '.version = "X.Y.Z"' package.json` |
| `pyproject.toml` | 有 `[project] version` 或 `[tool.poetry] version` | 解析 TOML | 更新 TOML |
| `Cargo.toml` | 有 `[package] version` | 解析 TOML | 更新 TOML（+ `Cargo.lock`） |
| `mix.exs` | 项目配置中有 `version:` | 正则提取 | 正则替换 |
| 仅 Git 标签 | 无版本文件，但存在 `v*` 标签 | `git describe --tags --abbrev=0` | `git tag vX.Y.Z` |

对于 PATCH 版本更新：自动增加。对于 MINOR 或 MAJOR 更新：需要明确确认。

---

## 框架检测

通过分析依赖和配置文件来检测：

### Python

| 框架 | 检测方式 |
| --------- | --------------------------------------------- |
| Django | `django` 在依赖中，`manage.py` 存在 |
| FastAPI | `fastapi` 在依赖中 |
| Flask | `flask` 在依赖中 |
| Starlette | `starlette` 在依赖中（不含 FastAPI） |

### JavaScript/TypeScript

| 框架 | 检测方式 |
| -------------- | -------------------------------------------------- |
| Next.js | `next` 在依赖中，`next.config.*` 存在 |
| Remix | `@remix-run/node` 在依赖中 |
| SvelteKit | `@sveltejs/kit` 在依赖中 |
| Nuxt | `nuxt` 在依赖中 |
| Express | `express` 在依赖中（不含元框架） |
| Astro | `astro` 在依赖中 |
| Vite（库） | `vite` 在依赖中（不含元框架） |

### Ruby

| 框架 | 检测方式 |
| --------- | --------------------------------------------- |
| Rails | `rails` 在 Gemfile 中，`config/routes.rb` 存在 |
| Sinatra | `sinatra` 在 Gemfile 中 |

### Go

| 框架 | 检测方式 |
| ---------------- | -------------------------------------- |
| Gin | `github.com/gin-gonic/gin` 在 `go.mod` 中 |
| Echo | `github.com/labstack/echo` 在 `go.mod` 中 |
| Chi | `github.com/go-chi/chi` 在 `go.mod` 中 |
| 标准库 | 无框架依赖 |

### Rust

| 框架 | 检测方式 |
| --------- | --------------------------- |
| Actix-web | `actix-web` 在 `Cargo.toml` 中 |
| Axum | `axum` 在 `Cargo.toml` 中 |
| Rocket | `rocket` 在 `Cargo.toml` 中 |

### 框架默认端口

| 框架 | 默认端口 |
| ------------- | ------------ |
| Next.js | 3000 |
| Remix | 3000 |
| SvelteKit | 5173 |
| Nuxt | 3000 |
| Vite | 5173 |
| Express | 3000 |
| Django | 8000 |
| FastAPI | 8000 |
| Flask | 5000 |
| Rails | 3000 |
| Phoenix | 4000 |
| Go（常见） | 8080 |
| Rust（常见） | 8080 |

---

## Monorepo 检测

| 信号 | 工具 | 配置 |
| ----------------------------------------- | -------------------- | ----------------------------------------- |
| `pnpm-workspace.yaml` | pnpm workspaces | `packages:` 数组列出工作区通配符 |
| `turbo.json` | Turborepo | `pipeline:` 定义任务依赖 |
| `nx.json` | Nx | `targetDefaults:` 定义构建图 |
| `lerna.json` | Lerna | `packages:` 数组列出包位置 |
| `[workspace]` 在 `Cargo.toml` 中 | Cargo workspaces | `members:` 数组列出 crate 路径 |
| `go.work` | Go workspaces | `use` 指令列出模块路径 |
| `settings.gradle` / `settings.gradle.kts` | Gradle 多项目 | `include` 语句列出子项目 |

对于 monorepo，当指定了路径时，将操作范围限定到相关工作区/包。

---

## CI/CD 检测

| 路径 | 系统 |
| ------------------------- | ------------------------------ |
| `.github/workflows/*.yml` | GitHub Actions |
| `.gitlab-ci.yml` | GitLab CI |
| `Jenkinsfile` | Jenkins |
| `.circleci/config.yml` | CircleCI |
| `bitbucket-pipelines.yml` | Bitbucket Pipelines |
| `.travis.yml` | Travis CI |
| `azure-pipelines.yml` | Azure DevOps |
| `.buildkite/pipeline.yml` | Buildkite |
| `Taskfile.yml` | Task（非 CI，是任务运行器） |

---

## 更新日志检测

| 文件 | 格式 |
| -------------- | ------------------------------ |
| `CHANGELOG.md` | Keep a Changelog（最常见） |
| `CHANGES.md` | 变体命名 |
| `HISTORY.md` | 变体命名 |
| `NEWS.md` | GNU 风格 |
| 无 | 跳过更新日志更新 |

Keep a Changelog 格式：

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

### Changed

### Fixed

### Removed
```
