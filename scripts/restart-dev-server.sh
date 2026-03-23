#!/usr/bin/env bash
# 重启本地静态站（项目根目录 → python http.server）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
for port in 9342 8765 8081; do
  fuser -k "${port}/tcp" 2>/dev/null || true
done
sleep 1
python3 -m http.server 9342 --bind 127.0.0.1 &
python3 -m http.server 8765 --bind 0.0.0.0 &
python3 -m http.server 8081 --bind 127.0.0.1 &
sleep 1
curl -s -o /dev/null -w "9342 %{http_code} " http://127.0.0.1:9342/ || true
curl -s -o /dev/null -w "8765 %{http_code} " http://127.0.0.1:8765/ || true
curl -s -o /dev/null -w "8081 %{http_code}\n" http://127.0.0.1:8081/ || true
