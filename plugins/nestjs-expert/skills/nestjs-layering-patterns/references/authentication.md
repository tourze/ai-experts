# 认证与 Guard

## JWT Strategy 与公共路由装饰器

```typescript
// auth/constants.ts
export const IS_PUBLIC_KEY = "isPublic";
export const ROLES_KEY = "roles";

// auth/decorators/public.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../constants";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// auth/jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

## JWT Guard 与角色控制

```typescript
// auth/decorators/roles.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { ROLES_KEY } from "../constants";

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// auth/guards/jwt-auth.guard.ts
import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(error: unknown, user: TUser | null | false) {
    if (error || !user) {
      throw error instanceof Error
        ? error
        : new UnauthorizedException("无效或缺失的访问令牌");
    }

    return user;
  }
}

// auth/guards/roles.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../constants";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    if (request.user?.role && roles.includes(request.user.role)) {
      return true;
    }

    throw new ForbiddenException("当前账号没有访问该资源的权限");
  }
}
```

## Auth Service 与模块装配

```typescript
import * as bcrypt from "bcrypt";
import { Injectable, Module, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User } from "../users/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException("邮箱或密码错误");
    }

    return user;
  }

  async login(user: Pick<User, "id" | "email" | "role">) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "7d" }),
    };
  }

  async register(dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 10);
    return this.usersService.create({ ...dto, password });
  }
}

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

## 全局注册

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";

@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

## 快速检查

| 组件 | 作用 |
|---|---|
| `JwtStrategy` | 解析并校验 JWT |
| `JwtAuthGuard` | 保护受限路由 |
| `RolesGuard` | 基于角色做细粒度授权 |
| `@Public()` | 标记无需登录的端点 |
| `@Roles("admin")` | 标记需要特定角色的端点 |
