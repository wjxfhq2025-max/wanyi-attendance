# Wanyi 考勤系统 - Render.com 部署指南

## 当前状态

✅ 后端代码已创建（Express + PostgreSQL）
✅ API 路由已配置
✅ 前端 HTML 已准备
✅ render.yaml 已创建

---

## 第一步：登录 GitHub

在 PowerShell 中运行：

```powershell
gh auth login
```

按提示选择 GitHub.com，使用浏览器登录。

---

## 第二步：创建 GitHub 仓库并推送

```powershell
cd C:\Users\Linda\.qclaw\workspace\wanyi-attendance-backend
git init
git add .
git commit -m "Initial commit"
gh repo create wanyi-attendance --public --source=. --remote=origin --push
```

---

## 第三步：在 Render.com 创建 Web Service

1. 打开浏览器，访问 **https://render.com**
2. 用 GitHub 账号登录
3. 点击 **New** → **Web Service**
4. 选择 `wanyi-attendance` 仓库

---

## 第四步：配置部署参数

| 设置项 | 值 |
|--------|-----|
| **Name** | `wanyi-attendance` |
| **Region** | Oregon (US West) 或 Singapore |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | **Free** |

---

## 第五步：添加 PostgreSQL 数据库

1. 在 Render 控制台，点击 **New** → **PostgreSQL**
2. 配置：
   - Name: `wanyi-attendance-db`
   - Region: 与 Web Service 相同
   - Plan: Free
3. 创建后，复制 **Internal Database URL**
4. 回到 Web Service，添加环境变量：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | 刚复制的 Internal Database URL |

---

## 第六步：部署

点击 **Deploy Web Service**，等待几分钟。

---

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

---

## 免费版限制

- 每月 750 小时免费
- 15分钟无访问会休眠
- 512MB 内存
- PostgreSQL: 1GB 存储

---

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/employees` | 获取员工列表 |
| `GET /api/attendance/current` | 获取当前周考勤 |
| `POST /api/attendance/save` | 保存考勤 |
| `GET /api/attendance/history` | 获取历史记录 |
| `GET /api/salary/history` | 获取工资历史 |
| `GET /api/debts` | 获取欠款记录 |
| `GET /api/settings/salary` | 获取工资设置 |
