# 环境捕获

需要记录的硬件、软件和配置上下文，以确保可复现的基准测试结果。

---

## 硬件上下文

### 必填字段

| 字段       | 如何捕获                              | 示例                                                    |
| ---------- | ------------------------------------- | ------------------------------------------------------- |
| CPU 型号   | <code>lscpu &#124; grep "Model name"</code> 或 `sysctl -n machdep.cpu.brand_string` | Apple M2 Pro, Intel i9-13900K |
| CPU 核心数 | `nproc` 或 `sysctl -n hw.ncpu`       | 12 核 (8P + 4E)                                        |
| 内存       | `free -h` 或 `sysctl -n hw.memsize`  | 32 GB                                                   |
| GPU        | `nvidia-smi` 或系统分析工具           | NVIDIA A100 40GB                                        |
| 存储       | `lsblk` 或磁盘工具                    | NVMe SSD, 1TB                                           |

### 可选字段（用于严格基准测试）

| 字段             | 如何捕获                     |
| ---------------- | ---------------------------- |
| CPU 频率         | <code>lscpu &#124; grep MHz</code>  |
| CPU 缓存大小     | <code>lscpu &#124; grep cache</code> |
| NUMA 拓扑        | `numactl --hardware`         |
| 热状态           | `sensors` 或 CPU 温度监控    |

### macOS 捕获脚本

```bash
echo "CPU: $(sysctl -n machdep.cpu.brand_string)"
echo "Cores: $(sysctl -n hw.ncpu)"
echo "RAM: $(( $(sysctl -n hw.memsize) / 1073741824 )) GB"
echo "OS: $(sw_vers -productVersion)"
```

### Linux 捕获脚本

```bash
echo "CPU: $(lscpu | grep 'Model name' | sed 's/.*: *//')"
echo "Cores: $(nproc)"
echo "RAM: $(free -h | awk '/Mem:/ {print $2}')"
echo "OS: $(uname -r)"
```

---

## 软件上下文

### 必填字段

| 字段                     | 如何捕获                             | 示例                       |
| ------------------------ | ------------------------------------ | -------------------------- |
| 操作系统版本             | `uname -r`                           | Darwin 25.3.0, Linux 6.5.0 |
| 语言运行时               | `python --version`, `node --version` | Python 3.12.1              |
| 包版本                   | `pip freeze`, `npm list`             | numpy==1.26.3              |
| 关键依赖版本             | 从锁定文件中提取                     | PyTorch 2.2.0, CUDA 12.1   |

### Python 环境捕获

```bash
python --version
pip freeze > benchmark_requirements.txt
echo "Virtual env: $VIRTUAL_ENV"
```

### Node.js 环境捕获

```bash
node --version
npm --version
npm list --depth=0 > benchmark_packages.txt
```

---

## 配置上下文

### 应用级配置

记录任何影响性能的设置：

| 设置类型           | 示例                                      |
| ------------------ | ----------------------------------------- |
| 线程数             | `WORKERS=4`, `OMP_NUM_THREADS=8`          |
| 批处理大小         | `BATCH_SIZE=32`                           |
| 缓存设置           | `CACHE_SIZE=1GB`, `CACHE_ENABLED=true`    |
| 连接池             | `MAX_CONNECTIONS=100`                     |
| 内存限制           | `JAVA_OPTS=-Xmx4g`                        |
| 优化标志           | `-O2`, `--release`, `NODE_ENV=production` |

### 数据库配置（如适用）

| 设置                    | 影响                       |
| ----------------------- | -------------------------- |
| `shared_buffers`        | 查询缓存大小               |
| `work_mem`              | 排序/哈希操作内存           |
| `max_connections`       | 连接池大小                 |
| `effective_cache_size`  | 查询计划器行为             |

---

## 可复现性检查清单

### 最低可复现性

- [ ] 所有硬件字段已记录
- [ ] 所有软件版本已捕获
- [ ] 配置设置已记录
- [ ] 输入数据已描述（或提供）
- [ ] 预热迭代次数已指定
- [ ] 测量迭代次数已指定
- [ ] 运行基准测试的命令已记录

### 完全可复现性

- [ ] Docker/容器镜像已提供
- [ ] 输入数据已包含（或生成脚本）
- [ ] 随机种子已固定
- [ ] 环境变量已记录
- [ ] 后台进程状态已注明
- [ ] 记录当日时间（用于云基准测试）

---

## 报告模板

在基准测试结果顶部包含此模块：

```markdown
## 环境

| 组件       | 值                     |
| ---------- | ---------------------- |
| CPU        | {型号, 核心数}         |
| 内存       | {大小}                 |
| GPU        | {型号}（如适用）       |
| 操作系统   | {名称, 版本}           |
| 运行时     | {语言, 版本}           |
| 关键依赖   | {包版本}               |

### 配置

| 设置                     | 值      |
| ------------------------ | ------- |
| 线程数                   | {N}     |
| 批处理大小               | {N}     |
| {其他相关设置}           | {值}    |

### 基准测试参数

| 参数               | 值    |
| ------------------ | ----- |
| 预热迭代次数       | {N}   |
| 测量迭代次数       | {N}   |
| 输入规模           | {列表} |
```
