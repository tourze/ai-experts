## 核心约束

- 控制器只负责协议层：参数解析、鉴权装饰器、响应码与 Swagger 注解；业务规则放在 Service/Use Case。
- 所有输入边界都必须通过 DTO + `class-validator` + `ValidationPipe`，禁止把原始 `req.body` 直接传入服务层。
- 统一使用构造函数注入与 `@Injectable()`；禁止手写 `new Service()` 绕过 Nest 容器。
- 配置、密钥、端口、第三方地址必须来自 `ConfigModule` 或环境变量；禁止写死在源码与示例里。
- Service 层抛出明确的 HTTP/领域异常，避免返回 `null`、魔法字符串或吞异常。
- 默认要求补单元测试；涉及控制器、路由、认证、全局管道或模块装配时，再补 Controller/E2E 验证。

## 代码模式

### 1. 先按问题类型加载参考资料

| 主题 | 参考文件 | 何时加载 |
|---|---|---|
| 控制器与路由 | `references/controllers-routing.md` | REST 路由、参数管道、版本控制、Swagger |
| 服务与依赖注入 | `references/services-di.md` | Provider、Repository、作用域、模块导出 |
| DTO 与验证 | `references/dtos-validation.md` | `class-validator`、嵌套对象、类型转换 |
| 认证与授权 | `references/authentication.md` | JWT、Passport、Guard、`@Public()`、RBAC |
| 测试 | `references/testing-patterns.md` | 单测、控制器测试、E2E、mock 仓储 |
| Express 迁移 | `references/migration-from-express.md` | 旧 Express 服务向 NestJS 重构 |

### 2. 交付顺序固定，先骨架再细节

交付顺序、DTO/Module/Controller/Service 完整骨架见 [references/basic-scaffold.md](references/basic-scaffold.md)。

### 3. 测试至少覆盖"成功路径 + 失败路径"

单测示例见 [references/testing-patterns.md](references/testing-patterns.md)：用 `Test.createTestingModule` 注入 mock Repository，分别断言创建成功与 `ConflictException` 抛出。

## 检查清单

- `AppModule` 或模块级入口是否启用了 `ValidationPipe`、必要的 Guard / Interceptor / Filter。
- DTO 是否覆盖所有输入边界，是否使用 `readonly`、枚举、嵌套校验与类型转换。
- Service 是否只依赖抽象或 provider，不在运行时直接创建外部依赖实例。
- 控制器是否声明了 `@ApiTags`、`@ApiOperation`、`@ApiResponse` 等 Swagger 注解。
- 配置、密钥、数据库连接与第三方 SDK 初始化是否全部走配置模块。
- 新增逻辑是否同时覆盖单测，涉及路由/认证时是否补了控制器或 E2E 测试。

## 反模式

### FAIL: Controller 操作 Repository

```typescript
@Controller('users')
export class UsersController {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  @Post()
  async create(@Req() req) { // 直接读 req
    const existing = await this.repo.findOneBy({ email: req.body.email });
    if (existing) throw new ConflictException();
    return this.repo.save(req.body); // 绕过 DTO + 验证
  }
}
```

### PASS: Controller 只做协议层

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) { // DTO 自动校验
    return this.usersService.create(dto);
  }
}
```

### FAIL: 返回整个 Entity

```typescript
return user; // 包含 passwordHash、internalNotes
```

### PASS: DTO/ResponseSerializer 隔离

```typescript
@UseInterceptors(ClassSerializerInterceptor)
async findOne(@Param('id') id: string): Promise<UserResponseDto> {
  return plainToInstance(UserResponseDto, await this.usersService.findOne(id));
}
```
