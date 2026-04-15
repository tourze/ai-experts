# Schema Design 代码模式

## 基础业务表 — identity 主键 + 原生类型

```sql
CREATE TABLE order_item (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
    product_id  BIGINT NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity    INT    NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    currency    TEXT   NOT NULL DEFAULT 'CNY' CHECK (currency ~ '^[A-Z]{3}$'),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  order_item IS '订单行项目';
COMMENT ON COLUMN order_item.unit_price IS '单价，精确到分';
```

## 唯一约束与表达式索引

```sql
-- 业务唯一：同一租户下邮箱不重复（不区分大小写）
ALTER TABLE app_user
    ADD CONSTRAINT uq_app_user_tenant_email
    UNIQUE (tenant_id, email);

-- 大小写不敏感匹配，配合表达式索引
CREATE UNIQUE INDEX idx_app_user_tenant_lower_email
    ON app_user (tenant_id, lower(email));
```

## CHECK 约束保护业务不变量

```sql
ALTER TABLE subscription
    ADD CONSTRAINT chk_subscription_dates
    CHECK (started_at < ended_at);

ALTER TABLE payment
    ADD CONSTRAINT chk_payment_amount_positive
    CHECK (amount > 0);

ALTER TABLE account
    ADD CONSTRAINT chk_account_status_valid
    CHECK (status IN ('active', 'suspended', 'closed'));
```

## 带 DEFAULT 和 NOT NULL 的枚举式列

```sql
CREATE TABLE ticket (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       TEXT        NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
    priority    TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status      TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assignee_id BIGINT      REFERENCES staff(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
