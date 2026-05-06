
## Copy 语义速查

| 类型 | 赋值复制内容 | 底层数据共享 |
|------|-------------|-------------|
| array | 整个数组值 | 否 |
| slice | header（ptr/len/cap） | 是（backing array） |
| map | 指针 | 是 |
| channel | 指针 | 是 |
| string | header（ptr/len） | 是（不可变，安全） |
| struct | 逐字段复制 | 值类型否；引用字段是 |
