# 线索研究人员 - 完整指南

## 研究工作流

### 1. 公司信息调研

研究基本的公司信息，包括行业、规模、地点和技术栈。

**需要收集的关键信息：**

- 公司名称和法定名称
- 行业和垂直领域
- 公司规模（员工数量）
- 年收入（如有）
- 总部所在地
- 网站和社交媒体资料
- 技术栈和使用的工具
- 近期新闻或融资

**调研方法：**

1. **从公司网站开始：**
   - 查看"关于我们"页面
   - 检查招聘页面获取公司规模指示
   - 查找职位描述中的技术栈信息
   - 记录总部所在地

2. **使用公司数据 API：**
   - Clearbit Enrichment API
   - ZoomInfo API
   - Apollo.io API
   - LinkedIn Sales Navigator
   - Crunchbase API

3. **交叉引用多个来源：**
   - 跨来源验证信息
   - 检查不一致之处
   - 更新过时信息
   - 标记数据质量问题

**示例实现：**

```typescript
// 调研公司信息
async function researchCompany(companyName: string, domain?: string) {
  const results = {
    name: companyName,
    domain: domain || "",
    industry: "",
    size: "",
    location: "",
    revenue: "",
    techStack: [],
    linkedIn: "",
    crunchbase: "",
  };

  // 使用 Clearbit Enrichment API
  if (domain) {
    const clearbitResponse = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLEARBIT_API_KEY}`,
        },
      }
    );

    if (clearbitResponse.ok) {
      const data = await clearbitResponse.json();
      results.industry = data.category?.industry || "";
      results.size = `${data.metrics?.employees || "未知"} 名员工`;
      results.location = data.geo?.city || "";
      results.linkedIn = data.linkedin?.handle || "";
    }
  }

  return results;
}
```

### 2. 联系信息发现

查找决策者和关键联系人的电子邮件地址、电话号码和社交媒体资料。

**需要找到的关键联系人：**

- CEO/创始人
- CTO/技术决策者
- 销售/市场负责人
- 与你产品相关的部门负责人
- 采购/财务联系人

**调研方法：**

1. **从 LinkedIn 开始：**
   - 搜索公司员工
   - 按职位和部门筛选
   - 记录个人资料信息
   - 检查资料中的电子邮件

2. **使用联系信息发现工具：**
   - Apollo.io - 联系人数据库和电子邮件查找器
   - Hunter.io - 电子邮件查找器和验证器
   - RocketReach - 联系信息发现
   - Lusha - 联系信息丰富
   - ZoomInfo - B2B 联系人数据库

3. **验证联系信息：**
   - 使用前验证电子邮件地址
   - 检查电话号码有效性
   - 验证社交媒体资料
   - 交叉引用多个来源

**示例实现：**

```typescript
// 查找公司联系人
async function findContacts(companyDomain: string, jobTitle?: string) {
  const contacts = [];

  // 使用 Hunter.io 查找电子邮件
  const hunterResponse = await fetch(
    `https://api.hunter.io/v2/domain-search?domain=${companyDomain}&api_key=${process.env.HUNTER_API_KEY}`
  );

  if (hunterResponse.ok) {
    const data = await hunterResponse.json();
    contacts.push(
      ...data.data.emails.map((email: any) => ({
        firstName: email.first_name,
        lastName: email.last_name,
        email: email.value,
        position: email.position,
        linkedIn: email.linkedin,
        confidence: email.confidence,
      }))
    );
  }

  // 如果提供了职位，按职位筛选
  if (jobTitle) {
    return contacts.filter((contact) =>
      contact.position?.toLowerCase().includes(jobTitle.toLowerCase())
    );
  }

  return contacts;
}

