# iOS 键盘与输入模式

键盘处理、文本输入和硬件键盘支持的全面指南。

## 软件键盘类型

### 选择合适的键盘

将键盘与预期输入匹配：

| 输入类型 | 键盘 | UIKeyboardType |
|---------|------|----------------|
| 常规文本 | 默认 | `.default` |
| 邮箱 | 邮箱优化（@ 和 . 突出） | `.emailAddress` |
| URL | URL 优化（/, .com） | `.URL` |
| 电话号码 | 数字键盘 | `.phonePad` |
| 数字（带标点） | 数字 + 标点 | `.numbersAndPunctuation` |
| 仅数字 | 十进制键盘 | `.decimalPad` |
| Twitter 账号 | Twitter 键盘 | `.twitter` |
| 网页搜索 | 搜索键盘 | `.webSearch` |
| 仅 ASCII | ASCII 键盘 | `.asciiCapable` |

### SwiftUI 实现

```swift
TextField("Email", text: $email)
    .keyboardType(.emailAddress)
    .textContentType(.emailAddress)
    .autocapitalization(.none)
    .disableAutocorrection(true)
```

### UIKit 实现

```swift
textField.keyboardType = .emailAddress
textField.textContentType = .emailAddress
textField.autocapitalizationType = .none
textField.autocorrectionType = .no
```

---

## 文本内容类型

通过指定内容类型启用自动填充：

| 内容 | textContentType | 启用功能 |
|------|-----------------|---------|
| 姓名 | `.name` | 联系人自动填充 |
| 名 | `.givenName` | |
| 姓 | `.familyName` | |
| 邮箱 | `.emailAddress` | 邮箱自动填充 |
| 电话 | `.telephoneNumber` | 电话自动填充 |
| 地址 | `.streetAddressLine1` | 地址自动填充 |
| 城市 | `.addressCity` | |
| 州 | `.addressState` | |
| 邮编 | `.postalCode` | |
| 国家 | `.countryName` | |
| 信用卡 | `.creditCardNumber` | 摄像头扫描卡片 |
| 用户名 | `.username` | 钥匙串自动填充 |
| 密码 | `.password` | 钥匙串自动填充 |
| 新密码 | `.newPassword` | 密码生成 |
| 一次性验证码 | `.oneTimeCode` | 短信自动填充 |

### 密码和登录字段

```swift
// 登录表单
TextField("Email", text: $email)
    .textContentType(.username)
    .keyboardType(.emailAddress)

SecureField("Password", text: $password)
    .textContentType(.password)

// 注册表单
SecureField("Create Password", text: $newPassword)
    .textContentType(.newPassword)
```

### 一次性验证码（双因素认证）

```swift
TextField("Verification Code", text: $code)
    .textContentType(.oneTimeCode)
    .keyboardType(.numberPad)
```

当设置此内容类型时，iOS 会自动从短信中建议验证码。

---

## 输入辅助视图

### 何时使用

输入辅助视图出现在键盘上方，用于：
- 字段间导航（上一个/下一个）
- 自定义操作（完成、格式化按钮）
- 上下文相关工具

### 标准工具栏模式

```swift
struct FormTextField: View {
    @Binding var text: String
    @FocusState private var isFocused: Bool

    var body: some View {
        TextField("Value", text: $text)
            .focused($isFocused)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") {
                        isFocused = false
                    }
                }
            }
    }
}
```

### 多字段导航

```swift
struct FormView: View {
    @FocusState private var focusedField: Field?

    enum Field {
        case firstName, lastName, email
    }

    var body: some View {
        Form {
            TextField("First Name", text: $firstName)
                .focused($focusedField, equals: .firstName)

            TextField("Last Name", text: $lastName)
                .focused($focusedField, equals: .lastName)

            TextField("Email", text: $email)
                .focused($focusedField, equals: .email)
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Button(action: focusPrevious) {
                    Image(systemName: "chevron.up")
                }
                .disabled(!canFocusPrevious)

                Button(action: focusNext) {
                    Image(systemName: "chevron.down")
                }
                .disabled(!canFocusNext)

                Spacer()

                Button("Done") {
                    focusedField = nil
                }
            }
        }
    }
}
```

---

## 键盘避让

### 自动行为（SwiftUI）

SwiftUI 在大多数情况下会自动适应键盘：
- ScrollViews 滚动以保持聚焦字段可见
- 安全区域会根据键盘高度调整

### 手动键盘处理

```swift
struct KeyboardAdaptive: ViewModifier {
    @State private var keyboardHeight: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .padding(.bottom, keyboardHeight)
            .onReceive(Publishers.keyboardHeight) { height in
                withAnimation(.easeOut(duration: 0.25)) {
                    keyboardHeight = height
                }
            }
    }
}
```

### 最佳实践

1. **滚动以显示字段** - 聚焦字段应可见
2. **不要遮盖重要操作** - 提交按钮应保持可访问
3. **对调整进行动画** - 匹配键盘动画（0.25 秒缓出）
4. **在不同设备上测试** - 键盘高度各不相同

---

## 硬件键盘支持

### 为何重要

