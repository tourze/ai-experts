---
name: godot-gdscript-patterns
description: 当用户需要开发、重构或排障 Godot 4 GDScript 项目时使用。覆盖场景树组织、信号解耦、状态机、资源建模、对象池、组件化战斗逻辑与性能问题。
---

# godot-gdscript-patterns

## 适用场景

- 需要搭建或重构 Godot 4 项目的场景树、状态流转、角色系统、UI 与战斗系统。
- 需要判断什么时候用 `Node`、`Resource`、`Autoload`、信号、Group，而不是继续堆脚本耦合。
- 需要修复“状态切不回来”“场景切换卡住”“资源被误共享”“子弹多了就掉帧”这类 Godot 运行时问题。
- 需要把一次性 demo 脚本收敛成可复用模式，例如状态机、对象池、组件化命中系统。
- 相关 skill：
  需要测试矩阵与边界覆盖时配合 `testing-strategy`、`test-brainstorm`；
  需要架构性重构时配合 `refactoring-patterns`、`tech-debt`；
  需要检查交互与动画反馈时配合 `interaction-design`。
- 需要继续展开场景切换与存档系统时，再读 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 核心约束

- 场景树负责组合，`Resource` 负责静态数据，运行时可变状态必须复制到实例或运行时副本，不能直接写回共享资源。
- 信号优先用于跨节点协作；只有父子强拥有关系且生命周期一致时，才保留直接引用。
- `Autoload` 只放真正的全局编排器或事件总线，不能把所有业务状态都塞进去。
- 属性 setter 不得自递归；任何会触发通知的字段都必须使用后备字段，例如 `_score`、`_current_health`。
- 状态机切换必须覆盖“首个状态”“状态不存在”“重复切换”“退出清理”四条路径，不能默认 `current_state` 永远存在。
- 对象池不能假设所有实例都有 `visible`；至少区分 `CanvasItem`、`Node3D` 与普通 `Node`。
- 性能优化先修结构性浪费：频繁 `get_node()`、热路径分配、无限 `process`、重复实例化，再谈微优化。
- 所有示例默认面向 Godot 4；涉及 `await`、静态类型、`ResourceLoader.load_threaded_request` 等用法时不要回退到 Godot 3 语法。

## 代码模式

5 个核心模式的完整代码见 [references/core-patterns.md](references/core-patterns.md)。

| 模式 | 要点 |
|------|------|
| 1. 状态机 | `transition_to` 统一入口 / 空状态保护 / `state_changed` 延迟发射 |
| 2. Autoload | 只做编排 / 信号属性用后备字段 `_score` 避免 setter 递归 |
| 3. Resource | 模板数据 vs 运行时副本 / `duplicate_for_runtime()` |
| 4. 对象池 | `on_spawn()` / `on_despawn()` / 按 CanvasItem / Node3D 切可见性 |
| 5. 命中系统 | Hitbox → Hurtbox → HealthComponent / 信号解耦 / 后备字段 |

场景切换与存档系统见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 状态机是否覆盖了“首状态为空 / 状态不存在 / 重复切换 / 退出清理”。
- 所有带通知的属性是否使用后备字段，避免 setter 自递归。
- `Resource` 是否只存模板数据；运行时状态是否通过 `duplicate(true)` 或实例字段隔离。
- 对象池是否处理了 `CanvasItem` / `Node3D` / 普通 `Node` 的差异，而不是直接访问不存在的属性。
- `Autoload` 是否只承担全局编排；是否把角色实例状态错误地塞进了单例。
- 性能热点是否缓存节点引用、减少热路径分配，并在离屏或闲置时关闭 `process`。
- 需要场景切换、存档系统时，是否同步核对了 [references/advanced-patterns.md](references/advanced-patterns.md) 中的异步加载与存档边界。

## 反模式

### FAIL: 共享可变 Resource

```gdscript
@export var stats: CharacterStats  # Inspector 拖入同一个 .tres
# 场景实例 A 掉血 → 实例 B 也掉血
# 原因：所有实例共享同一个 Resource 对象
```

### PASS: 运行时 duplicate

```gdscript
func _ready() -> void:
    stats = base_stats.duplicate_for_runtime()
    # 每个实例独立副本
```

### FAIL: setter 无限递归

```gdscript
var score: int:
    set(value):
        score = value  # ← 再次触发 set → 无限递归 → 栈溢出
        score_changed.emit(score)
```

### PASS: 后备字段

```gdscript
var _score: int = 0
var score: int:
    get: return _score
    set(value):
        if value == _score: return
        _score = value
        score_changed.emit(_score)
```

### FAIL: _process 中 get_node + 新建数组

```gdscript
func _process(delta):
    var enemies = get_node("../EnemyContainer").get_children()  # 每帧查找
    var filtered = []  # 每帧新建
    for e in enemies:
        if e.is_alive: filtered.append(e)
```

### PASS: @onready + 缓存

```gdscript
@onready var enemy_container := $"../EnemyContainer"
var _cached_alive: Array[Enemy] = []

func _on_enemy_died(_e):
    _cached_alive = enemy_container.get_children().filter(func(e): return e.is_alive)
```
