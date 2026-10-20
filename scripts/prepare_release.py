"""Export sanitized working files without copying private Git history."""
import argparse
from datetime import datetime
from pathlib import Path
import shutil
import subprocess

from audit_release import findings, local_secrets
from release_files import selected_files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft", action="store_true", help="Prepare a local review copy before licensing is resolved; never publish this draft")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    problems = findings(root, local_secrets(root))
    if problems:
        for path, line, rule in problems:
            print(f"{path}:{line}: {rule}")
        parser.error("Resolve release audit findings before exporting.")
    if not args.draft and not (root / "LICENSE").is_file():
        parser.error("Upstream authorization and LICENSE must be resolved first. --draft creates a local review copy only.")
    destination = root / ".release" / ("public-draft-" if args.draft else "public-")
    destination = destination.with_name(destination.name + datetime.now().strftime("%Y%m%d-%H%M%S-%f"))
    destination.mkdir(parents=True, exist_ok=False)
    count = 0
    for path in selected_files(root):
        target = destination / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / path, target)
        count += 1
    if findings(destination, local_secrets(root)):
        raise RuntimeError("Export verification failed; do not publish " + str(destination))
    subprocess.run(["git", "init", "--initial-branch=main", str(destination)], check=True, stdout=subprocess.DEVNULL)
    print(f"Exported {count} files to {destination}")
    print("Created an empty local Git repository. No remote was configured, no commit was made, and no private history was copied.")
    if args.draft:
        print("DRAFT: licensing is unresolved. This copy is for local review and verification only.")


if __name__ == "__main__":
    main()
