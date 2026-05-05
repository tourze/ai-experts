# Go 注入类漏洞深度参考

## SQL 注入

用户输入拼接到 SQL 语句，攻击者可改变查询语义。

```go
// FAIL
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)
db.Query(query) // 攻击输入: ' OR 1=1 --

// PASS — 参数化查询
db.Query("SELECT * FROM users WHERE email = $1", email)

// 动态 IN 子句
ph := strings.Repeat("?,", len(ids))
ph = ph[:len(ph)-1]
args := make([]any, len(ids))
for i, id := range ids { args[i] = id }
db.Query(fmt.Sprintf("SELECT id IN (%s)", ph), args...)
```

动态表名/列名不能用占位符，必须白名单校验：

```go
var allowedSort = map[string]string{"name": "name", "email": "email", "date": "created_at"}
func safeSort(key string) string {
    if col, ok := allowedSort[key]; ok { return col }
    return "id"
}
```

## 命令注入

通过 `sh -c` 或拼接将用户输入传入 shell。

```go
// FAIL — shell 拼接
exec.Command("sh", "-c", fmt.Sprintf("convert %s -resize 100x100 %s", input, output))

// PASS — 参数分离，不经 shell 解析
exec.Command("convert", input, "-resize", "100x100", output)

// PASS — 白名单限制可执行命令
var allowedCmds = map[string]string{"ping": "/bin/ping", "dig": "/usr/bin/dig"}
func runAllowed(name string, args ...string) error {
    path, ok := allowedCmds[name]
    if !ok { return fmt.Errorf("disallowed: %s", name) }
    return exec.Command(path, args...).Run()
}
```

## XSS（跨站脚本）

用户输入未转义直接嵌入 HTML。

```go
// FAIL
fmt.Fprintf(w, "<div>%s</div>", comment)          // 拼接 HTML
template.HTML(userInput)                            // 绕过转义

// PASS — html/template 自动按上下文转义
const tpl = `<div>{{.Comment}}</div>`               // HTML 上下文
const jsTpl = `<script>var name = {{.Name | js}};</script>` // JS 上下文
```

| 上下文 | 转义行为 | 注意 |
|--------|---------|------|
| HTML 文本/属性 | 实体编码 | 属性值必须加引号 |
| JS | Unicode 转义 | 禁用 `template.JS` |
| URL | 百分号编码 | 禁用 `template.URL` |
| CSS | Unicode 转义 | 禁用 `template.CSS` |

## SSRF（服务端请求伪造）

服务端根据用户输入发起 HTTP 请求，可探测内网。

```go
// FAIL
http.Get(userProvidedURL)

// PASS — 白名单 + 拒绝内网 IP
func safeFetch(rawURL string) (*http.Response, error) {
    u, err := url.Parse(rawURL)
    if err != nil { return nil, err }
    if u.Scheme != "https" { return nil, fmt.Errorf("scheme not allowed") }
    if !isAllowedHost(u.Hostname()) { return nil, fmt.Errorf("host not allowed") }
    ips, _ := net.LookupHost(u.Hostname())
    for _, ip := range ips {
        if isPrivateIP(net.ParseIP(ip)) { return nil, fmt.Errorf("private IP rejected") }
    }
    return http.Get(u.String())
}
```

## 路径穿越

`../` 可跳出预期目录。

```go
// FAIL
path := filepath.Join("/data/uploads", userInput)
os.ReadFile(path) // 可读到 /etc/passwd

// 防御一：filepath.Clean + 前缀检查
func safePath(base, userPath string) (string, error) {
    cleaned := filepath.Clean(filepath.Join(base, userPath))
    if !strings.HasPrefix(cleaned, filepath.Clean(base)+string(os.PathSeparator)) {
        return "", fmt.Errorf("path traversal detected")
    }
    return cleaned, nil
}

// 防御二：os.Root（Go 1.24+，推荐）
root, _ := os.OpenRoot("/data/uploads")
defer root.Close()
f, err := root.Open(userPath) // 穿越直接报错
```
