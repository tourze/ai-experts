# Python 测试模式 — 进阶参考

涵盖异步测试、monkeypatch、临时文件、conftest、属性测试、数据库测试、CI/CD 与配置。

## 模式 6：异步代码测试

```python
# test_async.py
import pytest
import asyncio

async def fetch_data(url: str) -> dict:
    """异步获取数据。"""
    await asyncio.sleep(0.1)
    return {"url": url, "data": "result"}


@pytest.mark.asyncio
async def test_fetch_data():
    """测试异步函数。"""
    result = await fetch_data("https://api.example.com")
    assert result["url"] == "https://api.example.com"
    assert "data" in result


@pytest.mark.asyncio
async def test_concurrent_fetches():
    """测试并发异步操作。"""
    urls = ["url1", "url2", "url3"]
    results = await asyncio.gather(*(fetch_data(u) for u in urls))
    assert len(results) == 3


@pytest.fixture
async def async_client():
    """异步 fixture。"""
    client = {"connected": True}
    yield client
    client["connected"] = False


@pytest.mark.asyncio
async def test_with_async_fixture(async_client):
    assert async_client["connected"] is True
```

## 模式 7：Monkeypatch 测试

```python
# test_environment.py
import os
import pytest

def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "sqlite:///:memory:")


def test_database_url_custom(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost/test")
    assert get_database_url() == "postgresql://localhost/test"


def test_database_url_not_set(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert get_database_url() == "sqlite:///:memory:"


class Config:
    def __init__(self):
        self.api_key = "production-key"

def test_monkeypatch_attribute(monkeypatch):
    config = Config()
    monkeypatch.setattr(config, "api_key", "test-key")
    assert config.api_key == "test-key"
```

## 模式 8：临时文件与目录

```python
# test_file_operations.py
import pytest
from pathlib import Path

def save_data(filepath: Path, data: str):
    filepath.write_text(data)

def test_file_operations(tmp_path):
    """tmp_path 是 pathlib.Path 对象。"""
    test_file = tmp_path / "test_data.txt"
    save_data(test_file, "Hello, World!")
    assert test_file.exists()
    assert test_file.read_text() == "Hello, World!"

def test_multiple_files(tmp_path):
    files = {"f1.txt": "内容1", "f2.txt": "内容2", "f3.txt": "内容3"}
    for name, content in files.items():
        (tmp_path / name).write_text(content)
    assert len(list(tmp_path.iterdir())) == 3
```

## 模式 9：Conftest 与参数化 Fixture

```python
# conftest.py
import pytest

@pytest.fixture(scope="session")
def database_url():
    return "postgresql://localhost/test_db"

@pytest.fixture
def sample_user():
    return {"id": 1, "name": "测试用户", "email": "test@example.com"}

@pytest.fixture(params=["sqlite", "postgresql", "mysql"])
def db_backend(request):
    """参数化 fixture，测试会运行 3 次。"""
    return request.param

def test_with_db_backend(db_backend):
    assert db_backend in ["sqlite", "postgresql", "mysql"]
```

## 模式 10：基于属性的测试

```python
# test_properties.py
from hypothesis import given, strategies as st

def reverse_string(s: str) -> str:
    return s[::-1]

@given(st.text())
def test_reverse_twice_is_original(s):
    """反转两次应返回原始字符串。"""
    assert reverse_string(reverse_string(s)) == s

@given(st.integers(), st.integers())
def test_addition_commutative(a, b):
    """加法交换律。"""
    assert a + b == b + a

@given(st.lists(st.integers()))
def test_sorted_list_is_ordered(lst):
    sorted_lst = sorted(lst)
    assert len(sorted_lst) == len(lst)
    assert all(sorted_lst[i] <= sorted_lst[i+1] for i in range(len(sorted_lst)-1))
```

## 数据库代码测试

```python
# test_database_models.py
import pytest
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    email = Column(String(100), unique=True)

@pytest.fixture
def db_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()

def test_create_user(db_session):
    user = User(name="测试用户", email="test@example.com")
    db_session.add(user)
    db_session.commit()
    assert user.id is not None

def test_unique_email_constraint(db_session):
    from sqlalchemy.exc import IntegrityError
    db_session.add(User(name="u1", email="same@example.com"))
    db_session.commit()
    db_session.add(User(name="u2", email="same@example.com"))
    with pytest.raises(IntegrityError):
        db_session.commit()
```

## CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.9", "3.10", "3.11", "3.12"]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -e ".[dev]" pytest pytest-cov
      - run: pytest --cov=myapp --cov-report=xml
      - uses: codecov/codecov-action@v3
```

## 配置文件

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --strict-markers --tb=short --cov=myapp --cov-report=term-missing
markers =
    slow: 慢速测试
    integration: 集成测试
    unit: 单元测试
    e2e: 端到端测试
```

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = ["-v", "--cov=myapp", "--cov-report=term-missing"]

[tool.coverage.run]
source = ["myapp"]
omit = ["*/tests/*", "*/migrations/*"]

[tool.coverage.report]
exclude_lines = ["pragma: no cover", "def __repr__", "raise AssertionError", "raise NotImplementedError"]
```
