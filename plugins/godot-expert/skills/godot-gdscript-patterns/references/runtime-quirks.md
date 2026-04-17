# runtime-quirks.md

Godot 4.6 运行时陷阱清单：只记录"写法看似对但会报错或行为异常"的问题。写 GDScript 前通读，或按症状回查。条目提炼自 [htdt/godogen](https://github.com/htdt/godogen) 的 `quirks.md`（MIT），剔除了依赖 `--headless --script` / `--write-movie` 的专有条目。

## 节点生命周期与信号

- `init()` / `setup()` 在 `add_child()` 之前调用 → `@onready` 为 `null`。入参先存普通字段，`_ready()` 里再落到节点；或用 `get_node_or_null()`。
- 兄弟节点 `_ready()` 信号时序：按树序触发，A emit 时 B 还没 connect。连完 signal 后检查 emitter 是否已有数据，有就手动调一次 handler。
- `get_path()` 是 `Node` 内置方法（返回 `NodePath`），不能重载。自定义方法命名为 `get_track_path()` 等。
- `preload()` 在解析期解析资源，资源还不存在（如流程中动态生成的场景）会直接失败。不确定存在时用 `load()`。

## 相机

- `Camera2D` 没有 `current` 属性 → 用 `make_current()`，且节点必须已入场景树。
- `_physics_process()` 里 `lerp()` 追随目标的相机第一帧会从 `(0,0,0)` 可见滑入。用 `_initialized` flag，第一帧 snap，后续帧再 lerp。
- 瞬移或切相机时调 `reset_physics_interpolation()`，否则会可见抽帧。

## 碰撞层与物理

- `collision_layer` / `collision_mask` 是位掩码不是 UI 层号：UI Layer 1=`1`、2=`2`、3=`4`、4=`8`（2 的幂）。`collision_layer = 4` 对应 Layer 3。
- 新建刚体 / 角色默认 `collision_mask = 1`，地形在 layer 2+ 会直接穿过且无报错。必须显式设 mask。
- `BoxShape3D` 在 trimesh 上卡棱（Godot / Jolt bug）。要在 trimesh 上滑动的物体（车辆、球）用 `CapsuleShape3D`。
- `CharacterBody3D.MOTION_MODE_FLOATING` 也适用于斜坡载具、雪板；`GROUNDED` 的 `floor_stop_on_slope` 会跟斜坡打架。
- 在 `body_entered` / `body_exited` 回调里改 `CollisionShape.disabled` 会报 "Can't change state while flushing queries"。必须 `set_deferred("disabled", false)`。
- 在激活 `Area2D` 内 spawn 可拾取物会同帧 `area_entered` 被销毁。记 `_alive_time`，前 ~0.8s 忽略 `area_entered`。
- 2D 碰撞形状略小于 tile（64px 网格用 48px）可顺畅转角。
- 帧率相关 drag：`speed *= (1 - drag)` 是依赖 tick 的指数衰减，60Hz 每秒剩 8.5%，120Hz 剩 0.7%。改用 `speed *= exp(-rate * delta)`。

## 材质、GLB 与渲染

- GLB 内部 `MeshInstance3D` 设 `material_override` 不会序列化（`set_owner_on_new_nodes()` 跳过有 `scene_file_path` 的子节点）。要自定义材质时用程序化 `ArrayMesh`。
- `MultiMeshInstance3D` 从 GLB 取 mesh 时，必须在释放源实例前 `Mesh.duplicate()`，否则 mesh 被 GC。
- `MultiMeshInstance3D.custom_aabb` 必须覆盖整个可见区域，否则相机到边缘会被视锥剔除。
- `MultiMeshInstance3D` 没有 `set_surface_override_material()`，用 `GeometryInstance3D.material_override` 或保留源 mesh 材质。
- `ProceduralSkyMaterial` 太阳盘用 `DirectionalLight3D` 方向色。主光 `sky_mode = SKY_MODE_LIGHT_AND_SKY`，补光 `SKY_MODE_LIGHT_ONLY`，否则会叠出多个太阳。
- `StandardMaterial3D.no_depth_test = true` + `TRANSPARENCY_ALPHA` 会整个消失。叠加层改用 opaque + unshaded。
- 叠层平面 Z-fighting（路面贴地形）：垂直 offset 0.15~0.30m + `render_priority = 1`。
- 程序化网格 winding 不确定时加 `cull_mode = CULL_DISABLED` 保险，确认后再恢复。
- UV 平铺双重缩放产生 Moire：世界空间 UV 配 `uv1_scale = Vector3(1,1,1)`，或归一化 UV 配 `uv1_scale = Vector3(tiles, tiles, 1)`，二选一。

## 粒子系统

- `GPUParticles2D` 的物理属性都在 `ParticleProcessMaterial` 上：`direction` / `spread` / `gravity` / `initial_velocity_min/max` / `damping_min/max` / `scale_min/max`。节点上只有 `amount` / `lifetime` / `emitting` / `one_shot` / `explosiveness` / `process_material`。设错位置会 "Invalid assignment"。
- `CPUParticles2D` vs `GPUParticles2D` API 不同：CPU 版把 `direction`（`Vector2`）、`spread`、`gravity`（`Vector2`）、`scale_amount_min/max` 直接放节点上，不需要 material；GPU 版全走 `ParticleProcessMaterial` 且用 `Vector3`。
- `CPUParticles2D.color_ramp` 要 `Gradient`（不是 `GradientTexture1D`）。`ParticleProcessMaterial.color_ramp` 反过来要 `Texture2D`（用 `GradientTexture1D`）。

## 动画、数学与 API 命名

- `SpriteFrames.set_loop()` 不存在 → 用 `set_animation_loop("name", bool)`（Godot 3 老名字会 `SCRIPT ERROR`）。同类：`set_animation_speed()`（不是 `set_speed()`）。
- GDScript 整数除法截断：`tex.get_width() / 4` 不整除会少 1 像素，`Rect2` 切片随 sheet 累积漂移。写 `float(tex.get_width()) / float(grid)`。
- 角度 `lerp()` 在 `PI` 附近会整圈转。先 wrap 角差到 `[-PI, PI]`：

```gdscript
var diff: float = fmod(target_yaw - current_yaw + 3.0 * PI, TAU) - PI
current_yaw += diff * t
```

## 类型推断（`:=`）陷阱

```gdscript
# WRONG — load() 返回 Resource，无 instantiate()：
var scene := load("res://car.glb")
var model := scene.instantiate()

# WRONG — := 与 instantiate() 同用 → Variant 推断失败：
var scene: PackedScene = load("res://car.glb")
var model := scene.instantiate()

# CORRECT — 显式类型 + instantiate() 用 =
var scene: PackedScene = load("res://car.glb")
var model = scene.instantiate()
```

以下函数返回 `Variant`，不能用 `:=`：`abs` / `sign` / `clamp` / `min` / `max` / `floor` / `ceil` / `round` / `lerp` / `smoothstep` / `move_toward` / `wrap` / `snappedf` / `randf_range` / `randi_range`。数组/字典元素访问同理：`var pos := positions[i]` 报错，改成 `var pos: Vector3 = positions[i]` 或不带类型。

## 值类型参数陷阱

`bool` / `int` / `float` / `Vector2/3` / `AABB` / `Transform2D/3D` 都是值类型，函数内部赋值不回写调用方。需要输出参数时用 `Array` / `Dictionary` 累加器：

```gdscript
# WRONG:
func collect(node: Node, result: AABB) -> void:
    result = result.merge(child_aabb)  # 返回后丢失
# CORRECT:
func collect(node: Node, out: Array) -> void:
    out.append(child_aabb)
```

## 扩充规范

新条目格式"症状 + 正确做法"，标注 Godot 版本；Godot 升级后回来复核。只收录普通编辑器 + 运行模式能复现的陷阱。
