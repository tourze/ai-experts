import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "architecture-reviewer" / "scripts" / "scan_codebase.sh"


class ScanCodebaseTests(unittest.TestCase):
    def run_in_repo(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir) / "repo"
            target = repo / "packages" / "sample"
            target.mkdir(parents=True)
            (target / "app.py").write_text("print('ok')\n", encoding="utf-8")
            (target / "general-vs-special.md").write_text("# note\n", encoding="utf-8")

            subprocess.run(["git", "init"], cwd=repo, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(
                ["git", "config", "user.email", "test@example.com"],
                cwd=repo,
                check=True,
                stdout=subprocess.DEVNULL,
            )
            subprocess.run(
                ["git", "config", "user.name", "Test User"],
                cwd=repo,
                check=True,
                stdout=subprocess.DEVNULL,
            )
            subprocess.run(["git", "add", "."], cwd=repo, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(
                ["git", "commit", "-m", "init"],
                cwd=repo,
                check=True,
                stdout=subprocess.DEVNULL,
            )

            return subprocess.check_output(["bash", str(SCRIPT), str(target)], text=True)

    def test_scan_detects_parent_git_repo_and_avoids_false_test_matches(self):
        output = self.run_in_repo()

        self.assertIn("Git repository: YES", output)
        self.assertIn("Test files found: 0", output)
        self.assertNotIn("├── /│", output)


if __name__ == "__main__":
    unittest.main()
