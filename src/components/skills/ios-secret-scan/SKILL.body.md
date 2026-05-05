## 扫描清单

### 凭据搜索

```bash
# Firebase / Google
strings "$BINARY" | rg 'AIza[0-9A-Za-z_-]{35}|[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com'

# AWS
strings "$BINARY" | rg 'AKIA[0-9A-Z]{16}|aws_secret_access_key'

# Stripe
strings "$BINARY" | rg 'sk_live_[a-zA-Z0-9]{24,}|pk_live_'

# 通用 API key / secret
strings "$BINARY" | rg -i 'api[_-]?key|api[_-]?secret|bearer |authorization'
```

### ATS 配置审计

```bash
plutil -p Info.plist | rg -A5 'NSAppTransportSecurity'
# 危险信号：NSAllowsArbitraryLoads = true
# 危险信号：NSExceptionAllowsInsecureHTTPLoads = true
```

### 弱加密检查

```bash
strings "$BINARY" | rg 'CC_MD5|MD5|ECB|DES|RC4'
rg 'kSecAttrAccessibleAlways' headers/  # Keychain 弱保护
```

### 越狱检测 / 反调试

```bash
strings "$BINARY" | rg '/Applications/Cydia|/bin/bash|canOpenURL.*cydia|ptrace'
rg 'IOSSecuritySuite|isSafeDevice|isJailbroken' headers/
```

## 发现报告格式

```markdown
### [严重级别] 服务 — 凭据类型

- **值**: `AIza...[后4位]`（已脱敏）
- **位置**: strings 输出第 N 行 / 类名
- **Client-safe**: 是 / 否
- **影响**: 攻击者可做什么
- **误报概率**: 低 / 中 / 高
- **验证**: 如何测试是否有效
- **修复**: 具体修复步骤
```

## 反模式

### FAIL: 命中即报告

```
strings 输出：AIzaSyB1234567890abcdefghijklm
→ 报告："Critical: Hardcoded Google API Key"
→ 实际：Firebase API key，设计上就是嵌入客户端的，severity=Info
```

### PASS: 分类 + 影响评估

```
1. 识别：AIzaSy... → Google API key
2. 分类：Firebase API key (client-safe by design)
3. 但检查：该 key 是否也被用作 Maps/Geocoding API？
4. 检查：Firestore 规则是否 allow read/write: if true?
5. 结论：key 本身低风险，但 Firestore 规则开放 → Medium
```