// 验证电子邮件地址
async function verifyEmail(email: string): Promise<boolean> {
  const response = await fetch(
    `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${process.env.HUNTER_API_KEY}`
  );

  if (response.ok) {
    const data = await response.json();
    return data.data.result === "deliverable";
  }

  return false;
}
```

### 3. 买家意向信号

识别表明公司正在积极寻找购买解决方案的信号。

**买家意向信号：**

1. **职位发布：**
   - 招聘与你解决方案相关的职位
   - 职位描述中提到你替换的工具
   - 新部门或团队正在组建
   - 技术相关招聘

2. **技术使用情况：**
   - 公司网站上列出的工具
   - 职位描述中提到的技术
   - Stack Overflow/GitHub 活动
   - 应用使用数据（如有）

3. **公司新闻：**
   - 融资轮次（表明增长/预算）
   - 收购或合并
   - 新产品发布
   - 领导层变动
   - 扩张公告

4. **在线行为：**
   - 访问竞争对手页面
   - 内容下载（如有追踪）
   - 网络研讨会参与
   - 社交媒体互动

**调研方法：**

```typescript
// 识别买家意向信号
async function identifyBuyerIntent(companyName: string, domain: string) {
  const signals = {
    jobPostings: [],
    technologyStack: [],
    recentNews: [],
    funding: null,
    expansion: false,
    score: 0, // 意向评分 0-100
  };

  // 检查职位发布
  const jobs = await searchJobPostings(companyName);
  signals.jobPostings = jobs.filter((job) =>
    job.description.includes("your-solution-keywords")
  );

  if (signals.jobPostings.length > 0) {
    signals.score += 30;
  }

  // 检查技术栈
  const techStack = await researchTechStack(domain);
  signals.technologyStack = techStack;

  // 检查他们是否使用竞争对手工具
  const competitorTools = ["competitor-tool-1", "competitor-tool-2"];
  const usesCompetitor = techStack.some((tech) =>
    competitorTools.includes(tech)
  );

  if (usesCompetitor) {
    signals.score += 25;
  }

  // 检查近期新闻和融资
  const news = await searchCompanyNews(companyName);
  signals.recentNews = news;

  const hasFunding = news.some(
    (item) =>
      item.title.toLowerCase().includes("funding") ||
      item.title.toLowerCase().includes("raised")
  );

  if (hasFunding) {
    signals.score += 20;
    signals.funding = news.find((item) =>
      item.title.toLowerCase().includes("funding")
    );
  }

  // 检查扩张信号
  const hasExpansion = news.some(
    (item) =>
      item.title.toLowerCase().includes("expansion") ||
      item.title.toLowerCase().includes("opening") ||
      item.title.toLowerCase().includes("hiring")
  );

  if (hasExpansion) {
    signals.expansion = true;
    signals.score += 25;
  }

  return signals;
}
```

## 数据来源和 API

### 公司数据 API

**Clearbit Enrichment：**

- 公司和域名信息丰富
- 员工数量、收入、行业
- 技术栈
- 社交媒体资料

**ZoomInfo：**

- 全面的 B2B 数据库
- 公司信息
- 联系人数据
- 意向信号

**Apollo.io：**

- 公司和联系人数据库
- 电子邮件查找器
- 意向数据
- 技术追踪

**Crunchbase：**

- 公司融资信息
- 投资者数据
- 收购数据
- 公司简介

**LinkedIn Sales Navigator：**

- 专业联系人
- 公司信息
- 员工数据
- 销售洞察

### 联系信息发现 API

**Hunter.io：**

- 电子邮件查找器和验证器
- 域名搜索
- 电子邮件验证

**RocketReach：**

- 联系信息发现
- 电子邮件和电话查找器
- 社交资料链接

**Lusha：**

- 联系信息丰富
- 电子邮件和电话号码
- 公司信息

### 意向信号来源

**职位发布：**

- LinkedIn Jobs API
- Indeed API
- Glassdoor API
- 公司招聘页面

**技术栈：**

- BuiltWith API
- Wappalyzer
- StackShare
- GitHub

**新闻和融资：**

- News API
- Crunchbase API
- Google News
- 公司博客

## 最佳实践

### 数据隐私与合规

- 遵守 GDPR、CCPA 和其他隐私法规
- 联系线索前获取同意
- 尊重退出请求
- 安全地处理个人数据
- 实施数据保留政策

### 数据质量

- 从多个来源验证信息
- 交叉核对数据准确性
- 标记过时或未经验证的数据
- 实施数据验证规则
- 定期更新线索信息

### 调研效率

- 使用 API 自动化数据收集
- 缓存频繁访问的数据
- 尽可能批量请求
- 实施速率限制
- 使用 webhook 进行实时更新

### 来源验证

- 始终验证联系信息
- 检查邮件可送达性
- 验证电话号码
- 验证公司信息
- 交叉引用多个来源

### 买家意向评分

- 制定一致的评分方法
- 适当加权不同的信号
- 根据结果更新评分
- 追踪哪些信号与转化相关
- 随时间优化意向检测

## 示例用户请求

**示例 1："调研 Acme Corp 的公司信息"**

- 收集基本公司数据（行业、规模、地点）
- 查找公司网站和社交媒体资料
- 调研技术栈
- 检查近期新闻或融资
- 编制全面的公司简介

**示例 2："查找科技公司决策者的电子邮件地址"**

- 确定目标公司
- 查找具有相关职位的联系人
- 使用 API 发现电子邮件地址
- 验证电子邮件地址
- 编制带有元数据的联系人清单

**示例 3："识别对我们解决方案有购买意向的公司"**

- 搜索表明需求的职位发布
- 检查竞争对手的技术栈使用情况
- 寻找融资或增长信号
- 计算意向评分
- 生成优先级排序的线索清单

**示例 4："用额外信息丰富现有线索数据"**

- 将线索匹配到公司记录
- 填补缺失的公司数据
- 查找更多联系人
- 添加意向信号
- 用丰富的数据更新线索记录
