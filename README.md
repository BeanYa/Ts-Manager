# TS Manager - TeamSpeak 服务器发货管理系统

用于淘宝/闲鱼等渠道的 TeamSpeak 服务器售卖管理系统。通过 Docker 官方镜像批量部署 TeamSpeak 容器，自动提取管理员凭据，并与订单/客户关联管理。

## 功能

- **订单管理**: 创建/编辑/删除订单，支持淘宝/闲鱼/自定义渠道
- **一键发货**: 自动创建 Docker 容器、提取凭据、生成连接地址
- **容器管理**: 查看凭据、导出/导入、重置、回收、刷新时间
- **仪表盘**: 统计概览、即将到期提醒
- **数据库**: 支持 SQLite（测试）/ MySQL（生产）动态切换

## 快速开始

### 一键部署（推荐）

```bash
chmod +x deploy.sh
./deploy.sh
```

### 开发模式

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env
# 编辑 .env 设置 AUTH_TOKEN

# 运行数据库迁移
pnpm db:migrate

# 启动开发服务
pnpm dev
```

前端: http://localhost:5173
后端: http://localhost:3000

### 运行测试

```bash
pnpm test
```

## 技术栈

| 层 | 选择 |
|---|---|
| 包管理 | pnpm workspaces |
| 后端 | Express + tsx |
| 数据库 | Knex.js + better-sqlite3/mysql2 |
| Docker API | dockerode |
| 前端 | Vite + React 19 + TypeScript |
| UI | Tailwind CSS + 自定义组件 |
| 状态管理 | @tanstack/react-query |
| 认证 | Bearer Token |
| 测试 | Vitest |

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| AUTH_TOKEN | (必填) | API 认证令牌 |
| DB_CLIENT | better-sqlite3 | `better-sqlite3` 或 `mysql2` |
| DB_HOST/PORT/USER/PASS/NAME | - | MySQL 连接信息 |
| PORT | 3000 | Express 端口 |
| PUBLIC_IP | (自动检测) | 公网 IP |
| CUSTOM_DOMAIN | (空) | 自定义域名 |
| TS_IMAGE | teamspeak | Docker 镜像名 |
| PORT_RANGE_START | 20000 | TS3 容器起始端口 |

## API

所有接口需 `Authorization: Bearer <token>` 头。

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/verify | 验证 token |
| GET | /api/orders | 订单列表 |
| POST | /api/orders | 创建订单 |
| PUT | /api/orders/:id | 更新订单 |
| DELETE | /api/orders/:id | 删除订单 |
| POST | /api/orders/:id/deliver | 发货 |
| GET | /api/containers | 容器列表 |
| GET | /api/containers/:id | 容器详情 |
| POST | /api/containers/:id/export | 导出容器 |
| POST | /api/containers/:id/import | 导入恢复 |
| POST | /api/containers/:id/reset | 重置容器 |
| POST | /api/containers/:id/recycle | 回收容器 |
| POST | /api/containers/:id/refresh | 刷新时间 |
| GET | /api/system/health | 健康检查 |
| GET | /api/system/info | 系统信息 |
| GET | /api/system/stats | 统计数据 |

## 部署架构

```
┌─────────────── 阿里云 Linux VPS ───────────────┐
│  Docker Engine                                  │
│  ├── ts-manager-app :3000 (管理面板)             │
│  ├── ts3-order-1 :20000(voice) :20001(query)    │
│  ├── ts3-order-2 :20002(voice) :20003(query)    │
│  └── mysql:3306 (生产模式)                       │
└─────────────────────────────────────────────────┘
```

## License

MIT
