---
name: nestjs-expert
description: 用于构建或审查 NestJS 模块、控制器、服务、DTO、Guard、Interceptor、Pipe、Swagger 文档与 Jest 测试。用户提到 NestJS、.module.ts、.controller.ts、.service.ts、ValidationPipe、JWT/Passport、TypeORM/Prisma、GraphQL 或 Express 迁移时启用。
version: "1.2.0"
alwaysApply: false
---

## 适用场景

- 需要创建、修改或排查 `*.module.ts`、`*.controller.ts`、`*.service.ts`、`dto/*.dto.ts`、Guard、Interceptor、Pipe、Filter。
- 需要设计 NestJS 模块边界、依赖注入关系、REST/GraphQL 接口、Swagger 文档、认证授权或配置加载。
- 需要同时处理 `TypeORM`、`Prisma`、`Passport/JWT`、`ConfigModule`、`class-validator`、Jest 单测或 E2E 测试。
- 需要把 Express/原生 Node.js API 重构为 NestJS 分层结构时，先读 [Express 迁移参考](references/migration-from-express.md)。
- 需要补强类型建模、Jest 细节或 OpenAPI 合同生成时，可联动现有技能 `typescript-magician`、`javascript-typescript-jest`、`openapi-spec-generation`。

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

1. 先定义模块边界：`*.module.ts` 中写清 imports / providers / exports。
2. 再写 DTO 与验证规则，明确入参、枚举、默认值与嵌套对象。
3. 然后落控制器：路由、鉴权、Swagger、请求参数管道。
4. 最后实现服务层与仓储访问，并补对应测试。

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  readonly password!: string;
}
```

```typescript
// users.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

```typescript
// users.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: "创建用户" })
  @ApiCreatedResponse({ description: "用户创建成功" })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

```typescript
// users.service.ts
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new ConflictException("邮箱已注册");
    }

    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return user;
  }
}
```

### 3. 测试至少覆盖“成功路径 + 失败路径”

```typescript
// users.service.spec.ts
import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";

const mockRepo = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo }
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it("邮箱重复时抛出 ConflictException", async () => {
    mockRepo.findOneBy.mockResolvedValue({ id: "1", email: "user@example.com" });

    await expect(
      service.create({
        email: "user@example.com",
        password: "Pass1234",
        name: "Test User",
      }),
    ).rejects.toThrow(ConflictException);
  });
});
```

## 检查清单

- `AppModule` 或模块级入口是否启用了 `ValidationPipe`、必要的 Guard / Interceptor / Filter。
- DTO 是否覆盖所有输入边界，是否使用 `readonly`、枚举、嵌套校验与类型转换。
- Service 是否只依赖抽象或 provider，不在运行时直接创建外部依赖实例。
- 控制器是否声明了 `@ApiTags`、`@ApiOperation`、`@ApiResponse` 等 Swagger 注解。
- 配置、密钥、数据库连接与第三方 SDK 初始化是否全部走配置模块。
- 新增逻辑是否同时覆盖单测，涉及路由/认证时是否补了控制器或 E2E 测试。

## 反模式

- 在 Controller 中直接操作 Repository、拼 SQL、写事务或堆业务分支。
- 直接传递 `req.body`、`req.query`、`req.params` 到 Service，而不经过 DTO 和管道。
- 滥用 `any`、`forwardRef()`、属性注入或全局可变单例掩盖模块设计问题。
- 认证逻辑散落在控制器里，或者把密码、Token、堆栈信息直接返回给客户端。
- 只写 happy path，不验证异常路径、权限边界、配置缺失与 DTO 校验失败。
