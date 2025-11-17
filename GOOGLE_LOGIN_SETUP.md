# Google 登录功能设置指南

## 功能概述

已成功为项目添加 Google OAuth 登录功能，用户可以使用 Google 账号登录系统。

## 已完成的工作

### 1. 后端改动
- ✅ 安装 `google-auth-library` 依赖包
- ✅ 添加 Google OAuth 环境变量配置
- ✅ 创建 Google 登录认证服务 (`AuthService.loginWithGoogle`)
- ✅ 添加 Google 登录控制器 (`AuthController.loginWithGoogle`)
- ✅ 新增 `/api/auth/google` 接口路由
- ✅ 更新 User 模型和数据类型，支持 Google 用户信息

### 2. 前端改动
- ✅ 安装 `vue3-google-login` 依赖包
- ✅ 添加 Google Client ID 环境变量
- ✅ 更新认证 Store，支持 Google 登录流程
- ✅ 创建 GoogleLogin 组件
- ✅ 创建登录页面 (Login.vue)
- ✅ 添加路由守卫，保护需要认证的页面

### 3. 数据库改动
- ✅ 创建数据库迁移脚本 (`migration_google_auth.sql`)

## 设置步骤

### 步骤 1：运行数据库迁移

在 MySQL 中运行迁移脚本来更新 users 表结构：

```bash
mysql -u hyperliquid -p hyperliquid < backend/database/migration_google_auth.sql
```

或者直接连接到 MySQL 并执行：

```bash
mysql -u hyperliquid -p
```

然后在 MySQL 命令行中：

```sql
USE hyperliquid;
SOURCE /path/to/backend/database/migration_google_auth.sql;
```

### 步骤 2：验证环境变量

确认以下环境变量已正确配置：

**后端 (.env)**
```env
GOOGLE_CLIENT_ID=240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**前端 (.env)**
```env
VITE_GOOGLE_CLIENT_ID=240275389988-s32vl4lt6djaphpu5ll8kfb2odd36spo.apps.googleusercontent.com
```

### 步骤 3：配置 Google OAuth 授权重定向 URI

在 Google Cloud Console 中配置授权的重定向 URI：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. 导航到 "APIs & Services" > "Credentials"
4. 点击你的 OAuth 2.0 客户端 ID
5. 在 "授权的 JavaScript 来源" 中添加：
   - `http://localhost:3000`
   - `http://localhost:5173` (Vite 默认端口)
6. 在 "授权的重定向 URI" 中添加：
   - `http://localhost:3000/login`
   - `http://localhost:5173/login`

### 步骤 4：重启服务

重启后端和前端服务以应用更改：

**后端**
```bash
cd backend
npm run dev
```

**前端**
```bash
cd frontend
npm run dev
```

## 使用说明

### 用户登录流程

1. 访问 `http://localhost:3000/login` (或 Vite 的端口)
2. 点击 "Sign in with Google" 按钮
3. 选择 Google 账号并授权
4. 登录成功后自动跳转到交易页面 (`/trade`)

### API 接口

**POST /api/auth/google**

请求体：
```json
{
  "token": "google_id_token"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "https://...",
      "walletAddress": null
    },
    "token": {
      "token": "jwt_token",
      "expiresIn": "7d"
    }
  }
}
```

## 数据库表结构变更

users 表新增字段：
- `google_id` (VARCHAR(255)): Google 用户唯一标识
- `name` (VARCHAR(255)): 用户名称
- `avatar` (VARCHAR(512)): 用户头像 URL
- `wallet_address` 改为可选字段（支持仅使用 Google 登录的用户）

## 路由守卫

- `/login` - 仅未登录用户可访问
- `/trade` - 需要认证
- `/portfolio` - 需要认证

未认证用户访问受保护页面会自动重定向到登录页面。

## 测试用户

根据你提供的 OAuth 配置信息，当前应用处于测试模式。只有在 Google Cloud Console 中添加为测试用户的账号才能登录。

要添加测试用户：
1. 访问 [OAuth 权限请求页面](https://console.cloud.google.com/apis/credentials/consent?project=turnkey-channel-421502)
2. 在 "测试用户" 部分添加邮箱地址

## 注意事项

- 确保 Google OAuth 客户端 ID 和密钥安全存储
- 生产环境请更换 JWT_SECRET
- 建议在生产环境中使用 HTTPS
- 定期检查和更新 OAuth 应用的权限范围

## 故障排查

### 问题：Google 登录按钮不显示
- 检查浏览器控制台是否有 JavaScript 错误
- 确认 VITE_GOOGLE_CLIENT_ID 环境变量已正确设置
- 检查网络连接，确保可以访问 `accounts.google.com`

### 问题：登录失败
- 检查后端日志，查看详细错误信息
- 确认 Google Client ID 和 Client Secret 正确
- 验证数据库迁移已成功执行
- 确保测试用户已添加到 Google OAuth 应用

### 问题：数据库错误
- 运行数据库迁移脚本
- 检查数据库用户权限
- 验证数据库连接配置

## 下一步

可以考虑添加以下功能：
- 关联 Google 账号与钱包地址
- 社交登录（Facebook, Twitter 等）
- 两步验证 (2FA)
- 用户资料管理页面
