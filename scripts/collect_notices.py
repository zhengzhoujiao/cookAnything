"""Collect installed package license/notice files for redistribution review."""
import argparse
from importlib import metadata
import json
from pathlib import Path
import re
import shutil


def safe_name(name):
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--python", action="store_true", help="Also collect this Python environment's installed distribution notices")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    # Generated release artifacts stay outside the source change list.
    destination = root / ".release" / "third-party"
    destination.mkdir(parents=True, exist_ok=True)
    records = []
    lock = json.loads((root / "frontend" / "package-lock.json").read_text(encoding="utf-8"))
    for relative in sorted(lock.get("packages", {})):
        if not relative:
            continue
        directory = root / "frontend" / relative
        package_file = directory / "package.json"
        if not package_file.is_file():
            continue
        package = json.loads(package_file.read_text(encoding="utf-8"))
        name, version = package.get("name", relative), package.get("version", "unknown")
        target = destination / "npm" / safe_name(name + "-" + version)
        copied = []
        for source in directory.iterdir():
            if source.is_file() and re.match(r"(?i)^(?:licen[cs]e|copying|notice|thirdpartynotice)", source.name):
                target.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target / source.name)
                copied.append((target / source.name).relative_to(destination).as_posix())
        records.append({"name": name, "version": version, "license": package.get("license", "UNDECLARED"), "files": copied})
    if not records and not args.python:
        parser.error("Install frontend dependencies with npm ci before collecting notices.")
    (destination / "npm-packages.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.python:
        old_python_manifest = destination / "python-packages.json"
        old_python_files = set()
        if old_python_manifest.exists():
            for record in json.loads(old_python_manifest.read_text(encoding="utf-8")):
                old_python_files.update(record.get("files", []))
        python_records = []
        for distribution in metadata.distributions():
            name = distribution.metadata.get("Name", "unknown")
            version = distribution.version
            target = destination / "python" / safe_name(name + "-" + version)
            copied = []
            for entry in distribution.files or []:
                path = Path(str(entry))
                if re.match(r"(?i)^(?:licen[cs]e|copying|notice|authors)(?:$|[._-])", path.name):
                    source = Path(distribution.locate_file(entry))
                    if source.is_file():
                        target.mkdir(parents=True, exist_ok=True)
                        output = target / safe_name(path.as_posix())
                        shutil.copyfile(source, output)
                        copied.append(output.relative_to(destination).as_posix())
            python_records.append({"name": name, "version": version, "license": distribution.metadata.get("License-Expression") or distribution.metadata.get("License") or "UNDECLARED", "files": copied})
        current_python_files = {name for record in python_records for name in record["files"]}
        for stale in old_python_files - current_python_files:
            stale_path = (destination / stale).resolve()
            if not stale_path.is_relative_to(destination.resolve()):
                raise RuntimeError("Notice path escaped output directory")
            if stale_path.is_file():
                stale_path.unlink()
        (destination / "python-packages.json").write_text(json.dumps(python_records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (destination / "README.md").write_text(
        "# Installed dependency notices\n\nGenerated from installed package metadata and license files. "
        "See npm-packages.json and, when generated, python-packages.json for exact versions and file locations. "
        "An absent notice file or UNDECLARED license needs review before redistribution. "
        "These dependency notices do not authorize reuse of the upstream application itself.\n",
        encoding="utf-8",
    )
    print(f"Collected notices for {len(records)} installed npm packages into .release/third-party (ignored by Git).")


if __name__ == "__main__":
    main()
