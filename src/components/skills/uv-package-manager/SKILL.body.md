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
