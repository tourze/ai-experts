# UV 包管理器 — 高级参考

高级工作流，包括 Docker 集成、锁定文件管理、性能优化、工具对比、常见工作流、工具集成、故障排除、最佳实践、迁移指南和命令参考。

## 高级工作流

### 模式 12：Monorepo 支持

```bash
# 项目结构
# monorepo/
#   packages/
#     package-a/
#       pyproject.toml
#     package-b/
#       pyproject.toml
#   pyproject.toml (root)

# 根 pyproject.toml
[tool.uv.workspace]
members = ["packages/*"]

# 安装所有工作区包
uv sync

# 添加工作区依赖
uv add --path ./packages/package-a
```

### 模式 13：CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v2
        with:
          enable-cache: true

      - name: Set up Python
        run: uv python install 3.12

      - name: Install dependencies
        run: uv sync --all-extras --dev

      - name: Run tests
        run: uv run pytest

      - name: Run linting
        run: |
          uv run ruff check .
          uv run black --check .
```

### 模式 14：Docker 集成

```dockerfile
# Dockerfile
FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Run application
CMD ["uv", "run", "python", "app.py"]
```

**优化的多阶段构建：**

```dockerfile
# Multi-stage Dockerfile
FROM python:3.12-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies to venv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-editable

# Runtime stage
FROM python:3.12-slim

WORKDIR /app

# Copy venv from builder
COPY --from=builder /app/.venv .venv
COPY . .

# Use venv
ENV PATH="/app/.venv/bin:$PATH"

CMD ["python", "app.py"]
```

### 模式 15：锁定文件工作流

```bash
# 创建锁定文件 (uv.lock)
uv lock

# 从锁定文件安装（精确版本）
uv sync --frozen

# 更新锁定文件但不安装
uv lock --no-install

# 升级锁中的特定包
uv lock --upgrade-package requests

# 检查锁定文件是否最新
uv lock --check

# 将锁定文件导出为 requirements.txt
uv export --format requirements-txt > requirements.txt

# 带哈希值导出以确保安全
uv export --format requirements-txt --hash > requirements.txt
```

## 性能优化

### 模式 16：使用全局缓存

```bash
# UV 自动使用全局缓存，位于：
# Linux: ~/.cache/uv
# macOS: ~/Library/Caches/uv
# Windows: %LOCALAPPDATA%\uv\cache

# 清除缓存
uv cache clean

# 检查缓存大小
uv cache dir
```

### 模式 17：并行安装

```bash
# UV 默认并行安装包

# 控制并行度
uv pip install --jobs 4 package1 package2

# 无并行（顺序）
uv pip install --jobs 1 package
```

### 模式 18：离线模式

```bash
# 仅从缓存安装（无网络）
uv pip install --offline package

# 离线从锁定文件同步
uv sync --frozen --offline
```

## 与其他工具对比

### uv vs pip

```bash
# pip
python -m venv .venv
source .venv/bin/activate
pip install requests pandas numpy
# ~30 秒

# uv
uv venv
uv add requests pandas numpy
# ~2 秒（快 10-15 倍）
```

### uv vs poetry

```bash
# poetry
poetry init
poetry add requests pandas
poetry install
# ~20 秒

# uv
uv init
uv add requests pandas
uv sync
# ~3 秒（快 6-7 倍）
```

### uv vs pip-tools

```bash
# pip-tools
pip-compile requirements.in
pip-sync requirements.txt
# ~15 秒

# uv
uv lock
uv sync --frozen
# ~2 秒（快 7-8 倍）
```

## 常见工作流

### 模式 19：启动新项目

```bash
# 完整工作流
uv init my-project
cd my-project

# 设置 Python 版本
uv python pin 3.12

# 添加依赖
uv add fastapi uvicorn pydantic

# 添加开发依赖
uv add --dev pytest black ruff mypy

# 创建目录结构
mkdir -p src/my_project tests

# 运行测试
uv run pytest

