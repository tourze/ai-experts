# Example Personas

Real output examples showing what good personas look like.

---

## Table of Contents

- [Example 1: Power User Persona](#example-1-power-user-persona)
- [Example 2: Business User Persona](#example-2-business-user-persona)
- [Example 3: Casual User Persona](#example-3-casual-user-persona)
- [JSON Output Format](#json-output-format)
- [Quality Checklist](#quality-checklist)

---

## Example 1: Power User Persona

### Script Output

```
============================================================
PERSONA: Alex the Power User
============================================================

📝 A daily user who primarily uses the product for work purposes

Archetype: Power User
Quote: "I need tools that can keep up with my workflow"

👤 Demographics:
  • Age Range: 25-34
  • Location Type: Urban
  • Occupation Category: Software Engineer
  • Education Level: Bachelor's degree
  • Tech Proficiency: Advanced

🧠 Psychographics:
  Motivations: Efficiency, Control, Mastery
  Values: Time-saving, Flexibility, Reliability
  Lifestyle: Fast-paced, optimization-focused

🎯 Goals & Needs:
  • Complete tasks efficiently without repetitive work
  • Automate recurring workflows
  • Access advanced features and shortcuts

😤 Frustrations:
  • Slow loading times (mentioned by 14/20 users)
  • No keyboard shortcuts for common actions
  • Limited API access for automation

📊 Behaviors:
  • Frequently uses: Dashboard, Reports, Export, API
  • Usage pattern: 5+ sessions per day
  • Interaction style: Exploratory - uses many features

💡 Design Implications:
  → Optimize for speed and efficiency
  → Provide keyboard shortcuts and power features
  → Expose API and automation capabilities
  → Allow UI customization

📈 Data: Based on 45 users
    Confidence: High
    Method: Quantitative analysis + 12 qualitative interviews
```

### Data Behind This Persona

**Quantitative Data (n=45):**
- 78% use product daily
- Average session: 23 minutes
- Average features used: 12
- 84% access via desktop
- Support tickets: 0.2 per month (low)

**Qualitative Insights (12 interviews):**

| Theme | Frequency | Sample Quote |
|-------|-----------|--------------|
| Speed matters | 10/12 | "Every second counts when I'm in flow" |
| Shortcuts wanted | 8/12 | "Why can't I Cmd+K to search?" |
| Automation need | 9/12 | "I wrote a script to work around..." |
| Customization | 7/12 | "Let me hide features I don't use" |

---

## Example 2: Business User Persona

### Script Output

```
============================================================
PERSONA: Taylor the Business Professional
============================================================

📝 A weekly user who primarily uses the product for team collaboration

Archetype: Business User
Quote: "I need to show clear value to my stakeholders"

👤 Demographics:
  • Age Range: 35-44
  • Location Type: Urban/Suburban
  • Occupation Category: Product Manager
  • Education Level: MBA
  • Tech Proficiency: Intermediate

🧠 Psychographics:
  Motivations: Team success, Visibility, Recognition
  Values: Collaboration, Measurable outcomes, Professional growth
  Lifestyle: Meeting-heavy, cross-functional work

🎯 Goals & Needs:
  • Improve team efficiency and coordination
  • Generate reports for stakeholders
  • Integrate with existing work tools (Slack, Jira)

😤 Frustrations:
  • No way to share views with team (11/18 users)
  • Can't generate executive summaries
  • No SSO - team has to manage passwords

📊 Behaviors:
  • Frequently uses: Sharing, Reports, Team Dashboard
  • Usage pattern: 3-4 sessions per week
  • Interaction style: Goal-oriented, feature-specific

💡 Design Implications:
  → Add collaboration and sharing features
  → Build executive reporting and dashboards
  → Integrate with enterprise tools (SSO, Slack)
  → Provide permission and access controls

📈 Data: Based on 38 users
    Confidence: High
    Method: Survey (n=200) + 18 interviews
```

### Data Behind This Persona

**Survey Data (n=200):**
- 19% of total user base fits this profile
- Average company size: 50-500 employees
- 72% need to share outputs with non-users
- Top request: Team collaboration features

**Interview Insights (18 interviews):**

| Need | Frequency | Business Impact |
|------|-----------|-----------------|
| Reporting | 16/18 | "I spend 2hrs/week making slides" |
| Team access | 14/18 | "Can't show my team what I see" |
| Integration | 12/18 | "Copy-paste into Confluence..." |
| SSO | 11/18 | "IT won't approve without SSO" |

### Scenario: Quarterly Review Prep

```
Context: End of quarter, needs to present metrics to leadership
Goal: Create compelling data story in 30 minutes
Current Journey:
  1. Export raw data (works)
  2. Open Excel, make charts (manual)
  3. Copy to PowerPoint (manual)
  4. Share with team for feedback (via email)

Pain Points:
  • No built-in presentation view
  • Charts don't match brand guidelines
  • Can't collaborate on narrative

Opportunity:
  • One-click executive summary
  • Brand-compliant templates
  • In-app commenting on reports
```

---

## Example 3: Casual User Persona

### Script Output

```
============================================================
PERSONA: Casey the Casual User
============================================================

📝 A monthly user who uses the product for occasional personal tasks

Archetype: Casual User
Quote: "I just want it to work without having to think about it"

👤 Demographics:
  • Age Range: 25-44
  • Location Type: Mixed
  • Occupation Category: Various
  • Education Level: Bachelor's degree
  • Tech Proficiency: Beginner-Intermediate

🧠 Psychographics:
  Motivations: Task completion, Simplicity
  Values: Ease of use, Quick results
  Lifestyle: Busy, product is means to end

🎯 Goals & Needs:
  • Complete specific task quickly
  • Minimal learning curve
  • Don't have to remember how it works between uses

😤 Frustrations:
  • Too many options, don't know where to start (18/25)
  • Forgot how to do X since last time (15/25)
  • Feels like it's designed for experts (12/25)

📊 Behaviors:
  • Frequently uses: 2-3 core features only
  • Usage pattern: 1-2 sessions per month
  • Interaction style: Focused - uses minimal features

💡 Design Implications:
  → Simplify onboarding and main navigation
  → Provide contextual help and reminders
  → Don't require memorization between sessions
  → Progressive disclosure - hide advanced features

📈 Data: Based on 52 users
    Confidence: High
    Method: Analytics analysis + 25 intercept interviews
```

### Data Behind This Persona

**Analytics Data (n=1,200 casual segment):**
- 65% of users are casual (< 1 session/week)
- Average features used: 2.3
- Return rate after 30 days: 34%
- Session duration: 4.2 minutes

**Intercept Interview Insights (25 quick interviews):**

| Quote | Count | Implication |
|-------|-------|-------------|
| "Where's the thing I used last time?" | 18 | Need breadcrumbs/history |
| "There's so much here" | 15 | Simplify main view |
| "I only need to do X" | 22 | Surface common tasks |
| "Is there a tutorial?" | 11 | Better help system |

### Journey: Infrequent Task Completion

```
Stage 1: Return After Absence
  Action: Opens app, doesn't recognize interface
  Emotion: 😕 Confused
  Thought: "This looks different, where do I start?"

Stage 2: Feature Hunt
  Action: Clicks around looking for needed feature
  Emotion: 😕 Frustrated
  Thought: "I know I did this before..."

Stage 3: Discovery
  Action: Finds feature (or gives up)
  Emotion: 😐 Relief or 😠 Abandonment
  Thought: "Finally!" or "I'll try something else"

Stage 4: Task Completion
  Action: Uses feature, accomplishes goal
  Emotion: 🙂 Satisfied
  Thought: "That worked, hope I remember next time"
```

---

## JSON Output Format

### persona_generator.mjs JSON Output

```json
{
  "name": "Alex，高效操作型用户",
  "archetype": "power_user",
  "tagline": "daily 频率、以 work 场景为主，主要通过 desktop 使用，追求批量效率与快捷路径。",
  "demographics": {
    "age_range": "25-34",
    "location_type": "urban",
    "occupation_category": "operations",
    "education_level": "bachelor",
    "tech_proficiency": "高级"
  },
  "psychographics": {
    "motivations": ["效率", "控制感"],
    "values": ["节省时间", "可靠反馈"],
    "attitudes": [],
    "lifestyle": "工作流驱动，偏向结果导向"
  },
  "behaviors": {
    "usage_patterns": [
      {
        "label": "daily",
        "count": 45
      }
    ],
    "feature_preferences": [
      {
        "feature": "dashboard",
        "count": 45
      },
      {
        "feature": "reports",
        "count": 37
      }
    ],
    "interaction_style": "探索型，愿意使用多功能组合",
    "learning_preference": "偏好快捷路径、批量操作和高级配置"
  },
  "needs_and_goals": {
    "primary_goals": [
      "缩短任务耗时",
      "批量处理"
    ],
    "secondary_goals": [
      "自定义工作台",
      "联动其他工具"
    ],
    "functional_needs": [
      "性能稳定",
      "减少重复输入",
      "支持协作共享"
    ],
    "emotional_needs": [
      "知道系统当前在做什么",
      "确认输入和结果不会丢失",
      "遇错时能快速恢复"
    ]
  },
  "frustrations": [
    {
      "issue": "slow loading",
      "count": 14
    },
    {
      "issue": "missing shortcuts",
      "count": 9
    }
  ],
  "scenarios": [
    {
      "title": "批量处理",
      "context": "work 场景下要快速处理多条记录",
      "goal": "最少点击完成高频任务",
      "steps": ["筛选数据", "执行批量操作", "确认结果"],
      "pain_points": ["缺少快捷入口", "处理中无反馈"]
    }
  ],
  "quote": "我希望工具能跟上我的节奏，而不是拖慢我。",
  "data_points": {
    "sample_size": 45,
    "interview_count": 6,
    "confidence_level": "high",
    "validation_method": "quantitative + qualitative"
  },
  "design_implications": [
    "优先优化批量路径和快捷操作",
    "减少重复输入与等待时间",
    "补齐提交态和处理中反馈"
  ]
}
```

### Using JSON Output

```bash
# Generate JSON for integration
node scripts/persona_generator.mjs --input ./users.json --interviews ./interviews.json --output-format json > persona_power_user.json

# Use with other tools
cat persona_power_user.json | jq '.design_implications'
```

---

## Quality Checklist

### What Makes a Good Persona

| Criterion | Bad Example | Good Example |
|-----------|-------------|--------------|
| **Specificity** | "Wants to be productive" | "Needs to process 50+ items daily" |
| **Evidence** | "Users want simplicity" | "18/25 users said 'too many options'" |
| **Actionable** | "Likes easy things" | "Hide advanced features by default" |
| **Memorable** | Generic descriptions | Distinctive quote and archetype |
| **Validated** | Team assumptions | User interviews + analytics |

### Persona Quality Rubric

| Element | Points | Criteria |
|---------|--------|----------|
| Data-backed demographics | /5 | From real user data |
| Specific goals | /5 | Actionable, measurable |
| Evidenced frustrations | /5 | With frequency counts |
| Design implications | /5 | Directly usable by designers |
| Authentic quote | /5 | From actual user |
| Confidence stated | /5 | Sample size and method |

**Score:**
- 25-30: Production-ready persona
- 18-24: Needs refinement
- Below 18: Requires more research

### Red Flags in Persona Output

| Red Flag | What It Means |
|----------|---------------|
| No sample size | Ungrounded assumptions |
| Generic frustrations | Didn't do user research |
| All positive | Missing real pain points |
| No quotes | No qualitative research |
| Contradicting behaviors | Forced archetype |
| "Everyone" language | Too broad to be useful |

---

*See also: `persona-methodology.md` for creation process*
