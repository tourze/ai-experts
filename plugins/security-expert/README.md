# security-expert

安全攻防专家能力，覆盖威胁建模、渗透测试、逆向工程、漏洞分析、网络取证和安全方法论。

## Agents

按场景拆分的窄向 agent，每个预加载相关 skill 在隔离上下文中输出专项报告。

| Agent | 适用场景 | 预加载 skill |
|-------|----------|--------------|
| `security-auditor` | 应用层只读漏洞审计：OWASP top 10、认证授权、敏感数据流、API 输入校验、前端防刷保护 | code-review-agent-framework, security-threat-model, frontend-dynamic-code-protection, sql-review-optimization, evidence-quality-framework |
| `mobile-security-auditor` | Android APK / iOS IPA 客户端安全：manifest、组件暴露、硬编码 secret、deeplink、反逆向态势 | android-apk-audit, android-manifest-security, android-frida-script-catalog, intent-deeplink-abuse, apktool, jadx, dex-dumper, ios-binary-analysis, ios-secret-scan, anti-reversing-techniques |
| `pentest-operator` | 在已授权工程中执行主机发现、漏洞利用验证、提权与后渗透 | ethical-hacking-methodology, nmap, linux-privilege-escalation, active-directory-attacks, broken-authentication, file-path-traversal, api-fuzzing-bug-bounty, intent-deeplink-abuse, top-web-vulnerabilities |
| `reverse-engineer` | 二进制 / APK / IPA / 固件 / 内存 / 协议的静态反汇编、反编译、动态 hook、符号与结构恢复 | binary-analysis-patterns, apktool, jadx, dex-dumper, idapython-scripting, frida-dynamic-analysis, android-frida-script-catalog, unicorn-emulation, symbol-recovery, struct-recovery, anti-reversing-techniques, ios-binary-analysis, chipsec, protocol-reverse-engineering, wireshark-analysis, memory-forensics |
| `security-researcher` | 当需要对二进制、固件、移动应用或网络流量做深度安全研究时使用——覆盖静态反汇编、动态 hook、内存取证、协议逆向和模拟执行。只读分析，产出研究报告与漏洞证据。 | android-apk-audit, binary-analysis-patterns, chipsec, frida-dynamic-analysis, idapython-scripting, ios-binary-analysis, ios-secret-scan, memory-forensics, protocol-reverse-engineering, unicorn-emulation, wireshark-analysis, ethical-hacking-methodology, evidence-quality-framework |
| `threat-modeler` | 系统设计或合规阶段建立威胁模型、生成攻击树、推导安全需求与缓解映射，支持写盘 docs/security/ | security-threat-model, stride-analysis-patterns, attack-tree-construction, threat-mitigation-mapping, security-requirement-extraction, security-ownership-map |

## Skills

| Skill | 用途 |
|-------|------|
| `security-threat-model` | 仓库级威胁建模（信任边界/资产/攻击者） |
| `stride-analysis-patterns` | STRIDE 方法论系统性威胁识别 |
| `attack-tree-construction` | 攻击树构建与攻击路径可视化 |
| `threat-mitigation-mapping` | 威胁到安全控制的映射 |
| `security-requirement-extraction` | 从威胁模型导出安全需求 |
| `security-ownership-map` | 安全所有权拓扑分析 |
| `top-web-vulnerabilities` | Web 应用 OWASP Top 10 漏洞识别 |
| `broken-authentication` | 认证/授权漏洞测试 |
| `file-path-traversal` | 目录遍历漏洞测试 |
| `api-fuzzing-bug-bounty` | API 安全模糊测试 |
| `frontend-dynamic-code-protection` | H5/Web 前端防刷量、反爬虫、请求参数保护与动态化代码保护 |
| `ethical-hacking-methodology` | 渗透测试全流程方法论 |
| `active-directory-attacks` | Active Directory 攻击技术 |
| `linux-privilege-escalation` | Linux 提权技术 |
| `nmap` | 网络侦察与端口扫描 |
| `wireshark-analysis` | 网络流量分析 |
| `binary-analysis-patterns` | 二进制反汇编/反编译/控制流分析 |
| `anti-reversing-techniques` | 反逆向与混淆保护技术 |
| `protocol-reverse-engineering` | 网络协议逆向工程 |
| `memory-forensics` | 内存取证（进程/注入/Rootkit） |
| `chipsec` | UEFI/BIOS 固件安全分析 |
| `jadx` | Android APK 反编译（DEX → Java 源码） |
| `apktool` | Android APK 解包与资源提取 |
| `dex-dumper` | 当需要从运行中的 Android 应用内存中 dump DEX 文件以绕过加壳保护时使用。 |
| `frida-dynamic-analysis` | 当需要用 Frida 做运行时 hook、trace、bypass 或动态分析时使用；涉及 Interceptor、Java.perform、ObjC.classes、内存扫描或自适应 bypass。 |
| `idapython-scripting` | 当需要编写 IDAPython 脚本做函数遍历、交叉引用、字节搜索、Hex-Rays 反编译或 IDALib 批量分析时使用。 |
| `ios-binary-analysis` | 当需要提取和分析 iOS IPA、Mach-O 二进制、dylib 或 framework，做类 dump 和调用链追踪时使用。 |
| `ios-secret-scan` | 当需要扫描 iOS 应用中的硬编码凭据、云服务密钥、弱加密和安全配置问题时使用。 |
| `struct-recovery` | 当需要从反编译代码中恢复数据结构定义、推断字段类型和布局时使用。 |
| `symbol-recovery` | 当需要为 stripped 二进制中的函数恢复符号名、识别已知库函数或算法实现时使用。 |
| `unicorn-emulation` | 当需要用 Unicorn 引擎模拟执行特定函数、绕过环境依赖或离线调试加密/解密算法时使用。 |
| `android-apk-audit` | 当需要对 Android APK 或已反编译 Android 应用做端到端安全审计、移动渗透测试、组件攻击面梳理、数据流追踪、动态验证或审计报告时使用。 |
| `android-frida-script-catalog` | 当需要为 Android 动态分析选择、组合或编写 Frida 脚本目录时使用；覆盖 SSL pinning、root/RASP、IPC/deep link、WebView、网络、存储、Keystore、crypto、JNI/native、DEX dump 和脚本加载顺序。 |
| `android-manifest-security` | 当需要审计 AndroidManifest.xml、exported 组件、权限、FileProvider、backup/debuggable、Network Security Config 或 Android 版本相关 manifest 安全配置时使用。 |
| `intent-deeplink-abuse` | 当需要测试 Android Intent injection、nested intent relay、deep link abuse、App Link 验证、FileProvider URI grant、PendingIntent 可变性或 exported 组件 confused deputy 风险时使用。 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/security-expert/hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
find plugins/security-expert/skills -type f -name '*.py' -print0 | xargs -0 -n1 python3 -m py_compile
node --test plugins/security-expert/tests/*.test.mjs
```
