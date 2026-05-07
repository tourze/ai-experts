# 二进制初筛命令

## 文件与架构识别

```bash
file sample.bin
readelf -h sample.bin
otool -hv sample.bin
rabin2 -I sample.bin
```

## 字符串与导入表

```bash
strings -a sample.bin | head -n 40
readelf -Ws sample.bin | head -n 40
objdump -T sample.bin | head -n 40
rabin2 -zz sample.bin | head -n 40
```

## 反汇编初筛

```bash
objdump -d sample.bin | sed -n '1,120p'
r2 -A -q -c 'afl~main;pdf @ main' sample.bin
```

记录命令输出时保留文件哈希、工具版本、架构识别结果和关键 offset。
