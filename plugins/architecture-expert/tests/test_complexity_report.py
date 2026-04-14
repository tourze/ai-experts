import json
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "code-refiner" / "scripts" / "complexity_report.py"


class ComplexityReportTests(unittest.TestCase):
    def run_report(self, source: str):
        with tempfile.TemporaryDirectory() as tmpdir:
            sample = Path(tmpdir) / "sample.py"
            sample.write_text(source, encoding="utf-8")
            output = subprocess.check_output(
                ["python3", str(SCRIPT), str(sample), "--format", "json"],
                text=True,
            )
        return json.loads(output)[0]["functions"]

    def test_nested_function_metrics_do_not_pollute_outer_function(self):
        functions = self.run_report(
            """
def outer(flag):
    def inner(items):
        for item in items:
            if item:
                return item
        return None

    if flag:
        return inner([1, 2, 3])
    return None
"""
        )

        outer = next(func for func in functions if func["name"] == "outer")
        inner = next(func for func in functions if func["name"] == "inner")

        self.assertEqual(outer["branch_count"], 1)
        self.assertEqual(outer["max_nesting_depth"], 1)
        self.assertEqual(inner["branch_count"], 2)
        self.assertEqual(inner["max_nesting_depth"], 2)


if __name__ == "__main__":
    unittest.main()
