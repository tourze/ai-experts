# 入口类型与定位线索

第 1 步「入口定位」用的查找清单。按目标系统的栈选择对应表,跑 `Grep` / `Glob`
找到入口文件后,记录 `file:line` 写进输出的「## 入口」段。

## HTTP 路由

| 框架 / 栈 | 定位线索 |
|---|---|
| Symfony | `#[Route(...)]` 注解、`config/routes/*.yaml`、`*Controller.php` |
| Laravel | `routes/web.php`、`routes/api.php`、`Route::` 调用、`*Controller.php` |
| ThinkPHP | `route/*.php`、`config/route.php` |
| Webman | `config/route.php`、`*Controller.php` |
| Express / NestJS | `router.get/post/put`、`@Controller`、`@Get`/`@Post` |
| Fastify / Koa | `app.route`、`router.register`、`app.use` |
| Spring Boot | `@RestController`、`@RequestMapping`、`@GetMapping`、`@PostMapping` |
| Gin / Echo | `r.GET`、`r.POST`、`e.Group` |
| Flask | `@app.route`、`@blueprint.route` |
| FastAPI | `@app.get`、`@app.post`、`APIRouter` |
| Django | `urls.py` 的 `path(...)`、`url(...)` |
| Rails | `config/routes.rb`、`resources :xxx` |

## CLI 命令 / 后台脚本

| 框架 | 定位线索 |
|---|---|
| Symfony Console | `#[AsCommand]`、`extends Command`、`bin/console` |
| Laravel Artisan | `extends Command`、`app/Console/Commands/` |
| ThinkPHP | `command.php`、`extends Command` |
| Cobra (Go) | `cobra.Command`、`AddCommand` |
| Click (Python) | `@click.command`、`@click.group` |
| Yargs (Node) | `yargs.command`、`yargs.argv` |

## 消息消费者

| 中间件 | 定位线索 |
|---|---|
| Symfony Messenger | `MessageHandlerInterface`、`#[AsMessageHandler]` |
| RabbitMQ (Spring) | `@RabbitListener` |
| RabbitMQ (Node) | `amqplib`、`channel.consume` |
| Kafka | `@KafkaListener`、`consumer.subscribe`、`sarama` |
| Redis Stream | `XREADGROUP`、`stream.read` |
| Bull / BullMQ | `queue.process`、`worker.on('completed')` |
| Celery | `@app.task`、`@shared_task` |
| Workerman | `Worker::__construct`、`onMessage` |

## 定时任务

| 调度器 | 定位线索 |
|---|---|
| Symfony Scheduler | `#[AsCronTask]`、`#[AsPeriodicTask]` |
| Laravel | `app/Console/Kernel.php` 的 `schedule()` |
| Spring | `@Scheduled` |
| Crontab | `crontab -l`、`/etc/cron.d/*`、Dockerfile 里的 cron 配置 |
| GitHub Actions | `.github/workflows/*.yml` 的 `schedule:` |
| Kubernetes | `CronJob` 资源、`schedule` 字段 |

## 事件 / 监听器

| 框架 | 定位线索 |
|---|---|
| Symfony EventDispatcher | `#[AsEventListener]`、`EventSubscriberInterface` |
| Laravel | `Event::listen`、`app/Listeners/`、`app/Events/` |
| Spring | `@EventListener`、`ApplicationEventPublisher` |
| Node EventEmitter | `emitter.on(...)`、`emitter.emit(...)` |

## Webhook / RPC

| 协议 | 定位线索 |
|---|---|
| Webhook | URL 中含 `/webhook/` 或 `/callback/`、签名验证函数 |
| JSON-RPC | `JsonRpcServer`、`@JsonRpcMethod` |
| gRPC | `*.proto` 文件、`@GrpcMethod`、`grpc.ServiceServerImpl` |
| GraphQL | `Query`/`Mutation` resolver、`schema.graphql` |

## 找不到入口怎么办

1. 让用户给一段 URL / 方法签名 / 错误堆栈底部的文件名。
2. 用 `git log -- <file>` 看最近改这个文件的人/commit,大概率能找到上下文。
3. 检查项目根的 `README.md` / `CLAUDE.md` / `AGENTS.md` 是否记载了入口约定。
4. 上面 3 步都失败 → 停下来问用户,**禁止**编造一个看起来像的入口。
