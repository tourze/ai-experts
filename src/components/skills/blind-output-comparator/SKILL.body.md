## 代码模式

盲评输出保持 JSON，便于后续 analyzer 读取：

```json
{
  "winner": "A",
  "reasoning": "输出 A 覆盖了全部验收项，并给出可执行命令；输出 B 只有概念说明，缺少验证路径。",
  "rubric": {
    "A": {
      "content_score": 4.7,
      "structure_score": 4.3,
      "overall_score": 9
    },
    "B": {
      "content_score": 3,
      "structure_score": 2.7,
      "overall_score": 5.7
    }
  },
  "output_quality": {
    "A": {
      "score": 9,
      "strengths": ["结论完整", "证据可追溯"],
      "weaknesses": ["少量格式不一致"]
    },
    "B": {
      "score": 6,
      "strengths": ["结构可读"],
      "weaknesses": ["缺少验证命令", "关键风险未覆盖"]
    }
  }
}
```
