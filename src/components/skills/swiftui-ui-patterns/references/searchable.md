# 可搜索

## 意图

使用 `searchable` 添加带有可选范围和异步结果的原生搜索 UI。

## 核心模式

- 将 `searchable(text:)` 绑定到本地状态。
- 使用 `.searchScopes` 实现多种搜索模式。
- 使用 `.task(id: searchQuery)` 或防抖任务避免过度请求。
- 在结果加载时显示占位符或进度状态。

## 示例：带范围的可搜索

```swift
@MainActor
struct ExploreView: View {
  @State private var searchQuery = ""
  @State private var searchScope: SearchScope = .all
  @State private var isSearching = false
  @State private var results: [SearchResult] = []

  var body: some View {
    List {
      if isSearching {
        ProgressView()
      } else {
        ForEach(results) { result in
          SearchRow(result: result)
        }
      }
    }
    .searchable(
      text: $searchQuery,
      placement: .navigationBarDrawer(displayMode: .always),
      prompt: Text("Search")
    )
    .searchScopes($searchScope) {
      ForEach(SearchScope.allCases, id: \.self) { scope in
        Text(scope.title)
      }
    }
    .task(id: searchQuery) {
      await runSearch()
    }
  }

  private func runSearch() async {
    guard !searchQuery.isEmpty else {
      results = []
      return
    }
    isSearching = true
    defer { isSearching = false }
    try? await Task.sleep(for: .milliseconds(250))
    results = await fetchResults(query: searchQuery, scope: searchScope)
  }
}
```

## 要保留的设计选择

- 当搜索为空或没有结果时显示占位符。
- 对输入进行防抖处理，避免频繁请求网络。
- 保持搜索状态为视图本地。

## 陷阱

- 避免对空字符串运行搜索。
- 不要在获取期间阻塞主线程。
