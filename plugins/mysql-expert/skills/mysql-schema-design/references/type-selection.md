# 类型选择详解

## 反例：类型选择不当

```sql
-- 问题 1: INT 主键，21 亿行后溢出
-- 问题 2: VARCHAR(255) 滥用，order_no 实际不超过 32 字符
-- 问题 3: FLOAT 存金额，精度丢失
-- 问题 4: utf8 不是真正的 UTF-8
-- 问题 5: 缺少 NOT NULL 和默认值
CREATE TABLE orders_bad (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_no    VARCHAR(255),
    amount      FLOAT,
    remark      TEXT,
    created_at  TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## ENUM 与 TINYINT 的选择

```sql
-- 推荐：TINYINT + 注释，扩展时只需加注释值，不需 ALTER
status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=draft 1=active 2=archived'

-- 不推荐：ENUM 在追加值时需要 ALTER TABLE，且顺序敏感
-- status ENUM('draft','active','archived') NOT NULL DEFAULT 'draft'
```

## DATETIME 与 TIMESTAMP 的区别

```sql
-- DATETIME: 8 字节，范围 1000-01-01 ~ 9999-12-31，不受时区转换影响，推荐用于业务时间
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

-- TIMESTAMP: 4 字节，范围 1970-01-01 ~ 2038-01-19，存储为 UTC 并按 session 时区转换
-- 仅在需要自动时区转换且数据不超过 2038 年时使用
last_login TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

## VARCHAR 长度选择原则

| 场景 | 推荐 | 说明 |
|------|------|------|
| 手机号 | `VARCHAR(20)` | 国际号码含国家码不超过 15 位 |
| 邮箱 | `VARCHAR(254)` | RFC 5321 规定最大 254 字符 |
| 业务编号 | `VARCHAR(32)` 或 `CHAR(n)` | 按实际格式定长 |
| 用户昵称 | `VARCHAR(100)` | 结合产品限制 |
| 地址 | `VARCHAR(500)` | 足够覆盖绝大多数地址 |

原则：按业务实际最大长度 + 20% 余量设定，不盲目用 255。
