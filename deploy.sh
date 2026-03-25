#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── 环境检测 ───
check_docker() {
  if ! command -v docker &>/dev/null; then
    error "Docker 未安装。请先安装 Docker: https://docs.docker.com/engine/install/"
  fi
  if ! docker info &>/dev/null; then
    error "Docker 未运行或权限不足。请启动 Docker 或使用 sudo。"
  fi
  log "Docker 已就绪"
}

check_compose() {
  if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
  elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
  else
    error "Docker Compose 未安装。"
  fi
  log "Docker Compose 已就绪"
}

# ─── 镜像加速 ───
setup_mirror() {
  if curl -s --connect-timeout 5 https://registry-1.docker.io/v2/ &>/dev/null; then
    log "Docker Hub 连接正常，无需镜像加速"
    return
  fi

  warn "Docker Hub 连接缓慢，配置阿里云镜像加速..."
  MIRROR="https://mirror.ccs.tencentyun.com"

  DAEMON_JSON="/etc/docker/daemon.json"
  if [ -f "$DAEMON_JSON" ]; then
    if grep -q "registry-mirrors" "$DAEMON_JSON"; then
      log "镜像加速已配置"
      return
    fi
  fi

  sudo mkdir -p /etc/docker
  sudo tee "$DAEMON_JSON" > /dev/null <<EOF
{
  "registry-mirrors": ["$MIRROR"]
}
EOF
  sudo systemctl restart docker 2>/dev/null || sudo service docker restart 2>/dev/null || true
  log "镜像加速已配置"
}

# ─── IP 检测 ───
detect_ip() {
  local ip=""
  for svc in "https://api.ipify.org" "https://ifconfig.me/ip" "https://icanhazip.com"; do
    ip=$(curl -s --connect-timeout 5 "$svc" 2>/dev/null || true)
    if [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "$ip"
      return
    fi
  done
  echo "127.0.0.1"
}

# ─── 主流程 ───
main() {
  echo "======================================="
  echo "  TS Manager 部署脚本"
  echo "======================================="
  echo

  check_docker
  check_compose

  # 模式选择
  echo
  echo "选择部署模式:"
  echo "  1) 测试模式 (SQLite, 轻量)"
  echo "  2) 生产模式 (MySQL, 推荐)"
  read -rp "请选择 [1/2, 默认 1]: " MODE_CHOICE
  MODE_CHOICE=${MODE_CHOICE:-1}

  if [ "$MODE_CHOICE" = "2" ]; then
    DB_CLIENT="mysql2"
    COMPOSE_PROFILES="--profile mysql"
    log "生产模式: MySQL"
  else
    DB_CLIENT="better-sqlite3"
    COMPOSE_PROFILES=""
    log "测试模式: SQLite"
  fi

  # Auth Token
  echo
  if [ -z "${AUTH_TOKEN:-}" ]; then
    read -rp "设置管理员 Token (用于 API 认证): " AUTH_TOKEN
    if [ -z "$AUTH_TOKEN" ]; then
      AUTH_TOKEN=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | xxd -p | head -1)
      log "自动生成 Token: $AUTH_TOKEN"
    fi
  fi

  # 公网 IP
  echo
  log "检测公网 IP..."
  AUTO_IP=$(detect_ip)
  read -rp "公网 IP [$AUTO_IP]: " PUBLIC_IP
  PUBLIC_IP=${PUBLIC_IP:-$AUTO_IP}

  read -rp "自定义域名 (可选, 留空跳过): " CUSTOM_DOMAIN
  CUSTOM_DOMAIN=${CUSTOM_DOMAIN:-}

  # 镜像加速
  setup_mirror

  # 写入 .env
  cat > .env <<EOF
AUTH_TOKEN=$AUTH_TOKEN
DB_CLIENT=$DB_CLIENT
DB_HOST=mysql
DB_PORT=3306
DB_USER=tsmanager
DB_PASS=$(openssl rand -hex 8 2>/dev/null || echo "tsmanager_password")
DB_NAME=tsmanager
PORT=3000
PUBLIC_IP=$PUBLIC_IP
CUSTOM_DOMAIN=$CUSTOM_DOMAIN
TS_IMAGE=teamspeak
PORT_RANGE_START=20000
EOF

  log "配置已写入 .env"

  # 构建 & 启动
  echo
  log "构建并启动服务..."
  $COMPOSE_CMD $COMPOSE_PROFILES up -d --build

  echo
  echo "======================================="
  echo -e "  ${GREEN}部署成功!${NC}"
  echo "======================================="
  echo
  echo "  管理面板: http://$PUBLIC_IP:3000"
  echo "  Auth Token: $AUTH_TOKEN"
  echo
  echo "  TS3 容器端口从 20000 开始分配"
  echo
  echo "  常用命令:"
  echo "    查看日志: $COMPOSE_CMD logs -f"
  echo "    停止服务: $COMPOSE_CMD down"
  echo "    重启服务: $COMPOSE_CMD restart"
  echo
}

main "$@"
