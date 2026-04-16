# GDScript 核心模式

从 SKILL.md 拆出的 5 个完整代码模式。

## 模式 1：显式首状态与空状态保护的状态机

- 注册阶段只接收 `State` 子节点，切换入口集中在 `transition_to`。
- 首次切换和中途切换走同一套入口。
- `state_changed` 必须在旧状态退出、新状态进入后再发射。

完整代码：`state_machine.gd` + `state.gd` + `player_idle.gd`（见 git 历史或下方）。

## 模式 2：Autoload 只做编排，不把通知字段写成递归 setter

- 全局管理器负责暂停、结算、分数广播。
- 会触发信号的属性统一用后备字段 `_score`。

## 模式 3：Resource 只存模板数据，运行时状态复制到实例

- 配置项放进 `Resource`，角色 `_ready()` 时克隆运行时副本。
- `duplicate_for_runtime()` + `reset_runtime_state()`。

## 模式 4：对象池抽象"激活/归还"

- 池化对象通过 `on_spawn()` / `on_despawn()` 处理生命周期。
- 可见性按 `CanvasItem` / `Node3D` 分别处理。

## 模式 5：组件化命中系统

- `Hitbox` 只负责发现命中。
- `Hurtbox` 只负责接收命中并转给 `HealthComponent`。
- 生命值组件用后备字段 `_current_health`，避免 setter 自递归。
