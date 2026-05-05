# 输出格式示例

第 2/3 步用的格式参考。任何输出必须严格按这个结构,标题不得改字、顺序不得调整。

## 完整示例:Symfony 创建订单接口

下面是一份针对 `POST /api/v1/orders` 的完整 6 段输出。复制时把所有 `<...>`
占位符换成真实的 file:line。

### ## 入口

POST /api/v1/orders,Symfony HTTP 路由,定义在
`src/Controller/Api/V1/OrderController.php:42` 的 `createAction`。

请求体由 `OrderCreateRequest` DTO 反序列化(`src/Dto/OrderCreateRequest.php:12`)。

### ## 调用链

```
OrderController::createAction(OrderCreateRequest $req)         OrderController.php:42
  ├─ Validator::validate($req)                                  OrderController.php:51
  │   └─ if (errors) → return JsonResponse(422)
  ├─ OrderService::create($req, $user)                          OrderService.php:88
  │   ├─ ProductRepository::findBySku($req->sku)                ProductRepository.php:34   [READ db.products]
  │   ├─ StockClient::reserve($product, $req->qty)              StockClient.php:18         [EXTERNAL POST wms.internal/stock/reserve]
  │   ├─ EntityManager::persist($order)                         OrderService.php:120       [WRITE db.orders]
  │   ├─ OrderCacheService::set($order)                         OrderCacheService.php:55   [WRITE redis order:{id}:status]
  │   └─ EventDispatcher::dispatch(OrderCreatedEvent)           OrderService.php:140
  │       ├─ OrderActivityLogger::onCreated()      [sync]       OrderActivityLogger.php:22 [WRITE db.activity_log]
  │       └─ NotifyUserListener::onCreated()       [async]      NotifyUserListener.php:18  [MQ amq.topic / order.created]
  └─ return JsonResponse(201, OrderResource::from($order))      OrderController.php:75
```

**缩进树规则**:

- 节点格式:`Class::method(args)` 后面对齐 `file:line`,再后面 `[副作用 tag]`。
- 副作用 tag 用方括号:`[READ <table>]` `[WRITE <table>]` `[CACHE <key>]` `[MQ <queue>]` `[EXTERNAL <url>]` `[FS <path>]`。
- 同步事件监听器标 `[sync]`,异步标 `[async]`,这是 bug 高发区,必须区分。
- 条件分支用 `├─ if (...)` 或 `├─ else` 标注,不要把只有某条件下才走的路径画成主干。
- 递归深度以「数据真正落盘 / 发出去 / 返回响应」为止,纯函数不展开。

### ## 数据读写

```
READ:
  - db.products (SELECT WHERE sku=?)                  ProductRepository.php:34
  - redis user:{id}:profile (TTL 3600)                UserCacheService.php:20

WRITE:
  - db.orders (INSERT)                                OrderService.php:120
  - db.activity_log (INSERT)                          OrderActivityLogger.php:22
  - redis order:{id}:status (SET, no TTL ⚠)           OrderCacheService.php:55

CACHE:
  - 命中路径:OrderCacheService::get(id)                OrderCacheService.php:30
  - 回源路径:OrderRepository::find(id)                 OrderRepository.php:60
  - 失效路径:OrderUpdatedListener::onUpdate()          OrderUpdatedListener.php:15

MQ:
  - 生产:OrderCreatedEvent → amq.topic / order.created  OrderService.php:140
  - 消费:NotifyUserConsumer                            NotifyUserConsumer.php:22

EXTERNAL:
  - POST https://wms.internal/stock/reserve            StockClient.php:18

FS:
  - 无
```

**清单规则**:

- 每条带精确 `file:line`,没有就不列。
- 「无」必须明写,不允许省略整个分类,这样用户能区分「没查到」和「真没有」。
- READ/WRITE 的数据库标注应该带表名,Redis 标注应该带 key pattern。

### ## 异步副作用

```
1. 消息队列
   - OrderCreatedEvent → amq.topic / order.created
     消费者:NotifyUserConsumer (NotifyUserConsumer.php:22)

2. 事件监听器
   - OrderActivityLogger::onCreated()  [sync,主链路阻塞]   OrderActivityLogger.php:22
   - NotifyUserListener::onCreated()   [async]            NotifyUserListener.php:18

3. 后台任务 / Worker
   - 无

4. 定时器 / 延迟任务
   - ScheduledMessage:OrderExpireMessage,delay=30min     OrderService.php:155

5. 持久化恢复 / 启动脚本
   - 无
```

**5 类必写**,即使是「无」也要写出来。少写一类就是漏掉一个 bug 来源。

## 最小示例(简单 CRUD)

如果是简单查询接口(如 `GET /users/{id}`),允许把第 2/3 步合并:

```
## 入口
GET /users/{id},UserController.php:18 的 showAction

## 调用链
UserController::showAction(int $id)                  UserController.php:18
  └─ UserRepository::find($id)                       UserRepository.php:42  [READ db.users]
                                                                            [CACHE 命中 redis user:{id}]

## 数据读写
READ:
  - db.users (SELECT WHERE id=?)                     UserRepository.php:42
  - redis user:{id} (cache-aside, TTL 600)           UserRepository.php:38
WRITE: 无
CACHE: 命中 UserRepository.php:38,回源 UserRepository.php:42
MQ / EXTERNAL / FS: 无
```

但 4/5/6 段不允许省略 —— 即使是简单 CRUD,异步副作用 / 风险点 / 验证方式 都
要列出。简单接口的 bug 通常不在主路径,而在「忘了考虑」的边角。
