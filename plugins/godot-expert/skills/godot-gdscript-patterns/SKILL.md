---
name: godot-gdscript-patterns
description: 用于 Godot 4 GDScript 开发、重构与排障。适用于场景树组织、信号解耦、状态机、资源建模、对象池、组件化战斗逻辑与性能问题；不适用于纯引擎安装教学或只想复述 GDScript 基础语法的场景。
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

### 模式 1：显式首状态与空状态保护的状态机

- 注册阶段只接收 `State` 子节点，并把切换入口集中在 `transition_to`。
- 首次切换和中途切换走同一套入口，避免 `_ready()` 和运行时逻辑分叉。
- `state_changed` 必须在旧状态退出、新状态进入后再发射，保证观察者读到的是稳定状态。

`state_machine.gd`

```gdscript
class_name StateMachine
extends Node

signal state_changed(from_state: StringName, to_state: StringName)

@export var initial_state: State

var current_state: State = null
var states: Dictionary[StringName, State] = {}

func _ready() -> void:
    for child in get_children():
        if child is State:
            var state := child as State
            states[state.name] = state
            state.state_machine = self

    if initial_state != null:
        transition_to(initial_state.name)

func _process(delta: float) -> void:
    if current_state != null:
        current_state.update(delta)

func _physics_process(delta: float) -> void:
    if current_state != null:
        current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
    if current_state != null:
        current_state.handle_input(event)

func transition_to(state_name: StringName, msg: Dictionary = {}) -> void:
    if not states.has(state_name):
        push_error("State '%s' not found" % state_name)
        return

    if current_state != null and current_state.name == state_name:
        return

    var previous_state := current_state
    if previous_state != null:
        previous_state.exit()

    current_state = states[state_name]
    current_state.enter(msg)

    var from_name := StringName()
    if previous_state != null:
        from_name = previous_state.name
    state_changed.emit(from_name, current_state.name)
```

`state.gd`

```gdscript
class_name State
extends Node

var state_machine: StateMachine

func enter(_msg: Dictionary = {}) -> void:
    pass

func exit() -> void:
    pass

func update(_delta: float) -> void:
    pass

func physics_update(_delta: float) -> void:
    pass

func handle_input(_event: InputEvent) -> void:
    pass
```

`player_idle.gd`

```gdscript
class_name PlayerIdle
extends State

@export var player: Player

func enter(_msg: Dictionary = {}) -> void:
    player.animation.play("idle")

func physics_update(_delta: float) -> void:
    var direction := Input.get_vector("left", "right", "up", "down")
    if direction != Vector2.ZERO:
        state_machine.transition_to("Move")

func handle_input(event: InputEvent) -> void:
    if event.is_action_pressed("attack"):
        state_machine.transition_to("Attack")
    elif event.is_action_pressed("jump"):
        state_machine.transition_to("Jump")
```

### 模式 2：Autoload 只做编排，不把通知字段写成递归 setter

- 全局管理器负责暂停、结算、分数广播；真正的战斗或 UI 逻辑由订阅方处理。
- 会触发信号的属性统一用后备字段，避免 setter 自己给自己赋值。

`game_manager.gd`

```gdscript
extends Node

signal game_started
signal game_paused(is_paused: bool)
signal game_over(won: bool)
signal score_changed(new_score: int)

enum GameState { MENU, PLAYING, PAUSED, GAME_OVER }

var state: GameState = GameState.MENU
var _score: int = 0
var score: int:
    get:
        return _score
    set(value):
        var next_value := maxi(value, 0)
        if next_value == _score:
            return
        _score = next_value
        score_changed.emit(_score)

var high_score: int = 0

func _ready() -> void:
    process_mode = Node.PROCESS_MODE_ALWAYS
    _load_high_score()

func _input(event: InputEvent) -> void:
    if event.is_action_pressed("pause") and state == GameState.PLAYING:
        toggle_pause()

func start_game() -> void:
    score = 0
    state = GameState.PLAYING
    game_started.emit()

func toggle_pause() -> void:
    var is_pausing := state != GameState.PAUSED

    if is_pausing:
        state = GameState.PAUSED
        get_tree().paused = true
    else:
        state = GameState.PLAYING
        get_tree().paused = false

    game_paused.emit(is_pausing)

func end_game(won: bool) -> void:
    state = GameState.GAME_OVER

    if score > high_score:
        high_score = score
        _save_high_score()

    game_over.emit(won)

func add_score(points: int) -> void:
    score += points

func _load_high_score() -> void:
    if FileAccess.file_exists("user://high_score.save"):
        var file := FileAccess.open("user://high_score.save", FileAccess.READ)
        high_score = file.get_32()

func _save_high_score() -> void:
    var file := FileAccess.open("user://high_score.save", FileAccess.WRITE)
    file.store_32(high_score)
```

