#!/usr/bin/env bash
# Tablero de trabajo (GitHub Issues) de ACN Institute.
# Uso:
#   bash ops/tablero.sh            # todos los issues abiertos
#   bash ops/tablero.sh hermes     # solo el scope de Hermes
#   bash ops/tablero.sh opencode   # solo el scope de opencode
#   bash ops/tablero.sh humano     # solo tareas que requieren humano
set -euo pipefail

SCOPE="${1:-all}"

TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$TOKEN" ]; then
  URL="$(git -C "$(dirname "$(dirname "$(realpath "$0")")")" remote get-url origin)"
  TOKEN="$(printf '%s' "$URL" | sed -E 's#https://([^:]+):([^@]+)@.*#\2#')"
fi
if [ -z "$TOKEN" ]; then
  TOKEN="$(grep -E '^GITHUB_TOKEN=' "$HOME/.hermes/.env" 2>/dev/null | tail -1 | cut -d= -f2-)"
fi
if [ -z "$TOKEN" ]; then
  echo "No se pudo extraer el token (usa GITHUB_TOKEN, el remote con credenciales, o GITHUB_TOKEN en ~/.hermes/.env)." >&2
  exit 1
fi

REPO="Zatairo/ACN"
API="https://api.github.com/repos/$REPO/issues?state=open&per_page=100"
JSON="$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "$API")"

if command -v node >/dev/null 2>&1; then
  PARSER=node
elif command -v python3 >/dev/null 2>&1; then
  PARSER=python3
else
  PARSER=python
fi

TMP="$(mktemp 2>/dev/null || mktemp /tmp/tablero.XXXXXX)"
if [ "$PARSER" = "node" ]; then
cat > "$TMP" <<'JS'
const readline = require('readline');
let raw = '';
readline.createInterface({ input: process.stdin }).on('line', l => raw += l).on('close', () => {
  const scope = process.argv[2];
  const issues = JSON.parse(raw);
  const prio = labels => ['P0','P1','P2'].find(p => labels.includes(p)) || 'P?';
  const map = { 'P0':0, 'P1':1, 'P2':2 };
  const rows = [];
  for (const i of issues) {
    const labels = (i.labels || []).map(l => l.name);
    const owner = labels.includes('hermes') ? 'hermes' : labels.includes('opencode') ? 'opencode' : labels.includes('humano') ? 'humano' : 'sin-scope';
    if (scope !== 'all' && owner !== scope) continue;
    rows.push([prio(labels), owner, i.number, i.title, labels.sort().join(',')]);
  }
  rows.sort((a, b) => (map[a[0]] ?? 3) - (map[b[0]] ?? 3) || a[2] - b[2]);
  if (!rows.length) { console.log(`(sin issues abiertos para scope='${scope}')`); return; }
  console.log('  #  PRIO  DUEÑO     ISSUE');
  for (const [p, o, n, t, l] of rows) console.log(`${String(p).padStart(5)} ${p.padEnd(5)} ${o.padEnd(9)} #${String(n).padEnd(3)} ${t.slice(0,60)}  [${l}]`);
});
JS
  printf '%s' "$JSON" | node "$TMP" "$SCOPE"
else
cat > "$TMP" <<'PY'
import json, sys
issues = json.load(sys.stdin)
def prio(labels):
    for p in ("P0", "P1", "P2"):
        if p in labels:
            return p
    return "P?"
rows = []
for i in issues:
    labels = [l["name"] for l in i["labels"]]
    owner = "hermes" if "hermes" in labels else ("opencode" if "opencode" in labels else ("humano" if "humano" in labels else "sin-scope"))
    if sys.argv[1] != "all" and owner != sys.argv[1]:
        continue
    rows.append((prio(labels), owner, i["number"], i["title"], ",".join(sorted(labels))))
rows.sort(key=lambda r: ({"P0":0,"P1":1,"P2":2}.get(r[0],3), r[2]))
if not rows:
    print("(sin issues abiertos para scope='%s')" % sys.argv[1])
else:
    print("  #  PRIO  DUEÑO     ISSUE")
    for prio, owner, num, title, labels in rows:
        print("%5s %-5s %-9s #%-3s %s  [%s]" % (prio, prio, owner, num, title[:60], labels))
PY
  printf '%s' "$JSON" | "$PARSER" "$TMP" "$SCOPE"
fi
rm -f "$TMP"