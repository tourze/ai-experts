# 发现-证据强绑定：完整示例

## 场景 1：代码审查中的内存泄漏

### FAIL: 印象式断言

```
发现 1：这块代码看起来有内存泄漏，应该排查一下。
```

问题：无定位、无证据、无触发条件、无影响、无修复方向。读者无法验证，也无法复现。

### PASS: 三件套齐全

```
发现 1：MessageBus.subscribe 未在组件卸载时取消订阅，导致内存泄漏。

- 定位：src/components/Inbox.tsx:42-58
- 证据：
  ```ts
  useEffect(() => {
    bus.subscribe('msg', handler)
    // 缺少 return () => bus.unsubscribe('msg', handler)
  }, [])
  ```
- 触发条件：用户在 Inbox 与其他页面间反复切换 ≥10 次。
- 影响：每次切换泄漏一个 handler 引用，1 小时使用后 heap 增长约 8 MB（Chrome DevTools Memory 面板可观测）。
- 修复方向：在 useEffect 返回函数中调用 unsubscribe；同类问题在 src/components/Notif.tsx:31 也存在。
```

## 场景 2：性能诊断中推断与事实的混淆

### FAIL: 推断伪装成事实

```
发现 2：性能瓶颈在 N+1 查询。
```

问题：纯代码模式扫描得出，没跑过 EXPLAIN，没看 slow log，把推断当事实。

### PASS: 推断显式标注 + 给出验证路径

```
发现 2：[推断] 列表页可能存在 N+1 查询。

- 定位：app/Http/Controllers/OrderController.php:88
- 证据：循环内调用 $order->customer 但 with('customer') 缺失。
- 推断依据：Eloquent 默认懒加载；未观测到批量查询痕迹。
- 验证路径：开启 query log 后访问 /orders?limit=50，预期看到 51 条 SELECT；建议作为下一步实测。
```

## 场景 3：flaky 测试中的"间歇性"陷阱

### FAIL: 无触发条件

```
发现 3：测试 X 偶尔失败，是 flaky test。
```

问题：「偶尔」不是触发条件。读者无法判断是真 flaky 还是运行环境问题。

### PASS: 给频率 + 给可观测信号

```
发现 3：测试 OrderServiceTest::it_creates_order 在 CI 上每 ~20 次运行失败 1 次，本地未复现。

- 定位：tests/OrderServiceTest.php:45；CI run_id 列表：#8821, #8907, #8956, #9012。
- 证据：失败均出现在 assertEquals($expected, $actual) 行，$actual.created_at 比 $expected 晚 1 秒。
- 触发条件：CI runner 跨秒执行（高 CPU 时间窗），断言精度到秒。
- 推断 → 待验证：怀疑是断言精度问题，可改用区间断言或 freeze time 验证。
```

## 场景 4：安全审计中的"应该有风险"

### FAIL: 风险断言无 PoC 路径

```
发现 4：这个接口可能存在 SSRF 风险。
```

问题：没指出输入点、没标参数、没给 PoC 路径。读者不知道是真风险还是误报。

### PASS: 输入路径 + 触发载荷 + 影响边界

```
发现 4：/api/preview 接口存在 SSRF，可被未授权用户访问内网服务。

- 定位：routes/api.php:47 → app/Http/Controllers/PreviewController.php:18
- 证据：`$url = $request->input('url'); $response = Http::get($url);` 未做协议白名单或 IP 段过滤。
- 触发条件：任意已登录用户。PoC：`POST /api/preview {"url":"http://169.254.169.254/latest/meta-data/"}`，返回 EC2 metadata。
- 影响：可读取云元数据、扫内网端口、利用基于源 IP 的内部信任。
- 修复方向：白名单 scheme=http(s)，DNS 解析后过滤私有/保留 IP 段；引用 Spatie/url-validator。
```

## 多源证据排序示例

同一发现来自多种证据时，按可信度从高到低排列：

```
发现 5：登录接口 P99 延迟在 18:00-18:30 出现 5x 尖刺。

证据（按可信度排序）：
1. [直接观测] Datadog metric login.p99 时间窗 2026-04-25T18:00-18:30，从 120ms 升至 600ms。
2. [直接观测] Application log: trace_id=xyz789 显示 DB 查询 select_user_by_email 耗时 480ms。
3. [间接推断] 同时段 db.connections.active 接近上限 200，疑似连接池打满。
4. [同类模式类比] 上周三同时段也出现类似尖刺（参见 #incident-2026-04-22）。
5. [直觉] 推测与每日 18:00 的批量任务有关 —— 待验证。
```

读者一眼看出 1-2 是事实、3 是推断、5 仅供探索方向。
