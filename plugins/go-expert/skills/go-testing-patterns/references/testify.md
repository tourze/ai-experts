# Testify 断言与 Mock 速查

## assert vs require

| 包 | 行为 | 适用场景 |
|---|---|---|
| `assert` | 失败后继续执行 | 收集多个失败，一次性输出 |
| `require` | 失败后立即停止 | 前置条件不满足，后续无意义 |

```go
func TestExample(t *testing.T) {
    require.NotEmpty(t, cfg.DBURL, "数据库地址不能为空") // 前置条件
    assert.Equal(t, http.StatusOK, resp.StatusCode)        // 业务断言
    assert.Contains(t, body, "success")
}
```

## 常用断言函数

```go
assert.Equal(t, expected, actual)
assert.True(t, ok)
assert.False(t, failed)
assert.Nil(t, err)
assert.Empty(t, slice)
assert.Contains(t, slice, item)
assert.Len(t, slice, 3)
assert.NoError(t, err)
assert.ErrorIs(t, err, os.ErrNotExist)
```

## mock.Mock 使用

```go
type MockUserRepo struct { mock.Mock }

func (m *MockUserRepo) GetByID(ctx context.Context, id int64) (*User, error) {
    args := m.Called(ctx, id)
    if u := args.Get(0); u != nil {
        return u.(*User), args.Error(1)
    }
    return nil, args.Error(1)
}

func TestGetUser(t *testing.T) {
    repo := new(MockUserRepo)
    repo.On("GetByID", mock.Anything, int64(1)).
        Return(&User{ID: 1, Name: "Alice"}, nil)

    user, err := NewUserService(repo).Get(context.Background(), 1)

    assert.NoError(t, err)
    assert.Equal(t, "Alice", user.Name)
    repo.AssertExpectations(t) // 验证所有期望都被调用
}
```

关键 API：`On("方法名", 参数...).Return(返回值...)`、`mock.Anything`、`AssertExpectations`。

## suite.Suite 生命周期

```go
type UserSuite struct {
    suite.Suite
    db *sql.DB
}

func (s *UserSuite) SetupSuite() {    // 整个 suite 前执行一次
    db, _ := sql.Open("sqlite3", ":memory:")
    s.db = db
}
func (s *UserSuite) TearDownSuite() { s.db.Close() }  // suite 后
func (s *UserSuite) SetupTest() {     // 每个 Test 方法前
    s.db.Exec("DELETE FROM users")
}
func (s *UserSuite) TearDownTest() {} // 每个 Test 方法后

func (s *UserSuite) TestCreateUser() {
    _, err := s.db.Exec("INSERT INTO users (name) VALUES (?)", "Bob")
    s.Assert().NoError(err)
}

func TestUserSuite(t *testing.T) { suite.Run(t, new(UserSuite)) }
```

## testify vs 标准库

| 维度 | testify | 标准库 `testing` |
|---|---|---|
| 可读性 | `assert.Equal(t, a, b)` | `if a != b { t.Fatalf(...) }` |
| 依赖 | 第三方库 | 零依赖 |
| 适用 | 业务测试、可读性优先 | 库/工具包、追求零依赖 |

原则：项目级别统一选一种，不要混用。
