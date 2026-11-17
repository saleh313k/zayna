#!/usr/bin/env python3
"""Regenerates FILE_STRUCTURE.md from the files git actually tracks, so the document cannot drift from the repository.

    python3 docs/gen_file_structure.py        (run from the repository root)
"""
import subprocess
from collections import defaultdict
from datetime import date

NOTES = {
    "backend": "ASP.NET Core 8 solution (ZAYNA.sln)",
    "backend/ZAYNA.API": "Web API: controllers, middleware, startup (Program.cs), EF migrations, appsettings",
    "backend/ZAYNA.API/Migrations": "EF Core migrations (schema history). The app never uses EnsureCreated.",
    "backend/ZAYNA.Core": "Entities, enums, DTOs, interfaces (no infrastructure dependencies)",
    "backend/ZAYNA.Infrastructure": "EF DbContext, services (auth, booking, email, notifications, loyalty, ...)",
    "backend/ZAYNA.Application": "Reserved for application-layer code (almost empty)",
    "backend/ZAYNA.Tests": "xUnit tests",
    "frontend": "React 18 + Vite + Tailwind SPA",
    "frontend/src/components": "UI by area: auth, customer, salon (owner), admin, reviews, common, ...",
    "frontend/src/services": "API clients (axios)",
    "frontend/src/i18n": "English and Arabic translations (keep key sets identical)",
    "database": "Legacy hand-written SQL reference. NOT the migration path.",
    "deploy": "Production: Caddyfile, web image Dockerfile, backup/restore/deploy scripts",
    "docs": "Runbook, roadmap, architecture notes, archive of superseded documents",
    ".github": "CI workflow",
}

files = subprocess.check_output(["git", "ls-files"], text=True).splitlines()
tree = lambda: defaultdict(tree)
root = tree()
for f in files:
    node = root
    parts = f.split("/")
    for p in parts[:-1]:
        node = node[p]
    node.setdefault("__files__", []).append(parts[-1])

out = []

def render(node, path, depth):
    pad = "  " * depth
    for name in sorted(k for k in node if k != "__files__"):
        full = f"{path}/{name}" if path else name
        note = NOTES.get(full)
        out.append(f"{pad}{name}/" + (f"   <- {note}" if note else ""))
        render(node[name], full, depth + 1)
    fl = sorted(node.get("__files__", []))
    if path.endswith("/Migrations"):
        migs = sorted({f.split(".")[0] for f in fl if f[:1].isdigit()})
        out.append(f"{pad}({len(fl)} files: {len(migs)} migrations + model snapshot)")
    elif len(fl) > 30:
        out.append(f"{pad}({len(fl)} files)")
    else:
        for f in fl:
            out.append(f"{pad}{f}")

render(root, "", 0)

header = f"""# ZAYNA - file structure

*Generated from `git ls-files` on {date.today().isoformat()} by `docs/gen_file_structure.py` - do not edit by hand;
rerun `python3 docs/gen_file_structure.py` after adding or moving files.*

```
"""
open("FILE_STRUCTURE.md", "w", encoding="utf-8", newline="\n").write(header + "\n".join(out) + "\n```\n")
print(f"{len(files)} tracked files -> FILE_STRUCTURE.md ({len(out)} lines)")
