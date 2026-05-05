## 代码模式
```bash
file sample.bin
strings -a sample.bin | head -n 40
objdump -d sample.bin | sed -n '1,120p'
```
