# protocol-freezing-patterns

## 适用场景
- 需要冻结已部署协议字段或在不破坏旧客户端前提下演进消息结构。
- 交叉引用：系统级设计配合 `system-design`；错误处理配合 `error-handling-patterns`。

## 核心约束
- 已部署字段的线上表示不可变（类型、位置、编码）。
- 新增字段必须可选且带默认值；旧客户端遇未知字段必须忽略。
- 每条消息携带版本标签或版本化信封。
- 删除字段走四阶段：标记废弃 -> 停写 -> 停读 -> 移除。
- 破坏性变更必须升版本号；禁止同版本下变更语义。
- 扩展点初始设计时预留；协议文档与代码同等冻结。
- 保留每版本 golden file，新代码须能反序列化所有历史版本。

## 代码模式
- 按需读取 `references/versioned-envelope.md`、`references/field-evolution.md`、`references/version-negotiation.md`、`references/golden-file-testing.md`。

## 检查清单
- 每条消息是否有版本标签。
- 新增字段是否可选 + 默认值。
- 废弃字段是否有四阶段计划。
- CI 是否运行历史 golden file 反序列化测试。

## 反模式

### FAIL: 偷改字段类型

```proto
// v1
message Order { int32 amount = 1; }

// v2 同一版本号偷改
message Order { string amount = 1; }
// 旧客户端：amount 解析为 0 / 崩
```

### PASS: 升版本 + 新字段

```proto
message Order {
  int32 amount = 1 [deprecated = true];
  string amount_str = 2;  // 新字段
  string version = 99;     // "2"
}
// 旧客户端读 amount，新客户端读 amount_str
// 全部升级后 → 进入四阶段废弃流程
```

### FAIL: 新增必填字段

```json
// v1
{ "user_id": 1 }
// v2 新增必填
{ "user_id": 1, "tenant_id": "t1" }  // 旧客户端发的请求被拒 400
```

### PASS: 新增可选 + 默认

```
新增字段必须 optional + 服务端默认值
旧客户端不发 tenant_id → 服务端 fallback 到 default_tenant
6 个月后所有客户端升级 → 才考虑改为 required
```

### FAIL: 删字段直接移除

```proto
// v3 直接删
message Order {
  // string promo_code = 5;  ← 删除
}
// 旧客户端发 promo_code → 服务端忽略 / 优惠丢失
```

### PASS: 四阶段

```
Phase 1（v3）：标记 deprecated，仍读写
Phase 2（v4）：服务端停写，但仍读
Phase 3（v5）：服务端停读，仅记录
Phase 4（v6，6+ 月后）：彻底移除
```
