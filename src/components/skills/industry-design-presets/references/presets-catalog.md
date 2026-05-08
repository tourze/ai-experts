# 行业设计预设目录

**95 个预设**。每条给出 **Style / Main Color / Accent / BG / Fonts(Display/Body) / AVOID**。

按大类分文件：

## 核心 45（#1-45）

- [presets-tech-saas.md](./presets-tech-saas.md) — SaaS / DevTool / AI / Cybersecurity / Enterprise（#1-8）
- [presets-finance-commerce.md](./presets-finance-commerce.md) — Fintech / Crypto / Insurance / E-commerce（#9-17）
- [presets-health-lifestyle.md](./presets-health-lifestyle.md) — Healthcare / Wellness / Fitness / Lifestyle（#18-26）
- [presets-services-creative.md](./presets-services-creative.md) — Services / Hospitality / Portfolio / Editorial（#27-37）
- [presets-youth-public.md](./presets-youth-public.md) — Gen-Z / Web3 / EdTech / Gov / Nonprofit（#38-45）

## 扩充 50（#46-95）

- [presets-mobility-realestate.md](./presets-mobility-realestate.md) — Real Estate / Logistics / Automotive / Airlines / Transit / Parking / Construction / Agriculture / Auto Repair / Moving（#46-55）
- [presets-local-services.md](./presets-local-services.md) — Florist / Bakery / Brewery / Cafe / Barber / Beauty Salon / Coworking / Wedding / Event Planner / Photography Studio（#56-65）
- [presets-events-culture.md](./presets-events-culture.md) — Museum / Theater / Conference / Festival / Arcade / Gym / Dance-Yoga / Library / Tourism / Nightlife（#66-75）
- [presets-productivity-consumer.md](./presets-productivity-consumer.md) — CRM / Invoice / VPN / Scheduling / Notes / Tasks / Alarm-Sleep / Grocery / Recipe / Pet Care / Plant Care（#76-86）
- [presets-media-edu-care.md](./presets-media-edu-care.md) — Podcast / Newsletter / Language Learning / Coding Bootcamp / Online Course / Kindergarten / Daycare / Senior Care / Veterinary（#87-95）

## 使用建议

- **主 preset + 氛围叠加**：如 "Fintech + Playful" = 用 Fintech 色和字体，圆角和动效偏 Playful。
- **AVOID 优先于选型**：先看禁用项避免踩雷，再看推荐。
- **Dark Mode 例外**：Developer / AI / Crypto / Gaming / Meditation-Sleep / DevTools / Podcast / Nightlife / Theater 默认可深色；其他默认浅色。
- **本土化**：中文项目把 Body 字体换成 `"PingFang SC", "HarmonyOS Sans"`；色相保持不变。
- **跨行业组合**：某些产品横跨多类（如"宠物 + SaaS"、"Gen-Z + Fintech"）——主 preset 跟"最重要的情绪"，再叠加次 preset 的局部元素。

## 致谢

本目录参考 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 products.csv + ui-reasoning.csv 数据结构，预设内容经过重写、精选（162→95）、反模式补强，并扩充到本地服务、文化场所、消费级 App 细分领域。
