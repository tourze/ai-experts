---
name: rspec-testing
description: 使用 RSpec 为 Ruby / Rails 代码编写可靠测试，覆盖 service spec、request spec、factory 管理、时间控制与外部依赖隔离。
---

# RSpec Testing

## 适用场景

- 需要为 Ruby / Rails 代码补单元测试、request spec、job spec 或 service spec。
- 已经识别出 controller 过重、service 边界模糊、依赖不易隔离时，先参考 [ruby-expert](../ruby-expert/SKILL.md) 收紧生产代码结构，再写测试。
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
- 如果测试需要大量 stub 才能写下去，是否应该回到 [ruby-expert](../ruby-expert/SKILL.md) 先做结构拆分。

## 反模式

- 用 `allow_any_instance_of` 或深层 stub 掩盖设计问题，让测试和实现一起变脆。
- 把多个场景塞进一个 example，失败后无法定位到底是哪条行为回归。
- request spec 只断言 `200 OK`，却不验证数据库副作用和错误响应体。
- factory 默认创建大量关联对象，让每个测试都慢且难读。
- 在测试里遗留 `binding.pry`、`puts`、`pp` 等调试语句，破坏自动化稳定性。
