# 服务与依赖注入

## Service 模式

```typescript
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { EmailService } from "../email/email.service";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    try {
      const user = this.repo.create(dto);
      const saved = await this.repo.save(user);
      await this.emailService.sendWelcome(saved.email);
      return saved;
    } catch (error) {
      const cause = error as { code?: string; message?: string };

      if (cause.code === "23505") {
        throw new ConflictException("邮箱已存在");
      }

      this.logger.error(`创建用户失败: ${cause.message ?? "unknown error"}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
  }
}
```

## 模块注册

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmailModule } from "../email/email.module";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## 自定义 Provider

```typescript
import { ConfigService } from "@nestjs/config";
import { ConsoleLogger } from "@nestjs/common";

export const apiKeyProvider = {
  provide: "API_KEY",
  useFactory: (configService: ConfigService) =>
    configService.getOrThrow<string>("API_KEY"),
  inject: [ConfigService],
};

export const configProvider = {
  provide: "APP_CONFIG",
  useFactory: (configService: ConfigService) => ({
    apiUrl: configService.getOrThrow<string>("API_URL"),
  }),
  inject: [ConfigService],
};

export const loggerProvider = {
  provide: ConsoleLogger,
  useClass: ConsoleLogger,
};
```

## 注入模式

```typescript
import { Inject, Injectable, Optional, Scope } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";

@Injectable()
export class ConstructorInjectedService {
  constructor(private readonly usersService: UsersService) {}
}

@Injectable()
export class TokenInjectedService {
  constructor(@Inject("API_KEY") private readonly apiKey: string) {}
}

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}
}

@Injectable()
export class OptionalDependencyService {
  constructor(
    @Optional()
    @Inject("CACHE_SERVICE")
    private readonly cacheService?: { get(key: string): Promise<unknown> },
  ) {}
}
```

## 快速检查

| 模式 | 适用场景 |
|---|---|
| 构造函数注入 | 默认方案，最易测也最清晰 |
| `@Inject(token)` | 注入字符串 token、Symbol 或工厂返回值 |
| `@Optional()` | 可选依赖，不希望模块强耦合 |
| Request Scope | 必须读取当前请求上下文 |
| Factory Provider | 运行时配置或 SDK 初始化 |
