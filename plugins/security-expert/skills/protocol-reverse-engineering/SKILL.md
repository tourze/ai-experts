---
name: protocol-reverse-engineering
description: "当需要从流量、二进制或设备通信中还原私有协议的帧结构、状态机和字段语义时使用。"
---

# 协议逆向工程

## 适用场景
- 需要从 PCAP、串口、USB、TCP/UDP 报文中整理字段、顺序和状态机。
- 需要和 [wireshark-analysis](../wireshark-analysis/SKILL.md) 配合做流量整理。
- 需要和 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 对照客户端或固件中的编解码实现。

## 核心约束
- 先收集多个样本，再推字段语义，不要拿单包强行命名。
- 把传输层、帧边界、编码方式、校验和加密层拆开分析。
- 记录方向、会话状态、长度字段和错误响应。
- 不确定的字段要明确标注置信度。

## 代码模式
```bash
tshark -r capture.pcap -Y 'tcp.port == 9000' -x
xxd -g 1 sample-frame.bin | sed -n '1,32p'
tshark -r capture.pcap -T fields -e frame.number -e data.data
```

## 检查清单
- 确认采集点、时间同步和请求/响应方向。
- 识别帧头、长度、消息类型、序号、校验和。
- 把状态转换和错误码单独列出。
- 必要时回到客户端代码或固件做字段交叉验证。

## 反模式
- 只看可打印字符串就认定是文本协议。
- 没有方向标注就开始推字段。
- 把加密失败误判成“协议不可逆”。
