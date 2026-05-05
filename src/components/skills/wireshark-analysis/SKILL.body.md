## 代码模式
```bash
tshark -r capture.pcap -Y 'http || tls || dns'
tshark -r capture.pcap -q -z conv,tcp
tshark -r capture.pcap -Y 'ip.addr == 10.0.0.10 && tcp.port == 443' -V | sed -n '1,120p'
```
