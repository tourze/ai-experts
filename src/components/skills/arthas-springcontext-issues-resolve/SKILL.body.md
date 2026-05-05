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