# 格式化代码
uv run black .
uv run ruff check .
```

### 模式 20：维护现有项目

```bash
# 克隆仓库
git clone https://github.com/user/project.git
cd project

# 安装依赖（自动创建虚拟环境）
uv sync

# 安装带开发依赖
uv sync --all-extras

# 更新依赖
uv lock --upgrade

# 运行应用
uv run python app.py

# 运行测试
uv run pytest

# 添加新依赖
uv add new-package

# 提交更新的文件
git add pyproject.toml uv.lock
git commit -m "Add new-package dependency"
```

## 工具集成

### 模式 21：Pre-commit 钩子

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: uv-lock
        name: uv lock
        entry: uv lock
        language: system
        pass_filenames: false

      - id: ruff
        name: ruff
        entry: uv run ruff check --fix
        language: system
        types: [python]

      - id: black
        name: black
        entry: uv run black
        language: system
        types: [python]
```

### 模式 22：VS Code 集成

```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": ["-v"],
  "python.linting.enabled": true,
  "python.formatting.provider": "black",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  }
}
```

## 故障排除

### 常见问题

```bash
# 问题：找不到 uv
# 解决方案：添加到 PATH 或重新安装
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc

# 问题：Python 版本错误
# 解决方案：明确固定版本
uv python pin 3.12
uv venv --python 3.12

# 问题：依赖冲突
# 解决方案：检查解析过程
uv lock --verbose

# 问题：缓存问题
# 解决方案：清除缓存
uv cache clean

# 问题：锁定文件不同步
# 解决方案：重新生成
uv lock --upgrade
```

## 最佳实践

### 项目设置

1. **始终使用锁定文件**以确保可重复性
2. **固定 Python 版本**使用 .python-version
3. **分离开发依赖**与生产依赖
4. **使用 uv run**而不是激活虚拟环境
5. **提交 uv.lock**到版本控制
6. **在 CI 中使用 --frozen**以获得一致的构建
7. **利用全局缓存**提高速度
8. **使用 workspace**处理 monorepo
9. **导出 requirements.txt**以实现兼容性
10. **保持 uv 更新**以获得最新功能

### 性能提示

```bash
# 在 CI 中使用冻结安装
uv sync --frozen

# 尽可能使用离线模式
uv sync --offline

# 并行操作（自动）
# uv 默认执行此操作

# 跨环境复用缓存
# uv 全局共享缓存

# 使用锁定文件跳过解析
uv sync --frozen  # 跳过解析
```

## 迁移指南

### 从 pip + requirements.txt

```bash
# 之前
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 之后
uv venv
uv pip install -r requirements.txt
# 或者更好：
uv init
uv add -r requirements.txt
```

### 从 Poetry

```bash
# 之前
poetry install
poetry add requests

# 之后
uv sync
uv add requests

# 保留现有 pyproject.toml
# uv 读取 [project] 和 [tool.poetry] 部分
```

### 从 pip-tools

```bash
# 之前
pip-compile requirements.in
pip-sync requirements.txt

# 之后
uv lock
uv sync --frozen
```

## 命令参考

### 基本命令

```bash
# 项目管理
uv init [PATH]              # 初始化项目
uv add PACKAGE              # 添加依赖
uv remove PACKAGE           # 移除依赖
uv sync                     # 安装依赖
uv lock                     # 创建/更新锁定文件

# 虚拟环境
uv venv [PATH]              # 创建虚拟环境
uv run COMMAND              # 在虚拟环境中运行

# Python 管理
uv python install VERSION   # 安装 Python
uv python list              # 列出已安装的 Python 版本
uv python pin VERSION       # 固定 Python 版本

# 包安装（兼容 pip）
uv pip install PACKAGE      # 安装包
uv pip uninstall PACKAGE    # 卸载包
uv pip freeze               # 列出已安装的包
uv pip list                 # 列出包

# 工具
uv cache clean              # 清除缓存
uv cache dir                # 显示缓存位置
uv --version                # 显示版本
```
