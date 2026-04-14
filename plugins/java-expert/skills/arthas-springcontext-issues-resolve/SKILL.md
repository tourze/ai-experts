---
name: arthas-springcontext-issues-resolve
description: 排查 Spring ApplicationContext、Bean 注册、条件装配与配置注入问题
---

# Arthas Spring Context 排查

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

- 直接 `getBean()` 或执行有副作用的表达式，扰动线上状态。
- 未区分父子容器，看到 `containsBean=false` 就认定 Bean 没注册。
- 全量打印所有 BeanDefinitionNames，导致输出爆炸且证据不聚焦。
- 不解释类加载器前提，直接给用户一个 `--classLoader` 哈希值让其盲试。
