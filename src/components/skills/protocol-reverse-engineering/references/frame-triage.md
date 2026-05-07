# 协议帧初筛命令

## 从 PCAP 提取十六进制

```bash
tshark -r capture.pcap -Y 'tcp.port == 9000' -x
tshark -r capture.pcap -T fields -e frame.number -e ip.src -e ip.dst -e tcp.srcport -e tcp.dstport -e data.data
```

## 查看样本帧

```bash
xxd -g 1 sample-frame.bin | sed -n '1,32p'
hexdump -C sample-frame.bin | sed -n '1,32p'
```

## 提取候选会话

```bash
tshark -r capture.pcap -Y 'tcp.stream == 3' -T fields -e frame.number -e frame.time_relative -e data.data
tshark -r capture.pcap -q -z follow,tcp,ascii,3
```

整理字段表时记录 offset、长度、方向、样本覆盖范围和置信度。
