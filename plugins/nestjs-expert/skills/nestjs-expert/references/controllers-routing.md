# 控制器与路由

## 带 Swagger 的 REST 控制器

```typescript
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

@Controller("users")
@ApiTags("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "创建用户" })
  @ApiCreatedResponse({ type: UserDto })
  create(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "分页查询用户" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<UserDto[]> {
    return this.usersService.findAll({ page, limit });
  }

  @Get(":id")
  @ApiParam({ name: "id", type: String, format: "uuid" })
  @ApiOkResponse({ type: UserDto })
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新用户" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "删除成功" })
  remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
```

## 嵌套路由

```typescript
import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";

@Controller("posts/:postId/comments")
@ApiTags("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findAll(@Param("postId", ParseUUIDPipe) postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Post()
  create(
    @Param("postId", ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, dto);
  }
}
```

## 全局前缀与版本控制

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI });
  await app.listen(3000);
}

void bootstrap();

// users.controller.ts
import { Controller } from "@nestjs/common";

@Controller({ path: "users", version: "1" }) // /api/v1/users
export class UsersV1Controller {}

@Controller({ path: "users", version: "2" }) // /api/v2/users
export class UsersV2Controller {}
```

## 快速检查

| 装饰器/管道 | 用途 |
|---|---|
| `@Controller("path")` | 定义路由前缀 |
| `@Get()` / `@Post()` | 绑定 HTTP 方法 |
| `@Param("name")` | 读取路径参数 |
| `@Query("name")` | 读取查询参数 |
| `DefaultValuePipe` | 给分页/过滤参数提供默认值 |
| `ParseUUIDPipe` / `ParseIntPipe` | 在控制器边界做类型校验 |
| `@ApiOperation()` / `@ApiResponse()` | 同步 Swagger 文档 |
