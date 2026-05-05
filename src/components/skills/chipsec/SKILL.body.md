## 代码模式
```bash
chipsec_main -m common.bios_wp
chipsec_main -m tools.uefi.scan_image -a firmware.bin
chipsec_util spi dump firmware.bin
```
