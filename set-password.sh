#!/bin/bash
# auth-config.js 를 새로 만들어 로그인 아이디/비밀번호를 바꿉니다.
#   ./set-password.sh                      → 아이디와 비밀번호를 물어봅니다
#   BLOG_ID=eunah BLOG_PW=... ./set-password.sh   → 환경변수로 지정
# 코드에는 비밀번호가 아니라 salt 가 섞인 SHA-256 해시만 저장됩니다.
set -euo pipefail
cd "$(dirname "$0")"

ID="${BLOG_ID:-}"
PW="${BLOG_PW:-}"
if [ -z "$ID" ]; then read -r -p "아이디: " ID; fi
if [ -z "$PW" ]; then read -r -s -p "비밀번호: " PW; echo; fi
if [ -z "$ID" ] || [ -z "$PW" ]; then echo "아이디와 비밀번호는 비워둘 수 없습니다." >&2; exit 1; fi
case "$ID$PW" in *[\"\'\\]*) echo "아이디/비밀번호에 따옴표나 역슬래시는 쓸 수 없습니다." >&2; exit 1;; esac

SALT="$(openssl rand -hex 16)"
HASH="$(printf '%s' "$SALT:$ID:$PW" | shasum -a 256 | cut -d' ' -f1)"

cat > auth-config.js <<EOF
// set-password.sh 가 생성한 파일입니다. 직접 수정하지 마세요.
window.AUTH_CONFIG = { id: "$ID", salt: "$SALT", hash: "$HASH" };
EOF
echo "auth-config.js 를 갱신했습니다. (아이디: $ID)"
