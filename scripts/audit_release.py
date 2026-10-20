"""Scan selected release files; print locations/rule names, never secret values.

This is a repository-specific guard, not a replacement for a dedicated secret scanner.
"""
import argparse
import ast
from pathlib import Path
import re
import subprocess
import sys

from release_files import is_private, selected_files

RULES = {
    "provider-token": re.compile(rb"(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{30,})"),
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----"),
    "credential-url": re.compile(rb"(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|https?)://[^\s/:]+:[^\s/@]+@"),
    "jwt": re.compile(rb"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
}


def local_secrets(root):
    values = set()
    env_files = [root / "backend" / ".env"]
    backup_dir = root / ".audit-private"
    if backup_dir.exists():
        env_files.extend(backup_dir.glob("env-backup-*"))
    for env in env_files:
        if not env.is_file():
            continue
        for line in env.read_text(encoding="utf-8-sig").splitlines():
            key, _, value = line.partition("=")
            if re.search(r"(?:KEY|PASSWORD|TOKEN|SECRET)", key) and len(value.strip()) >= 8:
                values.add(value.strip().strip("\"'").encode())
    return values


def findings(root, secrets_to_find=()):
    findings = []
    for path in selected_files(root):
        data = (root / path).read_bytes()
        for rule, pattern in RULES.items():
            for match in pattern.finditer(data):
                findings.append((path.as_posix(), data.count(b"\n", 0, match.start()) + 1, rule))
        for value in secrets_to_find:
            if value in data:
                findings.append((path.as_posix(), data[:data.index(value)].count(b"\n") + 1, "known-local-credential"))
        if path.suffix == ".py":
            try:
                tree = ast.parse(data.decode("utf-8-sig"))
                for node in ast.walk(tree):
                    if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                        if node.target.id in {"secret_key", "admin_initial_password"} and node.value is not None:
                            findings.append((path.as_posix(), node.lineno, "credential-default"))
            except (SyntaxError, UnicodeError):
                findings.append((path.as_posix(), 1, "invalid-python-source"))
        if path.as_posix().startswith("frontend/src/") and re.search(rb"import\.meta\.env\.VITE_\w*(?:KEY|TOKEN|SECRET|PASSWORD)", data):
            findings.append((path.as_posix(), 1, "browser-credential-env"))
    return sorted(set(findings))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--require-license", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    problems = findings(root, local_secrets(root))
    if (root / ".git").exists():
        tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).split(b"\0")
        for entry in tracked:
            if entry and is_private(Path(entry.decode())):
                problems.append((entry.decode(), 0, "private-file-still-tracked"))
    if args.require_license and not (root / "LICENSE").is_file():
        problems.append(("LICENSE", 0, "upstream-authorization-and-license-pending"))
    for path, line, rule in problems:
        print(f"{path}:{line}: {rule}")
    print(f"Scanned {sum(1 for _ in selected_files(root))} selected files; {len(problems)} findings.")
    return int(bool(problems))


if __name__ == "__main__":
    sys.exit(main())
