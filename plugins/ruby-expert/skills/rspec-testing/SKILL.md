---
name: rspec-testing
description: 当要为 Ruby / Rails 代码编写或审查 RSpec 测试时使用。
---

# RSpec Testing

## 适用场景

- 需要为 Ruby / Rails 代码补单元测试、request spec、job spec 或 service spec。
- 已经识别出 controller 过重、service 边界模糊、依赖不易隔离时，先参考 [rails-service-patterns](../rails-service-patterns/SKILL.md) 收紧生产代码结构，再写测试。
- 需要验证数据库副作用、事务回滚、时间逻辑或外部 API 交互是否稳定。
- 现有项目已经使用 FactoryBot、RSpec Rails、Timecop 或 ActiveSupport 时间助手时，优先复用现有约定。

## 核心约束

- 每个 example 只验证一个行为结果；标题必须写出触发条件和预期结果。
- 只隔离外部边界：网络、文件、随机数、当前时间、异步队列；不要 mock 被测核心业务逻辑。
- Rails HTTP 层优先 request spec，不补已经被官方弱化的 controller spec。
- factory 默认最小化：只构造当前测试需要的数据，不堆无关关联。
- 时间、时区与后台任务必须显式控制，不能依赖执行环境的默认值。

## 代码模式

```ruby
RSpec.describe CreateUser do
  subject(:service) { described_class.new(user_repo: User, audit_repo: AuditLog) }

  it "creates user and audit log in one transaction" do
    expect do
      service.call(email: "alice@example.com", name: "Alice")
    end.to change(User, :count).by(1)
      .and change(AuditLog, :count).by(1)
  end
end
```

```ruby
RSpec.describe "POST /users", type: :request do
  it "returns 201 for valid payload" do
    post "/users", params: { user: { email: "alice@example.com", name: "Alice" } }

    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body)).to include("email" => "alice@example.com")
  end
end
```

```ruby
RSpec.describe ExpireTrialJob do
  around do |example|
    travel_to(Time.zone.parse("2026-01-02 09:00:00")) { example.run }
  end

  it "expires overdue trials" do
    trial = create(:trial_account, expires_at: 1.day.ago)

    expect { described_class.perform_now }.to change { trial.reload.status }.to("expired")
  end
end
```

## 检查清单

- example 标题是否能直接说明失败影响，不出现 `works`、`case 1` 这类空洞命名。
- 是否同时覆盖成功路径、失败路径和关键边界，而不是只测 happy path。
- 是否只 mock 外部系统，而把领域逻辑保留在真实对象上运行。
- request spec 是否断言状态码、响应体和持久化副作用，而不是只看一个字段。
- factory、时间和后台任务状态是否在测试内显式设置，不依赖全局随机顺序。
- 如果测试需要大量 stub 才能写下去，是否应该回到 [rails-service-patterns](../rails-service-patterns/SKILL.md) 先做结构拆分。

## 反模式

### FAIL: allow_any_instance_of 掩盖设计

```ruby
it "creates user" do
  allow_any_instance_of(User).to receive(:save).and_return(true)
  allow_any_instance_of(AuditLog).to receive(:log).and_return(nil)
  service.call(params)
  # 测试通过，未验证真实行为
end
```

### PASS: 隔离外部边界 + 真实对象

```ruby
it "creates user and audit log" do
  expect { service.call(params) }.to change(User, :count).by(1)
    .and change(AuditLog, :count).by(1)
end
```

### FAIL: request spec 只断言 200

```ruby
it "creates user" do
  post "/users", params: { email: "a@b.com" }
  expect(response).to have_http_status(200)
  # 未验证真创建、响应体正确
end
```

### PASS: 状态码 + 响应体 + 副作用

```ruby
it "creates user" do
  expect { post "/users", params: { user: { email: "a@b.com" } } }
    .to change(User, :count).by(1)
  expect(response).to have_http_status(:created)
  expect(JSON.parse(response.body)).to include("email" => "a@b.com")
end
```

### FAIL: factory 默认关联爆炸

```ruby
factory :user do
  association :profile
  association :company
  after(:create) { |u| create_list(:post, 10, author: u) }
end
# 每个测试 10+ 记录，跑 3 分钟
```

### PASS: 最小化 + trait

```ruby
factory :user do
  email { generate(:email) }
end
trait :with_posts do
  after(:create) { |u| create_list(:post, 3, author: u) }
end
# 按需 create(:user, :with_posts)
```
