# DTO 与验证

## 基础 DTO 模式

```typescript
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from "@nestjs/swagger";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export class CreateUserDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: "密码至少包含一个大写字母和一个数字",
  })
  readonly password!: string;

  @ApiProperty({ minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  readonly name!: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole = UserRole.USER;
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["password"] as const),
) {}

export class LoginDto extends PickType(CreateUserDto, ["email", "password"] as const) {}
```

## 嵌套对象与数组校验

```typescript
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class AddressDto {
  @ApiProperty()
  @IsString()
  readonly city!: string;

  @ApiProperty()
  @IsString()
  readonly detail!: string;
}

export class OrderItemDto {
  @ApiProperty()
  @IsUUID()
  readonly productId!: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  readonly quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  readonly items!: OrderItemDto[];

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  readonly shippingAddress!: AddressDto;
}
```

## 自定义校验装饰器

```typescript
import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须同时包含大小写字母、数字和特殊字符`;
        },
      },
    });
  };
}
```

## 转换与清洗

```typescript
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

export class QueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  readonly search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  readonly isActive: boolean = true;
}
```

## 全局启用 ValidationPipe

```typescript
// main.ts
import { ValidationPipe } from "@nestjs/common";

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

## 快速检查

| 能力 | 用法 |
|---|---|
| 字段校验 | `@IsString()`、`@IsEmail()`、`@MinLength()` |
| 枚举与可选值 | `@IsEnum()`、`@IsOptional()` |
| 嵌套对象 | `@ValidateNested()` + `@Type(() => Class)` |
| DTO 复用 | `PartialType()`、`OmitType()`、`PickType()` |
| 参数清洗 | `@Transform()` |
