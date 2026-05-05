## 代码模式

- [构建打包模式](references/build-packaging-patterns.md)

## 反模式

### FAIL: 私钥提交仓库

```bash
$ ls .env
TAURI_PRIVATE_KEY=untrusted-comment:...
APPLE_CERT_PASSWORD=...
$ git add .env
$ git push  # 永久泄漏，必须吊销所有 key
```

### PASS: CI secrets 注入

```yaml
# .github/workflows/release.yml
- name: Build
  env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
    APPLE_CERTIFICATE: ${{ secrets.APPLE_CERT_BASE64 }}
  run: cargo tauri build
# .gitignore: .env, *.key, *.p12
```

### FAIL: macOS 只签名不公证

```bash
codesign --sign "Developer ID..." MyApp.app
# 用户首次打开：
# "MyApp.app cannot be opened because it is from an unidentified developer"
# Apple Notary Service 拒绝即视为未公证
```

### PASS: 签名 + 公证 + 装订

```bash
codesign --sign "Developer ID..." --options runtime --timestamp MyApp.app
xcrun notarytool submit MyApp.dmg --wait \
    --apple-id "$APPLE_ID" --password "$APPLE_PWD" --team-id "$TEAM_ID"
xcrun stapler staple MyApp.dmg  # 离线也可验证
```

### FAIL: Sidecar 不加 target triple

```json
{
  "bundle": {
    "externalBin": ["bin/my-tool"]
  }
}
```
```
macOS Intel 用户下载到 ARM 编译的 my-tool → 启动崩溃
```

### PASS: 命名按 target_triple

```
bin/my-tool-x86_64-apple-darwin
bin/my-tool-aarch64-apple-darwin
bin/my-tool-x86_64-pc-windows-msvc.exe
```
```json
{ "externalBin": ["bin/my-tool"] }
// Tauri 自动按当前 target 选择对应文件
```

详见 [references/](references/)。
