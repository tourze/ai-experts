# algo-visualization 资产来源与许可

## 上游

- 仓库：https://github.com/L0dyv/claude-algo-visualize
- 同步 commit：`bb4bb6f0349cc69f315608f5542064d188c436de`
- 许可：MIT License，Copyright (c) 2026 L0dyv

## 已同步的文件

| 本仓位置 | 上游路径 | 处理 |
|---|---|---|
| `assets/base.css` | `assets/base.css` | 原样复制 |
| `assets/boilerplate.js` | `assets/boilerplate.js` | 原样复制 |
| `assets/animation-html.html` | `assets/animation-html.html` | 原样复制 |
| `references/heap_overview.html` | `references/heap_overview.html` | 原样复制 |

`SKILL.md` 是基于上游 `SKILL.md` 重写的中文版，针对本仓写作风格、CSO 路由要求、Red Flags / Rationalizations 段落做了重组，不是逐行拷贝。

## 同步流程

上游有更新时：

```bash
# 0. 指向上游本地克隆；按自己的工作区调整
UPSTREAM=../_external_refs/claude-algo-visualize

# 1. 更新外部克隆
git -C "$UPSTREAM" pull

# 2. 比较 4 个资产文件
diff assets/base.css "$UPSTREAM/assets/base.css"
diff assets/boilerplate.js "$UPSTREAM/assets/boilerplate.js"
diff assets/animation-html.html "$UPSTREAM/assets/animation-html.html"
diff references/heap_overview.html "$UPSTREAM/references/heap_overview.html"

# 3. 看上游 SKILL.md 是否新增模板/铁律，决定是否需要回填本仓 SKILL.md
diff /tmp/upstream-skill.md SKILL.md   # 仅作参考，不要直接覆盖

# 4. 更新本文件 "同步 commit" 字段
git -C "$UPSTREAM" rev-parse HEAD
```

## MIT 许可全文

```
MIT License

Copyright (c) 2026 L0dyv

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
