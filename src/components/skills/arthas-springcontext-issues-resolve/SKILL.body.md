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
