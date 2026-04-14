#!/usr/bin/env python3
from __future__ import annotations

"""
Prompt Optimization Script

一个轻量示例脚本，用于：
- 并行评估 prompt 变体
- 记录准确率、延迟、token 粗估
- 从若干启发式变体中选择更优版本

约束：
- 仅依赖 Python 标准库
- 默认使用内置 MockLLMClient 做演示
"""

import json
import math
import os
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from statistics import fmean
from typing import Any


def percentile(values: list[float], pct: float) -> float:
    """计算线性插值百分位数。"""
    if not values:
        return 0.0

    ordered = sorted(values)
    if len(ordered) == 1:
        return float(ordered[0])

    rank = (pct / 100) * (len(ordered) - 1)
    lower = math.floor(rank)
    upper = math.ceil(rank)
    if lower == upper:
        return float(ordered[lower])

    weight = rank - lower
    return float(ordered[lower] + (ordered[upper] - ordered[lower]) * weight)


@dataclass(slots=True)
class TestCase:
    input: dict[str, Any]
    expected_output: str
    metadata: dict[str, Any] = field(default_factory=dict)


class PromptOptimizer:
    def __init__(self, llm_client, test_suite: list[TestCase], max_workers: int | None = None):
        self.client = llm_client
        self.test_suite = list(test_suite)
        self.results_history: list[dict[str, Any]] = []
        workers = max_workers or max(1, min(8, len(self.test_suite) or 1))
        self.executor = ThreadPoolExecutor(max_workers=workers)

    def shutdown(self) -> None:
        """关闭线程池。"""
        self.executor.shutdown(wait=True)

    def evaluate_prompt(
        self, prompt_template: str, test_cases: list[TestCase] | None = None
    ) -> dict[str, float]:
        """并行评估一个 prompt 模板。"""
        cases = test_cases or self.test_suite
        if not cases:
            return {
                "avg_accuracy": 0.0,
                "avg_latency": 0.0,
                "p95_latency": 0.0,
                "avg_tokens": 0.0,
                "success_rate": 0.0,
            }

        metrics = {
            "accuracy": [],
            "latency": [],
            "token_count": [],
            "success_rate": [],
        }

        def process_test_case(test_case: TestCase) -> dict[str, float]:
            started_at = time.perf_counter()

            try:
                prompt = prompt_template.format(**test_case.input)
                response = self.client.complete(prompt)
                response_text = "" if response is None else str(response)
                accuracy = self.calculate_accuracy(response_text, test_case.expected_output)
                success = 1.0 if response_text else 0.0
                token_count = float(len(prompt.split()) + len(response_text.split()))
            except Exception:
                accuracy = 0.0
                success = 0.0
                token_count = 0.0

            latency = time.perf_counter() - started_at
            return {
                "latency": float(latency),
                "token_count": token_count,
                "success_rate": success,
                "accuracy": accuracy,
            }

        results = list(self.executor.map(process_test_case, cases))
        for result in results:
            for key, value in result.items():
                metrics[key].append(value)

        return {
            "avg_accuracy": float(fmean(metrics["accuracy"])),
            "avg_latency": float(fmean(metrics["latency"])),
            "p95_latency": percentile(metrics["latency"], 95),
            "avg_tokens": float(fmean(metrics["token_count"])),
            "success_rate": float(fmean(metrics["success_rate"])),
        }

    def calculate_accuracy(self, response: str, expected: str) -> float:
        """用精确匹配 + 词重叠计算简易准确率。"""
        normalized_response = response.strip().lower()
        normalized_expected = expected.strip().lower()

        if normalized_response == normalized_expected:
            return 1.0

        response_words = set(normalized_response.split())
        expected_words = set(normalized_expected.split())
        if not expected_words:
            return 0.0

        overlap = len(response_words & expected_words)
        return overlap / len(expected_words)

    def optimize(self, base_prompt: str, max_iterations: int = 5) -> dict[str, Any]:
        """迭代优化 prompt。"""
        current_prompt = base_prompt
        best_prompt = base_prompt
        best_score = 0.0
        current_metrics: dict[str, float] | None = None

        for iteration in range(max_iterations):
            print(f"\nIteration {iteration + 1}/{max_iterations}")

            metrics = current_metrics or self.evaluate_prompt(current_prompt)
            print(
                f"Accuracy: {metrics['avg_accuracy']:.2f}, "
                f"Latency: {metrics['avg_latency']:.2f}s"
            )

            self.results_history.append(
                {
                    "iteration": iteration,
                    "prompt": current_prompt,
                    "metrics": metrics,
                }
            )

            if metrics["avg_accuracy"] > best_score:
                best_score = metrics["avg_accuracy"]
                best_prompt = current_prompt

            if metrics["avg_accuracy"] > 0.95:
                print("Achieved target accuracy!")
                break

            best_variation = current_prompt
            best_variation_metrics = metrics
            best_variation_score = metrics["avg_accuracy"]

            for variation in self.generate_variations(current_prompt, metrics):
                variation_metrics = self.evaluate_prompt(variation)
                if variation_metrics["avg_accuracy"] > best_variation_score:
                    best_variation = variation
                    best_variation_metrics = variation_metrics
                    best_variation_score = variation_metrics["avg_accuracy"]

            current_prompt = best_variation
            current_metrics = best_variation_metrics

            if best_variation_score > best_score:
                best_score = best_variation_score
                best_prompt = best_variation

        return {
            "best_prompt": best_prompt,
            "best_score": best_score,
            "history": self.results_history,
        }

    def generate_variations(
        self, prompt: str, current_metrics: dict[str, float]
    ) -> list[str]:
        """基于简单启发式生成候选变体。"""
        variations = [
            prompt + "\n\nProvide your answer in a clear, concise format.",
            "Let's solve this step by step.\n\n" + prompt,
            prompt + "\n\nVerify your answer before responding.",
        ]

        concise_prompt = self.make_concise(prompt)
        if concise_prompt != prompt:
            variations.append(concise_prompt)

        if "example" not in prompt.lower():
            variations.append(self.add_examples(prompt))

        # 准确率已经很高时，优先保留更短版本
        if current_metrics.get("avg_accuracy", 0.0) >= 0.8:
            variations = sorted(set(variations), key=len)
        else:
            variations = list(dict.fromkeys(variations))

        return variations[:3]

    def make_concise(self, prompt: str) -> str:
        """删除明显冗余的英语短语。"""
        replacements = [
            ("in order to", "to"),
            ("due to the fact that", "because"),
            ("at this point in time", "now"),
            ("in the event that", "if"),
        ]

        result = prompt
        for old, new in replacements:
            result = result.replace(old, new)
        return result

    def add_examples(self, prompt: str) -> str:
        """补一个最小示例。"""
        return f"""{prompt}

Example:
Input: Sample input
Output: Sample output
"""

    def compare_prompts(self, prompt_a: str, prompt_b: str) -> dict[str, Any]:
        """A/B 对比两个 prompt。"""
        print("Testing Prompt A...")
        metrics_a = self.evaluate_prompt(prompt_a)

        print("Testing Prompt B...")
        metrics_b = self.evaluate_prompt(prompt_b)

        return {
            "prompt_a_metrics": metrics_a,
            "prompt_b_metrics": metrics_b,
            "winner": "A" if metrics_a["avg_accuracy"] > metrics_b["avg_accuracy"] else "B",
            "improvement": abs(metrics_a["avg_accuracy"] - metrics_b["avg_accuracy"]),
        }

    def export_results(self, filename: str) -> None:
        """导出评估历史。"""
        output_dir = os.path.dirname(filename)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        with open(filename, "w", encoding="utf-8") as handle:
            json.dump(self.results_history, handle, indent=2, ensure_ascii=False)


def main() -> None:
    """本地演示入口。"""
    test_suite = [
        TestCase(input={"text": "This movie was amazing!"}, expected_output="Positive"),
        TestCase(input={"text": "Worst purchase ever."}, expected_output="Negative"),
        TestCase(
            input={"text": "It was okay, nothing special."},
            expected_output="Neutral",
        ),
    ]

    class MockLLMClient:
        def complete(self, prompt: str) -> str:
            if "amazing" in prompt.lower():
                return "Positive"
            if "worst" in prompt.lower():
                return "Negative"
            return "Neutral"

    optimizer = PromptOptimizer(MockLLMClient(), test_suite)
    try:
        base_prompt = "Classify the sentiment of: {text}\nSentiment:"
        results = optimizer.optimize(base_prompt)

        print("\n" + "=" * 50)
        print("Optimization Complete!")
        print(f"Best Accuracy: {results['best_score']:.2f}")
        print(f"Best Prompt:\n{results['best_prompt']}")

        optimizer.export_results("optimization_results.json")
    finally:
        optimizer.shutdown()


if __name__ == "__main__":
    main()
