# 表单

## 意图

使用 `Form` 进行结构化设置、分组输入和操作行。此模式使数据录入界面的布局、间距和无障碍性保持一致。

## 核心模式

- 仅当表单以 sheet 形式展示或处于没有现有导航上下文的独立视图时，才将其包裹在 `NavigationStack` 中。
- 将相关控件分组到 `Section` 块中。
- 当需要设计系统颜色时，使用 `.scrollContentBackground(.hidden)` 加上自定义背景颜色。
- 在适当时使用 `.formStyle(.grouped)` 实现分组样式。
- 在输入密集的表单中使用 `@FocusState` 管理键盘焦点。

## 示例：设置风格的表单

```swift
@MainActor
struct SettingsView: View {
  @Environment(Theme.self) private var theme

  var body: some View {
    NavigationStack {
      Form {
        Section("General") {
          NavigationLink("Display") { DisplaySettingsView() }
          NavigationLink("Haptics") { HapticsSettingsView() }
        }

        Section("Account") {
          Button("Edit profile") { /* open sheet */ }
            .buttonStyle(.plain)
        }
        .listRowBackground(theme.primaryBackgroundColor)
      }
      .navigationTitle("Settings")
      .navigationBarTitleDisplayMode(.inline)
      .scrollContentBackground(.hidden)
      .background(theme.secondaryBackgroundColor)
    }
  }
}
```

## 示例：带验证的模态表单

```swift
@MainActor
struct AddRemoteServerView: View {
  @Environment(\.dismiss) private var dismiss
  @Environment(Theme.self) private var theme

  @State private var server: String = ""
  @State private var isValid = false
  @FocusState private var isServerFieldFocused: Bool

  var body: some View {
    NavigationStack {
      Form {
        TextField("Server URL", text: $server)
          .keyboardType(.URL)
          .textInputAutocapitalization(.never)
          .autocorrectionDisabled()
          .focused($isServerFieldFocused)
          .listRowBackground(theme.primaryBackgroundColor)

        Button("Add") {
          guard isValid else { return }
          dismiss()
        }
        .disabled(!isValid)
        .listRowBackground(theme.primaryBackgroundColor)
      }
      .formStyle(.grouped)
      .navigationTitle("Add Server")
      .navigationBarTitleDisplayMode(.inline)
      .scrollContentBackground(.hidden)
      .background(theme.secondaryBackgroundColor)
      .scrollDismissesKeyboard(.immediately)
      .toolbar { CancelToolbarItem() }
      .onAppear { isServerFieldFocused = true }
    }
  }
}
```

## 要保留的设计选择

- 对于设置和输入界面，优先选择 `Form` 而非自定义堆栈。
- 通过在行按钮上使用 `.contentShape(Rectangle())` 和 `.buttonStyle(.plain)` 保持行可点击。
- 使用列表行背景使 Section 样式与您的主题保持一致。

## 陷阱

- 避免在 `Form` 内部使用重量级自定义布局；这可能导致间距问题。
- 如果需要高度自定义布局，优先选择 `ScrollView` + `VStack`。
- 不要混合使用多种背景策略；要么使用默认 Form 样式，要么使用自定义颜色。
