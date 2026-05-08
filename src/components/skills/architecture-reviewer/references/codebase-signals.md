# 代码库信号指南

用于模式 A（代码库审查）和模式 C（混合审查）的参考。详细说明需要定位的文件、需要 grep 搜索的模式以及需要检测的红旗信号——语言无关。

## 目录

1. 优先文件定位
2. 需搜索的红旗模式
3. 结构分析方法
4. 各维度的代码库信号

---

## 1. 优先文件定位

优先定位并检查以下几类文件。`scan_codebase.mjs` 脚本会识别其中大部分，但需手动验证是否有遗漏。

### 基础设施与部署

- `Dockerfile`、`docker-compose.yml` / `docker-compose.yaml`
- `kubernetes/`、`k8s/`、`deploy/`、`infra/` 目录
- `*.tf`、`*.tfvars`（Terraform）
- `template.yaml`、`serverless.yml`（SAM / Serverless Framework）
- `pulumi/`、`cdk/` 目录
- `nginx.conf`、`caddy`、`traefik.yml`（反向代理配置）
- `Procfile`、`app.yaml`、`render.yaml`（PaaS 配置）

### CI/CD 流水线

- `.github/workflows/*.yml`（GitHub Actions）
- `Jenkinsfile`、`.gitlab-ci.yml`、`buildspec.yml`（Jenkins、GitLab、CodeBuild）
- `bitbucket-pipelines.yml`、`.circleci/config.yml`
- `.pre-commit-config.yaml`

### 依赖清单

- `package.json` + `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`（Node.js）
- `requirements.txt` / `pyproject.toml` / `Pipfile` / `poetry.lock`（Python）
- `go.mod` + `go.sum`（Go）
- `Cargo.toml` + `Cargo.lock`（Rust）
- `pom.xml` / `build.gradle` / `build.gradle.kts`（Java/Kotlin）
- `Gemfile` + `Gemfile.lock`（Ruby）
- `composer.json` + `composer.lock`（PHP）

### API 定义

- `openapi.yaml` / `swagger.json` / `*.openapi.yml`
- `schema.graphql` / `*.graphql`
- `*.proto`（Protocol Buffers / gRPC）
- 路由定义文件（框架相关）

### 数据库与数据

- `migrations/`、`db/migrate/`、`alembic/` 目录
- 模式定义文件（ORM 模型、SQL DDL 文件）
- 种子文件、fixture
- `.env`、`.env.example`、`.env.local`

### 测试

- `tests/`、`test/`、`__tests__/`、`spec/` 目录
- 测试配置（jest.config.js、pytest.ini、phpunit.xml）
- `.codecov.yml`、`.coveragerc`

### 文档

- `README.md`、`CONTRIBUTING.md`、`ARCHITECTURE.md`
- `adr/`、`docs/`、`wiki/` 目录
- `CHANGELOG.md`、`SECURITY.md`

---

## 2. 需搜索的红旗模式

### 安全红旗（关键——务必检查）

```text
# 硬编码密钥（递归搜索，排除 lock 文件和 node_modules）
password\s*=\s*["\']
api_key\s*=\s*["\']
secret\s*=\s*["\']
token\s*=\s*["\']
AWS_ACCESS_KEY
PRIVATE.KEY
-----BEGIN RSA PRIVATE KEY-----
-----BEGIN OPENSSH PRIVATE KEY-----

# SQL 注入向量
"SELECT.*\+.*"       # 查询中的字符串拼接
f"SELECT              # f-string SQL（Python）
`SELECT.*\$\{`        # 模板字面量 SQL（JavaScript）
".*" \+ .*WHERE       # 拼接的 WHERE 子句

# 生产环境中的调试/开发配置
DEBUG\s*=\s*[Tt]rue
NODE_ENV\s*=\s*development  （在非 .env 文件中）
```

### 架构红旗

```text
# 内存状态（阻止水平扩展）
session_store.*memory
InMemoryCache
new Map().*session   # 存储在本地 Map 中的会话
global.*state        # 全局可变状态

# 缺少错误处理
catch.*\{\s*\}       # 空 catch 块
\.catch\(\)          # 空的 Promise catch
except:\s*pass       # Python 裸 except pass

# 紧耦合指示器
import.*from.*\.\.\/\.\.\/  # 深层相对导入
require\(.*\.\.\/\.\.\/     # 深层相对 require（Node.js）
```

### 性能红旗

```text
# N+1 查询模式
for.*\{.*\.find\(    # 循环内的查询
for.*\{.*\.get\(     # 循环内的数据库 get
for.*\{.*SELECT      # 循环内的 SQL
\.map\(.*await       # 未使用 Promise.all 的 async 查询

# 缺少分页
findAll\(\)          # 无边界的查询
SELECT.*FROM.*(?!.*LIMIT)  # 不带 LIMIT 的 SELECT
\.find\(\{\}\)        # MongoDB 全量查询
```

---

## 3. 结构分析方法

扫描脚本运行后，执行以下手动分析：

### 步骤 1：映射服务边界

- 识别顶层目录或独立的包/模块
- 对于 monorepo：识别服务目录
- 映射服务/模块之间的依赖图
- 检查共享库及其范围

### 步骤 2：识别关键路径

- 从入口点到响应追踪主要用户流
- 统计网络跳数、数据库查询和外部调用次数
- 识别可并行化或异步化处理的同步链

### 步骤 3：评估配置规范性

- 检查 .gitignore 是否排除了 .env
- 确认已提交的配置文件中没有密钥
- 检查环境特定配置模式
- 查找硬编码的 URL、端口或环境特定值

### 步骤 4：评估测试覆盖指标

- 测试文件与源文件的比例
- 集成测试和端到端测试的存在性（不仅是单元测试）
- 指示覆盖阈值的测试配置
- CI 流水线中的测试工作流步骤

---

## 4. 各维度的代码库信号

各维度检查内容的快速参考：

| 维度 | 需检查的关键文件 | 需搜索的关键模式 |
| ---------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 结构完整性 | 模块边界、接口、导入图 | 循环导入、上帝类（>500 LOC 的文件）、共享数据库 schema |
| 可扩展性 | 会话存储、缓存配置、队列配置、自动扩缩规则 | 内存状态、本地文件依赖、连接池设置 |
| 企业就绪度 | 认证中间件、租户 ID 传播、审计日志、RBAC 策略 | 查询中的租户范围限定、合规相关代码、部署配置 |
| 性能 | ORM 查询、缓存实现、异步模式、连接池 | N+1 查询、无限制的 SELECT、热路径中的同步外部调用 |
| 安全 | 认证/授权中间件、输入验证、CORS 配置、密钥引用 | 硬编码密钥、SQL 拼接、过度宽松的 CORS、缺少验证 |
| 运维卓越 | CI/CD 配置、IaC 文件、日志代码、健康端点、指标 | 非结构化日志、缺少健康检查、无追踪埋点 |
| 数据架构 | 迁移文件、模式定义、事件模式、备份配置 | 缺少约束、无迁移工具、无索引定义 |
