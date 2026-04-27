# steps 数据形状

每个动画的 `steps` 是一个数组，每个 step 反映完整状态。每步只做一件事（比较 or 交换），**不要一步同时高亮 3 种状态**。

## 模板 A（数组 + 完全二叉树）

```js
{
  vals: [...],     // 当前数组状态
  cap: "...",      // 说明文字（支持 <b> <code>）
  focus: number,   // 当前关注下标，-1=无
  swap: [a, b],    // 交换对，null=无
  lk: [...],       // 已锁定的下标（已排好的末尾）
  hn: number,      // 堆大小（数组比堆大时用）
  line: number,    // 当前高亮代码行号，-1=无（联动代码时必填）
}
```

模板 A 必须自行定义 `clsFn(i)`：

```js
function clsFn(i) {
  var s = steps[cur];
  if (s.swap && (s.swap[0] === i || s.swap[1] === i)) return ' sw';
  if (s.focus === i) return ' hl';
  if (s.lk && s.lk.indexOf(i) >= 0) return ' lk';
  return '';
}
```

## 模板 B（自定义坐标树/图）

```js
{
  cap: "...",
  nodes: [{ v: "值", x, y, cf, cs, ct }],   // 值 + 坐标 + 填充/描边/文字色
  edges: [{ x1, y1, x2, y2, l: "0/1" }],    // 边，l 可选标签
  arr: [...],                                // 可选：联动数组状态
  ch: [...],                                 // 可选：变化的数组下标
  line: number,                              // 联动代码时必填
}
```

模板 B 只提供 `renderStep()` 纯函数，需要自己写驱动层：

```js
var cur = 0;
function doRender() { renderStep('xx-svg','xx-cap','xx-pb','xx-nb','xx-dots',steps,cur); }
function go(d) { var n = cur+d; if (n>=0 && n<steps.length) { cur=n; doRender(); } }
doRender();
```

## 模板 C（纯数组）

用模板 A 的 `vals/cap/focus/swap/lk/line` 子集即可，不需要 `hn`。

## 颜色语义（CSS 类）

| 类 | 颜色 | 何时用 |
|---|---|---|
| `hl` | 蓝 | 当前关注 |
| `sw` | 橙 | 交换中 |
| `nw` | 绿 | 新元素 / 比较通过 |
| `pp` | 红 | 问题 / 删除 / 违规 |
| `ok` | 绿 | 已确认满足条件 |
| `lk` | 绿 | 已锁定（已排好的末尾） |
| `dim` | 灰 | 不参与 |
