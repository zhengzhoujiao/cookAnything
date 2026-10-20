"""Shared file selection for audits and history-free release exports."""
from pathlib import Path
import subprocess

PUBLIC_ENV_FILES = {"backend/.env.example", "frontend/.env.example", "frontend/.env.production"}
EXCLUDED_PARTS = {".git", "node_modules", "dist", "build", "__pycache__", ".venv", "venv", ".release", ".audit-private", ".kiro", ".pytest_cache", ".idea", ".vscode"}


def is_private(path: Path) -> bool:
    name = path.name.lower()
    return (
        any(part in EXCLUDED_PARTS for part in path.parts)
        or (name.startswith(".env") and path.as_posix() not in PUBLIC_ENV_FILES)
        or name == "project.private.config.json"
        or ".private." in name
        or path.suffix.lower() in {".pyc", ".pyo", ".bundle", ".bak", ".log", ".pem", ".key", ".p12", ".pfx"}
    )


def selected_files(root: Path):
    # In a Git checkout include edited tracked files and new, unignored files.
    if (root / ".git").exists():
        result = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
            cwd=root, check=True, stdout=subprocess.PIPE,
        )
        paths = {Path(p.decode("utf-8")) for p in result.stdout.split(b"\0") if p}
    else:
        paths = {p.relative_to(root) for p in root.rglob("*") if p.is_file()}
    for path in sorted(paths):
        absolute = root / path
        if absolute.is_file() and not is_private(path):
            if absolute.is_symlink():
                raise RuntimeError("Release exports do not follow symlinks: " + path.as_posix())
            yield path
