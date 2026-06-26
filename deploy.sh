#!/bin/bash
# deploy.sh - WorkMap FE + BE 배포 스크립트 (CI/CD 도입 전 임시)
# 배포 디렉토리: /home/therecommerce/workmap/
#   ├── backend/build/libs/workmap.jar  (BE jar)
#   ├── backend/Dockerfile
#   ├── docker-compose.yml              (prod compose)
#   ├── .env                            (서버에서 관리, 건드리지 않음)
#   └── frontend/                       (FE 정적 파일, 외부 nginx가 서빙)
#
# 사용법: ./deploy.sh         (FE + BE 모두)
#         ./deploy.sh fe      (FE만)
#         ./deploy.sh be      (BE만 — jar 교체 + api 재빌드/재기동)
set -e

TARGET="${1:-all}"
SERVER="therecommerce@59.8.160.12"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE="/home/therecommerce/workmap"

ssh_run()  { ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o IdentitiesOnly=yes "$SERVER" "$@"; }
scp_send() { scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o IdentitiesOnly=yes "$@"; }

deploy_fe() {
  echo "━━━ FE 빌드 ━━━"
  cd frontend
  # Node 22 강제 (.nvmrc=22). Node 18 등에서 corepack pnpm이 'Invalid host defined options'로 깨지는 문제 방지.
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
    nvm use >/dev/null 2>&1 || nvm use 22 >/dev/null 2>&1 || echo "⚠️  nvm use 실패 — 현재 Node($(node -v))로 진행"
  else
    echo "⚠️  nvm 없음 — 현재 Node($(node -v))로 진행 (Node 22 권장)"
  fi
  echo "Node: $(node -v)"
  pnpm build
  cd ..

  echo "━━━ FE 배포 ━━━"
  ssh_run "mkdir -p $REMOTE/frontend && rm -rf $REMOTE/frontend/*"
  scp_send -r frontend/dist/. "$SERVER:$REMOTE/frontend/"
  echo "✅ FE 완료 → $REMOTE/frontend/"
}

deploy_be() {
  echo "━━━ BE 빌드 ━━━"
  cd backend
  ./gradlew bootJar
  cd ..

  echo "━━━ BE 배포 & api 재빌드/재시작 ━━━"
  ssh_run "mkdir -p $REMOTE/backend/build/libs"
  scp_send backend/build/libs/workmap.jar "$SERVER:$REMOTE/backend/build/libs/workmap.jar"
  scp_send backend/Dockerfile "$SERVER:$REMOTE/backend/Dockerfile"
  scp_send docker-compose.prod.yml "$SERVER:$REMOTE/docker-compose.yml"
  ssh_run "cd $REMOTE && docker compose build api && docker compose up -d --force-recreate api"
  echo "✅ BE 완료 → $REMOTE/backend/build/libs/workmap.jar"
}

case "$TARGET" in
  fe)  deploy_fe ;;
  be)  deploy_be ;;
  all) deploy_fe && deploy_be ;;
  *)   echo "사용법: ./deploy.sh [fe|be|all]"; exit 1 ;;
esac

echo ""
echo "✅ 배포 완료 → http://59.8.160.12:8186"
