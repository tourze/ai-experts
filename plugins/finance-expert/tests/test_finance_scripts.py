import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
FINANCIAL_ANALYST_ROOT = PLUGIN_ROOT / "skills" / "financial-analyst"
CREATING_MODELS_ROOT = PLUGIN_ROOT / "skills" / "creating-financial-models"


def run_cli(script: Path, input_file: Path) -> dict:
    result = subprocess.run(
        [sys.executable, str(script), str(input_file), "--format", "json"],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def load_module(module_name: str, path: Path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class FinancialScriptSmokeTests(unittest.TestCase):
    def test_forecast_builder_accepts_consolidated_sample(self) -> None:
        output = run_cli(
            FINANCIAL_ANALYST_ROOT / "scripts" / "forecast_builder.py",
            FINANCIAL_ANALYST_ROOT / "assets" / "sample_financial_data.json",
        )
        self.assertNotIn("error", output["trend_analysis"])
        self.assertGreater(
            output["scenario_comparison"]["scenarios"]["base"]["total_revenue"],
            0,
        )


class CreatingFinancialModelsTests(unittest.TestCase):
    def test_one_way_sensitivity_reports_non_zero_output_change(self) -> None:
        module = load_module(
            "finance_sensitivity_analysis",
            CREATING_MODELS_ROOT / "sensitivity_analysis.py",
        )

        class Model:
            def __init__(self) -> None:
                self.revenue = 1000.0
                self.margin = 0.20
                self.multiple = 10.0

            def value(self) -> float:
                return self.revenue * self.margin * self.multiple

        model = Model()
        analyzer = module.SensitivityAnalyzer(model)
        df = analyzer.one_way_sensitivity(
            variable_name="Revenue",
            base_value=model.revenue,
            range_pct=0.20,
            steps=5,
            output_func=model.value,
            model_update_func=lambda x: setattr(model, "revenue", x),
        )

        self.assertNotEqual(df["output_change"].iloc[0], 0)
        self.assertEqual(df["output_change"].iloc[2], 0)

    def test_scenario_analysis_restores_model_state_between_runs(self) -> None:
        module = load_module(
            "finance_sensitivity_analysis_restore",
            CREATING_MODELS_ROOT / "sensitivity_analysis.py",
        )

        class Model:
            def __init__(self) -> None:
                self.a = 1.0
                self.b = 10.0

            def value(self) -> float:
                return self.a + self.b

        model = Model()
        analyzer = module.SensitivityAnalyzer(model)
        df = analyzer.scenario_analysis(
            scenarios={"s1": {"a": 2.0}, "s2": {"b": 20.0}},
            variable_updates={
                "a": lambda x: setattr(model, "a", x),
                "b": lambda x: setattr(model, "b", x),
            },
            output_func=model.value,
        )

        rows = df[df["scenario"].isin(["s1", "s2"])].set_index("scenario")
        self.assertEqual(rows.loc["s1", "output"], 12.0)
        self.assertEqual(rows.loc["s2", "output"], 21.0)
        self.assertEqual(model.a, 1.0)
        self.assertEqual(model.b, 10.0)


if __name__ == "__main__":
    unittest.main()
