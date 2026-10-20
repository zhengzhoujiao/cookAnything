"""Generate local-only credentials without displaying their values."""
import argparse
from datetime import datetime
from pathlib import Path
import secrets
import shutil


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rotate", action="store_true", help="Back up and replace both local credentials; existing database passwords are unchanged")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    destination = root / "backend" / ".env"
    if destination.exists() and not args.rotate:
        parser.error("backend/.env already exists. Use --rotate only when you intend to replace local credentials.")
    source = destination if destination.exists() else root / "backend" / ".env.example"
    text = source.read_text(encoding="utf-8-sig")
    if destination.exists():
        backup_dir = root / ".audit-private"
        backup_dir.mkdir(exist_ok=True)
        backup = backup_dir / ("env-backup-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f"))
        with backup.open("x", encoding="utf-8") as stream:
            stream.write(text)
    credentials = {
        "SECRET_KEY": secrets.token_hex(32),
        "ADMIN_INITIAL_PASSWORD": secrets.token_urlsafe(24),
    }
    lines = []
    for line in text.splitlines():
        key = line.partition("=")[0].strip()
        if key in credentials:
            lines.append(key + "=" + credentials.pop(key))
        else:
            lines.append(line)
    lines.extend(key + "=" + value for key, value in credentials.items())
    destination.write_text("\n".join(lines) + "\n", encoding="utf-8")
    frontend_env = root / "frontend" / ".env"
    if not frontend_env.exists():
        shutil.copyfile(root / "frontend" / ".env.example", frontend_env)
    print("Created local configuration. Credentials are stored only in backend/.env; no values were printed.")
    if args.rotate:
        print("Local JWT signing key rotated. Change any existing administrator password through /JManage; initialization does not overwrite database accounts.")


if __name__ == "__main__":
    main()
