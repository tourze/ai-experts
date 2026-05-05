## 适用场景

- Bean 找不到、注入到错误实现、`@Conditional` / `@Profile` 判断异常。
- 线上环境配置值与预期不一致，需要确认属性来源。
- 怀疑选错了 `ApplicationContext`、父子容器或类加载器。
- 如果核心症状是 CPU 飙高而不是 Bean / 配置问题，转到 [arthas-cpu-high](../arthas-cpu-high/SKILL.md)。

## 核心约束

- 优先只读查询：先用 `containsBean`、`getBeanNamesForType`、`Environment`，不要直接 `getBean()` 触发初始化副作用。
- 严格限量：`vmtool -l` 必须给上限，任何批量输出都要截断。
- 先确认上下文再查 Bean：多容器应用里，选错 `ApplicationContext` 会让后续结论全部失真。
- 若使用 `--classLoader` / `--classLoaderClass`，必须先解释为什么当前类加载器不对。

## 代码模式

```bash
# 先枚举 ApplicationContext，最多拿 5 个实例
vmtool --action getInstances \
  --className org.springframework.context.support.AbstractApplicationContext \
  -l 5
```

```bash
# 查询配置值与来源
vmtool --action getInstances \
  --className org.springframework.context.support.AbstractApplicationContext \
  -l 1 \
  --express 'instances[0].getEnvironment().getProperty("server.port")'
```

```bash
# 按 Bean 名确认是否存在，避免直接 getBean()
vmtool --action getInstances \
  --className org.springframework.context.support.AbstractApplicationContext \
  -l 1 \
  --express 'instances[0].containsBean("fooService")'
```

```bash
# 按类型查候选实现，最适合定位“实际注入的是谁”
vmtool --action getInstances \
  --className org.springframework.context.support.AbstractApplicationContext \
  -l 1 \
  --express 'instances[0].getBeanNamesForType(@com.example.OrderService@class)'
```

## 检查清单

- 是否先确认拿到的是正确的 `ApplicationContext` 与类加载器。
- 是否优先使用 `containsBean*` / `getBeanNamesForType`，避免提前初始化 Bean。
- 如果属性值异常，是否同时给出了“值”和“来源”。
- 如果出现多个候选 Bean，是否明确列出候选名并说明装配规则。
- 如果 `ClassNotFound`，是否回溯到类加载器选择，而不是误判 Bean 不存在。

## 反模式

### FAIL: getBean 触发初始化

```bash
vmtool ... --express 'instances[0].getBean("lazyInitBean")'
# → 触发初始化，改变线上状态
```

### PASS: containsBean 只读检查

```bash
vmtool ... --express 'instances[0].containsBean("lazyInitBean")'
# 返回 true/false，不触发初始化
```

### FAIL: 只看 containsBean 不看容器

```
containsBean("fooService") → false
结论："Bean 没注册"
→ 实际查的是父容器，Bean 在子容器里
```

### PASS: 先确认容器再查 Bean

```bash
vmtool --action getInstances --className AbstractApplicationContext -l 5  # 枚举容器
vmtool ... --express 'instances[2].getDisplayName()'                       # 确认是哪个
vmtool ... --express 'instances[2].containsBean("fooService")'             # 在正确容器查
```
