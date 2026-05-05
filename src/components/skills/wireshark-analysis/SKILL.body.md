# 网络流量分析

## 适用场景
- 需要对抓包文件进行过滤、跟流、字段提取和异常定位。
- 需要与 [nmap](../ethical-hacking-methodology/SKILL.md) 的端口画像交叉验证暴露服务。
- 需要把会话样本交给 [protocol-reverse-engineering](../protocol-reverse-engineering/SKILL.md) 深挖协议。

## 核心约束
- 先确认抓包点、时区和采集窗口，再解释流量。
- 优先用显示过滤器收窄数据集，避免在全量流量里盲看。
- 保存原始 PCAP，不在原始证据上改写。
- 异常结论必须绑定具体流、时间和端点。

## 代码模式
```bash
tshark -r capture.pcap -Y 'http || tls || dns'
tshark -r capture.pcap -q -z conv,tcp
tshark -r capture.pcap -Y 'ip.addr == 10.0.0.10 && tcp.port == 443' -V | sed -n '1,120p'
```

## 检查清单
- 确认时间线、端点、协议层次和异常流。
- 对关键连接跟流并导出证据。
- 把基线流量与异常流量分开描述。
- 必要时导出字段表供后续协议分析。

## 反模式

### FAIL: 无过滤肉眼翻

```bash
wireshark capture.pcap  # 50 万个包
# 滚轮翻 2 小时，仍找不到关键
```

### PASS: 显示过滤收窄

```bash
# 只看可疑端点
tshark -r capture.pcap -Y 'ip.addr == 1.2.3.4'
# 只看 HTTP 错误
tshark -r capture.pcap -Y 'http.response.code >= 400'
# 只看 TLS 握手失败
tshark -r capture.pcap -Y 'tls.alert_message'
```

### FAIL: 截图无过滤表达式

```
报告里：[wireshark 截图.png]
→ 同事："这是怎么过滤出来的？"
→ "我忘了" → 复核失败
```

### PASS: 留可复现命令

```md
## Finding 003: TLS 握手失败异常激增
- PCAP: incident-2026-04-15.pcap (sha256: ...)
- 过滤表达式: `tls.alert_message and ip.dst == 10.0.0.10`
- 时间窗: 2026-04-15 14:23:00 ~ 14:25:00 UTC
- 命中包数: 1247
- 复核命令: `tshark -r incident-...pcap -Y '上面表达式' | wc -l`
```

### FAIL: 无端点定性

```
"流量里有大量 SYN 包 → SYN flood 攻击"
→ 实际：客户端是健康检查，每秒 100 次连接是预期行为
```

### PASS: 端点 + 基线对比

```
1. 标注 source / destination IP + 业务身份
2. 与正常时段基线对比（每秒 100 vs 10000 才异常）
3. 看是否伴随响应失败 / 资源耗尽
4. 综合判定才能定性
```
