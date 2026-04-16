# 测试模式

## Mock Factory

```typescript
export const createMockRepository = <T>() => ({
  create: jest.fn<(entity: Partial<T>) => T>(),
  save: jest.fn<() => Promise<T>>(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  })),
});
```

## Service 单测基线

```typescript
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { createMockRepository } from "../test-utils/create-mock-repository";

describe("UsersService", () => {
  let service: UsersService;
  let repo: ReturnType<typeof createMockRepository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  it("创建用户成功", async () => {
    const dto = { email: "test@test.com", password: "Pass1234", name: "Test" };
    const user = { id: "1", ...dto } as User;

    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockReturnValue(user);
    repo.save.mockResolvedValue(user);

    await expect(service.create(dto)).resolves.toEqual(user);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(user);
  });

  it("邮箱重复时抛 ConflictException", async () => {
    repo.findOneBy.mockResolvedValue({ id: "1" } as User);

    await expect(
      service.create({ email: "test@test.com", password: "Pass1234", name: "Test" }),
    ).rejects.toThrow(ConflictException);
  });

  it("查询不存在的用户时抛 NotFoundException", async () => {
    repo.findOneBy.mockResolvedValue(null);

    await expect(service.findOne("missing")).rejects.toThrow(NotFoundException);
  });
});
```

## Controller 测试

```typescript
import { Test } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";

describe("UsersController", () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it("create 透传 Service 结果", async () => {
    const dto = { email: "test@test.com", password: "Pass1234", name: "Test" };
    const user = { id: "1", ...dto } as User;
    service.create.mockResolvedValue(user);

    await expect(controller.create(dto)).resolves.toEqual(user);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
```

## E2E 测试

```typescript
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("UsersController (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@test.com", password: "password" });

    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /users 创建用户", () => {
    return request(app.getHttpServer())
      .post("/users")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ email: "new@test.com", password: "Test1234", name: "New" })
      .expect(201)
      .expect(({ body }) => {
        expect(body.email).toBe("new@test.com");
      });
  });
});
```

## 快速检查

| 模式 | 用途 |
|---|---|
| `Test.createTestingModule()` | 构造 Nest 依赖图 |
| 仓储 mock factory | 减少重复 mock 搭建 |
| Controller 单测 | 验证参数传递、状态码与装饰器边界 |
| E2E + `supertest` | 验证真实路由、Guard、Pipe、Filter 链路 |
