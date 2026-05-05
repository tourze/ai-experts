# 基准测试设计

## 适用场景

- 用户要比较两个或多个候选方案的性能，而不是做泛泛的架构选型。
- 需要衡量延迟、吞吐、内存、准确率、成本、冷启动等指标。
- 需要产出可复现实验方案，或对已有结果做结构化解读。
- 需要结合 [testing-strategy](../testing-strategy/SKILL.md) 制定性能验证计划。

## 核心约束

- 候选方案必须可比：相同输入、相同环境、相同配置边界。
- 每次只选 `2-4` 个核心指标；指标过多会让结论失真。
- 必须记录环境：硬件、系统、运行时、依赖版本、关键配置。
- 必须报告波动，不只报平均值；至少给出样本数和离散情况。
- 无法实际运行时，只输出实验设计，不伪造结果。
- 优先加载这些参考文件：
  - [metric-selection.md](./references/metric-selection.md)
  - [test-case-design.md](./references/test-case-design.md)
  - [environment-capture.md](./references/environment-capture.md)
  - [statistical-rigor.md](./references/statistical-rigor.md)

## 代码模式

### 模式 1：定义基准范围

```markdown
## Benchmark Scope

- 候选 A：Node.js service v1.8.2，4 workers
- 候选 B：Rust service v0.9.1，4 threads
- 决策问题：P95 延迟与内存占用谁更适合生产 API
- 核心指标：P50/P95 延迟、吞吐、峰值 RSS
```

### 模式 2：设计测试矩阵

```markdown
| 用例 | 输入规模 | 说明 | 预热 | 正式迭代 |
|------|----------|------|------|----------|
| small | 1 KB | 单请求基线 | 20 | 100 |
| medium | 100 KB | 常见生产载荷 | 20 | 100 |
| large | 2 MB | 上界压力 | 20 | 50 |
```

### 模式 3：给出可复现执行命令

```bash
# 环境固定
export NODE_ENV=production
export SERVICE_PORT=8080

# 示例：用 hey 对两个候选分别压测
hey -z 30s -c 100 http://127.0.0.1:8081/api/benchmark > result-a.txt
hey -z 30s -c 100 http://127.0.0.1:8082/api/benchmark > result-b.txt
```

### 模式 4：输出结果与结论

```markdown
## 结果摘要

| 指标 | A | B | 结论 |
|------|---|---|------|
| P95 延迟 | 84 ms | 61 ms | B 更优 |
| 峰值 RSS | 410 MB | 265 MB | B 更优 |
| 吞吐 | 1,900 req/s | 1,750 req/s | A 更优 |

## 取舍分析

- 选 A：更重吞吐，且内存不是瓶颈
- 选 B：更重尾延迟和资源成本
- 局限：未覆盖跨 AZ 网络延迟与冷启动
```

## 检查清单

- [ ] 候选版本和配置写清楚了
- [ ] 输入规模覆盖小/中/大或等价分层
- [ ] 预热与正式迭代分开
- [ ] 环境信息完整记录
- [ ] 输出包含波动或样本信息
- [ ] 结论按指标拆开，而不是一句“B 更快”
- [ ] 已注明实验局限和不可外推条件

## 反模式

### FAIL: 不同环境比

```
A：Mac M2 16GB
B：服务器 64 核 256GB
“B 比 A 快 5 倍” → 废结论
```

### PASS: 同环境

```
两候选都跑同一台 c5.4xlarge
同 OS / 同内核 / 同依赖版本
环境信息写进报告头部
```

### FAIL: 只报均值

```
“平均延迟 50ms”
→ p99 = 800ms，关键交易超时
```

### PASS: p50/p95/p99 + 样本数

```
| 候选 | p50 | p95 | p99 | 样本 |
| A | 35 | 120 | 450 | 10000 |
| B | 40 | 80  | 150 | 10000 |
→ 看尾延迟分布做决策
```
