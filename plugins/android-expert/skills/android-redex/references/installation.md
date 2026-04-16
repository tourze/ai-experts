# ReDex 安装

## macOS

```bash
xcode-select --install
brew install autoconf automake libtool python3 boost jsoncpp
# App Bundle 支持需额外安装 protobuf
brew install protobuf

git clone https://github.com/facebook/redex.git && cd redex
autoreconf -ivf && ./configure && make -j4
sudo make install
```

## Ubuntu / Debian (64-bit, >= 22.04 / Debian 11)

```bash
sudo apt-get install -y automake libtool g++-10 python3 \
  libboost-all-dev libiberty-dev libjemalloc-dev libjsoncpp-dev \
  liblz4-dev liblzma-dev zlib1g-dev
# 或用便捷脚本
sudo ./setup_oss_toolchain.sh && sudo ldconfig

git clone https://github.com/facebook/redex.git && cd redex
autoreconf -ivf && ./configure && make -j4
sudo make install
```

App Bundle 支持需 protobuf >= 3.12.4，构建时加 `--enable-protobuf`：

```bash
autoreconf -ivf && ./configure --enable-protobuf && make -j4
```

## CMake 替代方案

```bash
mkdir build && cd build
cmake ..          # 或 cmake -G Ninja ..
cmake --build .
./redex-all --show-passes   # 验证，应显示约 45 个 pass
```

## 验证安装

```bash
redex-all --show-passes
```

应输出约 45 个 pass 名称。
