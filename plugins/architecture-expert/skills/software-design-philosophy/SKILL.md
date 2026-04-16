---
name: software-design-philosophy
description: "在需要从复杂度、深模块、信息隐藏和战略式编程角度评价设计时使用；目标是让系统更易理解、更易修改。"
---

# software-design-philosophy

## 适用场景
- 适合模块设计、API 评审、类拆分/合并、抽象层次和复杂度预算讨论。
- 适合解释为什么某个接口太浅、某个模块泄漏了知识、某些注释应记录设计意图。
- 交叉引用：具体重构动作配合 `refactoring-patterns`；边界批判配合 `seam-ripper`。

## 核心约束
- 以“是否降低整体复杂度”为最高判断标准，而不是局部优雅。
- 优先讨论依赖和 obscurity，而不是执着于代码行数。
- 深模块强调“强功能 + 简接口”，不是把逻辑塞成巨型黑盒。
- 注释应解释设计意图、约束和不变量，不要写显而易见的逐行翻译。

## 代码模式
- 复杂度、深模块、信息隐藏、通用/专用模块、注释设计等主题按需读取 `references/*.md`。
- 分析顺序推荐：复杂度症状 → 根因 → 接口设计 → 信息隐藏 → 战略性修正。
- 输出建议尽量落到模块边界、接口收缩和知识收敛。


## 检查清单
- 是否识别了变更放大、认知负担和未知未知数。
- 是否判断模块是深还是浅、知识有没有泄漏。
- 是否给出更简单的接口与更强的内部封装方案。
- 是否说明注释应该记录什么设计意图。

## 反模式

### FAIL: 浅模块伪装架构

```ts
// "解耦"
class UserController {
  constructor(private service: UserService) {}
  getUser(id) { return this.service.getUser(id); }
}
class UserService {
  constructor(private repo: UserRepo) {}
  getUser(id) { return this.repo.findById(id); }
}
class UserRepo {
  findById(id) { return db.users.find({id}); }
}
// 三层都只是转发，没有任何复杂度被隐藏
```

### PASS: 深模块

```ts
class OrderService {
  // 简单接口
  async place(req: PlaceOrderRequest): Promise<Order> {
    // 内部隐藏：库存校验 / 价格计算 / 优惠 / 支付路由 / 通知 / 审计
    // 调用方不需要关心任何细节
  }
}
// 接口窄，内部复杂度高 → 真正降低系统总复杂度
```

### FAIL: 配置参数地狱

```ts
process(items, {
  parallel: true, retries: 3, timeout: 5000,
  cache: true, cacheKey: 'x', cacheTTL: 60,
  logger: customLogger, errorHandler: ...,
  // 18 个参数
});
// 调用方需要理解所有参数才能用
// 复杂度从模块内转嫁到模块外 → 总复杂度增加
```

### PASS: 合理默认 + 进阶 API

```ts
process(items)                            // 90% 场景
process(items, { parallel: true })        // 9% 场景
processAdvanced(items, fullOpts)          // 1% 高级场景
// 简单情况简单使用，复杂需求才暴露完整 API
```
