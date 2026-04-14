#!/usr/bin/env python3
"""将结构化研究数据转换为可复核的 Persona 草案。"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


def dedupe_keep_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered


@dataclass(frozen=True)
class RankedItem:
    label: str
    count: int

    def as_dict(self, key: str = "label") -> dict[str, Any]:
        return {key: self.label, "count": self.count}


class PersonaGenerator:
    """Generate data-driven personas from user research."""

    def __init__(self, seed: int = 7) -> None:
        self.seed = seed
        self.archetype_templates = {
            "power_user": {
                "characteristics": ["高频使用", "追求效率", "偏爱快捷操作"],
                "goals": ["缩短任务耗时", "批量处理", "减少重复劳动"],
                "frustrations": ["性能慢", "缺少快捷方式", "批量操作弱"],
                "quote": "我希望工具能跟上我的节奏，而不是拖慢我。",
            },
            "casual_user": {
                "characteristics": ["低频使用", "目标明确", "偏好简单路径"],
                "goals": ["快速完成单次任务", "尽量少学习", "避免犯错"],
                "frustrations": ["入口难找", "步骤太多", "术语难懂"],
                "quote": "我只是想把事情做完，不想先研究一遍系统。",
            },
            "business_user": {
                "characteristics": ["工作场景", "重视协作", "关注结果可追踪"],
                "goals": ["提升团队效率", "输出报告", "保证信息同步"],
                "frustrations": ["协作能力弱", "缺少报表", "权限管理混乱"],
                "quote": "如果结果不能共享和复盘，这个工具就很难进入团队流程。",
            },
            "mobile_first": {
                "characteristics": ["移动优先", "碎片化使用", "偏好短操作"],
                "goals": ["随时处理任务", "少输入", "弱网也能完成"],
                "frustrations": ["移动端缺功能", "触控操作别扭", "加载过慢"],
                "quote": "很多时候我只有手机，如果关键操作做不了，产品就不可用。",
            },
        }

    def generate_persona_from_data(
        self,
        user_data: list[dict[str, Any]],
        interview_insights: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if not user_data:
            raise ValueError("user_data 不能为空。")

        patterns = self._analyze_user_patterns(user_data)
        archetype = self._identify_archetype(patterns)

        return {
            "name": self._generate_name(archetype, patterns),
            "archetype": archetype,
            "tagline": self._generate_tagline(patterns, archetype),
            "demographics": self._aggregate_demographics(user_data),
            "psychographics": self._extract_psychographics(patterns, interview_insights),
            "behaviors": self._analyze_behaviors(user_data, patterns),
            "needs_and_goals": self._identify_needs(patterns, interview_insights, archetype),
            "frustrations": self._extract_frustrations(patterns, interview_insights, archetype),
            "scenarios": self._generate_scenarios(archetype, patterns),
            "quote": self._select_quote(interview_insights, archetype),
            "data_points": self._calculate_data_points(user_data, interview_insights),
            "design_implications": self._derive_design_implications(patterns, archetype),
        }

    def _analyze_user_patterns(self, user_data: list[dict[str, Any]]) -> dict[str, Any]:
        patterns: dict[str, Any] = {
            "usage_frequency": defaultdict(int),
            "feature_usage": Counter(),
            "devices": defaultdict(int),
            "contexts": defaultdict(int),
            "pain_points": Counter(),
            "tech_scores": [],
            "user_feature_counts": [],
            "sample_size": len(user_data),
        }

        for user in user_data:
            freq = str(user.get("usage_frequency", "weekly"))
            patterns["usage_frequency"][freq] += 1

            features = [str(feature) for feature in user.get("features_used", []) if feature]
            patterns["user_feature_counts"].append(len(features))
            patterns["feature_usage"].update(features)

            device = str(user.get("primary_device", "desktop"))
            patterns["devices"][device] += 1

            context = str(user.get("usage_context", "general"))
            patterns["contexts"][context] += 1

            pain_points = [str(item) for item in user.get("pain_points", []) if item]
            patterns["pain_points"].update(pain_points)

            if "tech_proficiency" in user:
                try:
                    patterns["tech_scores"].append(float(user["tech_proficiency"]))
                except (TypeError, ValueError):
                    continue

        return patterns

    def _identify_archetype(self, patterns: dict[str, Any]) -> str:
        freq_pattern = max(patterns["usage_frequency"].items(), key=lambda item: item[1])[0]
        device_pattern = max(patterns["devices"].items(), key=lambda item: item[1])[0]
        work_count = patterns["contexts"].get("work", 0)
        personal_count = patterns["contexts"].get("personal", 0)
        avg_features = (
            sum(patterns["user_feature_counts"]) / len(patterns["user_feature_counts"])
            if patterns["user_feature_counts"]
            else 0
        )

        if device_pattern in {"mobile", "tablet"} and patterns["devices"][device_pattern] >= max(2, patterns["sample_size"] // 3):
            return "mobile_first"
        if work_count > personal_count and work_count >= max(2, patterns["sample_size"] // 3):
            return "business_user"
        if freq_pattern == "daily" and avg_features >= 4:
            return "power_user"
        return "casual_user"

    def _stable_pick(self, values: list[str], token: str) -> str:
        digest = hashlib.sha256(f"{self.seed}:{token}".encode("utf-8")).digest()
        return values[digest[0] % len(values)]

    def _generate_name(self, archetype: str, patterns: dict[str, Any]) -> str:
        names = {
            "power_user": ["Alex", "Jordan", "Morgan", "Taylor"],
            "casual_user": ["Jamie", "Pat", "Riley", "Casey"],
            "business_user": ["Avery", "Cameron", "Blake", "Drew"],
            "mobile_first": ["Quinn", "River", "Sage", "Skyler"],
        }
        roles = {
            "power_user": "高效操作型用户",
            "casual_user": "目标导向型用户",
            "business_user": "协作业务型用户",
            "mobile_first": "移动优先型用户",
        }
        token = f"{archetype}:{patterns['sample_size']}:{sorted(patterns['contexts'].items())}"
        return f"{self._stable_pick(names[archetype], token)}，{roles[archetype]}"

    def _generate_tagline(self, patterns: dict[str, Any], archetype: str) -> str:
        freq = max(patterns["usage_frequency"].items(), key=lambda item: item[1])[0]
        context = max(patterns["contexts"].items(), key=lambda item: item[1])[0]
        device = max(patterns["devices"].items(), key=lambda item: item[1])[0]
        labels = {
            "power_user": "追求批量效率与快捷路径",
            "casual_user": "希望少思考、少学习、快完成",
            "business_user": "关注协作闭环与结果可追踪",
            "mobile_first": "依赖移动端完成核心任务",
        }
        return f"{freq} 频率、以 {context} 场景为主，主要通过 {device} 使用，{labels[archetype]}。"

    def _aggregate_demographics(self, user_data: list[dict[str, Any]]) -> dict[str, Any]:
        demographics = {
            "age_range": "未提供",
            "location_type": "未提供",
            "occupation_category": "未提供",
            "education_level": "未提供",
            "tech_proficiency": "未提供",
        }

        ages = [int(user["age"]) for user in user_data if isinstance(user.get("age"), (int, float))]
        if ages:
            avg_age = sum(ages) / len(ages)
            if avg_age < 25:
                demographics["age_range"] = "18-24"
            elif avg_age < 35:
                demographics["age_range"] = "25-34"
            elif avg_age < 45:
                demographics["age_range"] = "35-44"
            else:
                demographics["age_range"] = "45+"

        for key in ["location_type", "occupation_category", "education_level"]:
            values = [str(user[key]) for user in user_data if user.get(key)]
            if values:
                demographics[key] = Counter(values).most_common(1)[0][0]

        tech_scores = [float(user["tech_proficiency"]) for user in user_data if isinstance(user.get("tech_proficiency"), (int, float))]
        if tech_scores:
            avg_score = sum(tech_scores) / len(tech_scores)
            if avg_score < 4:
                demographics["tech_proficiency"] = "初级"
            elif avg_score < 7:
                demographics["tech_proficiency"] = "中级"
            else:
                demographics["tech_proficiency"] = "高级"

        return demographics

    def _extract_psychographics(
        self,
        patterns: dict[str, Any],
        interviews: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        motivations: list[str] = []
        values: list[str] = []
        attitudes: list[str] = []
        lifestyle = "未提供"

        if patterns["usage_frequency"].get("daily", 0) > 0:
            motivations.extend(["效率", "稳定输出"])
            values.append("节省时间")

        if patterns["devices"].get("mobile", 0) > patterns["devices"].get("desktop", 0):
            lifestyle = "移动办公、碎片化处理任务"
            values.append("灵活性")
        elif patterns["contexts"].get("work", 0) > 0:
            lifestyle = "工作流驱动，偏向结果导向"

        if interviews:
            for interview in interviews:
                motivations.extend([str(item) for item in interview.get("motivations", []) if item])
                values.extend([str(item) for item in interview.get("values", []) if item])
                attitudes.extend([str(item) for item in interview.get("attitudes", []) if item])
                if lifestyle == "未提供" and interview.get("lifestyle"):
                    lifestyle = str(interview["lifestyle"])

        return {
            "motivations": dedupe_keep_order(motivations)[:5],
            "values": dedupe_keep_order(values)[:5],
            "attitudes": dedupe_keep_order(attitudes)[:5],
            "lifestyle": lifestyle,
        }

    def _analyze_behaviors(self, user_data: list[dict[str, Any]], patterns: dict[str, Any]) -> dict[str, Any]:
        usage_patterns = [
            RankedItem(label=str(label), count=count).as_dict()
            for label, count in Counter(user.get("usage_frequency", "weekly") for user in user_data).most_common(3)
        ]
        feature_preferences = [
            RankedItem(label=feature, count=count).as_dict("feature")
            for feature, count in patterns["feature_usage"].most_common(5)
        ]
        avg_features = (
            sum(patterns["user_feature_counts"]) / len(patterns["user_feature_counts"])
            if patterns["user_feature_counts"]
            else 0
        )

        if avg_features >= 5:
            interaction_style = "探索型，愿意使用多功能组合"
            learning_preference = "偏好快捷路径、批量操作和高级配置"
        elif avg_features >= 3:
            interaction_style = "熟悉型，围绕固定功能完成任务"
            learning_preference = "偏好明确指引和稳定布局"
        else:
            interaction_style = "保守型，只使用最短路径"
            learning_preference = "偏好低认知负担和即时反馈"

        return {
            "usage_patterns": usage_patterns,
            "feature_preferences": feature_preferences,
            "interaction_style": interaction_style,
            "learning_preference": learning_preference,
        }

    def _identify_needs(
        self,
        patterns: dict[str, Any],
        interviews: list[dict[str, Any]] | None,
        archetype: str,
    ) -> dict[str, Any]:
        template = self.archetype_templates[archetype]
        primary_goals = template["goals"][:]
        functional_needs: list[str] = []
        emotional_needs = [
            "知道系统当前在做什么",
            "确认输入和结果不会丢失",
            "遇错时能快速恢复",
        ]

        if patterns["contexts"].get("work", 0) > 0:
            functional_needs.extend(["支持协作共享", "可追踪状态与结果"])
        if patterns["devices"].get("mobile", 0) > 0:
            functional_needs.extend(["移动端关键任务可闭环", "弱网下反馈明确"])
        if patterns["usage_frequency"].get("daily", 0) > 0:
            functional_needs.extend(["性能稳定", "减少重复输入"])

        secondary_goals: list[str] = []
        if interviews:
            for interview in interviews:
                primary_goals.extend([str(item) for item in interview.get("goals", []) if item])
                secondary_goals.extend([str(item) for item in interview.get("secondary_goals", []) if item])
                functional_needs.extend([str(item) for item in interview.get("needs", []) if item])

        return {
            "primary_goals": dedupe_keep_order(primary_goals)[:4],
            "secondary_goals": dedupe_keep_order(secondary_goals)[:3],
            "functional_needs": dedupe_keep_order(functional_needs)[:5],
            "emotional_needs": emotional_needs,
        }

    def _extract_frustrations(
        self,
        patterns: dict[str, Any],
        interviews: list[dict[str, Any]] | None,
        archetype: str,
    ) -> list[dict[str, Any]]:
        frustration_counter = Counter(patterns["pain_points"])
        if interviews:
            for interview in interviews:
                frustration_counter.update(str(item) for item in interview.get("pain_points", []) if item)

        if not frustration_counter:
            frustration_counter.update(self.archetype_templates[archetype]["frustrations"])

        results = [
            {"issue": issue, "count": count}
            for issue, count in frustration_counter.most_common(5)
        ]

        if len(results) < 3:
            for fallback in self.archetype_templates[archetype]["frustrations"]:
                if any(item["issue"] == fallback for item in results):
                    continue
                results.append({"issue": fallback, "count": 0})
                if len(results) == 3:
                    break

        return results

    def _generate_scenarios(self, archetype: str, patterns: dict[str, Any]) -> list[dict[str, Any]]:
        dominant_context = max(patterns["contexts"].items(), key=lambda item: item[1])[0]
        dominant_device = max(patterns["devices"].items(), key=lambda item: item[1])[0]

        scenarios = {
            "power_user": [
                {
                    "title": "批量处理",
                    "context": f"{dominant_context} 场景下要快速处理多条记录",
                    "goal": "最少点击完成高频任务",
                    "steps": ["筛选数据", "执行批量操作", "确认结果"],
                    "pain_points": ["缺少快捷入口", "处理中无反馈"],
                }
            ],
            "casual_user": [
                {
                    "title": "一次性完成任务",
                    "context": f"在 {dominant_context} 场景里偶发使用系统",
                    "goal": "无需学习也能走通主流程",
                    "steps": ["找到入口", "填写必要信息", "确认提交成功"],
                    "pain_points": ["标签含糊", "页面噪声过多"],
                }
            ],
            "business_user": [
                {
                    "title": "协作交付",
                    "context": "需要和同事共享状态与结果",
                    "goal": "把信息传递给团队并可回溯",
                    "steps": ["创建内容", "共享给团队", "追踪反馈与状态"],
                    "pain_points": ["权限规则不清", "缺少状态同步"],
                }
            ],
            "mobile_first": [
                {
                    "title": "移动端快处理",
                    "context": f"主要通过 {dominant_device} 在碎片时间处理任务",
                    "goal": "用最少输入完成关键操作",
                    "steps": ["打开入口", "完成核心动作", "确认已同步"],
                    "pain_points": ["触控区域小", "移动端功能不全"],
                }
            ],
        }
        return scenarios[archetype]

    def _select_quote(self, interviews: list[dict[str, Any]] | None, archetype: str) -> str:
        if interviews:
            for interview in interviews:
                quotes = [str(item) for item in interview.get("quotes", []) if item]
                if quotes:
                    return quotes[0]
        return self.archetype_templates[archetype]["quote"]

    def _calculate_data_points(
        self,
        user_data: list[dict[str, Any]],
        interviews: list[dict[str, Any]] | None,
    ) -> dict[str, Any]:
        sample_size = len(user_data)
        if sample_size >= 31:
            confidence = "high"
        elif sample_size >= 11:
            confidence = "medium"
        else:
            confidence = "low"

        sources = ["quantitative"]
        if interviews:
            sources.append("qualitative")

        return {
            "sample_size": sample_size,
            "interview_count": len(interviews or []),
            "confidence_level": confidence,
            "validation_method": " + ".join(sources),
        }

    def _derive_design_implications(self, patterns: dict[str, Any], archetype: str) -> list[str]:
        implications = []

        if archetype == "power_user":
            implications.extend(["优先优化批量路径和快捷操作", "减少重复输入与等待时间"])
        if archetype == "casual_user":
            implications.extend(["收敛首屏噪声，突出单一主路径", "用就地解释替代术语堆砌"])
        if archetype == "business_user":
            implications.extend(["补齐协作状态、权限和结果追踪", "让关键指标和导出能力可见"])
        if archetype == "mobile_first":
            implications.extend(["确保移动端关键任务闭环", "扩大触控区域并强化弱网反馈"])

        if patterns["pain_points"].get("slow loading", 0) > 0:
            implications.append("对高频页面补充骨架屏和明确状态反馈")
        if patterns["pain_points"].get("confusing UI", 0) > 0:
            implications.append("重写含糊标签，统一导航命名")

        return dedupe_keep_order(implications)[:5]

    def format_persona_output(self, persona: dict[str, Any]) -> str:
        lines = [
            "=" * 60,
            f"Persona：{persona['name']}",
            "=" * 60,
            f"画像摘要：{persona['tagline']}",
            f"原型：{persona['archetype']}",
            f"代表性引语：{persona['quote']}",
            "",
            "人口属性：",
        ]

        for key, value in persona["demographics"].items():
            lines.append(f"  - {key}: {value}")

        lines.extend(["", "动机与价值："])
        if persona["psychographics"]["motivations"]:
            lines.append(f"  - motivations: {', '.join(persona['psychographics']['motivations'])}")
        if persona["psychographics"]["values"]:
            lines.append(f"  - values: {', '.join(persona['psychographics']['values'])}")
        if persona["psychographics"]["lifestyle"]:
            lines.append(f"  - lifestyle: {persona['psychographics']['lifestyle']}")

        lines.extend(["", "核心目标："])
        for goal in persona["needs_and_goals"]["primary_goals"]:
            lines.append(f"  - {goal}")

        lines.extend(["", "主要痛点："])
        for issue in persona["frustrations"]:
            suffix = f"（{issue['count']} 次）" if issue["count"] > 0 else "（模板补足）"
            lines.append(f"  - {issue['issue']}{suffix}")

        lines.extend(["", "设计启发："])
        for item in persona["design_implications"]:
            lines.append(f"  - {item}")

        lines.extend([
            "",
            "数据置信度：",
            f"  - sample_size: {persona['data_points']['sample_size']}",
            f"  - interview_count: {persona['data_points']['interview_count']}",
            f"  - confidence_level: {persona['data_points']['confidence_level']}",
        ])
        return "\n".join(lines)


def load_json_list(path: str, label: str) -> list[dict[str, Any]]:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"{label} 文件不存在：{file_path}")

    data = json.loads(file_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{label} 必须是 JSON 数组。")
    return data


def create_sample_user_data() -> list[dict[str, Any]]:
    return [
        {
            "user_id": f"user_{index}",
            "age": 24 + (index % 18),
            "usage_frequency": ["daily", "weekly", "daily", "monthly"][index % 4],
            "features_used": [
                "dashboard",
                "reports",
                "export",
                "share",
                "shortcuts",
            ][: 2 + (index % 4)],
            "primary_device": ["desktop", "desktop", "mobile", "tablet"][index % 4],
            "usage_context": ["work", "work", "personal"][index % 3],
            "tech_proficiency": 4 + (index % 5),
            "location_type": ["urban", "urban", "suburban"][index % 3],
            "occupation_category": ["operations", "design", "marketing"][index % 3],
            "education_level": ["bachelor", "master"][index % 2],
            "pain_points": [
                "slow loading",
                "confusing UI",
                "missing shortcuts",
            ][: 1 + (index % 3)],
        }
        for index in range(18)
    ]


def create_sample_interviews() -> list[dict[str, Any]]:
    return [
        {
            "quotes": ["如果系统不告诉我现在进展到哪一步，我会反复点按钮。"],
            "motivations": ["效率", "确定性"],
            "values": ["可靠反馈"],
            "goals": ["减少返工", "快速确认结果"],
            "needs": ["关键步骤要有即时反馈"],
            "pain_points": ["status unclear", "confusing UI"],
        }
    ]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="根据用户数据与访谈洞察生成结构化 Persona 草案。",
    )
    parser.add_argument(
        "--input",
        help="用户数据 JSON 文件路径，内容必须是对象数组。",
    )
    parser.add_argument(
        "--interviews",
        help="访谈洞察 JSON 文件路径，内容必须是对象数组。",
    )
    parser.add_argument(
        "--output-format",
        choices=("text", "json"),
        default="text",
        help="输出格式，默认 text。",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help="使用内置演示数据运行，便于快速体验。",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=7,
        help="用于稳定命名的随机种子，默认 7。",
    )
    parser.add_argument(
        "legacy_output_format",
        nargs="?",
        choices=("json",),
        help=argparse.SUPPRESS,
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    output_format = args.legacy_output_format or args.output_format

    try:
        if args.sample:
            user_data = create_sample_user_data()
            interview_data = create_sample_interviews()
        else:
            if not args.input:
                parser.error("请使用 --input 指定用户数据 JSON，或使用 --sample 生成演示数据。")
            user_data = load_json_list(args.input, "用户数据")
            interview_data = []

        if args.interviews:
            interview_data = load_json_list(args.interviews, "访谈洞察")

        generator = PersonaGenerator(seed=args.seed)
        persona = generator.generate_persona_from_data(user_data, interview_data)

        if output_format == "json":
            print(json.dumps(persona, ensure_ascii=False, indent=2))
        else:
            print(generator.format_persona_output(persona))
        return 0
    except FileNotFoundError as error:
        print(f"[persona_generator] {error}", file=sys.stderr)
        return 1
    except ValueError as error:
        print(f"[persona_generator] {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
