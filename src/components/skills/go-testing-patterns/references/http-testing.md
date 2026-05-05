# HTTP 测试模式

## httptest.NewRecorder — 测试 Handler

`ResponseRecorder` 记录 handler 写入的内容，不启动真实网络监听。

```go
func TestHealthHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/health", nil)
    rec := httptest.NewRecorder()
    HealthHandler(rec, req)

    assert.Equal(t, http.StatusOK, rec.Code)
    assert.Equal(t, "application/json", rec.Header().Get("Content-Type"))
    assert.Contains(t, rec.Body.String(), `"status":"ok"`)
}
```

## httptest.NewServer — 完整服务器测试

测试真实 HTTP 行为（重定向、TLS、真实网络栈）时使用。

```go
func TestAPIClient(t *testing.T) {
    mux := http.NewServeMux()
    mux.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprint(w, `[{"id":1,"name":"Alice"}]`)
    })
    srv := httptest.NewServer(mux)
    defer srv.Close()

    users, err := NewClient(srv.URL).ListUsers(context.Background())
    assert.NoError(t, err)
    assert.Equal(t, "Alice", users[0].Name)
}
```

## 表驱动 HTTP 测试

```go
func TestHandler(t *testing.T) {
    tests := []struct {
        name, method, path, wantBody string
        body                         any
        wantStatus                   int
    }{
        {name: "正常获取", method: "GET", path: "/users/1", wantStatus: 200, wantBody: `"Alice"`},
        {name: "不存在", method: "GET", path: "/users/999", wantStatus: 404, wantBody: "not found"},
        {name: "创建", method: "POST", path: "/users", body: map[string]string{"name": "Bob"}, wantStatus: 201},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            var body io.Reader
            if tt.body != nil {
                b, _ := json.Marshal(tt.body)
                body = bytes.NewReader(b)
            }
            req := httptest.NewRequest(tt.method, tt.path, body)
            if tt.body != nil { req.Header.Set("Content-Type", "application/json") }
            rec := httptest.NewRecorder()
            handler(rec, req)
            assert.Equal(t, tt.wantStatus, rec.Code)
            if tt.wantBody != "" { assert.Contains(t, rec.Body.String(), tt.wantBody) }
        })
    }
}
```

## 测试中间件链

```go
func TestAuthMiddleware(t *testing.T) {
    inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, r.Header.Get("X-User-ID"))
    })
    handler := AuthMiddleware(inner)

    t.Run("有效 token", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/", nil)
        req.Header.Set("Authorization", "Bearer valid-token")
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        assert.Equal(t, http.StatusOK, rec.Code)
    })
}
```

## JSON 编解码与响应检查

```go
func TestJSONRoundTrip(t *testing.T) {
    body, _ := json.Marshal(map[string]any{"name": "Alice", "age": 30})
    req := httptest.NewRequest("POST", "/users", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()
    CreateUserHandler(rec, req)

    assert.Equal(t, http.StatusCreated, rec.Code)
    var got map[string]any
    json.Unmarshal(rec.Body.Bytes(), &got)
    assert.Equal(t, "Alice", got["name"])
}
```
