# Express 到 NestJS 迁移参考

## 什么时候值得迁移

- 现有 Express 项目已经出现目录失控、依赖反向引用、控制器臃肿或中间件职责不清。
- 需要统一做 DTO 校验、依赖注入、模块边界治理、Swagger 文档或测试基线。
- 团队准备引入 TypeScript、`class-validator`、Passport/JWT、ORM 和结构化模块设计。

## 不建议强迁的场景

- 只有少量简单 CRUD 接口，且近期没有复杂鉴权、验证和模块拆分需求。
- 主要目标是极小冷启动或一次性原型验证，框架约束反而会拖慢交付。

## 概念映射

| Express | NestJS | 差异 |
|---|---|---|
| `app.get("/path", handler)` | `@Get("/path")` | 由命令式注册改为声明式装饰器 |
| `express.Router()` | `@Controller()` | 路由按类聚合，天然形成模块边界 |
| 中间件 | Guard / Interceptor / Pipe / Filter | 按职责拆分，不再用一个 middleware 包打天下 |
| 手动 `require()` / `new Service()` | 构造函数依赖注入 | 依赖图交给 Nest 容器管理 |
| 手写参数校验 | DTO + `ValidationPipe` | 校验从运行时 if/else 迁到声明式约束 |

## 路由处理器迁移

### 迁移前：Express

```typescript
// routes/users.js
const express = require("express");
const router = express.Router();
const userService = require("../services/userService");

router.post("/", async (req, res, next) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: "email and name are required" });
    }

    const user = await userService.create({ email, name });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 迁移后：NestJS

```typescript
// users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(2)
  readonly name!: string;
}

// users/users.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

## 中间件迁移

### 认证：Middleware -> Guard

```typescript
// Express
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "no token provided" });
  }

  req.user = verifyToken(token);
  next();
}
```

```typescript
// NestJS
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = request.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException("缺少访问令牌");
    }

    request.user = await this.jwtService.verifyAsync(token);
    return true;
  }
}
```

### 日志：Middleware -> Interceptor

```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(
          `${request.method} ${request.url} ${response.statusCode} ${Date.now() - start}ms`,
        );
      }),
    );
  }
}
```

## 手动实例化迁移

### 迁移前：Express Service

```typescript
class UserService {
  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
  }
}
```

### 迁移后：NestJS Provider

```typescript
import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { EmailService } from "../email/email.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}
}
```

## 错误处理迁移

```typescript
// common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        path: request.url,
        message: exception.getResponse(),
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      path: request.url,
      message: "Internal server error",
    });
  }
}
```

## 迁移检查清单

- 先按领域拆模块，再把 Express 路由归类到 Controller，避免机械复制。
- 把原 middleware 按职责拆到 Guard / Interceptor / Pipe / Filter，不要保留巨型万能中间件。
- 用 DTO + `ValidationPipe` 替换手写参数校验；用异常类替换 `res.status(...).json(...)` 分支。
- 把手动创建的 repository/service/client 迁到 provider，统一交给 Nest 容器管理。
- 迁移后至少补三类测试：Service 单测、Controller 或 Guard 单测、关键路径 E2E。
