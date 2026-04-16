---
name: rails-service-patterns
description: 当需要设计 Rails 7+ service/command object、收紧 Active Record 查询与事务边界、或按 `bundle exec` 工作流规范 controller 职责时使用。
---

# Rails Service 模式

## 适用场景

- 新建或重构 Ruby 3.x / Rails 7+ 代码，尤其是 service object、model、job、command、task 这些常见边界。
- 审查 Active Record 使用方式、事务边界、回调复杂度、N+1 风险和业务逻辑归属。
- 需要落地 `bundle exec`、`rake`、`bin/rails` 等日常开发工作流时，沿用本技能里的约束。
- 需要补测试时，联动 [rspec-testing](../rspec-testing/SKILL.md)。

## 核心约束

- 优先 Ruby 3.x 写法：关键依赖用关键字参数注入，不用位置参数堆叠上下文。
- 业务流程放在 service / command object，不把跨模型编排塞进 controller、view helper 或 Active Record callback。
- 事务边界显式放在 service 层；不要依赖隐式 callback 顺序拼凑一致性。
- 查询和写入职责分离：列表查询优先 scope / query object，写入优先命令式 service object。
- 所有脚本命令默认带 `bundle exec`，避免因为 gem 版本漂移执行到错误二进制。

## 代码模式

```ruby
class CreateUser
  def initialize(user_repo: User, audit_repo: AuditLog)
    @user_repo = user_repo
    @audit_repo = audit_repo
  end

  def call(params)
    user_repo.transaction do
      user = user_repo.create!(params.slice(:email, :name))
      audit_repo.create!(action: "user.created", target_id: user.id)
      user
    end
  end

  private

  attr_reader :user_repo, :audit_repo
end
```

```ruby
class UsersController < ApplicationController
  def create
    user = CreateUser.new.call(user_params)
    render json: { id: user.id, email: user.email }, status: :created
  end

  private

  def user_params
    params.require(:user).permit(:email, :name)
  end
end
```

```bash
bundle exec rubocop
bundle exec rspec
bundle exec rake db:migrate
```

## 检查清单

- controller 是否只处理协议转换和参数白名单，没有直接拼业务流程。
- service object 是否有单一职责，名字表达动作而不是泛化成 `Util` / `Manager`。
- Active Record 查询是否显式处理 preload / includes，避免把 N+1 留到线上。
- 事务、外部副作用、审计日志是否位于同一个明确的编排层，而不是散落在 callback。
- 所有命令是否通过 `bundle exec` 运行，避免 Bundler 上下文失真。
- 如果这段逻辑难以验证，是否应该回到 [rspec-testing](../rspec-testing/SKILL.md) 先补隔离良好的规格测试。

## 反模式

### FAIL: callback 跑业务

```ruby
class Order < ApplicationRecord
  after_commit :charge_payment, :send_email, :update_inventory, :notify_admin
end
# 4 个 callback 顺序依赖 / 测试难以隔离 / 一个挂全挂
```

### PASS: Service object 显式编排

```ruby
class CompleteOrder
  def call(order)
    Order.transaction do
      PaymentService.new.charge(order)
      InventoryService.new.deduct(order)
    end
    OrderMailer.confirmation(order).deliver_later  # 事务外异步
    AdminNotifier.new.order_completed(order)
  end
end
# 顺序明确 / 事务边界清楚 / 易测
```

### FAIL: Controller 操作多 model

```ruby
def create
  ActiveRecord::Base.transaction do
    @order = Order.create!(order_params)
    @order.items.create!(...)
    Inventory.deduct(@order)
    AuditLog.create!(...)
  end
end
# Controller 知道太多业务细节
```

### PASS: 委托 service

```ruby
def create
  @order = CreateOrder.new.call(order_params)
  render json: @order, status: :created
rescue Order::InsufficientStock => e
  render json: { error: e.message }, status: :unprocessable_entity
end
```
