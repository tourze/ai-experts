# Godot GDScript：进阶模式

面向需要继续下探场景切换、异步加载、存档落盘与性能约束的场景。这里的示例默认运行在 Godot 4，并假设你已经按主技能里的边界拆好了状态、资源和组件职责。

## 模式 6：异步场景切换把“过渡动画”和“资源加载”串成一条链

- 先播放转场，再发起线程加载；加载完成后统一走 `_swap_scene()`，不要让缓存命中和线程加载走两套收尾逻辑。
- 如果转场场景需要切 `visible`，其根节点应继承 `CanvasItem`。

`scene_manager.gd`

```gdscript
extends Node

signal scene_loading_started(scene_path: String)
signal scene_loading_progress(progress: float)
signal scene_loaded(scene: Node)
signal transition_started
signal transition_finished

@export var transition_scene: PackedScene

var _current_scene: Node = null
var _transition: CanvasItem = null

func _ready() -> void:
    _current_scene = get_tree().current_scene

    if transition_scene != null:
        var transition_instance := transition_scene.instantiate()
        if transition_instance is CanvasItem:
            _transition = transition_instance as CanvasItem
            add_child(_transition)
            _transition.visible = false
        else:
            push_warning("transition_scene root should inherit CanvasItem")

func change_scene(scene_path: String, with_transition: bool = true) -> void:
    if with_transition:
        await _play_transition_out()

    await _load_scene(scene_path)

func change_scene_packed(scene: PackedScene, with_transition: bool = true) -> void:
    if with_transition:
        await _play_transition_out()

    await _swap_scene(scene.instantiate())

func _load_scene(path: String) -> void:
    scene_loading_started.emit(path)

    if ResourceLoader.has_cached(path):
        var cached_scene := load(path) as PackedScene
        await _swap_scene(cached_scene.instantiate())
        return

    var request_error := ResourceLoader.load_threaded_request(path)
    if request_error != OK:
        push_error("Failed to request scene load: %s" % path)
        return

    while true:
        var progress := [0.0]
        var status := ResourceLoader.load_threaded_get_status(path, progress)

        match status:
            ResourceLoader.THREAD_LOAD_IN_PROGRESS:
                scene_loading_progress.emit(progress[0])
                await get_tree().process_frame
            ResourceLoader.THREAD_LOAD_LOADED:
                var scene := ResourceLoader.load_threaded_get(path) as PackedScene
                await _swap_scene(scene.instantiate())
                return
            _:
                push_error("Failed to load scene: %s" % path)
                return

func _swap_scene(new_scene: Node) -> void:
    if _current_scene != null:
        _current_scene.queue_free()

    _current_scene = new_scene
    get_tree().root.add_child(_current_scene)
    get_tree().current_scene = _current_scene

    scene_loaded.emit(_current_scene)
    await _play_transition_in()

func _play_transition_out() -> void:
    if _transition == null:
        return

    transition_started.emit()
    _transition.visible = true

    if _transition.has_method("transition_out"):
        await _transition.transition_out()
    else:
        await get_tree().create_timer(0.3).timeout

func _play_transition_in() -> void:
    if _transition == null:
        transition_finished.emit()
        return

    if _transition.has_method("transition_in"):
        await _transition.transition_in()
    else:
        await get_tree().create_timer(0.3).timeout

    _transition.visible = false
    transition_finished.emit()
```

## 模式 7：存档系统同时校验文件、JSON 与数据类型

- 存档失败时先返回空字典并发出错误信号，不要让坏存档继续污染运行时。
- `Saveable` 组件只负责通用坐标与自定义扩展点；业务对象自己的字段仍由父节点实现 `get_custom_save_data()` / `load_custom_save_data()`。

`save_manager.gd`

```gdscript
extends Node

const SAVE_PATH := "user://savegame.save"
const ENCRYPTION_KEY := "replace-with-project-specific-secret"

signal save_completed
signal load_completed
signal save_error(message: String)

func save_game(data: Dictionary) -> void:
    var file := FileAccess.open_encrypted_with_pass(
        SAVE_PATH,
        FileAccess.WRITE,
        ENCRYPTION_KEY
    )

    if file == null:
        save_error.emit("Could not open save file")
        return

    file.store_string(JSON.stringify(data))
    file.close()
    save_completed.emit()

func load_game() -> Dictionary:
    if not FileAccess.file_exists(SAVE_PATH):
        return {}

    var file := FileAccess.open_encrypted_with_pass(
        SAVE_PATH,
        FileAccess.READ,
        ENCRYPTION_KEY
    )

    if file == null:
        save_error.emit("Could not open save file")
        return {}

    var raw_json := file.get_as_text()
    file.close()

    var parsed := JSON.parse_string(raw_json)
    if parsed == null or not (parsed is Dictionary):
        save_error.emit("Could not parse save data")
        return {}

    load_completed.emit()
    return parsed

func delete_save() -> void:
    if FileAccess.file_exists(SAVE_PATH):
        DirAccess.remove_absolute(SAVE_PATH)

func has_save() -> bool:
    return FileAccess.file_exists(SAVE_PATH)
```

`saveable.gd`

```gdscript
class_name Saveable
extends Node

@export var save_id: String

func _ready() -> void:
    if save_id.is_empty():
        save_id = str(get_path())

func get_save_data() -> Dictionary:
    var parent := get_parent()
    var data := {"id": save_id}

    if parent is Node2D:
        data["position"] = {
            "x": parent.position.x,
            "y": parent.position.y,
        }

    if parent.has_method("get_custom_save_data"):
        data.merge(parent.get_custom_save_data(), true)

    return data

func load_save_data(data: Dictionary) -> void:
    var parent := get_parent()

    if data.has("position") and parent is Node2D:
        var position_data := data["position"] as Dictionary
        parent.position = Vector2(
            float(position_data.get("x", 0.0)),
            float(position_data.get("y", 0.0))
        )

    if parent.has_method("load_custom_save_data"):
        parent.load_custom_save_data(data)
```

## 性能提示

```gdscript
# 1. 缓存节点引用，而不是在热路径反复查找
@onready var sprite: Sprite2D = $Sprite2D

# 2. 热路径复用临时容器，避免每帧分配
var _reusable_array: Array[int] = []

func _process(_delta: float) -> void:
    _reusable_array.clear()

# 3. 离屏或闲置时关闭 process
func _on_off_screen() -> void:
    set_process(false)
    set_physics_process(false)
```

## 使用提示

- 需要排查“切场景后 UI 黑屏 / 重复切换 / 载入进度不动”时，先查转场节点类型、`await` 链是否完整、`ResourceLoader` 返回码是否检查。
- 需要排查“读档后位置错乱 / 坏存档崩溃”时，先查 `parsed is Dictionary`、坐标字段是否有默认值、扩展数据是否覆盖通用字段。
- 如果要把这些模式收进生产工程，优先补回归测试：场景切换成功路径、失败路径、坏存档路径、空存档路径、重复读档路径。
