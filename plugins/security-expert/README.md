# security-expert

安全攻防专家能力，覆盖威胁建模、渗透测试、逆向工程、漏洞分析、网络取证和安全方法论。

## Agents

| Agent | 用途 |
|-------|------|
| `pentest-operator` | 在已授权工程中执行主机发现、漏洞利用验证、提权与后渗透 |
| `security-auditor` | 应用层只读漏洞审计：OWASP top 10、认证授权、敏感数据流、API 输入校验、前端防刷保护 |
| `security-researcher` | 当需要对二进制、固件、移动应用或网络流量做深度安全研究时使用——覆盖静态反汇编、动态 hook、内存取证、协议逆向和模拟执行。只读分析，产出研究报告与漏洞证据。 |
| `threat-modeler` | 系统设计或合规阶段建立威胁模型、生成攻击树、推导安全需求与缓解映射，支持写盘 docs/security/ |

## Skills

| Skill | 用途 |
|-------|------|
| `android-apk-audit` | 当需要对 Android APK 或已反编译 Android 应用做端到端安全审计、移动渗透测试、组件攻击面梳理、数据流追踪、动态验证或审计报告时使用。 |
| `binary-analysis-patterns` | 二进制反汇编/反编译/控制流分析 |
| `chipsec` | UEFI/BIOS 固件安全分析 |
| `ethical-hacking-methodology` | 渗透测试全流程方法论 |
| `frida-dynamic-analysis` | 当需要用 Frida 做运行时 hook、trace、bypass 或动态分析时使用；涉及 Interceptor、Java.perform、ObjC.classes、内存扫描或自适应 bypass。 |
| `frontend-dynamic-code-protection` | H5/Web 前端防刷量、反爬虫、请求参数保护与动态化代码保护 |
| `idapython-scripting` | 当需要编写 IDAPython 脚本做函数遍历、交叉引用、字节搜索、Hex-Rays 反编译或 IDALib 批量分析时使用。 |
| `ios-binary-analysis` | 当需要提取和分析 iOS IPA、Mach-O 二进制、dylib 或 framework，做类 dump 和调用链追踪时使用。 |
| `ios-secret-scan` | 当需要扫描 iOS 应用中的硬编码凭据、云服务密钥、弱加密和安全配置问题时使用。 |
| `memory-forensics` | 内存取证（进程/注入/Rootkit） |
| `owasp-auth-data-audit` | 认证会话安全、密钥管理、批量赋值漏洞审计 |
| `owasp-injection-audit` | 命令注入、SSRF、路径遍历等注入类漏洞审计 |
| `owasp-xss-misconfig-audit` | XSS 跨站脚本、安全头配置、依赖风险审计 |
| `protocol-reverse-engineering` | 网络协议逆向工程 |
| `security-ownership-map` | 安全所有权拓扑分析 |
| `security-threat-model` | 仓库级威胁建模（信任边界/资产/攻击者） |
| `unicorn-emulation` | 当需要用 Unicorn 引擎模拟执行特定函数、绕过环境依赖或离线调试加密/解密算法时使用。 |
| `wireshark-analysis` | 网络流量分析 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/security-expert/hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
find plugins/security-expert/skills -type f -name '*.py' -print0 | xargs -0 -n1 python3 -m py_compile
node --test plugins/security-expert/tests/*.test.mjs
```
