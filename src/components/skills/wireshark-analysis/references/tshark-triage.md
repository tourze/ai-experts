# tshark 流量分析初筛命令

## 协议与会话概览

```bash
tshark -r capture.pcap -Y 'http || tls || dns'
tshark -r capture.pcap -q -z conv,tcp
tshark -r capture.pcap -q -z endpoints,ip
```

## 端点与端口过滤

```bash
tshark -r capture.pcap -Y 'ip.addr == 10.0.0.10 && tcp.port == 443' -V | sed -n '1,120p'
tshark -r capture.pcap -Y 'dns || tcp.analysis.retransmission || tcp.flags.reset == 1'
```

## 字段导出

```bash
tshark -r capture.pcap -T fields -e frame.number -e frame.time -e ip.src -e ip.dst -e _ws.col.Protocol -e _ws.col.Info
tshark -r capture.pcap -Y 'tcp.stream == 3' -T fields -e frame.number -e data.data
```

报告中保留过滤表达式、packet number、端点、时间窗口和原始 PCAP 哈希。