### 模式 3：`Resource` 只存模板数据，运行时状态复制到实例

- 配置项放进 `Resource`，角色实例在 `_ready()` 时克隆一份运行时副本。
- 不要在 `Resource._init()` 里依赖 Inspector 覆盖值；运行时值在复制后显式重置。

`weapon_data.gd`

```gdscript
class_name WeaponData
extends Resource

@export var name: StringName
@export var damage: int
@export var attack_speed: float
@export var range: float
@export_multiline var description: String
@export var icon: Texture2D
@export var projectile_scene: PackedScene
@export var sound_attack: AudioStream
```

`character_stats.gd`

```gdscript
class_name CharacterStats
extends Resource

signal stat_changed(stat_name: StringName, new_value: float)

@export var max_health: float = 100.0
@export var attack: float = 10.0
@export var defense: float = 5.0
@export var speed: float = 200.0

var _current_health: float = 0.0

func reset_runtime_state() -> void:
    _current_health = max_health

func get_current_health() -> float:
    return _current_health

func take_damage(amount: float) -> float:
    var actual_damage := maxf(amount - defense, 1.0)
    _current_health = maxf(_current_health - actual_damage, 0.0)
    stat_changed.emit("health", _current_health)
    return actual_damage

func heal(amount: float) -> void:
    _current_health = minf(_current_health + amount, max_health)
    stat_changed.emit("health", _current_health)

func duplicate_for_runtime() -> CharacterStats:
    var copy := duplicate(true) as CharacterStats
    copy.reset_runtime_state()
    return copy
```

`character.gd`

```gdscript
class_name Character
extends CharacterBody2D

@export var base_stats: CharacterStats
@export var weapon: WeaponData

var stats: CharacterStats

func _ready() -> void:
    stats = base_stats.duplicate_for_runtime()
    stats.stat_changed.connect(_on_stat_changed)

func attack() -> void:
    if weapon != null:
        print("Attacking with %s for %d damage" % [weapon.name, weapon.damage])

func _on_stat_changed(stat_name: StringName, value: float) -> void:
    if stat_name == "health" and value <= 0.0:
        die()
```

### 模式 4：对象池要抽象“激活/归还”，不要把节点类型写死

- 池化对象统一通过 `on_spawn()` / `on_despawn()` 处理生命周期。
- 可见性切换按节点能力处理，不能默认所有实例都暴露 `visible` 字段。

`object_pool.gd`

```gdscript
class_name ObjectPool
extends Node

@export var pooled_scene: PackedScene
@export var initial_size: int = 10
@export var can_grow: bool = true

var _available: Array[Node] = []
var _in_use: Array[Node] = []

func _ready() -> void:
    _initialize_pool()

func _initialize_pool() -> void:
    for _index in initial_size:
        _create_instance()

func _create_instance() -> Node:
    var instance := pooled_scene.instantiate()
    _set_instance_active(instance, false)
    add_child(instance)
    _available.append(instance)

    if instance.has_signal("returned_to_pool"):
        instance.returned_to_pool.connect(_return_to_pool.bind(instance))

    return instance

func get_instance() -> Node:
    var instance: Node

    if _available.is_empty():
        if not can_grow:
            push_warning("Pool exhausted and cannot grow")
            return null
        instance = _create_instance()
        _available.erase(instance)
    else:
        instance = _available.pop_back()

    _set_instance_active(instance, true)
    _in_use.append(instance)

    if instance.has_method("on_spawn"):
        instance.on_spawn()

    return instance

func _return_to_pool(instance: Node) -> void:
    if not _in_use.has(instance):
        return

    _in_use.erase(instance)

    if instance.has_method("on_despawn"):
        instance.on_despawn()

    _set_instance_active(instance, false)
    _available.append(instance)

func _set_instance_active(instance: Node, is_active: bool) -> void:
    instance.process_mode = Node.PROCESS_MODE_INHERIT if is_active else Node.PROCESS_MODE_DISABLED

    if instance is CanvasItem:
        (instance as CanvasItem).visible = is_active
    elif instance is Node3D:
        (instance as Node3D).visible = is_active

func return_all() -> void:
    for instance in _in_use.duplicate():
        _return_to_pool(instance)
```

