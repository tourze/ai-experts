# Go 依赖注入

补充 `go-design-patterns` 主文档中依赖注入策略的详细说明。

## 1. 手动构造器注入（无框架）

Go 最常见的 DI 方式：在 `New()` 中接收依赖，存入结构体字段。

```go
type OrderService struct {
    repo   OrderRepository
    logger *slog.Logger
}

func NewOrderService(repo OrderRepository, logger *slog.Logger) *OrderService {
    return &OrderService{repo: repo, logger: logger}
}
```

优点：零依赖、编译期检查、调用链完全可见。
适用：绝大多数 Go 项目（中小型服务、库）。

构造规则：
- 依赖以接口形式传入，不要传具体实现。
- 不要在 `New()` 里做 `http.Get`、`sql.Open` 等全局副作用，资源获取在调用方完成。
- 可选依赖用函数式选项（`WithLogger`），必选依赖用位置参数。

## 2. 接口设计原则

接口按使用方需求定义，不要把所有方法塞进一个大接口。

```go
type OrderReader interface {
    GetByID(ctx context.Context, id string) (*Order, error)
    List(ctx context.Context, filter Filter) ([]Order, error)
}

type OrderWriter interface {
    Save(ctx context.Context, order *Order) error
    Delete(ctx context.Context, id string) error
}
```

规则：
- 接口放在消费方包内（"accept interfaces, return structs"）。
- 方法数控制在 3-5 个以内，超过则拆分。
- 不要为了 mock 给每个方法抽接口——先确认是否真的需要替换实现。

## 3. 何时引入 DI 框架

`main()` 手动组装 30+ 依赖时构造链冗长且脆弱。出现以下信号时考虑框架：
- 依赖图超过 15-20 个节点。
- 多个服务共享部分依赖图，手动维护重复。
- 生命周期管理复杂（单例 vs 请求级）。

### Wire（编译期代码生成）

```go
func InitializeServer(cfg Config) (*Server, error) {
    wire.Build(NewDB, NewOrderRepo, NewOrderService, NewHTTPHandler, NewServer)
    return nil, nil
}
```

编译期生成注入代码，零反射，类型安全。适合大型项目。

### Dig（运行时反射）

```go
container := dig.New()
container.Provide(NewDB)
container.Provide(NewOrderRepo)
container.Invoke(func(svc *OrderService) { /* 启动 */ })
```

运行时解析依赖图，支持可选依赖和命名绑定。适合需要动态注册插件的场景。

选型：新项目优先 Wire；需动态注册时用 Dig；依赖图 < 15 个节点时手动注入足够。

## 4. Service Locator 反模式

```go
// 反模式：全局注册表
var registry = map[string]interface{}{}
func GetService(name string) interface{} { return registry[name] }
```

问题：丢失编译期类型安全、隐藏真实依赖、测试间互相污染、循环依赖无报警。
正确做法：将依赖作为构造器参数显式传入。

## 5. 通过 DI 实现 Mock 测试

```go
type mockOrderRepo struct {
    getFn func(ctx context.Context, id string) (*Order, error)
}

func (m *mockOrderRepo) GetByID(ctx context.Context, id string) (*Order, error) {
    return m.getFn(ctx, id)
}

func TestOrderService(t *testing.T) {
    svc := NewOrderService(&mockOrderRepo{
        getFn: func(_ context.Context, id string) (*Order, error) {
            return &Order{ID: id}, nil
        },
    }, slog.Default())
}
```

要点：
- Mock 按 interface 手写，接口方法 > 10 个时才考虑 testify/mock。
- 测试只 mock 直接依赖，不 mock 依赖的依赖。
- Mock 逻辑比生产代码还复杂时，说明接口需要重新拆分。
