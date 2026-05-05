## 核心约束

- 单个项目只保留一个依赖真源：`pyproject.toml` + `uv.lock`。
- 优先用 `uv run`，避免“激活了哪个 venv 我也说不清”的状态漂移。
- 不要在同一仓库同时混用 `pip install`、Poetry 和 uv 修改依赖。
- 锁文件进 CI 和发布流；需要可复现安装时使用 `uv sync --frozen`。
- 文档只保留已验证的命令参数，避免写历史版本选项。

## 代码模式

```bash
uv init .
uv python install 3.12
uv venv --python 3.12
uv add ruff pytest
uv add --dev mypy
uv run pytest
uv lock
uv sync --frozen
```

## 检查清单

- 项目是否已经明确 Python 版本、依赖组和锁文件策略。
- 开发、测试、CI 是否都通过 `uv run` / `uv sync` 执行。
- 文档、脚本和仓库实际命令是否一致。
- 是否避免了多个包管理器同时写同一份依赖。
- 团队成员首次拉仓后能否按文档一步跑通。

## 反模式

### FAIL: 多个真源并存

```bash
uv add fastapi
echo “django==5.0” >> requirements.txt   # 又手写
pip install -r requirements.txt
# 两套真源，谁说了算？
```

### PASS: 单一真源

```bash
uv add fastapi django
# pyproject.toml + uv.lock 唯一来源
```

### FAIL: 本地 vs CI 不一致

```bash
# 本地：source .venv/bin/activate && pytest
# CI：  pip install -r requirements.txt && python -m pytest
# 两套环境，行为不同
```

### PASS: 都走 uv run

```bash
uv sync --frozen
uv run pytest
```

### FAIL: 锁文件不提交

```bash
echo “uv.lock” >> .gitignore   # “锁文件每次都变”
# 每人版本不同，”我这能跑你那不行”
```

### PASS: 锁文件入仓 + frozen

```bash
git add uv.lock
uv sync --frozen   # CI 拒绝与 lock 不一致的安装
```
