# finance-expert

财务分析专家插件，覆盖财报比率、DCF 估值、预算差异分析、滚动预测，以及更深入的 DCF/敏感性建模模式。

## 目录

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`dispatch.mjs`、`hooks.json` 与 `session-start/plugin-sanity.mjs`
- `skills/financial-analyst/`：4 个可直接运行的标准库 CLI 脚本与样例数据
- `skills/creating-financial-models/`：依赖 `numpy`/`pandas` 的 DCF 与敏感性建模脚本
- `skills/risk-metrics-calculation/`：风险指标方法论与经校验的代码模式

## Python 依赖

- `financial-analyst`：仅使用 Python 标准库
- `creating-financial-models`：需要 `numpy`、`pandas`
- `risk-metrics-calculation`：示例代码使用 `numpy`、`pandas`

安装第三方依赖：

```bash
python3 -m pip install -r plugins/finance-expert/requirements.txt
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/finance-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install finance-expert@ai-experts
claude plugin install finance-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall finance-expert
claude plugin uninstall finance-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
python3 -m json.tool plugins/finance-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/finance-expert/hooks/hooks.json >/dev/null
node --check plugins/finance-expert/hooks/dispatch.mjs
node --test plugins/finance-expert/tests/*.test.mjs
python3 -m unittest discover -s plugins/finance-expert/tests -p 'test_*.py'
python3 -m py_compile $(find plugins/finance-expert -name '*.py' -print)
```
