## 代码模式
```bash
tshark -r capture.pcap -Y 'tcp.port == 9000' -x
xxd -g 1 sample-frame.bin | sed -n '1,32p'
tshark -r capture.pcap -T fields -e frame.number -e data.data
```
