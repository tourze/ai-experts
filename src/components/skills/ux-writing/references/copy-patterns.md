# UX 微文案模板

## 按钮标签

| 场景 | ❌ 生硬 | ✅ 动词化 |
|---|---|---|
| 创建账户 | Submit / OK | Create account |
| 发送邀请 | Send / Confirm | Send invite |
| 保存草稿 | Save | Save draft |
| 发布文章 | Publish | Publish article |
| 删除项目 | Delete | Delete project forever |
| 购买 | Buy | Buy for $49 / Subscribe $9/mo |
| 登录 | Login | Sign in / Log in（全产品统一一种）|
| 退出 | Exit / Quit | Sign out |
| 继续 | Next | Continue to payment / Review order |
| 取消订阅 | Cancel | Cancel subscription |

**原则**：动词 + 名词。如果按下后的动作说不清 3 个字，按钮命名就有问题。

## 错误消息（what-why-fix）

### 表单字段级

```
❌ Invalid email
✅ Enter a valid email address (e.g., you@example.com)

❌ Password too weak
✅ Use at least 8 characters with one number and one symbol

❌ Username taken
✅ "alex" is taken. Try alex42 or alexcodes.
```

### 提交级

```
❌ Error. Please try again.
✅ We couldn't save your changes.
   Your session expired. Sign in again to continue.

❌ Something went wrong.
✅ The file is too large (max 10 MB).
   Resize the image and upload again.

❌ Network error
✅ Lost connection to server.
   Check your internet and retry. [Retry]
```

### 系统级（服务异常）

```
❌ 500 Internal Server Error
✅ We're having trouble loading your invoices.
   Our team is on it. Try again in a few minutes.
   Still stuck? Contact support with ID: {requestId}
```

## 空态（教学 + CTA）

### 首次使用

```
❌ No items
✅ No invoices yet
   Invoices you send will appear here.
   [Create your first invoice]
```

### 搜索无结果

```
❌ No results found
✅ No results for "{query}"
   Try different keywords, or browse by category.
   [Clear search]  [Browse all]
```

### 筛选清空

```
❌ Nothing here
✅ No invoices match these filters
   Try clearing one filter or expanding the date range.
   [Clear filters]
```

## 确认对话框（反映真实后果）

### 可逆操作

```
Archive project?
Archived projects are hidden from the main view but can be restored anytime.
[Cancel]  [Archive]
```

### 不可逆操作

```
Delete "{projectName}" forever?
This permanently deletes all data, files, and history.
This can't be undone.

Type the project name to confirm:
[________________]

[Cancel]  [Delete forever]
```

### 扣费 / 订阅

```
Upgrade to Pro?
You'll be charged $49/month starting today.
Renews automatically. Cancel anytime from Settings.

[Cancel]  [Upgrade for $49/mo]
```

## 表单 Helper / Label / Placeholder

```
<label>Email</label>                             ← 永远可见
<input placeholder="you@example.com" />          ← 格式示例
<small>We'll send a verification link here.</small>  ← helper，说明用途
```

**禁止**：
- `<input placeholder="Email" />` 无 label
- helper 写成 "Please enter your email"（重复）
- label 和 placeholder 说同一件事

## Toast / Snackbar（简洁 + 动词反馈）

| 场景 | 模板 |
|---|---|
| 保存成功 | `Changes saved` |
| 发送成功 | `Invoice sent to client@example.com` |
| 删除（带撤销） | `Project archived. [Undo]` |
| 复制到剪贴板 | `Copied to clipboard` |
| 上传中 | `Uploading 3 files... (12%)` |
| 失败 | `Failed to send. [Retry]` |

**原则**：过去式反馈已完成动作；带可撤销状态的要给 Undo（5-10 秒）。

## 敏感操作措辞

| 动作 | ❌ 模糊 | ✅ 诚实 |
|---|---|---|
| 删除账户 | Delete account | Permanently delete account and all data |
| 注销会话 | Log out | Sign out of all devices |
| 取消订阅 | Cancel | End subscription on {date} — keep access until then |
| 移除成员 | Remove | Remove Alex from the team. They'll lose access immediately. |
| 清空回收站 | Empty | Delete 47 items permanently |

## 品牌声音维度

选一种，全产品一致：

| 维度 | 友好 | 专业 | 权威 | 技术 |
|---|---|---|---|---|
| 人称 | You / We | You / The company | - | Command |
| 句长 | 中-短 | 中 | 短 | 短 |
| 措辞 | 日常 | 中性 | 精确 | 术语 |
| 感叹号 | 偶尔 | 无 | 无 | 无 |
| 缩写 | 允许 | 少 | 无 | 技术缩写 OK |
| 举例 | "Save your work — we'll remember it." | "Changes are saved automatically." | "Auto-save enabled." | "autosave: true" |

## AI 腔清单（必删）

- "We're excited/thrilled to..."
- "Please kindly..."
- "Effortlessly / Seamlessly / Elevate your..."
- "Embark on your journey"
- "Unleash the power of..."
- "Your one-stop shop for..."
- "Cutting-edge / State-of-the-art / Best-in-class"
- "Let's get started!" (空态里的感叹号 + 激励)
- "Oops! Something went wrong" (AI 套版道歉)

## i18n 陷阱

- **复数**：`{n} items` 在英文里 1/其他；俄文里 1/2-4/5+；用 ICU plural。
- **字符串拼接**：禁止 `"Hello, " + name + "!"`。用 `hello_greeting: "Hello, {name}!"`。
- **语序**：德文动词在末尾，中文修饰在前，阿拉伯语右到左——留变量位而不固定前后。
- **长度**：英文→德文/法文 +30%；英文→中文 -30%；按钮/导航要兼顾最长语言。
- **性别**：西语 `amigo/amiga`，德语 `Kollege/Kollegin`——有条件提供性别变体或中性措辞。
- **日期/货币/数字**：用 `Intl.DateTimeFormat` / `Intl.NumberFormat`，不手工拼。

## 致谢

本模板集参考 `pbakaus/impeccable` (Apache-2.0) 的 ux-writing reference，并扩充了中文 / i18n / 敏感操作 / AI 腔清单。
