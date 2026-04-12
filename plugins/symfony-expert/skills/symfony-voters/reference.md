# Symfony Voters 参考文档 (Symfony)

本参考文档包含 `symfony-voters` 的实现细节和审查标准。


## Skill 操作检查清单

### 设计检查清单
- 首先确认操作边界和不变量。
- 在保持契约正确性的前提下最小化范围。
- 同时测试正常路径和异常路径行为。

### 验证命令
- ./vendor/bin/phpunit --filter=Voter
- php bin/console debug:container security
- ./vendor/bin/phpstan analyse

### 需要测试的失败模式
- 无效负载或未授权操作者。
- 边界值/未找到的情况。
- 异步流程的重试或部分失败行为。
