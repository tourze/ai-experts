## 代码模式
```bash
tshark -r capture.pcap -Y 'tcp.port == 9000' -x
xxd -g 1 sample-frame.bin | sed -n '1,32p'
tshark -r capture.pcap -T fields -e frame.number -e data.data
```

## 反模式

### FAIL: 单包推协议

```
看一个包：00 04 41 42 43 44
"前 2 字节 0x0004 = 长度，后 4 字节 = ABCD"
→ 推论错误，下个包就发现 0x0004 实际是 message_type
```

### PASS: 多样本对比

```
样本 1: 00 04 41 42 43 44
样本 2: 00 04 58 59 5A 5B
样本 3: 00 07 11 22 33 44 55 66 77
→ 第 2 字节随长度变化 → 是 length
→ 第 1 字节固定 0x00 → 可能是版本/魔数
→ 至少 5+ 样本才推断字段
```

### FAIL: 无方向推字段

```
看到 frame: 01 0A "OK"
"消息类型 0x01 = OK 响应"
→ 实际：这是客户端 → 服务端的请求 ACK，不是响应
```

### PASS: 标注方向 + 时序

```
[t=0.000][C→S] 01 00  # 客户端 hello
[t=0.012][S→C] 02 0A "ack" # 服务端 ack
[t=0.025][C→S] 03 ...  # 客户端 query
→ 字段含义随方向 + 状态机阶段而定
```
