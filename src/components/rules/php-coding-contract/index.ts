import { defineRule, defineRuleBody, Platform } from "../../sdk";

export const phpCodingContractRule = defineRule({
  id: "php-coding-contract",
  title: "PHP Coding Contract",
  description: "读写 PHP 源码、测试、静态分析或 Composer/PHPUnit 配置时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: defineRuleBody({
    lines: [
      "- 所有生产 PHP 文件默认 `declare(strict_types=1)`；参数、返回值、属性优先用原生类型，数组用 `array{}`、`list<T>` 或 `array<K,V>` 补结构，避免裸 `array` 和偷懒 `mixed`。",
      "- 跨层数据使用 readonly DTO、值对象或 enum；控制器只做验证、鉴权、调用服务和响应映射，业务规则放服务或领域对象，依赖用构造函数注入。",
      "- 只捕获能处理或转换的异常；用户可见消息与 SQL、路径、堆栈等内部细节分离，批处理要保留成功项、失败项和失败原因。",
      "- 大文件、分页和日志扫描只有在调用方能单次顺序消费时才用 `Generator` / `iterable`；持有文件句柄、游标或锁时必须 `try` / `finally` 清理。",
      "- 协程和长驻进程禁止同步阻塞 I/O；共享状态用 Channel / Mutex，连接有心跳和超时，worker 有 max_request、重启或缓存清理策略。",
      "- PHPUnit / Pest 测试优先用 PHP 8 属性，mock 只隔离外部边界；集成测试必须说明状态清理、事务边界和环境依赖。",
      "- 改 PHP 后优先跑项目已有 PHPStan / Psalm / PHPUnit / Pest / Composer 验证命令，并在结果中报告未验证项。",
    ],
  }),
  paths: [
    "**/*.php",
    "composer.json",
    "composer.lock",
    "phpunit.xml",
    "phpunit.xml.dist",
    "phpstan.neon",
    "phpstan.neon.dist",
    "psalm.xml",
    "psalm.xml.dist",
    ".php-cs-fixer.php",
    "rector.php",
  ],
  priority: 10,
});
