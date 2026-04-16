# Livewire 组件

## 组件模式

```php
class PostList extends Component
{
    use WithPagination, WithFileUploads;

    public string $search = '';
    public string $sortBy = 'created_at';
    public string $sortDirection = 'desc';

    protected $queryString = [
        'search' => ['except' => ''],
        'sortBy' => ['except' => 'created_at'],
    ];

    public function updatingSearch(): void { $this->resetPage(); }

    public function sortBy(string $field): void
    {
        $this->sortDirection = ($this->sortBy === $field)
            ? ($this->sortDirection === 'asc' ? 'desc' : 'asc')
            : 'asc';
        $this->sortBy = $field;
    }

    public function render()
    {
        return view('livewire.post-list', [
            'posts' => Post::query()
                ->when($this->search, fn($q) => $q->where('title', 'like', "%{$this->search}%"))
                ->orderBy($this->sortBy, $this->sortDirection)
                ->paginate(10),
        ]);
    }
}
```

## 表单与验证

```php
class PostForm extends Component
{
    public ?Post $post = null;
    public string $title = '';
    public string $content = '';

    protected function rules(): array
    {
        return [
            'title' => 'required|min:3|max:255',
            'content' => 'required|min:10',
        ];
    }

    // 实时验证
    public function updated($propertyName): void { $this->validateOnly($propertyName); }

    public function save(): void
    {
        $validated = $this->validate();
        $this->post
            ? $this->post->update($validated)
            : $this->post = Post::create($validated);

        session()->flash('message', '保存成功');
        $this->redirect(route('posts.show', $this->post));
    }
}
```

## Blade 模板要点

```blade
{{-- 搜索（防抖） --}}
<input type="text" wire:model.debounce.300ms="search" placeholder="搜索...">

{{-- 加载状态 --}}
<div wire:loading wire:target="save">保存中...</div>
<button wire:click="save" wire:loading.attr="disabled">保存</button>

{{-- 分页 --}}
{{ $posts->links() }}

{{-- 文件上传与进度 --}}
<input type="file" wire:model="image">
<div wire:loading wire:target="image">上传中...</div>
```

## 事件通信

```php
// 发送事件
$this->emit('postDeleted', $postId);
$this->emitTo('post-stats', 'refresh');
$this->emitUp('saved');

// 监听事件
protected $listeners = ['postDeleted' => 'updateStats'];

// 浏览器事件
$this->dispatchBrowserEvent('post-saved', ['id' => $post->id]);
```

## 性能建议

1. **wire:model.defer** — 表单提交时批量更新
2. **#[Computed]** — 缓存计算属性
3. **wire:poll.visible** — 隐藏时停止轮询
4. **wire:key** — 防止列表整体重渲染
5. **预加载关联** — 避免 N+1
6. **分页** — 不要一次加载全部
