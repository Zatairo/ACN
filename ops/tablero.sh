#!/usr/bin/env bash
# Tablero de trabajo (GitHub Issues) de ACN Institute.
# Uso:
#   bash ops/tablero.sh            # todos los issues abiertos
#   bash ops/tablero.sh hermes     # solo el scope de Hermes
#   bash ops/tablero.sh opencode   # solo el scope de opencode
#   bash ops/tablero.sh humano     # solo tareas que requieren humano
set -euo pipefail

SCOPE="${1:-all}"

TOKEN="$(git -C "$(dirname "$(dirname "$(realpath "$0")")")" remote get-url origin | sed -E 's#https://([^:@/]+):([^@/]+)@#\2#')"
if [ -z "$TOKEN" ] || [ "$TOKEN" = "origin" ]; then
  TOKEN="${GITHUB_TOKEN:-}"
fi
if [ -z "$TOKEN" ]; then
  echo "No se pudo extraer el token (usa GITHUB_TOKEN o que el remote tenga credenciales)." >&2
  exit 1
fi

REPO="Zatairo/ACN"
API="https://api.github.com/repos/$REPO/issues?state=open&per_page=100"

python3 - "$TOKEN" "$API" "$SCOPE" <<'PY'
import json, sys, urllib.request
token, api, scope = sys.argv[1], sys.argv[2], sys.argv[3]
req = urllib.request.Request(api, headers={"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json"})
with urllib.request.urlopen(req) as r:
    issues = json.load(r)

def prio(labels):
    for p in ("P0", "P1", "P2"):
        if p in labels:
            return p
    return "P?"

rows = []
for i in issues:
    labels = [l["name"] for l in i["labels"]]
    owner = "hermes" if "hermes" in labels else ("opencode" if "opencode" in labels else ("humano" if "humano" in labels else "sin-scope"))
    if scope != "all" and owner != scope:
        continue
    rows.append((prio(labels), owner, i["number"], i["title"], ",".join(sorted(labels))))

rows.sort(key=lambda r: ({"P0":0,"P1":1,"P2":2}.get(r[0],3), r[2]))
if not rows:
    print("(sin issues abiertos para scope='%s')" % scope)
else:
    print("  #  PRIO  DUEÑO     ISSUE")
    for prio, owner, num, title, labels in rows:
        print("%5s %-5s %-9s #%-3s %s  [%s]" % (prio, prio, owner, num, title[:60], labels))
PY