iPad 通常使用硬件键盘。应用应：
- 支持标准键盘快捷键
- 提供可发现性
- 在连接硬件键盘时不损坏功能

### 应支持的标准快捷键

| 快捷键 | 操作 | 备注 |
|-------|------|------|
| ⌘N | 新建 | 标准创建 |
| ⌘S | 保存 | |
| ⌘⌫ | 删除 | 带确认 |
| ⌘F | 查找/搜索 | |
| ⌘Z | 撤销 | |
| ⌘⇧Z | 重做 | |
| ⌘C/⌘V/⌘X | 复制/粘贴/剪切 | |
| ⌘, | 设置/偏好 | |
| ⌘W | 关闭窗口/模态 | |
| Escape | 取消/关闭 | |
| Tab | 下一个字段 | |
| ⇧Tab | 上一个字段 | |
| Return | 提交表单 | 适当时 |

### SwiftUI 键盘快捷键

```swift
struct ContentView: View {
    var body: some View {
        NavigationStack {
            ItemList()
                .toolbar {
                    Button("New Item", action: createItem)
                        .keyboardShortcut("n", modifiers: .command)
                }
        }
    }
}

// 列表项的自定义快捷键
List {
    ForEach(items) { item in
        ItemRow(item: item)
    }
}
.onDeleteCommand(perform: deleteSelected)  // ⌘⌫
```

### 键盘快捷键可发现性

按住 ⌘ 显示可用快捷键。确保快捷键出现：

```swift
Button("Save", action: save)
    .keyboardShortcut("s", modifiers: .command)
    // 出现在键盘快捷键覆盖层中
```

---

## 文本编辑

### 自动大写

| 样式 | 用途 |
|------|------|
| `.sentences` | 常规文本、消息 |
| `.words` | 姓名、标题 |
| `.allCharacters` | 代码、缩写 |
| `.none` | 邮箱、用户名、URL |

### 自动纠正

| 设置 | 用途 |
|------|------|
| 启用（默认） | 散文、消息 |
| 禁用 | 代码、用户名、特定值 |

```swift
TextField("Username", text: $username)
    .autocapitalization(.none)
    .disableAutocorrection(true)
```

### 文本输入特性总结

```swift
TextField("Email", text: $email)
    .keyboardType(.emailAddress)      // 键盘布局
    .textContentType(.emailAddress)   // 自动填充提示
    .autocapitalization(.none)        // 无自动大写
    .disableAutocorrection(true)      // 无自动纠正
    .textInputAutocapitalization(.never) // iOS 15+
```

---

## 安全文本输入

### 密码字段

```swift
SecureField("Password", text: $password)
    .textContentType(.password)
```

### 显示/隐藏切换模式

```swift
struct PasswordField: View {
    @Binding var password: String
    @State private var isSecure = true

    var body: some View {
        HStack {
            if isSecure {
                SecureField("Password", text: $password)
            } else {
                TextField("Password", text: $password)
            }

            Button(action: { isSecure.toggle() }) {
                Image(systemName: isSecure ? "eye.slash" : "eye")
                    .foregroundColor(.secondary)
            }
        }
        .textContentType(.password)
    }
}
```

---

## 搜索输入

### 搜索字段行为

```swift
struct SearchView: View {
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            List(filteredItems) { item in
                ItemRow(item: item)
            }
            .searchable(
                text: $searchText,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "Search items"
            )
        }
    }
}
```

### 搜索建议

```swift
.searchable(text: $searchText) {
    ForEach(suggestions) { suggestion in
        Text(suggestion.name)
            .searchCompletion(suggestion.name)
    }
}
```

---

## 常见模式

### 应用所有最佳实践的表单

```swift
struct RegistrationForm: View {
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @FocusState private var focusedField: Field?

    enum Field: Hashable {
        case email, password, confirmPassword
    }

    var body: some View {
        Form {
            Section("Account") {
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .textContentType(.username)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .focused($focusedField, equals: .email)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .password }

                SecureField("Password", text: $password)
                    .textContentType(.newPassword)
                    .focused($focusedField, equals: .password)
                    .submitLabel(.next)
                    .onSubmit { focusedField = .confirmPassword }

                SecureField("Confirm Password", text: $confirmPassword)
                    .textContentType(.newPassword)
                    .focused($focusedField, equals: .confirmPassword)
                    .submitLabel(.done)
                    .onSubmit(register)
            }

            Section {
                Button("Create Account", action: register)
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Button("Previous") { moveFocus(-.previous) }
                Button("Next") { moveFocus(.next) }
                Spacer()
                Button("Done") { focusedField = nil }
            }
        }
    }
}
```

### SubmitLabel 选项

| 标签 | 用途 |
|------|------|
| `.done` | 最后一个字段，关闭键盘 |
| `.go` | 触发操作（搜索、导航） |
| `.next` | 移动到下一个字段 |
| `.return` | 插入换行（文本区域） |
| `.search` | 搜索字段 |
| `.send` | 消息撰写 |
| `.continue` | 多步骤表单 |
| `.join` | 加入/连接 |
| `.route` | 导航应用 |

```swift
TextField("Search", text: $query)
    .submitLabel(.search)
    .onSubmit { performSearch() }
```