### 模式 5：组件化命中系统用后备字段与信号拆掉循环依赖

- `Hitbox` 只负责发现命中和传递攻击上下文。
- `Hurtbox` 只负责接收命中并转给 `HealthComponent`。
- 生命值组件自己维护后备字段 `_current_health`，避免 setter 自递归。

`health_component.gd`

```gdscript
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal damaged(amount: int, source: Node)
signal healed(amount: int)
signal died

@export var max_health: int = 100
@export var invincibility_time: float = 0.0

var _current_health: int = 0
var current_health: int:
    get:
        return _current_health
    set(value):
        var next_value := clampi(value, 0, max_health)
        if next_value == _current_health:
            return
        _current_health = next_value
        health_changed.emit(_current_health, max_health)

var _invincible: bool = false

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int, source: Node = null) -> int:
    if _invincible or current_health <= 0:
        return 0

    var actual := mini(amount, current_health)
    current_health -= actual
    damaged.emit(actual, source)

    if current_health <= 0:
        died.emit()
    elif invincibility_time > 0.0:
        _start_invincibility()

    return actual

func heal(amount: int) -> int:
    var actual := mini(amount, max_health - current_health)
    current_health += actual
    if actual > 0:
        healed.emit(actual)
    return actual

func _start_invincibility() -> void:
    _invincible = true
    await get_tree().create_timer(invincibility_time).timeout
    _invincible = false
```

`hitbox_component.gd`

```gdscript
class_name HitboxComponent
extends Area2D

signal hit(hurtbox: HurtboxComponent)

@export var damage: int = 10
@export var knockback_force: float = 200.0

var owner_node: Node

func _ready() -> void:
    owner_node = get_parent()
    area_entered.connect(_on_area_entered)

func _on_area_entered(area: Area2D) -> void:
    if area is HurtboxComponent:
        var hurtbox := area as HurtboxComponent
        if hurtbox.owner_node != owner_node:
            hit.emit(hurtbox)
            hurtbox.receive_hit(self)
```

`hurtbox_component.gd`

```gdscript
class_name HurtboxComponent
extends Area2D

signal hurt(hitbox: HitboxComponent)

@export var health_component: HealthComponent

var owner_node: Node

func _ready() -> void:
    owner_node = get_parent()

func receive_hit(hitbox: HitboxComponent) -> void:
    hurt.emit(hitbox)

    if health_component != null:
        health_component.take_damage(hitbox.damage, hitbox.owner_node)
```

## 检查清单

- 状态机是否覆盖了“首状态为空 / 状态不存在 / 重复切换 / 退出清理”。
- 所有带通知的属性是否使用后备字段，避免 setter 自递归。
- `Resource` 是否只存模板数据；运行时状态是否通过 `duplicate(true)` 或实例字段隔离。
- 对象池是否处理了 `CanvasItem` / `Node3D` / 普通 `Node` 的差异，而不是直接访问不存在的属性。
- `Autoload` 是否只承担全局编排；是否把角色实例状态错误地塞进了单例。
- 性能热点是否缓存节点引用、减少热路径分配，并在离屏或闲置时关闭 `process`。
- 需要场景切换、存档系统时，是否同步核对了 [references/advanced-patterns.md](references/advanced-patterns.md) 中的异步加载与存档边界。

## 反模式

- 直接在多个场景实例之间共享同一个可变 `Resource`，导致一个角色掉血全队一起掉。
- 在 `score`、`current_health` 这类 setter 里再次给自身赋值，触发无限递归。
- `transition_to()` 默认旧状态永远存在，结果首次切换直接空引用崩溃。
- 对象池不分节点类型就直接切可见性字段，结果池里一旦混入普通 `Node` 就在运行时炸掉。
- 把场景切换、存档、战斗结算都塞进一个 `Autoload`，最后变成难以测试的全局 God Object。
- 在 `_process()`、`_physics_process()` 中频繁 `get_node()`、新建数组或字典，靠帧循环放大无谓开销。
- 用直接引用把 UI、敌人、玩家、关卡管理器绑成网状依赖，而不是用信号或事件边界解耦。
