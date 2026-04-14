---
name: react-render-performance
description: 适用于 React 消费外部状态时的重渲染控制，重点覆盖 XState、@xstate/store、Zustand、Redux、Nanostores 与 Context 的 selector 模式。用户提到 store 订阅、selector、whole object、无意义 re-render 时使用。
---

# React 渲染性能

## 适用场景

- React 组件消费外部 store 后，几乎每次状态变化都会整片重渲染。
- 需要在 XState、Redux、Zustand、Nanostores 或 Context 中挑选正确订阅粒度。
- 组件本身不慢，但订阅方式让上层容器和整棵子树被反复刷新。
- 结构层面的拆分可联动 [react-composable-components](../react-composable-components/SKILL.md)；通用性能问题可联动 [react-performance](../react-performance/SKILL.md)。

## 核心约束

- 默认订阅最小 slice，不订阅 whole object。
- 订阅点尽量下沉到真正消费数据的叶子节点，别在 `App` 根上读整份 store。
- selector 要稳定、可推导、易比较；返回新对象就意味着每次都可能重渲染。
- React state 不要拿来做外部 store 的镜像缓存；镜像一份 whole snapshot 只会放大刷新范围。
- Context 只适合低频、稳定、作用域明确的共享值；高频更新要警惕整棵 Provider 子树抖动。

## 代码模式

```tsx
import { useStore } from "./store";

export function SessionPhase() {
  const phase = useStore((state) => state.session.phase);
  return <span>{phase}</span>;
}

export function SessionStep() {
  const step = useStore((state) => state.session.step);
  return <span>{step}</span>;
}
```

```tsx
import { shallowEqual, useSelector } from "react-redux";

export function Summary() {
  const { phase, step } = useSelector(
    (state: { session: { phase: string; step: number } }) => ({
      phase: state.session.phase,
      step: state.session.step,
    }),
    shallowEqual,
  );

  return (
    <div>
      {phase} / {step}
    </div>
  );
}
```

```tsx
import { useSelector } from "@xstate/react";
const selectPhase = (snapshot: { value: string }) => snapshot.value;

export function PhaseIndicator({ actor }: { actor: any }) {
  const phase = useSelector(actor, selectPhase);
  return <span>{String(phase)}</span>;
}
```

```tsx
import { atom, computed } from "nanostores";
import { useStore } from "@nanostores/react";

const $session = atom({ phase: "idle", step: 0 });
const $phase = computed($session, (session) => session.phase);

export function PhaseLabel() {
  const phase = useStore($phase);
  return <span>{phase}</span>;
}
```

## 检查清单

- [ ] 组件是否只订阅自己真正渲染的字段，而不是整份 store？
- [ ] 订阅位置是否尽量靠近消费点，而不是挂在高层容器？
- [ ] selector 返回值是否稳定，是否避免了每次构造新对象？
- [ ] 是否错误地用 React state 镜像了外部状态快照？
- [ ] Context Provider 的 value 是否稳定，更新频率是否适合 Context？
- [ ] 对象切片场景下，是否使用 `shallowEqual` / `useShallow` / computed store 等比较策略？

## 反模式

- `useStore()` / `useSelector((state) => state)` 直接吃整份状态。
- 把 actor/store snapshot 订阅后塞进 `useState`，再从中取一小段渲染。
- 在父组件顶层订阅 whole object，导致所有子组件被牵连刷新。
- selector 每次都返回新对象或新数组，却没有比较函数。
- 高频 Context value 每次 render 都新建，整个 Provider 子树无意义重跑。
