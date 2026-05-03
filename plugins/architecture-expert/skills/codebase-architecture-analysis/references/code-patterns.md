# 代码模式

## 依赖图生成

```bash
# 静态 import 分析（JavaScript/TypeScript）
npx dependency-cruiser --output-type dot src | dot -Tpng > deps.png

# Go package 依赖
go mod graph | grep "^<module>" > deps.txt

# Python import 追踪
pydeps --show-deps <package>
```

## 变更热点识别

```bash
# 高 churn 文件（最近 6 个月）
git log --format=format: --name-only --since="6 months ago" | sort | uniq -c | sort -nr | head -20

# Shotgun surgery 模式（同一 commit 频繁共改的文件对）
git log --format=format: --name-only --since="6 months ago" | awk 'NF' | paste - - | sort | uniq -c | sort -nr | head -20
```
