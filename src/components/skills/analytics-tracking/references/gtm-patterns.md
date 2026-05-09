# SaaS GTM 模式

SaaS 应用的常见 Google Tag Manager 配置。

---

## 容器架构

### 命名约定

使用一致的命名，否则 GTM 半年内就会变成黑盒。

```
标签:     [平台] - [事件名]           例如 "GA4 - signup_completed"
触发器:   [类型] - [描述]            例如 "DL Event - signup_completed"
变量:     [类型] - [参数名]          例如 "DLV - plan_name"
```

### 必需变量（优先创建）

| 变量名 | 类型 | 值 |
|--------|------|----|
| `CON - GA4 Measurement ID` | 常量 | `G-XXXXXXXXXX` |
| `CON - Environment` | 常量 | `production` |
| `JS - Page Path` | 自定义 JavaScript | `function() { return window.location.pathname; }` |
| `JS - User ID` | 自定义 JavaScript | <code>function() { return window.currentUserId &#124;&#124; undefined; }</code> |

### GA4 配置标签

**一个标签，在 All Pages 上触发：**

```
标签类型: Google Analytics: GA4 Configuration
Measurement ID: {{CON - GA4 Measurement ID}}
要设置的字段:
  - user_id: {{JS - User ID}}
触发器: All Pages
```

---

## 模式库

### 模式 1：Data Layer Push 事件

最可靠的模式。你的应用推送结构化数据，GTM 监听。

**在应用代码中：**
```javascript
// 在任何可追踪的事件上调用此函数
function trackEvent(eventName, parameters) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...parameters
  });
}

// 示例：注册成功后
trackEvent('signup_completed', {
  signup_method: 'email',
  user_id: newUser.id,
  plan_name: 'trial'
});
```

**在 GTM 中：**

1. 为每个参数创建 Data Layer 变量：
   - `DLV - signup_method` → Data Layer Variable → `signup_method`
   - `DLV - user_id` → Data Layer Variable → `user_id`
   - `DLV - plan_name` → Data Layer Variable → `plan_name`

2. 创建触发器：
   - 类型：Custom Event
   - 事件名：`signup_completed`
   - 名称：`DL Event - signup_completed`

3. 创建标签：
   - 类型：Google Analytics: GA4 Event
   - 配置标签：GA4 Config 标签
   - 事件名：`signup_completed`
   - 事件参数：
     - `method`：`{{DLV - signup_method}}`
     - `user_id`：`{{DLV - user_id}}`
     - `plan_name`：`{{DLV - plan_name}}`
   - 触发器：`DL Event - signup_completed`

---

### 模式 2：特定元素上的点击事件

当无法修改应用代码且需要跟踪特定 CTA 时使用。

**GTM 设置：**

1. 启用 `Click - All Elements` 内置变量（如果未启用）：
   - GTM → 变量 → 配置 → 启用：Click Element、Click ID、Click Classes、Click Text

2. 创建触发器：
   - 类型：Click - All Elements
   - 触发条件：Some Clicks
   - 条件：
     - Click Element 匹配 CSS 选择器：`[data-track="demo-cta"]`
     或
     - Click Text 等于 "Request a Demo"
   - 名称：`Click - Demo CTA`

3. 创建标签：
   - 类型：GA4 Event
   - 事件名：`demo_requested`
   - 事件参数：
     - `page_location`：`{{Page URL}}`
     - `click_text`：`{{Click Text}}`
   - 触发器：`Click - Demo CTA`

**最佳实践：** 在 HTML 中给重要元素添加 `data-track` 属性，而不是依赖易碎的 CSS 选择器或文本匹配。

```html
<button data-track="demo-cta" data-track-source="pricing-hero">
  Request a Demo
</button>
```

---

### 模式 3：表单提交跟踪

取决于表单是通过 JavaScript 还是完整页面重载提交。

**对于 JavaScript 处理的表单（AJAX/fetch）：**
- 表单成功提交回调后使用模式 1（dataLayer push）

**对于传统表单提交：**

1. 创建触发器：
   - 类型：Form Submission
   - 检查验证：✅（仅在表单通过 HTML5 验证时触发）
   - 启用 History Change：✅（适用于 SPA）
   - 触发条件：Some Forms
   - 条件：Form ID 等于 `contact-form` 或 Form Classes 包含 `js-track-form`
   - 名称：`Form Submit - Contact`

2. 创建标签：
   - 类型：GA4 Event
   - 事件名：`form_submitted`
   - 参数：
     - `form_name`：`contact`
     - `page_location`：`{{Page URL}}`
   - 触发器：`Form Submit - Contact`

---

### 模式 4：SPA 页面浏览跟踪

单页应用在路由变化时通常不会触发标准页面浏览事件。

**方法 A：History Change 触发器（最简单）**

1. 创建触发器：
   - 类型：History Change
   - 名称：`History Change - Route`

2. 创建标签：
   - 类型：GA4 Event
   - 事件名：`page_view`
   - 参数：
     - `page_location`：`{{Page URL}}`
     - `page_title`：`{{Page Title}}`
   - 触发器：`History Change - Route`

**重要：** 如果使用此方法，禁用 GA4 配置标签中的默认 pageview，否则初始加载时会出现重复。

**方法 B：从路由器的 dataLayer push（更可靠）**

```javascript
// 在路由器的导航处理器中：
router.afterEach((to, from) => {
  window.dataLayer.push({
    event: 'page_view',
    page_path: to.path,
    page_title: document.title
  });
});
```

---

### 模式 5：滚动深度跟踪

用于内容互动度测量：

**选项 A：使用 GA4 增强型测量（仅 90% 深度）**
- 在 GA4 → 数据流 → 增强型测量 → 滚动中启用
- 当用户滚动到页面 90% 时触发
- 无需 GTM 配置

**选项 B：通过 GTM 自定义里程碑**

1. 为每个深度创建触发器：
   - 类型：Scroll Depth
   - 垂直滚动深度：25、50、75、100（百分比）
   - 启用条件：Some Pages → Page Path 包含 `/blog/`
   - 名称：`Scroll Depth - Blog`

2. 创建标签：
   - 类型：GA4 Event
   - 事件名：`content_scrolled`
   - 参数：
     - `scroll_depth_pct`：`{{Scroll Depth Threshold}}`
     - `page_location`：`{{Page URL}}`
   - 触发器：`Scroll Depth - Blog`

---

### 模式 6：同意模式集成

用于 GDPR 合规——将你的 CMP 连接到 GTM。

**基本同意模式（拒绝时全部阻止）：**

```javascript
// 在 CMP 回调中：
window.dataLayer.push({
  event: 'cookie_consent_update',
  ad_storage: 'denied',         // 或 'granted'
  analytics_storage: 'denied',  // 或 'granted'
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted'   // 始终授予
});
```

**增强版同意模式（对拒绝用户的建模数据）：**

在 `<head>` 中 GTM 加载之前添加：
```javascript
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// 默认全部拒绝
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500  // 等待 CMP 初始化的毫秒数
});
```

然后在用户同意时更新：
```javascript
gtag('consent', 'update', {
  analytics_storage: 'granted'
});
```

---

## GTM 版本控制

### 版本命名约定

```
v1.0 - 初始设置：GA4 + 核心事件
v1.1 - 添加：结账跟踪
v1.2 - 修复：SPA 上的重复 pageview
v2.0 - 改造：新事件分类 + Meta Pixel
```

### 发布协议

1. 在 GTM 预览模式下测试——验证事件正确触发
2. 在 GA4 DebugView 中测试——确认参数被捕获
3. 使用 GTM 的"What changed?"差异视图测试
4. 添加版本说明（变更内容 + 原因）
5. 发布到生产环境
6. 发布后在 GA4 Realtime 视图中验证

### 环境

在 GTM 中创建 staging 环境（管理 → 环境）：
- 开发环境：测试变更而不影响生产环境
- 预发布环境：发布前验证
- 生产环境：线上

与开发团队分享 staging GTM 代码段，以便他们针对同一容器进行测试。

---

## 常见 GTM 错误

| 错误 | 现象 | 修复 |
|------|------|------|
| 标签应在限定范围触发却在"All Pages"上触发 | 事件计数膨胀 | 为触发器添加页面条件 |
| Data Layer Variable 路径错误 | 参数显示为 `undefined` | 使用 GTM 预览检查 dataLayer 结构 |
| GA4 配置标签多次触发 | 重复的会话/用户 | 检查所有触发器——应只有一个触发器，"All Pages" |
| 增强型测量与自定义标签冲突 | 重复的出站点击事件 | 禁用有冲突的增强型测量设置 |
| 触发器在 DOM ready 之前触发 | 找不到元素错误 | 将触发器类型从"Page View"改为"DOM Ready"或"Window Loaded" |
| 表单触发器不触发 | 表单使用 AJAX 或自定义提交 | 改为在提交回调后使用 dataLayer push |
